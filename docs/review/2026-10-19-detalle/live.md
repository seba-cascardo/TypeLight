# TypeLight — QA en vivo (2026-10-19)

Probado con Playwright headless (Chromium 1243 de `playwright@1.63`) contra un dev server propio en `127.0.0.1:5181` (rama `claude/typelight-comprehensive-review-466e4d`, sin cambios) y contra el sitio publicado `https://seba-cascardo.github.io/TypeLight/`. El tipeo leyó el DOM (`.type-char`) y mandó cada carácter; la ñ y las tildes van por `insertText`. Scripts en `scratchpad/review/live/s*.cjs`; capturas en `scratchpad/review/live/shots/` (abajo se citan por nombre de archivo). El server ya está apagado y el puerto 5181 quedó libre (verificado).

**Límites de la prueba:**
- **WebKit no se pudo correr.** Playwright 1.63 pide `webkit-2359` y sólo está `webkit-2248`; con `executablePath` falla por protocolo (`'Console' domain was not found`). No bajé navegadores. Safari quedó sin probar en vivo; el caso «sin `showDirectoryPicker`» se probó en Chromium borrando la API (L-13).
- Firefox no está instalado.
- El bot tipea a 100–400 PPM, así que las velocidades y la fluidez de las capturas no son realistas. No reporto nada que dependa de eso.

## Hallazgos

### L-01 · alto · Dos pestañas abiertas se pisan el progreso: se pierden sesiones sin aviso
- **Pasos:** con progreso guardado, abrí `/practica/calentamiento` en la pestaña A y `/practica/repaso` en la B. Terminá el Calentamiento en A y después el Repaso en B. Variante: dejá B abierta en Ajustes, terminá otro Calentamiento en A y cambiá la «Meta semanal» en B.
- **Esperado:** las dos sesiones quedan guardadas y la rutina marca Calentamiento y Repaso.
- **Real:** `localStorage['typelight.v1']` queda con lo que tenía B en memoria. Después de A: 9 sesiones, `routine.warmup: true`. Después de B: 9 sesiones, la última es `review`, `routine.warmup: false`: **el Calentamiento de A desapareció**. En la variante, tocar un ajuste en una pestaña vieja borró la sesión que A acababa de grabar (de 10 sesiones se volvió a 9). No hay error en consola ni aviso.
- **Evidencia:** salida de `s5-twotabs.cjs` (resúmenes de `localStorage` paso a paso); `shots/twotabs-A-home.png`.
- **Probable (hipótesis, no lo leí entero):** `src/app/store/index.ts:193-300`. `persist` no escucha el evento `storage` (grep sin resultados en `src/app`), así que cada pestaña escribe su estado completo en memoria. Arreglo típico: `window.addEventListener('storage', e => e.key === 'typelight.v1' && useStore.persist.rehydrate())`, o un `BroadcastChannel`. La copia automática a carpeta replicaría el estado pisado.

### L-02 · medio · Un usuario recién llegado ve «Examen semanal» el día 1, y su resultado queda como velocidad de referencia y «Récord personal»
- **Pasos:** usuario nuevo → Bienvenida → Inicio. La cuarta tarjeta ya dice «Examen semanal», y la mascota, «Hoy toca el examen: tres minutos limpios, sin apuro.» Entrá al examen sin haber hecho ninguna lección.
- **Esperado:** sin letras aprendidas no hay examen (o el Reto queda oculto) hasta tener material mínimo. Un examen de 3 minutos no debería durar 3 segundos.
- **Real:**
  - El texto es un drill `fffjjjfffjjj…` de 117–124 caracteres, con f y j que todavía no se enseñaron (`Practice.tsx:260`: con < 2 letras aprendidas el pool es `['f','j']`). Termina al acabarse el texto, en segundos, con el reloj todavía en «3:00».
  - Se graba `reference: true, blind: true`: Progreso muestra «Velocidad de referencia 74 PPM», un rombo en el chart y la marca «sin ayuda» en el día 0.
  - Inicio pasa a decir «Récord personal hoy. Eso es tuyo.»
  - `lastExamDay` queda en hoy, así que el examen «de verdad» no vuelve hasta la semana siguiente.
  - Con el espacio ya aprendido, el examen es un drill de f/j de ~1570 caracteres (`fj jj fj ffjf…`), también como referencia.
- **Evidencia:** `shots/latam-05-home.png` (tarjeta coral y frase de la mascota en el día 0), `shots/zero-exam-end.png`, `shots/zeroexam-stats.png`, `shots/zeroexam-home.png`. Sesión grabada: `{"kind":"exam","wpm":426,"chars":117,"seconds":3.3,"reference":true,"blind":true}`.
- **Probable:** `Home.tsx:130` (`examToday = examDue(lastExamDay, …)` no mira cuánto se aprendió) y `Practice.tsx:278`.

