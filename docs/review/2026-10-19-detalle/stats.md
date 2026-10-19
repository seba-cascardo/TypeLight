# Review — estadísticas, hábito y modelo de habilidad

Área: `src/engine/stats/*`, `src/app/lib/{mascot,share,gameSession,sessionFields}.ts`, el uso desde `src/app/store/index.ts` y `src/app/hooks/useDaySnapshot.ts` (y, para seguir el dato, los call sites en `Home.tsx`, `Practice.tsx`, `Stats.tsx`, `useHiddenInput.ts`).

Repros: tests temporales `src/engine/stats/zz-review-stats-*.test.ts` corridos con `npx vitest run` (ya borrados). La salida citada es la real.

---

## S-01 · alto · Para un usuario nuevo, la «velocidad de referencia» y los récords arrancan con un drill de dos teclas (f/j)

- **Dónde:** `src/app/routes/Home.tsx:130` (`examToday = examDue(lastExamDay, dayKey()) && !routine.challenge`), `src/engine/stats/exam.ts` (`examDue(null, …) → true`), `src/app/routes/Practice.tsx:278` (`if (kind === 'examen') return joined ? drillText(learned, 40, …) : examText(…)`) y la rama del Reto (`if (joined) return drillText(learned, 12, …)`); los dos llevan `reference: true` (`Practice.tsx`, `meta.reference`), y eso termina en `days[d].reference` (`store/index.ts:237`).
- **Escenario:** un amigo instala la app y completa la rutina el día 1. El examen semanal nunca se hizo (`lastExamDay = null`), así que la tarjeta coral del día 1 es el **examen**: 3 minutos, sin ayuda, de `fffjjjfffjjjj…` (con `learned = ['f','j']` el pool todavía no tiene espacio, así que `joined` es true). Ese PPM entra como referencia y como `days[d].exam`. Los días siguientes el Reto también se mide sobre 4–8 letras (pseudopalabras de `wordsText`), y también cuenta como referencia. Consecuencias:
  - «Velocidad de referencia» (gráfico, titular, delta de 7 días, `weeklySummary.refDelta`) mide durante semanas cuánto creció el pool, no la habilidad: el día 1 da un pico y después la curva «baja» cuando aparece texto real.
  - `records().bestReference` y `bestMedian7` quedan fijados en el drill: el chip «Récord personal» del Reto (`Practice.tsx:307`) no vuelve a salir durante mucho tiempo.
  - `legacyBeaten` (tarjeta «superaste tu forma vieja») mira las últimas 7 referencias con mínimo 3: tres días de drills rápidos pueden superar el PPM de «Como antes», que se mide sobre el pool completo.
  - `blindSince` = día 1, así que el pronóstico (`forecast(…, since)`) incluye esos puntos.
  - Choca con la regla de Seba que está en la memoria de arquitectura: «ninguna métrica se mueve con un ejercicio fácil suelto».
- **Evidencia (repro):** `drillText(['f','j'], 40, { joined: true })` → `"fffjjjfffjjjjjjffjffjfjffjffffjfjjfffjjfjjjfffjjfjffjjfjjjjj"`. Con velocidades hipotéticas (examen de drill a 38, Retos de 4 y 6 teclas a 34 y 33, después texto real de 21 a 25), `records(days).bestReference = { wpm: 38, day: '2026-10-01' }` y `legacyBeaten(primeros 3 puntos, 30) = true`.
- **Confianza:** el camino del código está **verificado leyendo** (día 1: examen sobre drill f/j, con `reference: true`); los PPM de los drills son **hipótesis** (se confirma mirando el estado de alguien que arrancó de cero, o con un e2e que haga examen + Reto el día 1).
- **Arreglo:** que un Reto o un examen cuenten como referencia sólo con un pool mínimo (por ejemplo `wordsReady(learned)`, espacio + 8 letras), y no ofrecer el examen antes de eso (que `examDue` devuelva false o la tarjeta muestre el Reto). Los PPM anteriores se pueden guardar como práctica.

## S-02 · medio · «Fluidez» (rollover) queda inflada cuando una tecla se suelta con otro modificador: la tecla queda «apretada» para siempre

