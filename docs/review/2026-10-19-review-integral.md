# Review integral de TypeLight — 2026-10-19

Objetivo: dejar la app lista para que la usen amigos (usuarios nuevos, cada uno en su navegador, casi todos Chrome/Edge de escritorio, en España y Argentina).

## Cómo se hizo

- Siete revisores en paralelo, uno por área: motor de tipeo y currículo, estadísticas y hábito, persistencia y copias, pantallas, juegos, prueba en vivo como usuario nuevo y «listo para producción».
- Después, dos verificadores trataron de refutar cada hallazgo alto o medio contra el código, con repros. No refutaron ninguno; varios cambiaron de severidad, y eso queda anotado acá.
- Los cuatro más graves se confirmaron además a mano (lectura del código y, para E1-01, repro propio en el navegador).
- Base: `npm test` 305/305, `npm run e2e` 47/47, `tsc -b` limpio, `oxlint` con 0 errores y 4 warnings. `npm audit` da 2 vulnerabilidades, las dos en dependencias de desarrollo.
- El detalle de cada hallazgo (escenario, evidencia, arreglo sugerido) está en [`2026-10-19-detalle/`](2026-10-19-detalle/), un archivo por área; los veredictos, en `verify-a.md` y `verify-b.md`. Los IDs de abajo son los de esos archivos. Los scripts de repro y las capturas quedaron en el scratchpad de la sesión: no se versionan.

Severidades: **alto** = un amigo lo va a encontrar y le rompe algo (progreso, métricas o la pantalla); **medio** = molesta o mide mal en un caso común; **bajo** = raro, cosmético o sólo con una URL armada a mano.

---

## Alto: arreglar antes de pasar el link

### 1. Después del tip de bienvenida, Calentamiento, Repaso, Reto y Examen salen vacíos (E1-01)
- **Qué ve el amigo:** lee la tarjeta de bienvenida, vuelve a Inicio antes de terminar «Teclas f y j» y abre cualquier bloque de la rutina: el recuadro del texto está vacío y tipear no hace nada. Reproducido en Chromium: 0 letras con el tip hecho; 24, 21, 33 y 128 sin él.
- **Por qué:** el tip se crea con el pool vacío (`src/engine/curriculum/build.ts:55,133`). `useProgress` toma como «aprendido» el pool de la última lección completada (`src/app/hooks/useCurriculum.ts:31-32`), que es el tip, y queda `[]`. En `Practice.tsx:276-288`, `drillText([])` devuelve `''`.
- **Arreglo:** que `useProgress` saltee los tips (o las lecciones con pool vacío) al buscar la última, más un respaldo `['f','j']` en las ramas de drill de `Practice`.

### 2. El primer día, el «Examen semanal» es un drill de f/j y queda como velocidad de referencia (S-01 = U-01 = L-02)
- **Qué ve el amigo:** sin ninguna lección hecha, la tarjeta coral de Inicio ya dice «Examen semanal · 3 min» y la mascota anuncia «Hoy toca el examen». El examen resulta ser `fffjjj…`, termina en 3 segundos y se graba como velocidad de referencia «sin ayuda». Después Inicio muestra «Récord personal hoy», el gráfico arranca en un número inflado, el chip de récord casi nunca vuelve a salir y el examen de verdad queda para la semana siguiente. El Reto, antes de aprender el espacio, tiene el mismo problema.
- **Por qué:** `examDue(null)` es `true` (`src/engine/stats/exam.ts:19`, usado en `Home.tsx:130`), y `Practice.tsx:278/287` cae en `drillText` mientras no haya espacio, con `reference: true`. Va contra tu propia regla: ningún ejercicio fácil mueve las métricas.
- **Arreglo:** no ofrecer el examen y no contar Reto ni examen como referencia hasta `wordsReady(learned)` (espacio + 8 letras). Mientras tanto, la tarjeta coral vuelve a ser el Reto, o se oculta.