### L-03 · medio · Con la pestaña abierta durante un deploy, la navegación muestra la pantalla de error de React Router («Hey developer 👋»)
- **Pasos:** abrí el sitio publicado y dejalo en Inicio. Publicá una versión nueva (Pages reemplaza los chunks con hash). Simulado con `page.route('**/TypeLight/assets/**' → 404)`. Hacé clic en «Ruta».
- **Esperado:** la app se recarga sola o muestra un mensaje en español («Hay una versión nueva, recargá»).
- **Real:** pantalla «Unexpected Application Error! Failed to fetch dynamically imported module: …/assets/Path-BfkleW-C.js» con el texto para desarrolladores. La gente deja la pestaña abierta todo el día, y Seba pushea seguido a `master`.
- **Evidencia:** `shots/stale-chunk-ruta.png`; consola: `Error handled by React Router default ErrorBoundary: TypeError: Failed to fetch dynamically imported module`.
- **Probable:** `src/main.tsx:150-175`, donde ninguna ruta tiene `errorElement`. Las rutas `lazy` dependen de chunks con hash. Arreglo típico: `errorElement` propio, más `window.addEventListener('vite:preloadError', () => location.reload())`. Cualquier otro error en tiempo de ejecución también cae en esa pantalla en inglés.

### L-04 · medio · Celular: desborde horizontal en la lección y en Progreso; las leyendas del teclado salen cortadas
- **Pasos:** viewport de 390×844 (iPhone 12–14), `/leccion/guia-64-6b-keys` hasta el ejercicio, y `/estadisticas`.
- **Esperado:** sin scroll horizontal (el e2e `mobile.spec.ts` lo exige a 400 px).
- **Real:**
  - En la lección, `scrollWidth` es 399 contra 390: las tarjetas del texto y del teclado se salen 9 px y se ve cortado el borde derecho.
  - En Progreso, `scrollWidth` es 415: todas las `section.card` miden 399 px, y «Enter» del teclado de dominio queda en x = 393.
  - Las leyendas de las teclas se cortan («Tal», «May», «Shi», «En») y los glifos se ven partidos por arriba.
  - A 400 px (el ancho del e2e) pasa justo; a 390 no.
- **Evidencia:** `shots/vp-phone-lesson-exercise.png`, `shots/phone-stats-mid.png`; salida de `s6b-phone-probe.cjs` (lista de elementos con `right > 390`).
- **Probable (hipótesis):** `src/app/components/Keyboard.tsx`. El ancho mínimo de las filas (gaps fijos más teclas) supera el contenedor, y la grilla de Progreso se estira con él.

### L-05 · medio · Celular sin teclado físico: la Bienvenida espera una tecla que no se puede apretar, y nada avisa que la app es para teclado físico
- **Pasos:** en un celular, nombre → «Seguir». La pantalla dice «Apretá la tecla que está justo a la derecha de la L».
- **Real:** la detección escucha `keydown` en `window` (`Welcome.tsx:60-70`) sin ningún input con foco, así que el teclado virtual no aparece. Lo único que se puede hacer es el link chico «Prefiero elegirlo a mano». Después, todo el currículo (manos, dedos, fila guía) asume un teclado físico, y en ningún lado se avisa que en el celular no sirve. Es probable que algún amigo abra el link desde WhatsApp en el teléfono.
- **Evidencia:** `shots/vp-phone-welcome.png`; código de `Welcome.tsx`. La pantalla de detección en celular no se capturó: es inferencia del código más el comportamiento de los navegadores móviles.
- **Sugerencia:** con `(pointer: coarse)` y sin `keydown` recibido, mostrar «TypeLight se usa con un teclado de verdad: abrilo en la compu» y saltar directo a elegir el teclado a mano.

### L-06 · medio · El link compartido no tiene vista previa, y los deep links devuelven HTTP 404
- **Pasos:** `curl -I https://seba-cascardo.github.io/TypeLight/ruta`, y revisar el `<head>` publicado.
- **Real:**
  - **Vista previa:** el `<head>` publicado no tiene `meta description`, ni `og:title`, `og:description`, `og:image`, ni `twitter:*`, ni `apple-touch-icon`. En WhatsApp sale un link pelado, sin imagen ni descripción.
  - **Deep links:** cualquier ruta que no sea la raíz responde `HTTP/1.1 404 Not Found`, con `index.html` como cuerpo por el `404.html`. En el navegador funciona (se probaron `/ruta`, `/estadisticas`, `/ajustes`, `/jugar/rain`, `/leccion/guia-tip-intro` y `/lectura`), pero ensucia la consola con `Failed to load resource: the server responded with a status of 404`, y los generadores de vista previa o los crawlers tratan el link como roto.
  - **Favicon:** `/TypeLight/favicon.svg` da 200. `favicon.ico` da 404, pero no hace falta.
