# Review UI de TypeLight: pantallas, hooks y componentes

Alcance: `src/main.tsx`, `src/app/routes/*` (sin la parte de copias de seguridad de Ajustes ni el rescate de Bienvenida), `src/app/hooks/*`, `src/app/components/*` (sin `games/`), `src/index.css`.
Base: `616de67` (worktree `typelight-comprehensive-review-466e4d`). No toqué archivos del repo. Los tests temporales `zz-review-ui-*` ya están borrados. El dev server propio (:5199) quedó apagado y el puerto, verificado libre.

Etiquetas de confianza: **repro** (lo reproduje: Vitest/jsdom o Playwright contra un dev server propio), **leyendo** (una cita del código lo prueba), **hipótesis** (con lo que la confirmaría).

---

## U-01 · alto · Día uno: el «Examen semanal» y el Reto se hacen sobre un drill de f/j y quedan como velocidad de referencia

- **Dónde:** `src/app/routes/Home.tsx:130` (`examToday = examDue(lastExamDay, dayKey()) && !routine.challenge`), `src/engine/stats/exam.ts:19` (`if (!lastExamDay) return true`), `src/app/routes/Practice.tsx:278` (examen con `joined` → `drillText(learned, 40, …)`), `Practice.tsx:287` (Reto con `joined` → `drillText(learned, 12, …)`), `Practice.tsx:304-305` (`reference = meta.reference === true && counted`, sin mirar qué texto fue).
- **Escenario:** un amigo nuevo termina la Bienvenida. En Inicio, la cuarta tarjeta (la coral) no es el Reto: es **«Examen semanal · 3 min · Sin ayuda ni Backspace»**, antes de haber hecho una sola lección. Si la abre (o, ya hecho el examen, abre el Reto), tipea `fffjjjfffjjjffffffjjfjfjjjjffjjfj` (33 caracteres, termina en segundos, no en 3 minutos ni en 1). Esa sesión se graba con `reference: true`, entra en `days[hoy].reference`, pasa a ser el «Mejor Reto» de `records()` y fija `blindSince`.
- **Consecuencias:** el primer punto del gráfico y la «Velocidad de referencia» de Inicio salen de un drill de dos teclas, que es mucho más rápido que el texto real de las semanas siguientes. Después vienen: «↓ N vs. la semana pasada», un chip de «Récord personal» que no aparece en semanas, la predicción apagada por la pendiente negativa, y un resumen semanal que muestra una caída. Contradice la regla que fijó Seba: «ninguna métrica se mueve con un ejercicio fácil suelto». Además, la descripción del examen promete «El mismo texto todo el mes», y para él es falsa: le toca un drill al azar. Esto le pasa a **todo** usuario nuevo, con teclado ES, LATAM o US.
- **Evidencia (repro):** Home con un store recién estrenado (`onboarded: true`, layout `es`) muestra `routine-challenge` = «3 min · Examen semanal · Sin ayuda ni Backspace…» y `href=/practica/examen`. `/practica/reto` con solo «Teclas f y j» hecha da de texto `"fffjjjfffjjjffffffjjfjfjjjjffjjfj"`. Al tipearlo queda `session {kind:'challenge', reference:true, blind:true, chars:33}`, `days[hoy].reference=[…]` y `records().bestReference` = esa sesión.
- **Confianza:** alta.
- **Arreglo:** que el examen y la referencia exijan texto real. Por ejemplo, `examDue(...) && wordsReady(learned)`, y `reference` solo si `wordsReady(learned)` (o si `!joined` y hay ≥ N letras). Mientras tanto, la tarjeta coral puede decir «se abre después de la lección X».

## U-02 · alto · En los textos largos, el cursor se va de la pantalla y cada tecla deshace el scroll del usuario

- **Dónde:** `src/app/hooks/useHiddenInput.ts:99-100` (el input oculto vive fijo en `left: 0; top: 0` del área de tipeo) y `src/app/components/TypingArea.tsx` (nada lleva la letra actual a la vista: no hay ningún `scrollIntoView` en `src/`).
- **Escenario:** un amigo con notebook (1366×768) pega un texto en «Texto propio» (tope de 1500 caracteres) o hace el examen semanal (≥ 1500 caracteres en `examText`). A los ~900 caracteres, la letra actual queda debajo del borde de la ventana. Baja con la rueda para verla, aprieta una tecla, y la página **salta para arriba**: Chrome lleva a la vista el input enfocado, que está arriba de todo, y el cursor vuelve a quedar fuera de la pantalla. Seguir tipeando viendo la letra actual se vuelve imposible. Seba no lo ve porque usa un monitor de 2160 px de alto.
- **Evidencia (repro, Playwright Chromium a 1366×768, dev server propio):**
  ```
  after 900 chars      {"scrollY":0,  "curTop":989, "innerH":768, "curVisible":false}
  after wheel down 600 {"scrollY":600,"curTop":389, "curVisible":true}
  after 1 more key     {"scrollY":228,"curTop":761, "curVisible":true}
  after 60 more        {"scrollY":228,"curTop":819, "curVisible":false}
  after wheel down 400 {"scrollY":628,"curTop":419, "curVisible":true}
  after 1 more key (2) {"scrollY":228,"curTop":819, "curVisible":false}
  ```
