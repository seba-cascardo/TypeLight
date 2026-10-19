# TypeLight: revisión de "listo para producción" (deploy, carga, seguridad, compatibilidad, primer contacto)

Revisado el 2026-10-19 sobre el worktree `typelight-comprehensive-review-466e4d` (HEAD `616de67`, el mismo commit que está publicado: el chunk principal en vivo, `assets/index-DNm4cEs4.js`, tiene el mismo hash que el build local). No se tocó ningún archivo del repo.

Evidencia generada (todo en este directorio `scratchpad/review/`):
- `dist-ops/`: build con `BASE_PATH=/TypeLight/`.
- `stale-chunk.mjs` → `stale-chunk-chromium.png`: simula un deploy con una pestaña abierta.
- `import-repro.mjs`: copia de seguridad con una clave de más, contra zustand real.
- `live-load.mjs` → `live-desktop.png`, `live-phone.png`: primera carga del sitio en vivo, en escritorio y en un Pixel 7 emulado.
- `unused_exports.py`: busca exports sin uso.

Niveles de confianza: **verificado con repro/medición**, **verificado leyendo** (con cita) o **hipótesis** (con lo que la confirmaría).

---

## Alto

### O-01 · alto · Después de cada deploy, una pestaña abierta muestra un error en inglés para developers, y no hay ninguna pantalla de error propia
- **Dónde:** `src/main.tsx:34-59`: el router no tiene `errorElement` ni `ErrorBoundary` en ninguna ruta. `grep -rn "errorElement\|ErrorBoundary\|vite:preloadError" src` → 0 resultados. A esto se suma `.github/workflows/pages.yml`: cada push a master reemplaza el sitio entero.
- **Escenario:** un amigo deja TypeLight abierto (es una app de rutina diaria). Seba pushea a master, Pages publica chunks con hash nuevo y borra los viejos. El amigo toca «Ruta» (o Progreso, Ajustes, una lección: todo menos Inicio es lazy) y ve una pantalla gris en inglés:
  - «Unexpected Application Error!»
  - «Failed to fetch dynamically imported module: …/assets/Path-BfkleW-C.js», con el stack.
  - «💿 Hey developer 👋 You can provide a way better UX…».

  La pantalla no tiene navegación ni botón para recargar. Lo mismo pasa ante cualquier `throw` durante un render: un estado raro en localStorage, o una copia importada con forma inesperada (ver O-02).
- **Evidencia (verificado con repro):** `stale-chunk.mjs` sirve `dist-ops` como lo sirve Pages, siembra un usuario, carga Inicio, renombra `Path-*.js` (el deploy nuevo) y hace click en «Ruta». El texto de la página queda en `Unexpected Application Error! | Failed to fetch dynamically imported module … | 💿 Hey developer 👋 …`, con captura en `stale-chunk-chromium.png`. Que salga el texto "Hey developer" en producción también está verificado: `react-router` 7.18.3 sólo exporta su build `development` (`package.json` → `exports["."]` no tiene condición `production`) y ese texto está en `dist-ops/assets/jsx-runtime-*.js`.
- **Lo agrava (verificado con medición):** Pages responde `Cache-Control: max-age=600` también para `index.html` (`curl -sI https://seba-cascardo.github.io/TypeLight/`). Durante hasta 10 minutos después de un deploy, un navegador puede usar el `index.html` viejo, que apunta a chunks que ya no existen. Si el que falta es el chunk principal, la página queda en blanco: ese error ocurre antes del router y no lo atrapa ningún `errorElement`. Esta variante en blanco es **hipótesis**; se confirmaría repitiendo el repro con el `index-*.js` renombrado y el `index.html` cacheado.
- **Confianza:** alta.
- **Arreglo sugerido:**
  1. `window.addEventListener('vite:preloadError', …)` en `main.tsx`, que recarga la página una sola vez (con una marca en `sessionStorage` para no entrar en un bucle). Verifiqué leyendo el chunk que el helper de Vite 8 dispara ese evento también cuando falla el `import()`: `return e().catch(i)` en `jsx-runtime-*.js`.
  2. Un `errorElement` en español en la ruta raíz, con «Algo salió mal», un botón «Recargar» y otro «Volver a Inicio», y que distinga el caso «Hay una versión nueva de TypeLight, recargá». Recomiendo las dos cosas: la recarga cubre el caso común y el `errorElement` cubre todo lo demás.

