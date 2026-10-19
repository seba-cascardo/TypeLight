# Verificación adversarial A: juegos (G-01…G-05) y UI (U-02, U-04, U-05, U-06, U-08)

Método: leí el código de cada cita. Para G-01 y U-04 armé simulaciones o tests temporales (`zz-verify-a-*.test.ts`, ya borrados), y para U-02, U-05 y U-08 una prueba con Playwright Chromium headless contra un Vite propio en `127.0.0.1:5191`, ya apagado y con el puerto liberado. El script quedó en `scratchpad/verify-a/repro.cjs`. No modifiqué ni commiteé nada del repo.

| ID | Veredicto | Severidad (amigos, Chrome desktop) |
|---|---|---|
| G-01 | CONFIRMADO (números reproducidos) | alto |
| G-02 | CONFIRMADO | medio |
| G-03 | CONFIRMADO | medio |
| G-04 | CONFIRMADO CON MATICES (líneas mal citadas; el efecto es peor que lo descripto) | medio |
| G-05 | CONFIRMADO | medio |
| U-02 | CONFIRMADO (también a 1920×1080) | alto |
| U-04 | CONFIRMADO CON MATICES (el exceso real es acotado, el reloj congelado es lo visible) | medio |
| U-05 | CONFIRMADO (lo de la barra de direcciones sigue siendo hipótesis) | medio |
| U-06 | CONFIRMADO (por lectura) | bajo |
| U-08 | CONFIRMADO | bajo |

---

## G-01 · CONFIRMADO · alto

- **Código:** `RhythmGame.tsx:137-141`. El tick avanza con `nextTickAt + r.beat`, y `r.beat` ya trae el pulso nuevo apenas `advance` lo cambia (`rhythm.ts:147-150`). Las notas, en cambio, ya estaban agendadas con el pulso viejo hasta `now + lookahead` (`rhythm.ts:94-99`; `lookahead = (width − 72) / 0.16`, `RhythmGame.tsx:87`), y recién después siguen desde `nextAt` con el pulso nuevo. Las dos series quedan con fases distintas.
- **Repro:** el loop del componente a 60 fps (schedule → advance → tick) con un jugador perfecto. Este es el desfase, en ms, entre cada nota y el tick más cercano:
  - 800 px, 12 PPM: `14000:-17 16000:83 18000:283 20000:-400 21800:-400 … 29000:-400`. Tras la segunda rampa (30 s, 810 ms): `34400:50 … 42590:123` (queda en ~+130).
  - 1100 px, 12 PPM: `-200` estable entre 22 y 29 s; después de la segunda rampa, `~-300`.
  - 1600 px, 12 PPM: `+100` entre 26 y 30 s; después, `~+270`.
  - 1100 px, 20 PPM (540 ms → 486 ms): `~+110` y después `~-215`.
  - En todos los casos, una buena parte de las notas que vienen después de la primera rampa cae a más de ±160 ms del tick: a seguir el oído, es «fuera».
- **Matiz:** el juicio se hace contra la llegada visual de la nota, que sigue siendo correcta: quien mira la nota no pierde nada. Lo que miente es el «tac» y los cuatro puntitos (`beatCount`). El desfase cambia en cada rampa y va de 0 a medio pulso según el ancho. Solo pasa si el jugador viene ≥ 80 % a tiempo. El rótulo «pulso X/min» cambia un `lookahead` (≈ 4,5–10 s) antes de que lleguen las notas rápidas: confirmado.
- **Por qué alto:** el sonido viene prendido por defecto, y la sincronización con un estímulo de audio es más fuerte que con uno visual. Al que juega bien, un metrónomo desfasado medio pulso lo saca de tiempo justo cuando el juego lo premia.

## G-02 · CONFIRMADO · medio

- **Código:** ningún juego de rAF escucha `visibilitychange` ni `blur`. El único `visibilitychange` está en `useTypingSession.ts:58` y en `autoBackup.ts`.
  - Lluvia: `RainGame.tsx:127-128` usa `performance.now()` crudo, y `dropY` tiene tope en `ground` (`:72`). Al volver, todas las gotas vivas llegan al agua en el mismo frame (`:136-151`) y cada una saca una vida. Una gota tarda unos 5–6 s en caer y nace una cada ~1,5 s, así que hay 3–4 vivas al mismo tiempo. Con una ausencia más larga que eso, el juego termina al volver.
  - Al compás: `advance` vence de un saque todas las notas del hueco, y el `for` de `:131-136` llama a `thud()` una vez por nota en el mismo frame.
  - Globos: `:113-124` escapan todos los globos vivos.