- **Confianza:** alta en «Texto propio». En el examen, alta para quien tipee más de ~8 renglones en 3 minutos. El Reto (~420 caracteres) y las páginas de lectura (≤ 480) entran en una notebook típica por poco: **hipótesis** para pantallas de 1280×720 con barras del navegador, a confirmar con la misma prueba sobre `/practica/reto`.
- **Arreglo:** posicionar el input oculto sobre la letra actual (con `offsetTop/Left` del `.is-current`). Así el propio scroll del navegador sigue al cursor, y el candidato del IME aparece donde corresponde. O, si no, `scrollIntoView({ block: 'nearest' })` de la letra actual en cada avance, con el input posicionado igual.

## U-03 · alto · Sin `errorElement` ni manejo de chunks viejos: después de cada deploy, una pantalla de error en inglés y sin salida

- **Dónde:** `src/main.tsx:34-59`: ninguna ruta tiene `errorElement`/`ErrorBoundary`, y no se escucha `vite:preloadError`. Las rutas son `lazy` (`main.tsx:13`, `45-53`).
- **Escenario A (el probable):** un amigo deja TypeLight abierto en una pestaña. Seba hace push a `master` y Pages publica un artefacto nuevo: los `assets/Stats-<hash>.js` viejos dejan de existir (Pages devuelve su `404.html`). El amigo hace clic en «Progreso», «Ruta» o en una tarjeta de la rutina, el `import()` del chunk falla, y React Router muestra su `DefaultErrorComponent`: **«Unexpected Application Error!»** con el mensaje («Failed to fetch dynamically imported module…») y el stack. Reemplaza la página entera, sin el menú de navegación. La única salida es F5, y un amigo no tiene por qué saberlo.
- **Escenario B:** cualquier `throw` en un render (un dato raro del store, un bug de un juego) produce la misma pantalla, por la misma razón.
- **Evidencia:** repro en Vitest con la misma estructura de rutas (`createMemoryRouter`, layout con `<nav>` y una ruta `lazy` que rechaza): tras navegar, aparece «Unexpected Application Error!» y el `nav` desaparece. Leyendo: el build de producción de react-router 7 (`node_modules/react-router/dist/production/chunk-EFMJ2SG4.mjs:6195-6211`) renderiza `h2 "Unexpected Application Error!"` + mensaje + `pre` con el stack, también en producción.
- **Confianza:** alta en el mecanismo. Que Pages borra los assets del deploy anterior es **hipótesis fuerte**: se confirma abriendo la URL de un chunk viejo después de un push.
- **Arreglo:** un `errorElement` en la ruta del layout (o en la raíz) con un mensaje en español y un botón «Recargar». Además, `window.addEventListener('vite:preloadError', () => location.reload())`, con una guarda en `sessionStorage` para no entrar en bucle.

## U-04 · medio · El límite del Reto, del examen y de «Como antes» no corta mientras se tipea rápido, y la cuenta regresiva se congela

