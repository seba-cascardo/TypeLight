# Review — juegos (TypeLight)

Alcance: `src/app/components/games/*`, `src/engine/games/*`, `src/app/routes/Play.tsx`, `src/app/lib/gameSession.ts`, la función `game` de `src/engine/curriculum/build.ts`, `src/engine/curriculum/warmup.ts` y `WarmupGame` en `src/app/routes/Practice.tsx`. También leí `LessonPlayer.tsx` en la parte que monta los juegos, y `useTypingSession`/`useHiddenInput` en lo que los juegos usan de ellos.

Los repros fueron tests temporales (`src/engine/games/zz-review-games-reducers.test.ts`, `src/app/components/games/zz-review-games-render.test.tsx`), ya borrados. Los de render simulan el rAF y `performance.now()` a mano: una pestaña oculta es un salto del reloj sin frames de por medio, que es exactamente lo que hace Chrome.

---

## G-01 · alto · Al compás: después de la primera aceleración, el metrónomo queda desfasado de las notas (hasta medio pulso) por el resto de la ronda

- **Dónde:** `src/app/components/games/RhythmGame.tsx:137-141` (tick del metrónomo) contra `src/engine/games/rhythm.ts:94-99` (`schedule`) y `:147-150` (rampa en `advance`).
- **Escenario:** un jugador que viene bien (≥ 80 % a tiempo en los primeros 15 s) y tiene el sonido prendido (el default es `sound: true`). A los 15 s el pulso se acelera un 10 %, y desde ahí el «tac» del metrónomo y la llegada de las notas a la zona dejan de coincidir. Con una pantalla de 800 px a 12 PPM, cada nota cae 400 ms antes del tac más cercano (el pulso es de 900 ms). Si el jugador sigue al oído, todo le sale «fuera», porque la ventana de «justo» es de ±80 ms y la de «bien» de ±160 ms. Pierde justamente quien venía jugando bien. Los cuatro puntitos del indicador de pulso (`beatCount`) también siguen al tick, así que la pista visual queda igual de desfasada.
- **Evidencia (verificado con repro):** simulé el loop del componente (schedule → advance → tick, con las mismas fórmulas) y un jugador perfecto que toca cada nota en su `at`. El desfase entre cada nota y el tick más cercano, en ms, sale así: `14000:0 15000:0 16000:100 17000:200 18000:300 19000:400 20000:-400 20900:-400 … 29000:-400`. Con un campo de 1600 px, después de 28 s: `100 100 100 190 280 370 -350 -260 -170 -80 …`.
- **Causa:** cuando cambia el pulso, el metrónomo pasa a `r.beat` en el tick siguiente (`nextTickAt + r.beat`). Las notas, en cambio, ya estaban agendadas con el pulso viejo hasta `now + lookahead`, y el lookahead es `(width − 72) / 0.16`: unos 4,5 s en 800 px y unos 10 s en un campo ancho. Recién después siguen con el pulso nuevo, a partir de `nextAt`. Las dos series quedan con fases distintas para siempre. El rótulo «pulso X/min» también cambia entre 5 y 10 s antes de que las notas se aceleren.
- **Confianza:** alta.
- **Arreglo:** que el metrónomo suene cuando una nota llega a su `at` (guardar el último `id` que sonó y hacer `metronome()` cuando `now >= note.at`), en vez de llevar un reloj aparte.

## G-02 · medio · Lluvia, Al compás y Globos no se pausan: el reloj sigue corriendo con la pestaña oculta y, al volver, se cobra todo de una vez

- **Dónde:** `RainGame.tsx:72,127-151`, `RhythmGame.tsx:123-136`, `BalloonsGame.tsx:103-124`. Ninguno escucha `visibilitychange` ni `blur`: el tiempo sale siempre de `performance.now() - startedAt` y de `now - bornAt`.
- **Escenario:**
  - **Lluvia:** jugás 4–5 s, cambiás de pestaña 12 s para contestar un WhatsApp y volvés. En el primer frame todas las gotas en el aire «tocan el agua», se van las 3 vidas, el juego termina y la sesión se graba. En una lección, además, la lección queda completada con 1 estrella.
  - **Al compás:** vencen de golpe todas las notas del hueco, cada una con su `thud()` en el mismo instante. Con 32 osciladores de ganancia 0,16 sumados en fase, eso es un golpe de sonido que satura.
  - **Globos:** se escapan todos los globos vivos.
  - Si la ausencia supera el tiempo que quedaba, el juego termina al volver.