- **Globos con pérdida de foco sola:** confirmado leyendo. Al perder el foco, `focused=false` muestra el velo (`:296-300`), pero el loop (`:99-139`) no mira `focused` y los globos siguen subiendo y sacando vidas. Las teclas tampoco llegan, porque Globos lee del input oculto.
- **Matiz:** en Lluvia y Al compás, perder solo el foco de la ventana (clic en otra app) no cobra todo de golpe, porque rAF sigue corriendo. Las vidas se pierden de a una y sin aviso, ya que las teclas van a otra ventana. No está en el reporte, pero es la misma causa: nada pausa.

## G-03 · CONFIRMADO · medio

- **Código:** `useTypingSession.ts:47-56` acumula `hiddenMs` desde el montaje, aunque la sesión todavía no haya empezado, y `startedAt` se guarda en ese reloj de sesión (`typing/index.ts:124`, `startedAt = s.startedAt ?? t` con `t = clock()`). `RaceGame.tsx:58` y `:89` calculan `elapsed = performance.now() − startedAt`, con el reloj crudo. Si la pestaña estuvo oculta 60 s antes de la primera tecla, `elapsed` arranca en 60 s. El resultado sale bien porque `metrics` usa el reloj de sesión (`:33-34`). Ocultar la pestaña a mitad de carrera adelanta el fantasma exactamente lo que duró la ausencia.
- No lo reproduje en el navegador: el mecanismo se lee sin ambigüedad en esas cuatro líneas, y el revisor original lo reprodujo montando el componente.
- **Severidad:** todo es visual, pero contradice el resultado («Va adelante» durante toda la carrera, y después «Le ganaste»). Cualquier cambio de pestaña durante la carrera también lo dispara.

## G-04 · CONFIRMADO CON MATICES · medio

- **Líneas mal citadas:** `ghostWpm` está en `src/engine/games/race.ts:5-14`, no en `:199-208` (el archivo tiene 34 líneas). El pie está en `GameResults.tsx:75`, no en `:171` (el archivo tiene 134). `build.ts:336-337` y `LessonPlayer.tsx:288` están bien.
- **Comportamiento:** confirmado. Además es **peor** de lo que dice el reporte: también son `reference` los ejercicios de las lecciones de texto (`LessonPlayer.tsx:116`, `lesson.kind === 'text'`) y las propias Carreras (`gameSession.ts:14`). En la unidad Velocidad, las lecciones «Texto N · meta X» van justo antes de `carrera-1`/`carrera-2`, así que prácticamente siempre hay una referencia de los últimos 7 días, y el `goalWpm` de la carrera no se usa nunca. La tercera estrella exige ganar (`scoring.ts:35`).
- **Rótulos:** `RaceGame.tsx:105` dice «la meta de la unidad» solo si el número coincide con la meta, y si no, «tu mejor Reto de la semana», aunque la mejor referencia haya sido un texto o una carrera. El pie (`GameResults.tsx:75`) dice «tu mejor Reto de la semana» cuando ganás, y «… (o a la meta de la unidad)» cuando perdés.

## G-05 · CONFIRMADO · medio

- **Código:** `RainGame.tsx:172` (`d.ch === e.key`) y `rhythm.ts:113` (`note.ch !== ch`, llamado desde `RhythmGame.tsx:160` con `e.key`). En Globos, `balloons.ts:110` y `:115` comparan el carácter que entrega el input oculto. `pickLetters` (`pool.ts:5-10`) excluye todo lo que va con Shift, así que con Bloq Mayús activo ninguna tecla puede acertar. `getModifierState` no aparece en ningún archivo de `src/`.
- **Matiz:** lo mismo pasa en `TypingArea` (lecciones, Reto), fuera de este reporte. Ahí al menos el error se ve en el texto, pero tampoco hay aviso. Shift apretado a propósito no es un bug. Que pase seguido es hipótesis: la tecla está pegada a la `a`, que el principiante aprende primero.

## U-02 · CONFIRMADO · alto

- **Código:** `useHiddenInput.ts:99-100` (input fijo en `left:0; top:0` del área), sin `scrollIntoView` en `src/`.
- **Repro (Playwright Chromium, «Texto propio» con un texto de ~1800 caracteres):**
  ```
  1366x768  el cursor queda debajo del borde hacia el carácter 700
  1366x768  after 750       {"scrollY":0,  "curTop":874,"inputTop":238, "curVisible":false}
  1366x768  after wheel 700 {"scrollY":700,"curTop":174,"inputTop":-462,"curVisible":true}
  1366x768  after 1 key     {"scrollY":228,"curTop":646,"inputTop":10}
  1920x1080 el cursor queda debajo del borde hacia el carácter 900
  1920x1080 after 950       {"scrollY":0,  "curTop":1103,"curVisible":false}
  1920x1080 after wheel 700 {"scrollY":700,"curTop":403}
  1920x1080 after 1 key     {"scrollY":269,"curTop":834,"inputTop":12}
  ```
  Con cada tecla, Chrome lleva el input oculto a la vista (`inputTop` ≈ 10) y deshace el scroll del usuario. A partir de ahí el cursor vuelve a bajar del borde con cada renglón.
