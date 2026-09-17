# Ola 2 · El converso — diseño

Fecha 2026-09-18 · aprobado por Seba el 2026-09-18 («aprobado todo») sobre el artifact `https://claude.ai/artifact/FP7sAfjYGDGJQja7Uenqgb` (respuesta: `1A · 2A · 3A · 4B · 5A · 6A · 7A · 8A · 9A`). Fuente: `docs/research/2026-09-17-auditoria-y-roadmap.md` §5 Ola 2 (puntos 8–14) y §10.

**Estado:** implementado completo (rama `ola-2`, mergeada fast-forward a `master` el 2026-09-18). Desvíos: el examen usa `pickSentences(pool, 60)` y `minChars = 1500` (no 1200) para cubrir 3 min a 80 PPM; en la Carrera Enter no espera al auto-chequeo (sí en Reto y examen); `repairMs` es el tiempo hasta el primer Backspace después de cada error, no solo de los reparados.

## 0. Qué es

La app deja de tratar a Seba como principiante: mide **sin ayuda**, deja **reparar con Backspace** como en un texto real, y hace visible lo único que no puede ver: **el dedo**. Diez piezas, dos sesiones. Lo que no cambia: la ruta por filas, parar en el error en lecciones/Calentamiento/Repaso, la mediana diaria como referencia, tu velocidad de antes y su hito, el build estable en `:5173`.

## 1. Motor: modo «texto real» (`mode: 'free'`)

`createSession(target, mode = 'stop')`. El modo `stop` es el actual, intacto. En `free`:

- `TypingState` suma `mode`, `typed: (string | null)[]` (qué se tipeó en cada posición `< pos`; `null` = salteada) y `extras: Record<number, string>` (letras de más colgadas antes del índice de un espacio o del final).
- **Tecla correcta:** `typed[pos] = ch`, `pos + 1`. Si la posición venía marcada en `erred`, la marca queda (reparada, con marca).
- **Tecla incorrecta** (`expected !== ch`):
  - `ch === ' '` y `expected !== ' '` y la palabra actual ya tiene al menos una letra tipeada → **resincroniza**: las posiciones desde `pos` hasta el próximo espacio (exclusive) quedan `erred` y `typed = null`; `pos` salta al índice siguiente al espacio (o al final). Un solo keystroke erróneo.
  - `ch === ' '` al inicio de palabra (doble espacio) → keystroke erróneo, `pos` no se mueve.
  - `expected === ' '` (o `pos === target.length`) y `ch !== ' '` → **letra de más**: se agrega a `extras[pos]` (tope 5; pasado el tope se cuenta el error y no se agrega); `pos` no se mueve.
  - cualquier otro caso → `typed[pos] = ch`, `erred[pos] = true`, **`pos + 1`** (el error pasa).
- **Backspace** (`backspace(s, t)`): si hay `extras[pos]`, quita la última; si no y `pos > 0`, `pos − 1` y se borra `typed[pos]`. Se registra como keystroke `{ backspace: true, correct: false }` que **no** cuenta ni como error ni como intento (`metrics`, `keySamples` y `rhythm` lo ignoran).
- **Fin:** `pos >= target.length` (el Reto y el examen terminan por reloj antes; el texto es largo).
- `metrics(s)` en `free`: `chars = pos`; `correct` = posiciones `< pos` con `typed[i] === target[i]` (texto correcto al final: lo reparado cuenta, lo que quedó mal no); `errors` = keystrokes erróneos (al primer intento); `accuracy = 1 − errors / keystrokes no-backspace` (la precisión de siempre); `wpm = correct / 5 / minutos`.
- `repairMetrics(s)` (solo `free`): `firstTryErrors` (= `errors`), `kspc` = keystrokes totales (Backspace incluido) ÷ `max(1, chars)`, `repaired` = posiciones `erred` con `typed[i] === target[i]` al final, `repairMs` = mediana de (primer Backspace posterior − keystroke erróneo) sobre los errores reparados, `null` sin reparaciones.
- **Render** (`TypingArea`): posición hecha con `typed[i] !== target[i]` → clase `is-mistyped` y se muestra **la letra tipeada** en coral (1A); salteada → `is-skipped` (tachado suave); `extras` se dibujan colgadas después de la palabra en coral; reparada → `is-done was-error` como hoy.
- `useHiddenInput` gana `onBackspace?`: con callback, Backspace lo invoca (y sigue haciendo `preventDefault`). `useTypingSession` gana `mode` y expone `backspace()`.