- **Dónde:** `src/engine/stats/rollover.ts:22` y `:27` (el `held` se indexa por `key`), alimentado desde `src/app/hooks/useHiddenInput.ts:82` y `:89` con `e.key`.
- **Escenario:** en cualquier texto con mayúsculas o con símbolos de AltGr (el Reto, el examen, los textos de Velocidad, la lectura, la Carrera). El keydown de Shift+L llega como `'L'`; si Shift se suelta antes que la L (algo muy común), el keyup llega como `'l'` y `held.delete('l')` no saca la `'L'`. Desde ahí, **cada** pulsación cuenta como solapada hasta que alguien vuelva a soltar esa tecla con Shift apretado. Lo mismo con AltGr (`@` abajo, `2`/`q` arriba) y con un keyup perdido por blur o alt-tab (no hay limpieza en `blur`, a diferencia de `usePressedKeys.ts:21`). La tarjeta «Fluidez» de Progreso (`fluidity`) muestra un número alto que no corresponde.
- **Evidencia (repro, motor):** una frase tipeada estrictamente de a una tecla, con una sola mayúscula inicial soltada después de Shift → `{ presses: 42, overlaps: 41, held: ['L'], ratio: 0.976 }` (el valor real es 0).
- **Confianza:** el efecto en el motor está **verificado con repro**; que Chrome dé `key` en minúscula en el keyup tras soltar Shift es comportamiento estándar de `KeyboardEvent.key` (depende de los modificadores en el momento del evento), pero acá no lo probé en un navegador real: **hipótesis fuerte**. Se confirma logueando keydown/keyup de Shift+L en Chrome.
- **Arreglo:** pasar `e.code` (la tecla física) en lugar de `e.key` a `trackKeyDown`/`trackKeyUp`, y vaciar `held` en `blur`/`visibilitychange`.

## S-03 · medio · Los récords que salen de `sessions` bajan solos cuando se pasa el tope de 1000 sesiones

- **Dónde:** `src/app/store/index.ts:230` (`.slice(-1000)`); `src/engine/stats/records.ts` (`bestWeeklyAcc` se calcula sobre `sessions`); `src/app/routes/Stats.tsx:115` (`cleanBest`, la «Racha de precisión» histórica, sobre `sessions`); `src/app/routes/Play.tsx:88` (mejor marca de Muerte súbita, sobre `sessions`).
- **Escenario:** cada ejercicio de una lección graba una sesión (`LessonPlayer.tsx:105`), así que alguien que practica todos los días llega a 1000 en uno a tres meses (estimación: **hipótesis**, depende de cuántos ejercicios haga por día). Desde ahí, cuando se descarta la semana del récord, «Mejor semana de precisión», la «Racha de precisión histórica» y la mejor marca de Muerte súbita se reemplazan en silencio por otro valor menor. Es un «récord» que baja. `bestReference` y `bestMedian7` no tienen este problema porque salen de `days` (store v3 hizo justamente eso para la referencia).
- **Evidencia (repro):** semana vieja con 100 % de precisión + 1000 sesiones nuevas al 95 %: antes del tope `{ acc: 1, week: '2026-08-03' }`; después de `slice(-1000)`: `{ acc: 0.952, week: '2026-09-28' }`.
- **Confianza:** repro (mecanismo); el tiempo que tarda en pasar es hipótesis.
- **Arreglo:** acumular en `DaySummary` lo que esos récords necesitan (`chars`, `errors`, `cleanRun` máximo, mejor Muerte súbita), igual que `reference`, y derivar los récords de `days`.

## S-04 · medio · Las tablas de palabras (y de bigramas) se congelan cuando se llenan: una entrada nueva se descarta en la misma sesión en que entra