---

## Medio

### O-02 · medio · Importar una copia con claves de más pisa funciones del store y deja la app rota para siempre (ni «Empezar de cero» la arregla)
- **Dónde:** `src/app/store/index.ts:350-352` (`importState` hace `useStore.setState(state)` con el objeto entero) y `src/app/lib/backup.ts:42-78`. `isPersistedState` exige que estén las claves conocidas, pero deja pasar las que sobran. `migrateState` devuelve el objeto tal cual si `version >= 8` (`src/app/store/migrate.ts:96`). Además, `persist` no tiene `partialize` (`store/index.ts:297-310`), así que guarda en localStorage todo lo que haya en el estado.
- **Escenario:** alguien importa un `.json` con `"app":"typelight","version":8` y una clave como `"recordSession": "x"`, ya sea un archivo armado a mano o pasado por otro. zustand hace `Object.assign` y la acción queda reemplazada por un string. Persist la guarda. Al recargar, el `merge` superficial la vuelve a poner. La primera sesión que se graba tira `TypeError` y, por O-01, aparece la pantalla de error en inglés. `resetProgress` no la limpia porque sólo reescribe las claves de progreso, y restaurar una copia buena tampoco, porque `Object.assign` no borra claves. La única salida es borrar los datos del sitio, lo que también se lleva el progreso.
- **Evidencia (verificado con repro):** `import-repro.mjs` usa el zustand 5 real del proyecto con `persist` + `setState(parsed)`. Salida:
  - `after import, typeof recordSession = string`
  - `persisted: {"state":{…,"recordSession":"pwned"}}`
  - `after reload, typeof recordSession = string`

  Prototype pollution global, en cambio, **no** hay (verificado): `JSON.parse` + spread/`Object.assign` sólo cambian el prototipo del objeto local, no el de `Object.prototype`. Aparte, **hipótesis**: una copia con la forma correcta arriba pero con basura adentro (por ejemplo `sessions: [null]` o `keys: {"a": 5}`) pasa `isPersistedState`, que no mira los elementos, y rompe un render. Lo confirmaría un test de `parseBackup` con esa entrada seguido del render de Progreso.
- **Confianza:** alta en el mecanismo. La probabilidad de que le pase a un amigo es baja, porque hace falta un archivo manipulado, pero cuando pasa el daño es total y no tiene salida dentro de la app.
- **Arreglo sugerido:**
  - `importState` aplica `persistedState(state)`, que se queda sólo con `PERSISTED_KEYS`.
  - `persist` gana `partialize: persistedState` y un `merge` que también filtra por `PERSISTED_KEYS`. Esto además limpia un localStorage que ya esté envenenado.

  Son tres líneas, con un test de unidad.

### O-03 · medio · Las fuentes se cargan desde Google: la IP de cada visitante va a Google sin aviso (RGPD) y la primera pintura depende de un tercero
- **Dónde:** `index.html:9-14`, un `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Gabarito…&family=Lexend…">`.
- **Escenario:** un amigo en España abre la app. Antes de pintar nada, el navegador le pide la hoja de estilos a `fonts.googleapis.com` (el `<link>` bloquea el render) y después las fuentes a `fonts.gstatic.com`, entregando su IP a Google. La app no tiene ningún aviso de privacidad. En Alemania esto ya tuvo condena: LG München I, 20-01-2022, Az. 3 O 17493/20, que fijó 100 € por incrustar Google Fonts de forma dinámica sin consentimiento. Para una app entre amigos el riesgo legal real es mínimo, pero es la única petición a un tercero que hace la app y se elimina fácil.
- **Evidencia (verificado con medición):** `live-load.mjs` contra el sitio en vivo registra estos hosts: `seba-cascardo.github.io: 8, fonts.googleapis.com: 1, fonts.gstatic.com: 2`, y ningún otro tercero. Un `grep` de `fetch|sendBeacon|XMLHttpRequest|WebSocket` en `src` no encuentra nada fuera de un texto de práctica en `corpus/code.ts`.
- **Confianza:** alta en el hecho técnico. La parte legal es interpretación: no soy asesor legal.
- **Opciones:**
  - (a) Autoalojar con `@fontsource-variable/gabarito` y `@fontsource-variable/lexend`, las dos en 5.3.0 y con licencia OFL-1.1 (verificado con `npm view`). Pro: cero terceros, sin bloqueo de render externo y la fuente funciona en cualquier red. Contra: unos 50–100 KB más en el deploy (**hipótesis** sobre el tamaño de los woff2 variables).
  - (b) Dejarlo como está y sumar una línea de privacidad en Ajustes. Pro: no hay que tocar código. Contra: el tercero y el bloqueo siguen ahí.

  **Recomiendo (a).** Habilita además una frase honesta en Ajustes y en el README: «TypeLight no manda nada a ningún servidor».