- **Dónde:** `src/app/hooks/useTypingSession.ts:77-87`. El intervalo de 200 ms que actualiza `now` y aplica `timeLimitMs` tiene `state` entre sus dependencias, así que se destruye y se recrea **en cada pulsación**.
- **Escenario:** alguien que ya tipeaba rápido con los dedos «mal» mide «Tu velocidad de antes» (60 s), o un usuario avanzado hace el Reto. Si encadena teclas a menos de 200 ms entre sí, el intervalo no llega a disparar nunca: la cuenta regresiva queda clavada (en `1:00` al principio, o en el último valor que alcanzó a pintar) y el minuto se pasa hasta la primera pausa de ≥ 200 ms. Las teclas tipeadas después de los 60 s se aceptan y cuentan. Como `endSession` usa el instante de esa pausa tardía, el PPM sale proporcional y no muy distorsionado; lo que falla a la vista es el reloj, y la sesión dura más de lo que dice el título.
- **Evidencia (repro, fake timers):** límite de 1 s y 20 teclas cada 150 ms. Durante los 3 s, `elapsedMs` fue `0` en todas las lecturas y `finished=false`. Recién tras una pausa de 250 ms queda `finished=true` con `finishedAt=3250`, `pos=20`.
- **Confianza:** alta en el mecanismo. Para principiantes (intervalos > 200 ms) casi no se nota. Pega en «Como antes» y en los usuarios rápidos.
- **Arreglo:** que el intervalo dependa de un booleano `running` (`startedAt !== null && !finished`) y lea `stateRef.current` adentro, y además chequear el límite en `input()`. Cerrar en `startedAt + limit`, no en el tick.

## U-05 · medio · Tab saca el foco del ejercicio: lo que se tipea después se pierde (o va a la barra del navegador)

- **Dónde:** `src/app/hooks/useHiddenInput.ts:67-85`. `onKeyDown` frena Escape, Backspace y Enter, pero no Tab.
- **Escenario:** a mitad de una lección o del Reto, el meñique roza Tab (está pegado a la Q). El foco pasa al siguiente elemento enfocable. En las pantallas de ejercicio no hay ninguno después del input, así que en Chrome con ventana sale a la barra del navegador. Aparece el velo «Hacé clic acá y empezá a escribir», pero las letras siguientes no llegan al ejercicio y, en Chrome real, se escriben en la barra de direcciones. En el Reto, el reloj sigue corriendo.
- **Evidencia (repro):** en el hook, `Tab`, `ArrowLeft`, `Home` y `F5` dan `prevented: false`. En jsdom con user-event, tras `{Tab}` el foco queda en `BODY`, aparece el velo y la tecla siguiente no llama a `onInput`. En Playwright/Chromium sobre `/practica/repaso`, tras Tab `activeElement = BODY` y la letra siguiente no avanza (`pos` sigue en 1). Que en Chrome con ventana el foco vaya a la barra de direcciones es **hipótesis**, a confirmar a mano.
- **Confianza:** alta en que el foco se va y se pierden teclas. Recuperable con un clic, pero desorienta justo a un principiante.
- **Arreglo:** `if (e.key === 'Tab') e.preventDefault()` en el input oculto, dejando Shift+Tab o Esc como salida accesible si se quiere conservar la navegación por teclado.

## U-06 · bajo · El Enter «global» de las pantallas de resultado le gana a cualquier botón enfocado

- **Dónde:** `Practice.tsx:247-257`, `LessonPlayer.tsx:149-161`, `OwnText.tsx:103-113`, `Play.tsx:44-54`, `Reading.tsx:230-240`. Son listeners en `window` que hacen `preventDefault()` y navegan, sin mirar `e.target`.
- **Escenario:** quien usa el teclado lleva el foco con Tab a «Otra vez», «Repetir», «Copiar resultado» o «Practicar estas →» y aprieta Enter. En vez de activar ese botón, vuelve a Inicio o salta a la lección siguiente (el `preventDefault` en keydown además cancela el clic implícito del botón). Variante: dos Enter seguidos (o mantenerlo apretado) en los resultados de una lección navegan a la siguiente, y el segundo cae en el «Siguiente →» con `autoFocus` de la intro y se saltea una tarjeta explicativa (**hipótesis**: el auto-repeat de Enter sobre un botón con foco, a confirmar a mano).
- **Confianza:** alta en el primer caso (leyendo). Con el mouse no pasa.
- **Arreglo:** ignorar el Enter si `e.target` es un `button`, un `a`, un `input` o un `select` (`(e.target as HTMLElement).closest('button,a,input,select,textarea')`).

## U-07 · bajo (cuestiona una decisión documentada) · Esc reinicia sin preguntar, también en textos de 1500 caracteres y en el examen

- **Dónde:** `useHiddenInput.ts:73-76` → `onRestart`, que todas las pantallas cablean a `session.restart()`.
- **Escenario:** en «Texto propio» al carácter 1400, o en el examen al minuto 2:50, un Esc accidental (o un amigo que espera que Esc «cierre» algo) borra todo sin aviso. La memoria de arquitectura documenta «Escape (reiniciar)», y en drills cortos tiene sentido. En textos largos, a un usuario nuevo le cuesta mucho.
- **Confianza:** alta (leyendo).
- **Arreglo:** en textos largos o con reloj, pedir Esc dos veces (el primero muestra «Esc otra vez para reiniciar» por 2 s), o confirmar inline.