- **Evidencia (verificado con repro):**
  - Lluvia, montada con rAF simulado: 3 gotas en el aire y 3 vidas; 12 s oculta; un frame después, `onFinish` con `{ misses: 3, seconds: 16 }`.
  - Al compás, con el reducer a 20 PPM y 20 s ocultos: `expired in one frame: 32 onTime 0.33`.
  - Globos: con 5 vivos y un salto largo, `escaped at once 5 lives 0`.
  - Globos, verificado leyendo: si se pierde solo el foco (clic afuera o notificación), aparece el overlay «Hacé clic acá y seguí escribiendo» (`BalloonsGame.tsx:296-300`), que tapa el campo mientras el loop sigue restando vidas.
- **Decisión documentada:** la memoria dice «Física por tiempo con rAF (se pausa en pestañas ocultas…)». Es cierto solo del dibujo; el reloj no se pausa. La app ya resolvió esto para el Reto: `useTypingSession.ts:43-47` resta el tiempo oculto («the Reto's minute doesn't run while you're away»). Los juegos de rAF quedaron afuera de esa decisión.
- **Confianza:** alta.
- **Arreglo:** un `usePausableClock` compartido con `visibilitychange` + `blur`. Al pausar, overlay «Pausa · Enter para seguir»; al reanudar, correr `startedAt` (y en Lluvia `bornAt`/`lastSpawn`) en lo que duró la pausa. Con eso se arregla de paso el overlay de Globos.

## G-03 · medio · Carrera: si la pestaña estuvo oculta antes de arrancar, el fantasma y el reloj arrancan adelantados por todo ese tiempo

- **Dónde:** `src/app/components/games/RaceGame.tsx:57-59` (`setNow(performance.now())`, reloj crudo) y `:89` (`elapsed = now - state.startedAt`), contra `useTypingSession.ts:47`: `startedAt` está en el reloj de sesión, que es el crudo menos el tiempo oculto.
- **Escenario:** abrís la Carrera, te vas a otra pestaña un minuto y volvés. Con la primera tecla, el cronómetro marca 1:00, el auto del fantasma aparece por el 60–70 % de la pista (o directamente en la bandera) y el texto dice «Va adelante». El resultado final se calcula bien, porque `m.seconds` usa el reloj de sesión, así que podés terminar viendo «Le ganaste» después de haber visto toda la carrera al fantasma muy adelante. Pasa lo mismo, en menor medida, si ocultás la pestaña a mitad de carrera. `Esc` (`restart`) pone `hiddenMs` en 0 y lo corrige; el montaje inicial no.
- **Evidencia (verificado con repro):** RaceGame montado; oculto 60 s; una tecla; dos frames. Resultado: `timer right after the first key: 1:00 | ghost car style: left: calc(12px + 0.69… * (100% - 120px)) | Va adelante. Sin apuro…`.
- **Confianza:** alta.
- **Arreglo:** que el loop del fantasma use el mismo reloj que la sesión: exponer `clock` desde `useTypingSession`, o usar `session.elapsedMs` interpolado.

## G-04 · medio · «Juego: carrera a 34 PPM» (y la de 50) no corre a 34: el fantasma corre a tu mejor referencia de 7 días

- **Dónde:** `src/engine/curriculum/build.ts:336-337` (`race.goalWpm = goal`, título `carrera a ${goal} PPM`), `LessonPlayer.tsx:288` (`ghostWpm(sessions, dayKey(), lesson.goalWpm)`) y `src/engine/games/race.ts:199-208`.
- **Escenario:** en la unidad Velocidad, el usuario ya tiene sesiones de referencia de los textos. `ghostWpm` devuelve la mejor de 7 días, así que la meta de la lección solo se usa si no hay ninguna. Alguien con un mejor de 22 PPM «gana» la «carrera a 34» yendo a 23. Alguien con un mejor de 48 no puede ganarla a 34, y la tercera estrella exige ganar. El rótulo en juego dice «Fantasma a 48 PPM · tu mejor Reto de la semana» bajo un título que promete 34. Al pie, `GameResults.tsx:171` dice «tu mejor Reto de la semana» aunque el fantasma haya sido el de 30 días o la meta, y aunque la mejor referencia sea una Carrera o un texto, no un Reto.
- **Evidencia:** verificado leyendo; las tres citas de arriba bastan.
- **Decisión documentada:** la memoria dice «fantasma = mejor sesión `reference` de 7 días o `goalWpm`». Sirve para el modo libre y para la Carrera de Mayúsculas. En las dos lecciones con número en el título choca con lo que el título promete.
- **Confianza:** alta en el comportamiento; que la intención haya sido otra es interpretación.
- **Arreglo:** en las lecciones con `race.goalWpm` explícito, pasar `ghostWpm = lesson.goalWpm`, o sacar el número del título. Y que el pie diga contra qué corrió, usando `detail.ghostWpm` y la fuente.

## G-05 · medio · Bloq Mayús (y Shift) activo: en Lluvia y Al compás cada tecla cuenta como error, sin ningún aviso

- **Dónde:** `RainGame.tsx:169-172` y `RhythmGame.tsx:157-160` comparan `e.key` con letras en minúscula. En Globos, `useHiddenInput` entrega `'A'` y `typeChar` no encuentra candidato. No hay `getModifierState('CapsLock')` en ningún lado de `src/`.
- **Escenario:** el meñique izquierdo aprende la `a`, que está pegada a Bloq Mayús. Un principiante lo toca sin querer, y desde ese momento todo es «otra tecla», la mascota entra en pánico y se pierden vidas, sin que nada explique por qué. Es probable en los usuarios nuevos a los que apunta la app.
- **Evidencia:** verificado leyendo (con Bloq Mayús, `e.key` es la mayúscula; `pickLetters` excluye todo lo que va con Shift, así que nunca hay una `'F'` en el pool). Que sea frecuente es hipótesis; se confirmaría mirando con qué frecuencia aparecen mayúsculas en `wrong`.
- **Confianza:** alta en el mecanismo.
- **Arreglo:** en el keydown, si `e.getModifierState('CapsLock')` está activo, mostrar un aviso «Bloq Mayús activado» y no contar la tecla. Vale lo mismo para `TypingArea`, que está fuera de esta área.

---

## G-06 · bajo · Calentamiento con Al compás: la rampa puede bajar del mínimo de 250 ms, y el pulso inicial no tiene tope

- **Dónde:** `Practice.tsx:143-147,196-197`, `RhythmGame.tsx:46,65`, `rhythm.ts:21-23` (`floorMs` reemplaza a `MIN_BEAT_MS`, no se combina con él).
- **Escenario:** un amigo que ya escribe rápido con la digitación correcta, con referencia de 60 PPM: `beatWpm = 54` da un pulso inicial de 222 ms, y el piso `beatMs(60)` es de 200 ms. Son letras sueltas al azar a 54 PPM, desde el primer segundo. Ya a 250 ms las ventanas de ±160 ms de dos notas seguidas se superponen. El «mínimo 250 ms» documentado vale en las lecciones pero no en el Calentamiento.
- **Evidencia:** el piso y la falta de tope, verificado leyendo. Que sea injugable para letras sueltas es hipótesis: se confirmaría jugándolo con `beatWpm` ≥ 50.
- **Arreglo:** `floor = Math.max(MIN_BEAT_MS, beatMs(maxWpm))` y el pulso inicial `Math.max(beat, MIN_BEAT_MS)`. Pensar además si el 90 % de la velocidad en texto es una buena base para letras sueltas.

## G-07 · bajo · «Juego: signos» casi no tiene signos; «al compás con números» tiene un 25 % de números

- **Dónde:** `build.ts:308` (Lluvia con todo el pool) y `src/engine/games/pool.ts:139-145` (`pickLetters` saca todo lo que va con Shift o AltGr).
- **Escenario y evidencia (verificado con repro):** con el pool de `juego-signos` (99 caracteres), Lluvia usa 43 teclas, y los únicos signos son `, . - ¡ ' +` en ES y `, . - ¿ ' +` en LATAM. De los 20 signos que enseña la unidad aparecen 3, cada uno más o menos 1 de cada 43 gotas. En `juego-numeros` (Al compás), 10 de 40 notas son dígitos.
- **Arreglo:** un `focus` para los juegos temáticos (como `patterns` en Globos), que priorice los caracteres nuevos de la unidad. Para signos con Shift, Lluvia necesitaría leer la combinación, o usar Globos o Carrera, que pasan por `useHiddenInput`.

## G-08 · bajo · Globos ensucia la latencia de las letras iniciales en el modelo de teclas

- **Dónde:** `BalloonsGame.tsx:148`, donde la latencia es `now - lastKeyAt` para todas las letras, incluida la primera de cada palabra; `balloons.ts:168-170` y `updateKeyStats`.
- **Escenario:** la latencia de la inicial incluye leer los globos, elegir uno y, si no hay ninguno, esperar a que nazca otro (1,1–1,8 s), con un tope de 2000 ms. Eso entra al `latencyEma` de las letras que suelen ir primeras (c, p, s, m, d…), y `weakestKeys` y el Repaso pueden elegirlas por eso. El motor de tipeo ya excluye la primera letra de cada palabra en `wordSamples` por esta misma razón (`typing/index.ts:338`, «which carries the reading pause»).
- **Evidencia:** el mecanismo, verificado leyendo. El tamaño del efecto en el Repaso es hipótesis: se confirmaría comparando el `latencyEma` de las iniciales antes y después de unas rondas de Globos.
- **Arreglo:** no registrar la latencia cuando la letra es la que engancha un globo (`r.active === null` antes de `typeChar`).

## G-09 · bajo · Muerte súbita: «Tu mejor marca hasta hoy» puede ser falso

- **Dónde:** `Play.tsx:88` (`best` sale de `sessions`), `store/index.ts:230` (`sessions.slice(-1000)`) y `GameResults.tsx:180-182`.
- **Escenario:** las sesiones se recortan a 1000 (cada ejercicio de una lección es una), así que en uso diario un récord de hace 2–3 meses se pierde y el juego vuelve a festejar marcas más bajas. Además, el criterio `best <= score` festeja un empate, y también el primer juego terminado en 0 caracteres.
- **Evidencia:** verificado leyendo.
- **Arreglo:** guardar el récord en un campo persistido (como `records`) y festejar solo si `score > best`, con `score > 0`.

## G-10 · bajo · Un juego sin una sola tecla graba sesión y mantiene la racha

- **Dónde:** `gameSession.ts` y sus llamadores (`Play.tsx:36-40`, `Practice.tsx:150-154`, `LessonPlayer.tsx:170-178`). Las lecciones sí descartan las sesiones vacías (`LessonPlayer.tsx:100`, `if (m.chars === 0) return`).
- **Escenario:** entrar a `/jugar/sudden` y equivocarse en la primera tecla graba una sesión de 0 s y 0 caracteres, y `bumpStreak` cuenta el día como activo. Dejar correr Lluvia sin tocar nada también graba sesión y, en lección, la completa con 1 estrella.
- **Evidencia:** verificado leyendo. Si esto choca con la regla «ninguna métrica se mueve con un ejercicio fácil suelto» es para que Seba lo decida.
- **Arreglo:** no grabar (o no contar para la racha) si `hits === 0`.

## G-11 · bajo · El cronómetro muestra «0:60» en el Calentamiento

- **Dónde:** `RainGame.tsx:250`, `RhythmGame.tsx:226` y `BalloonsGame.tsx:225` arman `0:{seg}`. El Calentamiento pasa `durationMs` 60 000 (`Practice.tsx:201`).
- **Evidencia:** verificado leyendo; con 60 s se ve «0:60» en la pantalla de inicio y durante el primer segundo.
- **Arreglo:** formatear `m:ss` como en `RaceGame.tsx:119`.

## G-12 · bajo · Tecla mantenida y barra espaciadora en Lluvia y Al compás

- **Dónde:** `RainGame.tsx:169` y `RhythmGame.tsx:157`, sin `if (e.repeat) return`.
- **Escenario:** dejar una tecla apretada dispara unas 30 pulsaciones por segundo. En Lluvia cada una revienta la gota de esa letra que esté en el aire, y las demás cuentan como error. En Lluvia y en Al compás sin palabras, un toque reflejo de la barra espaciadora cuenta como error, con su thud y la mascota.
- **Evidencia:** verificado leyendo.
- **Arreglo:** ignorar `e.repeat`. En los juegos sin espacio, ignorar `' '`.

## G-13 · bajo · Globos es un 50 % más fácil en pantallas altas

- **Dónde:** `BalloonsGame.tsx:70,73` (`scale` con tope de 1,5) y `balloons.ts:15-19`.
- **Escenario:** el recorrido es `h − 34` px, pero la velocidad solo escala hasta ×1,5. Con un campo de 420 px, un globo tarda unos 27 s en escaparse; con 900 px (el tope de `.game-field`, el caso de un monitor de 1440p o 4K), unos 41 s. Un amigo en una notebook de 1080p (campo de ~650 px, ~28 s) juega bastante más difícil que alguien en un monitor 4K. Lluvia, en cambio, escala la velocidad con `size.h / 420` y su tiempo de caída es constante.
- **Evidencia:** verificado leyendo; las cuentas salen de las fórmulas.
- **Arreglo:** escalar la velocidad con `(size.h − GROUND) / (420 − GROUND)`, sin tope.

## G-14 · bajo · `/jugar/toString` (o `constructor`) pasa el guard de `Play`

- **Dónde:** `Play.tsx:15`, `if (!(gameId in GAME_META))`: el operador `in` incluye las claves de `Object.prototype`.
- **Escenario:** con una URL armada a mano se ve una página con el h1 vacío y sin juego. No rompe nada. Otro revisor (ui-misc) lo está reproduciendo.
- **Arreglo:** `Object.hasOwn(GAME_META, gameId)`.

---

## Revisado sin hallazgos

- **Doble `onFinish` / sesión grabada dos veces:** los cinco juegos tienen el guard `finished.current`. Los loops de rAF se cancelan en el cleanup del efecto y no reprograman después de `finish()` (siempre hay `return` antes de `requestAnimationFrame`). Los listeners de `window` se sacan al cambiar de fase. En Muerte súbita, el efecto de `lastWrong` y el `onFinish` de la sesión no pueden disparar los dos.
- **Monitores de 144/240 Hz:** toda la física es por tiempo (`now − bornAt`, `elapsed`); nada depende de la cantidad de frames. Solo cuesta más render por segundo (un `setFrame` por frame), que no es un bug.
- **Teclas muertas en ES/LATAM:** en Lluvia y Al compás, `e.key === 'Dead'` tiene largo > 1 y se ignora, y `pickLetters` excluye las letras con tilde, así que una tilde no rompe nada (la letra compuesta que sigue cuenta como error, y es un error real). Globos, Carrera y Muerte súbita pasan por `useHiddenInput` (composition), que compone bien `´ + a`.
- **Pools chicos:** con el pool de un usuario nuevo (`['f','j']`) entrando a `/jugar/*` por URL, Lluvia funciona, Al compás alterna f/j (`pickNote` nunca devuelve undefined), Globos cae a pseudo-palabras con dos iniciales como máximo, y la Carrera y Muerte súbita generan texto (`fffj fff ffj…`). No hay crash. `balloonWords` devuelve `[]` solo sin letras, y entonces `pickWord` da `null` y no se crea ningún globo, sin error.
- **Divisiones por cero:** las precisiones están todas guardadas (`total ? … : 0`), `tally.onTime` y `metrics.wpm` también. Las estrellas no dividen.
- **Carrera sin referencia previa:** el fantasma va a `goalWpm` y el rótulo dice «la meta de la unidad». `ghostWpm30` devuelve `null` sin datos y los botones no aparecen. La mediana redondea, así que no hay PPM con decimales.
- **`warmupGame`:** Home y Practice lo llaman igual (con `nextGame`). Las ramas sin `wordsReady` devuelven `null` o `rhythm` según corresponde.
- **Calentamiento:** cuando `beatWpm` es bajo, `maxWpm = round(beatWpm / 0.9) ≥ beatWpm`, así que el piso nunca es más lento que el pulso inicial. Reintentar graba una sesión más y vuelve a marcar la rutina, que es idempotente.
- **`gameSession`:** el campo `rhythm` mezcla dos semánticas (% a tiempo en Al compás, regularidad en Carrera y Muerte súbita), pero hoy no lo lee ninguna estadística, así que no tiene impacto.
- **`Game.tsx`, `meta.ts`, `moods.ts`, `Mascot.tsx`:** sin problemas. El SVG de la mascota sale de assets propios generados por script, no de datos del usuario.