### O-04 · medio · En el celular la app no dice que es para escritorio, y el link va a llegar por WhatsApp, que casi siempre se abre en el celular
- **Dónde:** no hay código que mire `pointer: coarse`, `maxTouchPoints` ni el ancho de pantalla para avisar (`grep -rn "escritorio|celular|pointer: coarse|maxTouchPoints|matchMedia" src/app src/index.css` → nada). Sólo el README dice «Chrome o Edge de escritorio». Ni `Welcome.tsx` ni Inicio lo mencionan.
- **Escenario:** Seba pasa el link por WhatsApp y el amigo lo toca en el teléfono. Ve la Bienvenida bien armada (verificado), pone su nombre, elige un teclado de PC que no tiene y empieza a tipear con el teclado virtual. Su progreso queda guardado en el navegador del teléfono. Cuando después abra la app en la PC, va a empezar de cero sin entender por qué.
- **Evidencia:**
  - Verificado con medición: `live-load.mjs` con un Pixel 7 emulado carga `/TypeLight/bienvenida` sin scroll horizontal (`scrollWidth 412`) y sin ningún aviso (`live-phone.png`).
  - **Hipótesis:** con Gboard o el teclado de iOS, el `<input>` oculto recibe composiciones de palabra entera o autocorrecciones, y las latencias por tecla, los bigramas y el dominio por dedo quedan sin sentido. Lo confirmaría probarlo en un teléfono real en `/leccion/guia-66-6a-keys`.
- **Confianza:** alta en la falta del aviso; media en cómo se comporta el teclado virtual.
- **Arreglo sugerido:** un aviso en la Bienvenida cuando `matchMedia('(pointer: coarse)')` es verdadero y no hay teclado físico detectado, del estilo de «TypeLight se usa con un teclado de computadora. Abrí este link en la PC: tu progreso se guarda en cada navegador», con un botón «Copiar link» y la opción de seguir igual. No recomiendo bloquear la app: una tablet con teclado bluetooth es un uso válido.

### O-05 · medio · Cada push a master se publica sin pasar por los e2e ni por el lint
- **Dónde:** `.github/workflows/pages.yml:24-30`. Corre `npm ci`, `npm test` (Vitest) y `npm run build` (incluye `tsc -b`, así que el chequeo de tipos sí está en CI). No corre `npm run lint` ni `npm run e2e`, aunque el repo tiene 20 specs de Playwright que cubren los flujos de UI.
- **Escenario:** una regresión de UI que los tests de unidad no ven, por ejemplo una pantalla que tira error al montar, llega a los amigos con el push siguiente, y por O-01 la ven como «Unexpected Application Error».
- **Evidencia (verificado leyendo y corriendo):** el workflow citado. `npx oxlint` hoy da 0 errores y 4 warnings: dos de `only-export-components` en `main.tsx` y dos de `preserve-manual-memoization` en `LessonPlayer.tsx:94` y `:180`. `npx tsc -b` en este worktree falla sólo por un archivo sin versionar que agregó otra revisión en paralelo (`src/engine/stats/zz-review-stats-dst.test.ts`); en el código versionado no hay errores.
- **Confianza:** alta.
- **Opciones:**
  - (a) Sumar `npm run lint` y `npx playwright install --with-deps chromium && npm run e2e` al job `build`, antes del deploy. Pro: nada roto llega a los amigos. Contra: +3–6 min por deploy (**hipótesis**). Además, en un runner de 2 vCPU los e2e de tipeo largo pueden fallar de forma intermitente: la memoria del proyecto ya registra fallas por carga, así que conviene `retries: 1` sólo en CI y `workers: 2`.
  - (b) Seguir corriendo los e2e a mano antes del merge. Pro: el deploy sigue siendo rápido. Contra: depende de acordarse.

  **Recomiendo (a)**, y que un e2e en rojo frene el deploy. El lint es gratis.