- **Matiz:** el reporte lo daba solo a 1366×768, pero también pasa en un monitor común de 1080 p, a partir de ~900 caracteres. En el examen (3 min, ≥ 1500 caracteres) le pega a quien tipee más de ~700–900 caracteres, es decir, a ≥ ~47–60 PPM. En «Texto propio» le pega a cualquiera que pegue un texto largo.

## U-04 · CONFIRMADO CON MATICES · medio

- **Código:** `useTypingSession.ts:77-87`. El intervalo de 200 ms tiene `state` entre sus dependencias y se recrea con cada tecla, así que solo dispara después de una pausa de ≥ 200 ms.
- **Pantallas con límite:** solo `Practice.tsx:336` (`timeLimitMs: meta.timed`): **Reto** (60 s, `:78`), **Examen** (180 s, `:89`) y **Como antes** (60 s, `:98`). Ninguna otra pantalla pasa `timeLimitMs`.
- **Repro con el hook real (fake timers):**
  - Teclas cada 150 ms con un límite de 1 s: `elapsedMs` dio 0 en las 20 lecturas y `finished=false`. Recién con una pausa de 250 ms, `finished=true`.
  - Con intervalos realistas (lognormal, CV 0,45, 5 corridas por velocidad, límite de 60 s):

    | Velocidad | El límite se pasa por (ms) | El segundo mostrado queda congelado hasta (ms) |
    |---|---|---|
    | 50 PPM | 37–1191 | 1240–1716 |
    | 70 PPM | 92–863 | 2131–4471 |
    | 90 PPM | 154–1005 | 3451–6702 |
    | 110 PPM | 154–4272 | 5528–10845 |

  - En Playwright, sobre `/practica/reto`, con teclas cada 50 ms el reloj se quedó en `1:00` (ver U-05).
- **Matiz:** el «no corta» se exagera. El exceso es de menos de 1 s hasta ~90 PPM y de unos pocos segundos a 110, y el PPM sale proporcional (`endSession` en el instante del tick). Lo que sí se ve es el reloj y el PPM en vivo trabados varios segundos en quien tipea rápido. Le pega sobre todo a «Como antes», que justamente mide a quien ya tipeaba rápido. En principiantes casi no se nota.

## U-05 · CONFIRMADO · medio

- **Código:** `useHiddenInput.ts:67-85` no frena Tab.
- **Repro (Playwright, `/practica/reto`):**
  ```
  after 3 chars             {"active":"INPUT[Escribí el texto]","done":3,"clock":"1:00","veil":false}
  after Tab                 {"active":"BODY","done":3,"veil":true}
  after 5 more chars + 2.5s {"active":"BODY","done":3,"clock":"0:58","veil":true}
  ```
  Las 5 letras se perdieron y el reloj siguió corriendo.
- **Matiz:** que en Chrome con ventana el foco vaya a la barra de direcciones sigue siendo **hipótesis**: en headless queda en `BODY`. El velo deja claro qué pasó y se recupera con un clic. Es medio en el Reto y el examen, donde el reloj sigue corriendo; en los ejercicios sin reloj, bajo.

## U-06 · CONFIRMADO (por lectura) · bajo

- Los cinco listeners están en `window`, hacen `preventDefault()` y navegan sin mirar `e.target`: `Practice.tsx:247-257` y `:159-168` (WarmupGame), `LessonPlayer.tsx:149-161`, `OwnText.tsx:103-113`, `Play.tsx:44-54` y `Reading.tsx:230-240`. El `preventDefault` en keydown cancela la activación del botón enfocado. Esto lo deduje del código, no lo reproduje.
- **Matiz:** solo afecta a quien navega con Tab, o a quien hizo clic en un botón (que queda con el foco) y después aprieta Enter. Lo del doble Enter que se saltea una tarjeta queda como hipótesis sin probar.

## U-08 · CONFIRMADO · bajo

- **Código:** `Play.tsx:15` y `Practice.tsx:119` validan con `in`.
- **Repro:** `/jugar/toString` y `/jugar/hasOwnProperty` se quedan en su path, con `h1: ""` y sin juego. `/practica/constructor` se queda, con `h1: ""` y el área de tipeo. `/jugar/nope` redirige a `/` (control).
- Solo se llega con una URL armada a mano.