## 2. Reto diario (`/practica/reto`)

- `mode: 'free'`, **sin `KeyGuide`** (ni teclado ni manos ni próxima tecla), sin línea de PPM en vivo (§11). Reloj y «Esc reinicia» se quedan.
- Resultado: Velocidad (PPM), Al primer intento (%), Reparados («3 de 4 · 0,6 s») y Teclas por letra (1,08). Debajo, el auto-chequeo (§8).
- `SessionRecord` suma (opcionales): `mode: 'free'`, `blind: true`, `firstTryErrors`, `kspc`, `repaired`, `repairMs`, `rollover`, `form`. Sigue `reference: true`.

## 3. Examen semanal (`/practica/examen`)

- `mode: 'stop'`, `blind: true`, 3 minutos (`timed: 180_000`), `SessionKind` nuevo `'exam'`, `reference: true`, `markRoutine('challenge')`.
- **Texto fijo por mes:** `examText(pool, monthKey)` = `challengeText(pool, { rng: makeRng(seedOf(monthKey)), minChars: 1200 })`. Fijo mientras el pool no cambie dentro del mes (documentado en la tarjeta: «el mismo texto todo el mes»).
- **Cuándo:** `examDue(lastExamDay, today)` = `lastExamDay === null` o `weekKey(lastExamDay) !== weekKey(today)` (`weekKey` = lunes ISO de la semana, `yyyy-mm-dd`). Store: `lastExamDay: string | null` (progreso; se borra con «Reiniciar»).
- **Inicio (2A):** cuando el examen está pendiente y la tarjeta Reto no está hecha hoy, la tarjeta coral dice «Examen semanal · 3 min · Sin ayuda ni Backspace. Tu velocidad limpia.» y lleva a `/practica/examen`. Al terminar, `lastExamDay = hoy`; el resto de la semana la tarjeta vuelve a ser el Reto. Siguen siendo cuatro tarjetas.

## 4. Chart: una sola discontinuidad (3A)

- Store: `blindSince: string | null` — el día de la primera sesión de referencia sin ayuda (se fija en `recordSession` cuando llega la primera con `blind: true`; migración → `null`).
- `DaySummary` suma `exam?: number` (PPM del examen de ese día; `addSession` lo escribe cuando `kind === 'exam'`). La mediana del día sigue incluyendo al examen (es una sesión de referencia).
- `ReferenceChart` suma `blindSince?` (línea vertical punteada con rótulo «sin ayuda») y dibuja el examen como **rombo** hueco coral sobre el punto del día. Leyenda: «examen semanal», «desde acá, sin ayuda».
- El hito «superaste tu forma vieja» no cambia.

## 5. Manos guía por dominio (4B)

- `dominance(stat, goalWpm)` → 0..1: `min(samples / 10, errorTerm, latencyTerm)` con `errorTerm` = 1 si `errorEma ≤ 0.03`, 0 si `≥ 0.15`, lineal entre; `latencyTerm` = 1 si `latencyEma ≤ target`, 0 si `≥ 2·target`, lineal (`target = 60000 / (goalWpm·5)`). Sin stat → 0.
- `KeyGuide` gana `handsOpacity?: number`; el bloque de manos se dibuja con `opacity = max(0.3, 1 − dominance(keys[nextChar]))`. Lo usan intro (por el carácter resaltado), `keys`/`review`/`practice`/`text` (por la próxima tecla) y Calentamiento/Repaso. **El Reto y el examen no muestran `KeyGuide`.** `settings.showHands = false` sigue apagándolas del todo.