## U-08 · bajo · Los params de ruta se validan con `in`: `/jugar/toString` y `/practica/constructor` no redirigen

- **Dónde:** `Play.tsx:15` (`gameId in GAME_META`), `Practice.tsx:119` (`kind in META`). `in` también mira `Object.prototype`.
- **Escenario:** solo con una URL armada a mano (un amigo no la va a tipear). `/jugar/toString` muestra «Jugar libre» con el `h1` vacío y ningún juego. `/practica/constructor` muestra un ejercicio de tipeo sin título y, al terminarlo, `recordSession({ kind: meta.session! })` graba una sesión con `kind: undefined`.
- **Evidencia (repro):** las dos rutas se quedan en su path (sin redirigir), con `h1: ""`. En la segunda está el área de tipeo.
- **Confianza:** alta. Impacto real bajo.
- **Arreglo:** `Object.hasOwn(META, kind)` / `Object.hasOwn(GAME_META, gameId)`.

## U-09 · bajo · Inicio no se entera del cambio de día si la pestaña queda abierta

- **Dónde:** `Home.tsx:130-135` y `store/index.ts:314-318` (`useRoutine` calcula `dayKey()` solo al renderizar). Nada re-renderiza a medianoche ni al volver a la pestaña.
- **Escenario:** un amigo deja Inicio abierto a la noche y vuelve a la mañana. Sigue viendo las tarjetas de ayer tildadas, «Rutina completa» y el saludo y la fecha de ayer, hasta que navega a otra pantalla. Puede creer que la rutina de hoy ya está hecha.
- **Confianza:** alta (leyendo). Se autocorrige al primer clic.
- **Arreglo:** un `useEffect` en `AppShell` que fuerce un re-render en `visibilitychange`/`focus` si cambió `dayKey()`.

## U-10 · bajo · Contraste de `--color-ink-mute` por debajo de AA en texto chico