- **Evidencia:** salida de `s9-pub.cjs`: `pub head: {"title":"TypeLight — mecanografía con diez dedos","desc":null,"og":[],…}` y `pub deep /ruta: HTTP 404`.
- **Probable:** `index.html` (agregar las metas). Lo de los deep links es una limitación de Pages: compartir siempre la raíz.

### L-07 · bajo · «Dominio por dedo» contradice a «Dominio del teclado» en los primeros días
- **Pasos:** usuario nuevo, después de las primeras lecciones → Progreso.
- **Real:** «Dominio del teclado» dice «dominada · 0, en camino · 3», y «Dominio por dedo» pinta «100 %» en cada dedo con teclas, para después decir «Piden más: índice izquierdo y índice derecho.» Para un usuario nuevo se lee como «¿domino o no domino?».
- **Evidencia:** `shots/phone-stats-mid.png` y `shots/latam-3-stats.png`.
- **Probable (hipótesis, por la memoria de arquitectura):** `fingerDominance` usa `dominance` (sin la regla de `daysSeen ≥ 2`), mientras que el mapa usa `mastery(…, today)`.

### L-08 · bajo · El texto dice «Texto real» y lo que aparece es un drill de f/j
- **Real:** el Reto («Texto real durante sesenta segundos…», y en Inicio «Un minuto de texto real»), la Carrera («Frases reales contra tu mejor Reto») y Muerte súbita («Texto real: el primer error termina») muestran `fff ff fjj fj…` mientras se aprendieron pocas letras. Para un usuario nuevo parece una promesa rota.
- **Evidencia:** salida de `s2-routine.cjs` y `s3-games.cjs`; `shots/game-race-intro.png`, `shots/game-sudden-intro.png`.

### L-09 · bajo · La primera referencia de la historia aparece como «Récord personal» en Inicio
- **Real:** `Practice.tsx` evita a propósito el chip de récord en el primer Reto («The very first Reto is not a "record"»), pero la mascota de Inicio dice «Récord personal hoy. Eso es tuyo.» después de la primera referencia, sea examen o Reto.
- **Evidencia:** `shots/zeroexam-home.png`.
- **Probable:** `Home.tsx:147` (`recordToday` no exige que hubiera una referencia anterior).

### L-10 · bajo · «Se te resistieron» y «Palabras que piden práctica» listan pedazos de drill como palabras
- **Real:** después del Reto con f/j: «Se te resistieron: fff → Practicar estas». En Progreso: «Palabras que piden práctica: jfj, fff…».
- **Evidencia:** salida de `s10-misc.cjs` y `s1-newuser.cjs` (texto de `/estadisticas`).
- **Probable:** `wordSamples`/`resistedWords` no filtran por el corpus de palabras reales.

### L-11 · bajo · Recargar o ir Atrás en medio de un ejercicio pierde el avance sin preguntar
- **Real:**
  - **Recargar:** en una lección con el ejercicio empezado, se vuelve a la tarjeta de intro «1 DE 3» y hay que hacer clic de nuevo en todo el recorrido.
  - **Recargar el Reto:** arranca de cero (con el mismo texto, porque el Reto sale de la fecha).
  - **Atrás:** desde el Calentamiento vuelve a Inicio sin confirmar, y Adelante lo reinicia vacío.
  - En todos los casos, nada en consola.
- **Evidencia:** salida de `s4-routes.cjs`; `shots/reload-mid-lesson.png`.

### L-12 · bajo · Contraste debajo de WCAG AA en textos chicos
- **Real (medido con `getComputedStyle`):**
  - **Gris tenue en tema claro:** `rgb(139,144,151)` sobre papel da 2.7–3.2:1. Afecta los eyebrows («LUNES, 19 DE OCTUBRE», «TU RUTA»), las etiquetas de Progreso y «5 de 154 lecciones».
  - **Blanco sobre verde:** 2.83:1 en «Ir a la lección», «Listo», la tarjeta Lección y las metas de la Ruta.
  - **Blanco sobre violeta:** 2.77:1 en «Al compás».
  - **Peor caso:** «meta 18 ppm» en la Ruta da 2.22:1.
  - **Tema oscuro:** los eyebrows quedan en 3.7–4.1:1, apenas mejor.