### O-06 · medio · Un amigo no tiene por dónde reportar un bug o una idea, y Seba no tiene forma de saber qué versión tenía
- **Dónde:** la app no muestra ningún link ni texto de contacto (Ajustes termina en los créditos: `src/app/routes/Settings.tsx:320-330`). `package.json` dice `"version": "0.0.0"` y no se inyecta ningún SHA ni fecha de build. Del lado de GitHub, `gh api repos/seba-cascardo/TypeLight` → `has_issues: true` y `homepage: null`.
- **Escenario:** un amigo le escribe a Seba «se trabó el juego de globos». Seba no sabe de qué deploy era, en qué navegador, con qué teclado elegido ni en qué pantalla pasó.
- **Evidencia:** verificado leyendo y con la API de GitHub.
- **Confianza:** alta.
- **Opciones:**
  - (a) Un botón en Ajustes, «Reportar un problema o una idea», que copia un bloque listo para pegar en WhatsApp (versión = SHA corto + fecha, navegador, layout, ruta actual, cantidad de sesiones) y lo muestra en pantalla. Pro: no hace falta cuenta y entra en el canal que ya usan con Seba. Contra: el reporte llega desordenado al chat.
  - (b) Un link a `github.com/seba-cascardo/TypeLight/issues/new?title=…&body=…` con los mismos datos precargados. Pro: el reporte queda ordenado en el repo. Contra: hace falta una cuenta de GitHub, que la mayoría de los amigos no tiene.
  - (c) `mailto:` con un cuerpo precargado. Pro: universal. Contra: expone el mail de Seba en un sitio público.

  **Recomiendo (a) como principal, con (b) como link secundario.** Para la versión: `define: { __APP_VERSION__: JSON.stringify(process.env.GITHUB_SHA?.slice(0,7) ?? 'local') }` en `vite.config.ts`, que en Actions viene gratis, y mostrarla chiquita al pie de Ajustes. Aparte, poner la URL de Pages en el campo «homepage» del repo.

---

## Bajo

### O-07 · bajo · Los créditos de Tatoeba (CC BY 2.0 FR) y de la lista de palabras (CC BY-SA 4.0) no aparecen en la app publicada
- **Dónde:**
  - Están en el README (`README.md:171-177`) y en los comentarios de `src/engine/corpus/words.ts:1-2` y `sentences.generated.ts:1`.
  - El build quita los comentarios: `grep -c "OpenSubtitles|CC-BY-SA|Tatoeba" dist-ops/assets/*.js` → 0 en todos los chunks.
  - En la app, los créditos se limitan a la mascota y las manos (`Settings.tsx:320-330`) y a Wikisource en la biblioteca (`Reading.tsx:78-83`).
- **Escenario:** el sitio distribuye frases de Tatoeba y una lista derivada de FrequencyWords sin atribución visible para quien lo usa. CC BY pide que el crédito acompañe al material distribuido. BY-SA pide además indicar que la lista fue adaptada y que la adaptación (`words.ts`) siga bajo BY-SA. El README ya lo declara así, pero el visitante del sitio no lo ve.
- **Evidencia:** verificado leyendo y con `grep` sobre el build.
- **Confianza:** alta en el hueco. Que una lista de frecuencias sea protegible tiene matices (derecho sui generis de bases de datos en la UE): esto es interpretación, no asesoramiento legal.
- **Arreglo sugerido:** sumar al pie de Ajustes una línea como «Palabras: lista adaptada de OpenSubtitles 2018 vía hermitdave/FrequencyWords (CC BY-SA 4.0). Frases: Tatoeba (CC BY 2.0 FR)», con links. Es un cambio de 5 minutos que deja el tema cerrado.