### 3. Después de cada deploy, quien tenga la pestaña abierta ve un error en inglés y sin salida (O-01 = U-03 = L-03)
- **Qué ve el amigo:** cada vez que hacés push a master, Pages publica archivos JS con nombres nuevos y borra los viejos. Un amigo con la pestaña abierta toca «Ruta» y recibe la pantalla de React Router: «Unexpected Application Error! Failed to fetch dynamically imported module… Hey developer 👋», sin menú ni botón. Reproducido contra el sitio publicado.
- **Por qué:** las pantallas se cargan de a pedazos (`lazy`), y el router no tiene `errorElement` (`src/main.tsx:34-59`). Pages además cachea `index.html` 10 minutos.
- **Arreglo:** (a) escuchar `vite:preloadError` y recargar la página una sola vez, lo que resuelve el 99 % sin que el amigo note nada; (b) un `errorElement` propio, en español, con «Recargar» y «Volver a Inicio», para cualquier otro error de render (hoy, un error así es una pantalla rota).

### 4. Dos pestañas abiertas se pisan el progreso (P-01 = L-01)
- **Qué pasa:** la pestaña A queda abierta desde la mañana; en la B el amigo hace la rutina y dos lecciones. Vuelve a A y toca cualquier cosa: A escribe su estado viejo entero y lo hecho en B desaparece, sin aviso. La copia automática del día también se pisa. Reproducido tres veces: dos revisores y la prueba en vivo.
- **Por qué:** zustand `persist` reescribe todo el estado en cada cambio y nadie escucha el evento `storage`, con el que el navegador avisa que otra pestaña cambió `localStorage` (no hay ningún listener en `src/`).
- **Arreglo:**

  | Opción | Pro | Contra |
  |---|---|---|
  | A. Rehidratar al recibir `storage` (`useStore.persist.rehydrate()`) | Las dos pestañas quedan sincronizadas solas. Son ~10 líneas. | Un ejercicio a medio hacer en A sigue con su texto, pero al terminar graba sobre el estado ya actualizado. |
  | B. Aviso «TypeLight está abierta en otra pestaña» y bloquear la vieja | Imposible perder datos. | Es más fricción. |

  Recomiendo A, que es lo estándar.

### 5. En textos largos, la letra actual se va de la pantalla y cada tecla deshace el scroll (U-02)
- **Qué ve el amigo:** en el Texto propio (hasta 1500 caracteres) o en el examen, a 1366×768 la letra actual queda debajo del borde hacia el carácter 700 (en 1920×1080, hacia el 900). Si baja con la rueda, la tecla siguiente lo devuelve arriba. Reproducido con Playwright. Vos no lo ves porque tu monitor tiene 2160 px de alto.
- **Por qué:** el `<input>` oculto que captura el teclado está fijo en `top:0` (`src/app/hooks/useHiddenInput.ts:99-100`), y Chrome scrollea hasta el campo con foco en cada tecla.
- **Arreglo:** mover el input oculto a la posición de la letra actual, con lo que el scroll del navegador sigue al cursor solo, o hacer `scrollIntoView` de la letra.

### 6. Al compás: después de la primera aceleración, el metrónomo se desfasa de las notas (G-01)
- **Qué pasa:** el tic cambia al pulso nuevo al instante, pero las notas que ya estaban en camino siguen con el pulso viejo. Quien juega bien (y por eso acelera) y sigue el sonido cae fuera de la ventana: a 12 PPM, cada nota llega 400 ms antes del tac, con ventanas de ±80/±160 ms. Reproducido simulando la ronda.
- **Dónde:** `src/app/components/games/RhythmGame.tsx:137-141` contra `src/engine/games/rhythm.ts`.
- **Arreglo:** que el tic suene cuando una nota llega a su `at`, no con un reloj propio.

---

## Medio