- **Dónde:** `src/engine/stats/words.ts:38` (`MAX_WORDS = 400`, desalojo por `samples` y después por `lastSeen`), `src/engine/stats/bigrams.ts:41` (`MAX_BIGRAMS = 600`, sólo por `samples`).
- **Escenario:** es un LFU sin envejecimiento. Cuando hay 400 palabras con ≥ 2 muestras, cualquier palabra nueva que aparece una sola vez en la sesión entra con `samples: 1`, queda última en el orden y se desaloja en el acto. Nunca llega a 2 muestras, así que `weakestWords` («Palabras que se resisten» en Progreso) queda limitado a las palabras que entraron antes de que la tabla se llenara, o a las que aparecen dos veces en una misma sesión (las palabras funcionales, justo las fáciles). Una palabra difícil y rara, que falla cada vez que aparece, nunca entra. Con los bigramas pasa lo mismo, pero sin desempate por fecha.
- **Evidencia (repro):** 400 palabras vistas dos veces; después, `difícil` con error una vez por día durante 19 días → presente en la tabla 0 de 19 veces; `weakestWords` = `['w0','w1',…]`. Con 600 bigramas, `qz` con error 20 veces → 0 de 20.
- **Confianza:** el mecanismo está en el repro. Cuánto tarda en llenarse es **hipótesis**: por la ley de Zipf, en ~10 000 palabras de texto corrido hay más de 1000 tipos con frecuencia ≥ 2, o sea una o dos semanas de práctica para las palabras. Para los bigramas en minúsculas es menos probable (hay unos cientos en español), pero las mayúsculas, las tildes y la unidad de código lo acercan.
- **Arreglo:** desalojar por recencia (`lastSeen` más viejo) o por un puntaje con envejecimiento, y no desalojar nunca lo que entró en esta misma llamada. Los bigramas necesitan `lastSeen`.

## S-05 · bajo (pero le pasa a todo usuario nuevo) · La mascota de Inicio dice «Récord personal hoy» con la primera referencia de la vida

- **Dónde:** `src/app/routes/Home.tsx:147` (`recordToday: best.bestReference?.day === today && …`) contra `src/app/routes/Practice.tsx:307-309`, que excluye explícitamente el primer Reto («The very first Reto is not a "record"»).
- **Escenario:** el primer día que alguien hace un Reto, un examen o una Carrera, la tarjeta de resultados no muestra récord (bien), pero al volver a Inicio la mascota dice «Récord personal hoy. Eso es tuyo.» con humor `thrilled`: compara el día contra sí mismo. Y por cómo está armado S-01, eso cae en el día 1 de cada amigo.
- **Evidencia (repro):** `records(addSession({}, '2026-10-19', 60, 25), [])` con un solo día → `bestReference.day === '2026-10-19'` → `recordToday = true`.
- **Confianza:** repro + leyendo.
- **Arreglo:** que `recordToday` exija un récord previo en otro día (el mejor valor de los días anteriores a hoy > 0 y superado hoy), con la misma regla que `Practice.tsx`.

## S-06 · bajo (decisión documentada que conviene revisar) · El `halfLife` castiga las teclas frecuentes y se satura en un solo día

- **Dónde:** `src/engine/stats/index.ts:33-37` (`nextHalfLife`: ÷2 ante cualquier error en la sesión, ×1.5 por sesión limpia), aplicado una vez por sesión en `updateKeyStats`.
- **Escenario:** (a) el error es absoluto, no una tasa: la `e` aparece unas 50 veces por Reto, así que con un 1,5 % de error tiene casi siempre ≥ 1 error por sesión y su `halfLife` vive en el mínimo de 3 días, mientras una `x` limpia con 3 apariciones sube a 30. Después de 8 días sin practicar, la `e` (la tecla más dominada) baja de nivel en `mastery` y suma +2 en `weaknessScore`, y la `x` no. (b) Crece por sesión y no por día: seis sesiones limpias el primer día llevan el `halfLife` de 3 a 30, sin espaciado. La literatura de repaso espaciado (Settles & Meeder 2016, *Half-Life Regression*, Duolingo) actualiza por repaso pero usa el intervalo transcurrido como variable, justamente para no premiar el atracón.
- **Evidencia (repro):** 5 días × 4 sesiones, `e` 49/50 con un desliz en 3 de cada 4 sesiones (`errorEma` ≈ 0,015) y `x` 3/3: `e.halfLife = 3`, `x.halfLife = 30`; ocho días después, `mastery(e) = 2`, `mastery(x) = 3`. Seis sesiones limpias el mismo día → `halfLife: 30, daysSeen: 1`.
- **Confianza:** repro. El comportamiento está descrito en la memoria («÷2 por error», «×1.5 por sesión»); lo que cuestiono es su efecto.
- **Arreglo:** decidir con la tasa de error de la sesión contra un umbral (p. ej. `errors / attempts > 0.05`) y aplicar el ×1.5 como mucho una vez por día (`newDay`).