### O-08 · bajo · Una visita directa a una ruta interna devuelve HTTP 404 (aunque la app se ve bien)
- **Dónde:** `pages.yml:31`, que copia `index.html` a `404.html`.
- **Evidencia (verificado con medición):** `curl -sI https://seba-cascardo.github.io/TypeLight/estadisticas` → `HTTP/1.1 404 Not Found`. El navegador pinta la app igual.
- **Escenario:** el link de vista previa de WhatsApp o Telegram para una ruta interna probablemente no se genere, porque muchos crawlers descartan un 404 (**hipótesis**; se confirmaría pegando el link en WhatsApp). Un monitor de disponibilidad también lo vería caído.
- **Arreglo sugerido:** compartir siempre la raíz `/TypeLight/`, que responde 200. Si alguna vez hace falta, copiar `index.html` a `dist/<ruta>/index.html` para las rutas fijas. Pro: dan 200. Contra: hay que mantener la lista de rutas y no cubre las que tienen parámetros. Hoy no lo recomiendo.

### O-09 · bajo · El link compartido se ve pobre: no hay `description`, `og:*`, imagen ni ícono para iOS
- **Dónde:** `index.html:1-20` tiene `lang="es"`, `title`, `theme-color` y un favicon SVG (que el build reescribe bien a `/TypeLight/favicon.svg`, verificado en `dist-ops/index.html`). Faltan `<meta name="description">`, `og:title`, `og:description`, `og:image` y `apple-touch-icon`.
- **Escenario:** el amigo recibe un link pelado, sin tarjeta con imagen ni frase, y es menos probable que lo abra.
- **Confianza:** verificado leyendo.
- **Arreglo sugerido:** sumar `description`, `og:title`, `og:description`, un `og:image` de 1200×630 (una captura de Inicio con el teclado) con URL absoluta a `https://seba-cascardo.github.io/TypeLight/og.png`, `og:url`, y un `apple-touch-icon` PNG de 180 px.

### O-10 · bajo · El workflow de Actions se puede endurecer
- **Dónde:** `.github/workflows/pages.yml`.
- **Evidencia (verificado leyendo):**
  - `:9-12`: `pages: write` e `id-token: write` están a nivel workflow, así que el job `build`, que corre `npm ci` con scripts de instalación de terceros, también recibe un token OIDC que no necesita.
  - `:21-22, :32-33, :43`: las actions van por tag (`@v4`, `@v5`, `@v3`) y no por SHA.
  - `:14-16`: `cancel-in-progress: true`, cuando el workflow de inicio de Pages usa `false` para no cortar un deploy a mitad de camino.
  - No hay `dependabot.yml`.
- **Confianza:** alta en los hechos. El riesgo práctico es bajo, porque las actions son oficiales de GitHub.
- **Arreglo sugerido:**
  - Mover `pages: write` e `id-token: write` al job `deploy` y dejar `contents: read` arriba.
  - Poner `cancel-in-progress: false`.
  - Opcional: pinear las actions por SHA y sumar Dependabot para `github-actions` y `npm` con frecuencia mensual. Pro: cubre la cadena de suministro. Contra: llegan PRs para revisar.

### O-11 · bajo · `npm audit` marca 2 vulnerabilidades, las dos sólo de build
- **Evidencia (verificado con medición):**
  - `source-map-js` 1.2.1, high (GHSA-68fv-2mgg-jv7q, DoS al procesar source maps). Llega por `@tailwindcss/node`, `postcss` y `css-tree`: es herramienta de build y no se publica en el bundle.
  - `@dicebear/core` ≤ 9.4.2, moderate (GHSA-gcr2-9v8m-gq45, inyección SVG por la opción `rotate`). Sólo la usa `scripts/build-mascot.mjs`, que no usa `rotate` (verificado con `grep`). La salida ya está congelada en `src/app/assets/mascot.ts`.
  - Con `npm outdated` hay parches pendientes: react 19.3.1, vite 8.3.4, vitest 5.0.5, react-router 7.18.4.
- **Arreglo sugerido:** `npm audit fix` y actualizar los parches dentro del rango. Las versiones mayores nuevas (react-router 8, TS 7, motion 14) no hacen falta ahora.