## 6. Fluidez (rollover)

- `TypingArea` (vía `useHiddenInput`) cuenta en un `RolloverCounter` (`{ presses, overlaps }`): cada `keydown` de tecla imprimible (`e.key.length === 1`, sin repetición) suma `presses`; si en ese momento hay otra tecla imprimible sin soltar, suma `overlaps`. `keyup`/`blur` limpian las teclas sostenidas. El padre pasa `rollover?: RefObject<RolloverCounter>` y lo lee en `onFinish`.
- `rolloverRatio(c)` = `overlaps / presses`, `undefined` con `presses < 20`. Se guarda como `SessionRecord.rollover` en lecciones, Calentamiento, Repaso, Reto, examen y Carrera.
- Progreso: `fluidity(sessions, today)` = media ponderada por `chars` de `rollover` en los últimos 7 días (`null` sin datos). **Reemplaza a «Ritmo parejo»** en la tarjeta Constancia: «Fluidez · qué fracción de teclas empezás antes de soltar la anterior». `rhythmHeadline` se elimina (el campo `rhythm` de las sesiones se conserva: Al compás lo usa).

## 7. Dominio por dedo (5A)

- `fingerDominance(keys, learned, goalWpm, fingerOf)` → `Partial<Record<Finger, { value: number; keys: number }>>`: media de `dominance` sobre las teclas aprendidas de cada dedo (`fingerOf(ch)` = primer dedo de `fingersFor(layout, ch)`; el espacio va a los pulgares).
- `Hands` gana `tints?: Partial<Record<Finger, number>>` (opacidad del tinte por dedo, 0.12 + 0.78·valor) y `labels?: Partial<Record<Finger, string>>` (burbuja en la yema, escalonadas; los pulgares hacia el hueco central con más separación entre manos).
- Progreso: tarjeta «Dominio por dedo» debajo de «Dominio del teclado», con las manos pintadas y «meñique izq. 38 %…» en las yemas. Sin teclas aprendidas para un dedo → sin tinte ni número.

## 8. Auto-chequeo de forma (6A)

- `FormCheck` (`src/app/components/FormCheck.tsx`): «¿Fila guía y dedos correctos?» con tres keycaps `1 Sí` (verde) · `2 Más o menos` (sol) · `3 No` (coral); teclas `1`/`2`/`3`; `Esc` salta. Tras responder o saltar muestra «Gracias» / «Sin respuesta» y **recién entonces Enter vuelve**. `onAnswer(form: 'si' | 'medio' | 'no' | null)`.
- Store: `setSessionForm(at, form)` parchea la última sesión por `at`. `recordSession` devuelve el `at` grabado para poder parchearla.
- Aparece en el resultado del Reto, del examen y de la Carrera (`GameResults` gana `formCheck?: (form) => void`, usado por `LessonPlayer` y `Play` solo para `race`).
- Progreso: tile «Forma · últimos 10» = «7 de 10» (`formHeadline(sessions)`: entre las últimas 10 sesiones de Reto/examen/Carrera **con respuesta**, cuántas `'si'`; `null` sin respuestas). Informativo.

## 9. Onboarding de converso y ancla (7A)

- `settings.anchor: string` (por defecto `''`), `settings.conversoSeen: boolean` (por defecto `false`; para instalaciones nuevas también `false`: la tarjeta aparece la primera vez que se entra a Inicio ya onboardeado).
- Inicio: si `!conversoSeen`, tarjeta «Antes de seguir» arriba de la rutina: «Diez minutos, cinco días, unas diez semanas.» + «Las primeras dos o tres semanas vas a ser más lento que con los dedos de antes. Es esperado: la precisión hace la velocidad.» + campo «Después de ___, practico» + «Listo» (guarda `anchor`, `conversoSeen = true`). Con `anchor` no vacío, debajo del saludo: «Después de {anchor}, practico.» (punto verde).
- Ajustes: campo «Tu ancla» (input) junto al nombre.