## S-07 · bajo · `weekWin` dice «meta semanal cumplida: 6 de 5 días»

- **Dónde:** `src/engine/stats/week.ts:62`; también `src/app/routes/Stats.tsx:285` (`{weekDays} de {weeklyGoal}`).
- **Escenario:** una semana con 6 días activos y meta 5, sin delta de referencia ni teclas nuevas: la tarjeta de resumen semanal dice «6 de 5 días», justo lo que `weekGoalLabel` evita (lo dice su docstring, y la memoria lo menciona en «Inicio: una tarjeta cerrable por vez»). Progreso muestra «6 de 5» en la barra «Esta semana».
- **Confianza:** leyendo (la interpolación es directa).
- **Arreglo:** usar `weekGoalLabel(n.activeDays, goal)` en las dos partes.

## S-08 · bajo · `dayOfYear` da el día anterior entre las 00:00 y la 01:00 en horario de verano (España)

- **Dónde:** `src/engine/stats/index.ts:118` (`new Date(y, 0, 0)` en hora de invierno contra `d` en hora de verano, dividido por 86 400 000 y con `floor`).
- **Escenario:** de fines de marzo a fines de octubre, entre las 00:00 y las 01:00 hora de Madrid, `dayOfYear` devuelve el día anterior. Lo usan `warmupGame` (`Home.tsx:132`, `Practice.tsx:128`) y la paridad del calentamiento con bigramas (`Practice.tsx:240`). Si Inicio se dibuja a las 00:50 y el Calentamiento se abre a las 01:05, la tarjeta anuncia un juego y el ejercicio es otro (o ninguno). En Argentina no pasa (sin DST).
- **Evidencia (repro, `TZ=Europe/Madrid`):** `2026-10-19 00:30` → `dayKey 2026-10-19`, `dayOfYear 291`; `2026-10-19 12:00` → `292`. En enero coinciden.
- **Confianza:** repro.
- **Arreglo:** calcular sobre la clave local: `daysBetween(\`${y}-01-01\`, dayKey(d)) + 1`, o con `Date.UTC` sobre año, mes y día locales.

## S-09 · bajo · «Copiar resultado» afirma que el Reto es el mismo texto para todos, pero depende del pool y del teclado de cada uno

- **Dónde:** `src/app/lib/share.ts:1` (docstring) y `Practice.tsx:271` («everyone with the app types the same thing»); `challengeText(pool, { rng })` filtra frases y palabras por el pool aprendido (`src/engine/generator/index.ts:251`).
- **Escenario:** dos amigos en distintas etapas (o uno con ES y otro con LATAM, que tienen distintas teclas en el pool) comparten «Reto 19/10 · 42 PPM» y «Reto 19/10 · 30 PPM» creyendo que tipearon lo mismo. Además, entre las 19:00 y la medianoche de Argentina en España ya es el día siguiente, así que la fecha también difiere (eso al menos se ve en el texto compartido).
- **Confianza:** leyendo.
- **Arreglo:** o bien sembrar sobre el pool completo del camino principal cuando el usuario ya lo completó y decirlo en el texto, o bien sacar la promesa de «mismo texto» del copy y del comentario.

## S-10 · bajo · El pronóstico dice «llega en ~1 día» cuando la recta ya pasó la meta pero el último día bajó

- **Dónde:** `src/engine/stats/forecast.ts:40` (`Math.max(1, days)` cuando `days ≤ 0`).
- **Escenario:** pendiente positiva con buen R², último punto por debajo de la meta e intercepto de la recta (hoy) por encima: `days` da negativo o 0 y se muestra «~1 día». Pasa justo cuando el usuario tuvo un mal día cerca de la meta.
- **Evidencia (repro):** diez puntos de 20 a 47 con el último en 34, meta 40 → `{ reached: false, daysToGoal: 1, slope: 2.29, r2: 0.80 }`.
- **Confianza:** repro.
- **Arreglo:** si `days ≤ 0`, devolver null (o un mensaje «estás a la altura de la meta; falta sostenerla»).