| ID | Qué pasa | Dónde | Arreglo en una línea |
|---|---|---|---|
| U-04 | El reloj del Reto, del examen y de «Como antes» se congela mientras se tipea rápido (hasta 11 s a 110 PPM), y el límite se pasa hasta 4 s. | `useTypingSession.ts:77-87`: el intervalo de 200 ms se recrea en cada tecla. | Intervalo estable, con el estado leído por ref. |
| U-05 | Tab saca el foco del ejercicio: aparece el velo, se pierden las letras siguientes y el reloj del Reto sigue corriendo. | `useHiddenInput.ts` (sólo bloquea Enter y Backspace). | `preventDefault` de Tab en el input oculto. |
| G-05 | Bloq Mayús prendido: en Lluvia, Al compás y Globos cada tecla es error, y en las lecciones también, todo sin aviso. Probable en principiantes, porque Bloq Mayús está pegado a la A. | No hay `getModifierState` en `src/`. | Aviso «Bloq Mayús activado» sobre el ejercicio (y en los juegos, aceptar la letra igual). |
| G-02 | Lluvia, Al compás y Globos no se pausan: al volver de otra pestaña se cobran todas las vidas o notas de golpe (en una lección, 1 estrella). En Globos basta con perder el foco. | Física con `performance.now()` crudo. | Pausar con `visibilitychange`/`blur`, como ya hace `useTypingSession`. |
| G-03 | Carrera: si la pestaña estuvo oculta, el fantasma y el reloj arrancan adelantados (el resultado final sale bien). | `RaceGame.tsx:58,89`. | Usar el mismo reloj descontado que la sesión. |
| G-04 | «Juego: carrera a 34/50 PPM» no corre a ese número: el fantasma es tu mejor referencia de 7 días, que en Velocidad siempre existe. El pie dice «tu mejor Reto de la semana» aunque no lo sea. | `race.ts:5-14`, `GameResults.tsx:75`. | Usar la meta de la lección si existe, o cambiar el título. |
| S-02 | «Fluidez» inflada: Shift+L baja como `L` y, si Shift se suelta primero, sube como `l`. La `L` queda «apretada» toda la sesión (ratio 0,975 cuando el real es 0). | `rollover.ts:22/27`, `useHiddenInput.ts:82/89`. | Indexar por `e.code` y vaciar en `blur`. |
| S-04 | La tabla de palabras (400) se congela unos 2 meses después de terminar el camino: una palabra nueva se descarta en la misma sesión. Además, pedazos de drill («fff», «úúú») ocupan lugares para siempre y aparecen en «Palabras que piden práctica» (L-10). | `engine/stats/words.ts:38` (y `bigrams.ts:41`, con menos efecto). | Desalojar por `lastSeen`, y no registrar tokens que no son palabras. |
| E1-02 | Las frases de Tatoeba traen tuteo e imperativos de tú («Abre la ventana», «Haz el favor», «Acabas de…») y dos delicadas: «Si la hieres de alguna manera, te mataré» y una con un suicidio. Son unas 35 de 1500 (cota inferior), y ~13 % de los Retos traen al menos una. | `sentences.generated.ts`; filtro en `scripts/build-sentences.py`. | Ampliar el filtro (imperativos de tú, blocklist de violencia) y regenerar. |
| O-04 / L-04 / L-05 | Celular: el link va a llegar por WhatsApp. A 390 px hay desborde horizontal (lección 399 px, Progreso 415 px) y la Bienvenida espera una tecla física que no se puede apretar. Nada dice que la app es para teclado físico. | `Keyboard.tsx` (ancho mínimo, hipótesis), `Welcome.tsx`. | Aviso en pantallas táctiles: «TypeLight necesita un teclado físico; abrila en la compu», con «Seguir igual». |
| L-06 / O-09 / O-08 | El link compartido no tiene vista previa (faltan `description`, `og:title`, `og:image`), y las rutas internas responden HTTP 404 aunque la app se vea bien. | `index.html`; Pages. | Agregar las meta y una imagen og. El 404 es una limitación de Pages, aceptable. |
| O-03 | Google Fonts es el único tercero: cada amigo le manda su IP a Google sin aviso (tema RGPD en España), y la primera pintura depende de eso. | `index.html:9-14`. | Autoalojar Gabarito y Lexend con `@fontsource-variable/*` (licencia OFL). |
| O-05 | Cada push a master se publica sin correr e2e ni lint. | `.github/workflows/pages.yml`. | Sumar `npm run lint` y `npm run e2e` (con `retries: 1` sólo en CI) antes del deploy. |
| O-06 | Ni los amigos tienen por dónde reportar, ni vos cómo saber qué versión tenían (`version` 0.0.0, sin SHA). | `package.json`, `vite.config.ts`. | Botón «Reportar un problema» en Ajustes que copie versión, navegador y teclado para pegar en WhatsApp, más la versión visible al pie. |
| P-02 | Safari borra todo después de 7 días de usar Safari sin abrir la app, y ahí no hay copia automática. El recordatorio llega recién a los 14 días activos. Sólo afecta a quien use Safari. | `backup.ts:108-111`. | Sin copia automática, recordar la copia a mano antes, y avisar en Safari. |