- **Evidencia:** salida de `s7-contrast.cjs`.
- **Nota:** el verde de los botones es una elección de diseño. Lo dejo como dato, no como bug.

### L-13 · mejora · Ajustes sin `showDirectoryPicker` (Firefox/Safari): el mensaje es claro, salvo un detalle
- **Real:** Chromium sin la API muestra «Este navegador no puede guardar solo en una carpeta: usá Chrome o Edge, o bajá la copia a mano.» con «Descargar copia» e «Importar copia…», y no muestra «Elegir carpeta». Se entiende.
- **Detalle:** en Safari, «Descargar» con `<a download>` y un blob suele abrir el JSON en otra pestaña en vez de bajarlo. No se pudo verificar sin WebKit.
- **Evidencia:** `shots/nofsa-ajustes.png`.

### L-14 · mejora · A 1280×800 y 1366×768 las manos quedan bajo el pliegue durante el ejercicio, y a 4K al 100 % todo queda chico
- **1280×800 y 1366×768:** el texto y el teclado entran, pero las manos guía quedan cortadas abajo, y a 1366×768 la página se autodesplaza y esconde la cabecera.
- **3840×2160 al 100 %:** la columna de 86rem ocupa el 49 % del ancho y las letras se ven chicas. Al 150 % (equivale a 2560×1440) se ve bien.
- **Evidencia:** `shots/vp-1366x768-lesson-exercise.png`, `shots/vp-1280x800-lesson-exercise.png`, `shots/vp-3840x2160-lesson-exercise.png`.

### L-15 · mejora · Con 2 errores en ~480 caracteres, el resultado dice «Al primer intento 100 %»
- **Real:** `Math.round(0.996 × 100)` da 100 %, al lado de «Reparados 2 de 2». Es correcto como redondeo, pero queda raro. Un `floor`, o un decimal cuando hay errores, lo evitaría.
- **Evidencia:** salida de `s10-misc.cjs`; `Practice.tsx:412`.

## Probado sin problemas
- **Onboarding completo con LATAM, ES y US:** detección por tecla (ñ+`{` → LATAM, ñ+tecla muerta → España, `;` → US, también con el `keyboard.press('Semicolon')` real) y elección a mano. Enter y Tab durante la detección no rompen nada. Con el nombre vacío, el saludo queda «Buen día.» sin coma colgando.
- **Primeras cuatro lecciones con los tres layouts:** tip «Antes de empezar», «Teclas f y j» (en el mismo recorrido), «La barra espaciadora», «Repaso: f y j» y «Práctica: f y j», tipeadas de verdad hasta «Lección terminada» con 3 estrellas. «Siguiente: … (Enter)» encadena bien.
- **Rutina completa (Calentamiento, Repaso, Examen, Reto):** se marca en Inicio, aparece la fila «Jugar». El chequeo de forma bloquea Enter hasta responder, como está diseñado. «Copiar resultado» copia `TypeLight · Reto 19/10 · 220 PPM · 100 % al primer intento · ⌨️ 🟩🟩🟩🟩🟩`. En el Reto, Backspace repara los errores.
- **Juegos en modo libre:** Lluvia, Al compás, Globos, Carrera y Muerte súbita arrancan con Enter, corren y terminan con pantalla de resultados. Lluvia, Al compás y la Carrera se jugaron de verdad y dieron puntajes coherentes. Globos sale con 13 % de precisión, pero es casi seguro un defecto de mi bot, que lee el DOM un frame tarde (trampa ya documentada), no de la app.
- **Rutas inválidas:** `/leccion/no-existe` → `/ruta`; una lección bloqueada → `/ruta`; `/jugar/foo`, `/cualquiera`, `/practica/foo` y `/practica/palabras` sin `w` → `/`; `/lectura/x` → `/lectura`. Sin onboarding, `/ruta` y `/jugar/rain` → `/bienvenida`. Ninguna pantalla en blanco.
- **Consola del dev server:** ni un error ni un warning en ninguno de los flujos.
- **Sitio publicado:** carga, los assets dan 200, el favicon SVG da 200, el título es correcto y `lang="es"`. El onboarding funciona con la base `/TypeLight/`, y los deep links funcionan en el navegador.
- **Tema oscuro:** Inicio, lección, Progreso, Ajustes y juegos se ven bien, con las teclas en grafito y la leyenda del color del dedo. Tablet de 820×1180 sin desbordes. Las demás vistas del celular (Inicio, Ruta, Ajustes, Lectura, Texto propio, Globos, Reto) sin desborde horizontal. 1920×1080 y 2560×1440 bien.
- **Celular:** tocar el área de tipeo enfoca el input oculto (`aria-label="Escribí el texto"`).