### O-12 · bajo · Hay código y archivos muertos, y uno de ellos se publica
- **Evidencia (verificado leyendo y con `grep`):**
  - `public/icons.svg`: es el sprite de íconos de la plantilla de Vite (empieza con `<symbol id="bluesky-icon">`). Nadie lo referencia y **se publica** en `/TypeLight/icons.svg` (está en `dist-ops/`).
  - `src/assets/hero.png` y `src/assets/vite.svg`, de la plantilla: sin referencias.
  - `scripts/.keep`: sobra, la carpeta ya tiene 11 archivos.
  - La dependencia `motion` (en `dependencies`): ningún `import` en `src`, `scripts` ni `e2e`. Está desde el primer commit (`7c5c16e`). Por el tree-shaking no pesa en el bundle; es sólo ruido.
  - 6 exports sin ningún uso, ni en tests (`unused_exports.py`): `useSettings` (`store/index.ts`), `lessonAfter` (`curriculum/index.ts`), `keyLegend` y `getLayout` (`layouts/index.ts`), `handOf` (`layouts/types.ts`), `formatAccuracy` (`stats/index.ts`).
  - Duplicación menor: los 20 specs e2e arman cada uno su propio estado sembrado en localStorage.
- **Arreglo sugerido:** borrar todo lo anterior y sacar `motion` de `package.json`. A futuro, un `e2e/seed.ts` compartido.

### O-13 · bajo · No hay Content-Security-Policy
- **Dónde:** Pages no deja poner headers, e `index.html` no tiene `<meta http-equiv="Content-Security-Policy">`.
- **Evidencia (verificado leyendo):** la superficie de XSS hoy es mínima.
  - El único `dangerouslySetInnerHTML` es `Mascot.tsx:36`, con SVGs constantes generados en build (`mascot.ts`).
  - El texto propio pegado pasa por `prepareOwnText` y React lo renderiza como texto.
  - Los textos de una copia importada (nombre, ancla, compromiso) también se renderizan como texto.
  - Los únicos `href` son constantes (Wikisource, Johan Melin, CC).
- **Arreglo sugerido (mejora):** una meta CSP del estilo de `default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; font-src 'self'; connect-src 'self'`. Sólo es simple después de O-03 (a): con Google Fonts habría que listar sus dos dominios. Ojo: los `style=""` que trae el SVG de la mascota necesitan `'unsafe-inline'` en `style-src`.