- **Dónde:** `src/index.css:11` (`--color-ink-mute: #8b9097`).
- **Evidencia (calculada):** sobre `--color-paper` (#f1ecdf) da ≈ 2,7:1, y sobre `--color-keycap` (#fffdf7) ≈ 3,2:1. AA pide 4,5:1 para texto normal. Se usa en textos que hay que leer: «meta N PPM · Esc reinicia» (`LessonPlayer.tsx:451`), «Después, Enter vuelve · Esc salta» (`FormCheck.tsx`, `text-xs`), la explicación de reparados del Reto, el pie de «Tus semanas», etc. En el texto ya tipeado (`.type-char.is-done`) el bajo contraste es deliberado y está bien.
- **Confianza:** alta en el número. Cuánto molesta es subjetivo, y en el tema oscuro no lo medí.
- **Arreglo:** usar `ink-soft` (#5b6068, ≈ 5,6:1 sobre papel) para los textos instructivos y dejar `ink-mute` para lo decorativo.

## U-11 · mejora · TypingArea re-renderiza el texto entero en cada tecla y además 5 veces por segundo sin que nada cambie en pantalla

- **Dónde:** `useTypingSession.ts:77-87` (un `setNow` cada 200 ms mientras se tipea, incluso donde `live` no se muestra: lecciones, Repaso, Texto propio, lectura) y `TypingArea.tsx:90-127` (recrea un `<span>` por carácter en cada render, sin memo por palabra).
- **Evidencia (repro, jsdom, React dev):** con 1500 caracteres, el montaje tarda 95 ms y cada actualización 8,9 ms de mediana (p90 31,6 ms), en render puro. En Chrome con build de producción debería ser varias veces menos (**hipótesis**: perfilar `/texto` con DevTools). No es un bug hoy, pero es margen que se pierde en notebooks modestas.
- **Arreglo:** pedir el tick de 200 ms solo con `timeLimitMs` (o cuando se muestre `live`), y memoizar por palabra (`React.memo` de un `Word` cuyas props cambien solo si el cursor o una marca caen en ella).

## U-12 · mejora · Textos pensados para Seba que confunden a un amigo nuevo

- `Home.tsx:64-100`: la tarjeta «Antes de seguir» le dice a **todos** «vas a ser más lento que con los dedos de antes». Un amigo que nunca tipeó con diez dedos (ni «mal») no tiene «dedos de antes». Lo mismo pasa con «Medí tu velocidad de antes →» en Inicio y con «Como antes» en Ajustes. Conviene una pregunta en la Bienvenida («¿ya escribís rápido mirando el teclado?») que active o no este bloque.
- Jerga a la vista: «Calentamiento · bigramas» (`Practice.tsx:367`), «Teclas por letra» (KSPC) en el resultado del Reto, «Transiciones / bigrama», «Fluidez · qué fracción de teclas empezás antes de soltar la anterior», «sin ayuda» en el gráfico. Cada uno merece una frase o un `title` que lo explique.
- Voseo rioplatense en toda la UI («Hacé clic acá», «Apretá», «Elegí»…): para los amigos de España se entiende, pero se lee porteño. Es una decisión de tono de Seba, no un bug. Lo dejo anotado para que decida.

## U-13 · mejora · `ThemeSync` en modo «Automático» no sigue el cambio del sistema para el `theme-color`

- **Dónde:** `main.tsx:16-26`. El `matchMedia` se lee una sola vez por cambio de ajuste, sin listener. Los colores de la página sí siguen el sistema (el CSS usa `prefers-color-scheme`); lo que queda desfasado es el color de la barra del navegador (`meta theme-color`) cuando el sistema pasa a oscuro a la noche.
- **Arreglo:** escuchar `matchMedia('(prefers-color-scheme: dark)').addEventListener('change', …)` cuando `theme === 'auto'`.

---

## Revisado sin hallazgos

- **Rutas inválidas:** `/leccion/xyz` y una lección bloqueada → `/ruta`; `/practica/xyz` → `/`; `/practica/palabras` sin `?w=` válido → `/` (`wordsParam` filtra, baja a minúsculas, deduplica y topea en 12); `/lectura/libro-inexistente` → `/lectura`; `*` → `/`. Salvo U-08, ninguna da pantalla en blanco. `RequireOnboarding` manda a Bienvenida, que convive bien con el bloqueo de escritura.
- **Doble grabación:** `useTypingSession` dispara `onFinish` una sola vez por identidad de estado (`notified`), y StrictMode duplica efectos solo al montar, cuando todavía no hay sesión terminada. El doble Enter entre ejercicios no avanza dos pasos: el listener se desmonta al cambiar `stepDone`, y el `preventDefault` en keydown evita que el clic del botón con `autoFocus` sume un segundo `nextStep`. Desmontar a mitad de ejercicio no graba nada.
- **Pérdida de foco por clic afuera o Alt+Tab:** el `blur` muestra el velo «Hacé clic acá…» y al volver con Alt+Tab el navegador devuelve el foco solo (`onFocus` lo esconde). El `onMouseDown` del área con `preventDefault` + `focus()` recupera el foco sin parpadeo.
- **Pestaña oculta:** el reloj descuenta `hiddenMs` y la primera tecla al volver usa `afterPause` (ya cubierto por un test).
- **Texto que se regenera debajo del usuario:** en `Practice`, `text` depende de `keys`/`bigrams`, que solo cambian al grabar, o sea, ya terminado. El Reto y el examen tienen semilla, así que el string es igual y la sesión no se reinicia. En Repaso la sesión se reinicia en silencio detrás de la tarjeta de resultado, sin efecto visible.
- **Lectura:** el lugar se guarda al terminar cada página, un libro terminado vuelve a empezar al abrirlo, `resolveSpot` tolera una biblioteca regenerada, y elegir capítulo remonta la página y le devuelve el foco al input.
- **Cambio de layout:** `Player` lleva `layout.id` en la `key`, `useProgress` recalcula con el currículo del layout nuevo (cacheado), y la Bienvenida detecta ES/LATAM/US con fallback manual.
- **Listeners y timers:** todos los `addEventListener` y `setInterval` de rutas y hooks tienen su limpieza (`usePressedKeys`, `FormCheck`, los Enter de las pantallas, el metrónomo, `ResizeObserver` de `Keyboard`).
- **Estados vacíos de usuario nuevo:** Progreso tiene su pantalla propia con `sessions.length === 0`, Inicio muestra «—» en los números y Ruta y Biblioteca funcionan sin datos. Salvo lo de U-01 y U-12, todo correcto.
- **Accesibilidad básica:** `:focus-visible` global con contorno de 3 px, `prefers-reduced-motion` anula animaciones y transiciones, `lang="es"`, teclado y numérico con `aria-hidden`, el input oculto con `aria-label`, toggles con `label` y checkbox real, gráfico con `role="img"` y puntos enfocables.
- **`useDaySnapshot` / `snapshotDay`:** solo escribe si cambia algo, sin bucle de renders.