---

## Bajo (en una línea)

**Métricas y textos**
- S-05 / L-09: la primera referencia de la vida aparece como «Récord personal hoy».
- S-07: la tarjeta semanal dice «6 de 5 días».
- S-10: el pronóstico dice «~1 día» cuando la recta ya pasó la meta.
- S-11: «N días seguidos» y el calendario gris no coinciden con lo que cuentan.
- L-07: «Dominio por dedo» contradice a «Dominio del teclado» los primeros días.
- L-08: la tarjeta dice «texto real» y aparece un drill.
- L-15: con 2 errores, el resultado muestra «Al primer intento 100 %».
- S-03: los récords que salen de `sessions` bajan solos cuando se pasa el tope de 1000. A ritmo normal eso llega a los ~6 meses.
- S-06: `halfLife` castiga las teclas frecuentes. Cuestiona una decisión documentada.
- S-08: `dayOfYear` corrido entre las 00:00 y la 01:00 en verano; sólo cambia qué juego toca en el calentamiento.
- S-09: «Copiar resultado» promete el mismo texto para todos, pero depende del teclado y de lo aprendido.

**Tipeo y contenido**
- E1-03: la tarjeta de un símbolo con Shift se titula «? mayúscula».
- E1-04: la de Á/É/Í/Ó/Ú no dice que va con Shift.
- E1-05: en US hay muy pocas frases con números o símbolos y se repiten.
- E1-07: `words.ts` trae «pene», «vagina», «mataré», aunque en 37 800 palabras generadas no salieron.
- E1-08: en modo `free`, la última letra cierra el texto aunque esté mal.
- E1-09: erratas en Quiroga y en un título de Arlt.
- E1-06 y E1-11: hipótesis sobre teclas muertas en LATAM y en US-Internacional.
- O-14 (hipótesis): con Mac, las guías de AltGr no corresponden.

**Juegos**
- G-06: la rampa del calentamiento puede bajar del mínimo.
- G-07: «Juego: signos» casi no tiene signos.
- G-08: Globos ensucia la latencia de las iniciales.
- G-09: el récord de Muerte súbita puede ser falso.
- G-10: un juego sin teclas mantiene la racha.
- G-11: el cronómetro muestra «0:60».
- G-12: no ignoran la tecla mantenida.
- G-13: Globos es más fácil en pantallas altas.

**Pantallas**
- U-06: el Enter global de los resultados le gana al botón con foco.
- U-07: Esc reinicia sin preguntar textos de 1500 caracteres.
- U-08 / G-14: `/jugar/toString` y `/practica/constructor` no redirigen (sólo con URL a mano).
- U-09: Inicio no se entera del cambio de día con la pestaña abierta.
- U-10 / L-12: el contraste de `ink-mute` queda por debajo de AA en texto chico.
- U-13: el `theme-color` no sigue al sistema.
- L-11: recargar o ir Atrás pierde el ejercicio sin preguntar.