## 10. Juego dentro de la rutina (8A)

- `warmupGame(dayOfYear, learned)` → `'rhythm' | 'balloons' | null`: `null` salvo `dayOfYear % 3 === 0`; entonces alterna por `Math.floor(dayOfYear / 3) % 2` entre `rhythm` y `balloons`; `balloons` exige `wordsReady` (espacio + ≥ 8 letras), si no cae a `rhythm`; `rhythm` exige ≥ 6 letras aprendidas, si no `null`.
- Inicio: la tarjeta Calentamiento muestra «Al compás · ~1 min · juego» (lav) o «Globos · ~1 min · juego» (mint) y sigue apuntando a `/practica/calentamiento`.
- `/practica/calentamiento` con juego: renderiza `Game` (`durationMs: 60_000`), `goalWpm` para Al compás = `round(0.9 × mediana de referencia de 7 días)` o la meta de la unidad si no hay referencia; al terminar `recordSession(gameSession(r))` + `markRoutine('warmup')` y `GameResults` con `backTo` Inicio.
- La decisión por día se toma una vez por montaje (como `bigramDay`).

## 11. PPM en vivo → resumen al final (9A)

En `Exercise` (lecciones) y en `Practice` desaparece la línea «N PPM · N % · N errores» mientras se tipea; queda «meta N PPM · Esc reinicia» (lección) o «Esc reinicia» (práctica). Los números siguen en el banner de fin de ejercicio y en los resultados.

## 12. Store y compatibilidad

- `version: 3 → 4`; `migrateState` v4: `lastExamDay: null`, `blindSince: null`, `settings.anchor: ''`, `settings.conversoSeen: false`. Campos nuevos de `SessionRecord`/`DaySummary` son opcionales: sin backfill.
- `PERSISTED_KEYS` suma `lastExamDay` y `blindSince`; `resetProgress` los vuelve a `null`; `isPersistedState` (backup) acepta `null | string` en ambos; `BACKUP_VERSION = 4`.
- `SessionKind` suma `'exam'`.

## 13. Verificación

- Unitarios (Vitest): motor `free` (avance con error, extras y tope, resincronización por espacio, doble espacio, Backspace en cada caso, `metrics`/`repairMetrics`, `keySamples` ignora Backspace), `weekKey`/`examDue`, `examText` determinista por mes, `rolloverRatio`, `dominance`/`fingerDominance`, `fluidity`, `formHeadline`, `warmupGame`, `addSession` con examen, `blindSince` en el store, migración v3→v4 y `parseBackup` v4, `useHiddenInput` con `onBackspace`.
- e2e (Playwright): Reto sin teclado con error que pasa y Backspace que repara; tarjeta Examen en Inicio cuando está pendiente y vuelta al Reto después; auto-chequeo con tecla `1` y Enter; tarjeta de converso en Inicio y ancla bajo el saludo; Progreso con «Dominio por dedo», «Fluidez» y «Forma»; Calentamiento con juego: `warmupGame` se prueba unitario y el e2e fija la fecha con `page.clock.setFixedTime` en un día con `dayOfYear % 3 === 0`.
- `npm run lint` sin advertencias nuevas (4 previas). `npm run build` OK.

## 14. Orden de implementación

Sesión 1: §1 motor + `TypingArea` → §2 Reto → §3 examen → §4 chart → §8 auto-chequeo → §11 PPM → §12 store. Sesión 2: §5 manos → §6 fluidez → §7 por dedo → §9 ancla → §10 juego. Rama `ola-2`, merge fast-forward a `master`.