## S-11 · mejora · Dos textos que no coinciden con lo que cuentan

- `src/app/lib/mascot.ts:44`: «N días seguidos» usa `streak.count`, que suma días **activos** perdonando un día de hueco (L-X-V-D cuenta 4): no son días seguidos. Mejor «N días de racha».
- `src/engine/stats/progress.ts:241` (`calendar`): un día con práctica fuera de la rutina (jugar libre, lectura, texto propio) sale gris («nada» en la leyenda de `Stats.tsx`), aunque contó para la racha y para la meta semanal. Un usuario nuevo que sólo juega ve el calendario vacío con la racha subiendo. Se podría pintar «part» o un tono distinto cuando `seconds > 0 && blocks === 0`.

---

## Revisado sin hallazgos

- `dayKey`, `daysBetween`, `shiftDay`, `weekKey`, `monthKey`: trabajan sobre la clave local `yyyy-mm-dd` con aritmética UTC, así que no se mueven con el DST ni en UTC−3. El lunes ISO cruza bien el año (2027-01-01 → 2026-12-28) y la «semana 53» no existe como concepto porque la clave es el lunes.
- `bumpStreak` / `streakAlive` / `streakAtRisk` / `returnLine`: primer día (`gap null → 1`), mismo día (sin cambios), reloj hacia atrás (`gap < 0` ignorado), consumo de comodines (`gap − 2 ≤ freezes`) coherente con `streakAlive`, el comodín ganado después del consumo y el tope de 2. `returnLine` («Uno/Dos comodines») es consistente con `alive`.
- Hitos: `milestoneReached` + `markMilestoneSeen` (marca todos los ≤ m) no disparan dos veces; un salto (importar, migración v5) muestra sólo el más alto, y es a propósito.
- `weeklySummary`: semana anterior por `weekKey(shiftDay(weekKey(today), −1))`, null sin actividad, `masteredNew ≥ 0`, sin divisiones por cero.
- Usuario sin datos: `median([]) = 0` está protegido en todos los call sites, `weeklyAccuracy`/`weekAccuracy`/`fluidity`/`formHeadline`/`records`/`referenceHeadline`/`forecast`/`monthSummary`/`ghostWpm30` devuelven null o 0 sin NaN, y `bigramClasses`/`fingerDominance` sólo dividen con n > 0.
- EMA: `alphaFor` en [0,05, 0,5], `errorEma` acotado a [0, 1] y `halfLife` acotado a [3, 30]; no se van a infinito ni a negativo. `keySpeed` protege la división (`max(latencyEma, 1)`).
- `forecast`: protege `sxx = 0` y `syy = 0`, exige ≥ 8 puntos, R² ≥ 0,5 y pendiente > 0; respeta `since`.
- `records.bestMedian7` y `bestRoutineRun`, `unitMarks`, `snapshotBefore`, `constancy`, `legacyBeaten` (salvo el insumo de S-01).
- Crecimiento: `days` crece de a una fila por día (chico), `keys` está acotado por el alfabeto, `sessions` tiene tope de 1000 y `commitments` crece de a una por semana. El JSON total queda muy por debajo de la cuota de localStorage.
- `store.recordSession`: `today` es local, `addSession` recorta los segundos negativos, `blindSince` se fija una vez. `setSessionForm` y `markRoutine`/`useRoutine` resetean bien al cambiar el día.
- `useDaySnapshot`: `setSnapshot` no escribe si no cambió nada (no hay bucle de renders). Detalle menor: con la pestaña abierta pasada la medianoche no hay snapshot del día nuevo hasta que cambien las `keys`.
- `gameSession` (`rhythm` 0..1 en Al compás, `reference` sólo en Carrera), `gameExtra`, `repairFields`, `shareText` (casillas acotadas a 0..5, `goalWpm` protegido), `keyReason`, `weaknessQualities`, `resistedWords`, `prepareOwnText`, `seedOf`, `firstRetoOfDay`, `ghostWpm30`.