**Datos**
- P-03: la foto «antes de reiniciar» se puede pisar.
- P-04: un fallo de `setItem` rompe la acción sin aviso.
- P-05: un estado de versión futura se acepta.
- P-06 / O-02: importar un JSON editado a mano con claves de más rompe la app aun después de recargar. Una copia real no las trae, por eso bajó de medio a bajo.
- P-07: «Empezar de cero» en el rescate pisa el archivo del día.
- P-08: localhost y github.io comparten el prefijo de archivos; sólo te afecta a vos.

**Repo y deploy**
- O-07: los créditos de Tatoeba y de la lista de palabras no aparecen en la app.
- O-10: el workflow se puede endurecer.
- O-11: `npm audit fix` para las 2 vulnerabilidades de build.
- O-12: código y archivos muertos, como `public/icons.svg` (se publica), `hero.png`, `vite.svg` y la dependencia `motion`.
- O-13: no hay Content-Security-Policy.

## Mejoras que conviene hacer ya, pensando en amigos

- **M-01 · `merge` de `settings` superficial** (`store/index.ts:297-309`). Hoy, si agregás un ajuste nuevo sin migración, queda `undefined` para todos los que ya tienen datos. Mientras el único usuario eras vos daba igual; con amigos, cada olvido es un bug en sus navegadores. Arreglo: un `merge` que combine `settings` campo por campo, de una línea.
- **M-02:** `BACKUP_VERSION` y la versión del store son dos constantes; si se desfasan, una copia se re-migra y pierde datos. Conviene una sola.
- **M-03:** pedir `navigator.storage.persist()` también al terminar la Bienvenida, no sólo al recargar.
- **U-11:** TypingArea re-renderiza el texto entero en cada tecla y 5 veces por segundo. Hoy anda; es margen para máquinas lentas.
- **U-12:** los textos están pensados para vos. La tarjeta «Antes de seguir» supone que todos tipeaban «con los dedos de antes», y hay jerga a la vista (bigramas, KSPC, fluidez). El voseo es decisión tuya de tono.
- **O-15 (PWA):** instalarla como app en Chrome es opcional. Pro: un ícono propio y, en Safari, exención de los 7 días. Contra: un service worker suma su propio caso de «versión vieja en caché».

## Revisado y sin problemas

- **Motor:** recorrido del currículo completo de los tres layouts con 15 semillas por ejercicio. No hay textos vacíos, caracteres intipeables ni IDs repetidos. Los tres modos de tipeo dan sus métricas sin NaN, los generadores siempre terminan, y los layouts ES y LATAM se revisaron símbolo por símbolo.
- **Fechas:** días locales, cambio de horario de Madrid, huso UTC−3, racha y comodines, y que los hitos no se disparen dos veces.
- **Datos:** la cadena de migraciones v0→v8 (con un estado v1 real), el bloqueo de escrituras ante datos ilegibles, `parseBackup` con basura, otra app, una versión futura o `__proto__`, y la cola, la rotación y los permisos de la copia automática. Firefox y Safari sin `showDirectoryPicker` muestran un mensaje claro.
- **Juegos:** no hay doble grabación ni fugas de rAF, la física es estable a 144/240 Hz y los pools chicos no rompen nada.
- **En vivo:** onboarding con LATAM, ES y US, cuatro lecciones tipeadas de verdad, la rutina completa, los cinco juegos, rutas inválidas que redirigen, tema oscuro, tablet, 1920×1080 y 2560×1440. Cero errores de consola.
- **Carga:** ~213 KB gzip al entrar, primera pintura en 268 ms medida contra el sitio publicado.
- **Sin probar:** Safari real, porque el WebKit de Playwright instalado no coincide con la versión.

## Orden sugerido

1. **Paquete «antes de pasar el link»:** los altos 1 a 5, más U-05 (Tab), G-05 (aviso de Bloq Mayús), el aviso de celular, las meta del link y M-01. Son cambios chicos y acotados, cada uno con su test.
2. **Paquete de juegos:** G-01, G-02, G-03 y G-04.
3. **Contenido:** E1-02 (regenerar frases) y S-04 (tabla de palabras).
4. **Operación:** O-03 (fuentes locales), O-05 (CI con e2e y lint), O-06 (versión y reporte de problemas), O-07 (créditos).