### O-14 · bajo (hipótesis) · Una persona con Mac recibe las guías de AltGr de Windows
- **Dónde:** `src/engine/layouts/data.ts` modela ES y LATAM con AltGr de Windows. No hay ninguna mención de macOS (`grep "Mac|macOS|Option"` → nada).
- **Escenario:** un amigo con Mac en la unidad de Signos ve «AltGr + …» para símbolos que en el teclado español de Mac van con Option y a veces en otra tecla (por ejemplo `\`). La app acepta el carácter igual, porque escucha `input`; lo único que queda mal es la guía visual.
- **Confianza:** hipótesis. Se confirmaría comparando la tabla de `data.ts` con el layout «Spanish – ISO» de macOS.
- **Arreglo sugerido:** si algún amigo usa Mac, una línea en la Bienvenida: «En Mac, AltGr es Option y algunos signos cambian de lugar». Una tabla de Mac completa sólo si alguien la pide.

---

## Mejora

### O-15 · mejora · PWA (manifest y service worker)
- **Estado (verificado):** no hay `manifest.webmanifest` ni service worker.
- **Opciones:**
  - (a) Sólo el manifest, con nombre, íconos y `start_url: /TypeLight/`. Pro: «Instalar TypeLight» queda en Chrome/Edge con su propio ícono y ventana, sin riesgo. Contra: no anda sin conexión.
  - (b) `vite-plugin-pwa` con `registerType: 'autoUpdate'` y precache. Pro: anda sin conexión y, además, una pestaña vieja tiene sus chunks en caché, lo que también resuelve O-01. Contra: un service worker cambia cómo llegan las actualizaciones (la versión vieja queda hasta recargar) y suma un sistema más que entender y depurar.

  **Recomiendo (a) ahora y (b) sólo si un amigo pide usarla sin conexión.** Antes de cualquiera de las dos, O-01.

### O-16 · mejora · Bundle y carga: está bien
- **Medición (verificado):**
  - Carga inicial: `index-*.js` 459 KB (158 KB gzip) + `jsx-runtime-*.js` 127 KB (43 KB gzip, React + router) + CSS 44 KB (9,6 KB gzip). Son unos 213 KB gzip.
  - Las rutas lazy van de 1,8 a 24 KB. Biblioteca pesa 262 KB (101 KB gzip, `books.ts`), pero se carga sólo al entrar a Lectura.
  - Los PNG de las manos suman unos 62 KB y viven en un chunk lazy.
  - En vivo y desde España, en un Pixel 7 emulado: FCP 268 ms, DOMContentLoaded 238 ms, h1 visible a 394 ms.
- **Mejoras opcionales:**
  - `sentences.generated.ts` (91 KB crudo) viaja en el chunk inicial. Se podría cargar lazy, pero en escritorio no vale la pena.
  - `react-router` llega en su build `development` porque el paquete no expone la de producción por `exports`. Un alias en `vite.config.ts` a `react-router/dist/production/index.mjs` lo achicaría un poco (**hipótesis** sobre el tamaño). Pierde importancia una vez resuelto O-01.

---

## Revisado sin hallazgos

- **Base path:** `vite.config.ts:8` usa `BASE_PATH`, el router usa `basename: import.meta.env.BASE_URL`, y el favicon y los assets salen con `/TypeLight/` en el `index.html` construido (verificado en `dist-ops/index.html`).
- **Fallback 404 → app:** funciona en el navegador (verificado en el repro y en vivo); el único detalle es el código de estado (O-08).
- **XSS:** no hay `innerHTML` ni `eval` con datos del usuario. `code.ts` contiene `<a href=…>`, pero como texto a tipear, renderizado como texto (verificado leyendo).
- **Prototype pollution global** desde el import: no existe (verificado con node, ver O-02).
- **Terceros:** fuera de Google Fonts (O-03), la app no hace ninguna petición a otro dominio (verificado en la red y con `grep`).
- **APIs no estándar:**
  - `showDirectoryPicker` tiene detección (`autoBackup.ts:202`, `'showDirectoryPicker' in window`) y fallback a descarga manual.
  - `navigator.clipboard.writeText` está en `try/catch`, que si falla muestra el texto para copiar a mano (`Practice.tsx:341-347`).
  - `navigator.storage.persist` va con `?.` y `catch` (`storage.ts:73-75`).
  - `AudioContext` tiene detección (`sound.ts:5`).
  - `KeyboardEvent.code` existe en Safari ≥ 10.1 y en Firefox.
- **CSS moderno:** sólo `100dvh` (`index.css:161`, `:262`), que soportan Chrome ≥ 108, Firefox ≥ 101 y Safari ≥ 15.4. No hay `:has`, `@property` ni container queries (verificado con `grep`). El target por defecto de Vite 8 (baseline widely available) alcanza para Chrome/Edge actuales.
- **`index.html`:** tiene `lang="es"`, un título descriptivo y `theme-color`, que se sincroniza con el tema (`main.tsx:23`).
- **`.gitignore`:** cubre `dist`, `node_modules`, `test-results`, `e2e/screens` y las fuentes del corpus. `.gitattributes` fuerza LF.
- **`package.json`:** `private: true` es correcto (evita publicarlo a npm por error). Los scripts son coherentes.
- **README:** la sección «Usarla» ya está escrita para quien usa la app. El resto es para quien la desarrolla, lo cual es razonable en un repo.
- **Datos personales en el repo público:** no hay mails ni rutas de usuario. `scripts/TypeLight.bat` sólo tiene `C:\Projects\TypeLight`.
- **Bloqueo de escrituras ante una hidratación fallida** (`guardedStorage`): protege el caso de JSON ilegible. El caso de claves de más es O-02.

## Fuera de alcance, para quien revise contenido
- `sentences.generated.ts` empieza con frases de tuteo («Acabas de despertar mi curiosidad», «Abre la ventana», «…que tu me recomendaste»), aunque la memoria del proyecto dice que el filtro de Tatoeba saca el tuteo. No lo investigué.
