# Ola 2 · El converso — plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** que el Reto mida sin ayuda y con Backspace, que exista un examen semanal limpio, que las manos se desvanezcan por dominio y que Progreso muestre fluidez, dominio por dedo y forma; más la ancla, el juego en la rutina y el fin del PPM en vivo.

**Architecture:** el motor puro (`src/engine/`) gana el modo `free` y las métricas nuevas; el store (zustand persist) sube a v4 con `lastExamDay`, `blindSince`, `settings.anchor/conversoSeen`; la UI (`Practice`, `Home`, `Stats`, `LessonPlayer`, `TypingArea`, `KeyGuide`, `Hands`) solo renderiza. Cada tarea deja tests verdes y un commit.

**Tech Stack:** Vite + React 19 + TS + Tailwind v4 + zustand persist · Vitest (motor y hooks, jsdom) · Playwright (e2e en :5174).

**Spec:** `docs/superpowers/specs/2026-09-18-ola-2-converso-design.md`

> **Estado:** ejecutado completo el 2026-09-18 en la rama `ola-2` (14 tareas, 16 commits), mergeado fast-forward a `master`. Desvíos respecto del plan: el contador de rollover se hizo en la tarea 2 (lo necesitaba `TypingArea`); la tarea 7 (PPM en vivo) se hizo junto con la 5 y la 8; `.claude/launch.json` ganó `typelight-branch` (:5175).

## Global Constraints

- Motor puro en `src/engine/`, sin React. La UI solo renderiza.
- Sin `window.confirm`; confirmaciones inline de dos pasos.
- `npm run lint` con las 4 advertencias previas (2 en `src/main.tsx`, 2 en `LessonPlayer.tsx`); no sumar ninguna.
- Copy en español rioplatense (vos). Código, identificadores y commits en inglés.
- Puertos: `:5173` build estable (no tocar), `:5175` dev de rama, `:5174` e2e.
- Backticks en heredocs del Bash fallan: los archivos con template strings se escriben con el tool Write.
- Playwright: `Enter` (no `Return`); `getByText` no ve `<text>` SVG; fixtures de `/estadisticas` con ≥ 1 sesión.

---

### Task 1: Motor — modo `free` (avance con error, extras, resync, Backspace, métricas)

**Files:**
- Modify: `src/engine/typing/index.ts`
- Test: `src/engine/typing/free.test.ts` (nuevo)

**Interfaces:**
- Produces: `createSession(target, mode: 'stop' | 'free' = 'stop')`; `TypingState.mode`, `.typed: (string | null)[]`, `.extras: Record<number, string>`; `Keystroke.backspace?: true`; `backspace(s, t): TypingState`; `repairMetrics(s): RepairMetrics | null` con `{ firstTryErrors, kspc, repaired, repairMs: number | null }`; `MAX_EXTRAS = 5`; `wordStart(target, pos): number`.

- [x] **Step 1: tests que fallan** — en `free.test.ts`:
  - `wrong letter advances`: `typeChar(createSession('casa','free'),'x',0)` → `pos 1`, `typed[0]==='x'`, `erred[0]`, `metrics.errors 1`.
  - `backspace removes it`: luego `backspace(s,10)` → `pos 0`, `typed.length 0`, keystrokes 2 (el 2.º `backspace: true`), `metrics.errors` sigue 1, `keySamples` no registra `'\b'`.
  - `repair keeps the mark`: tras backspace, `typeChar('c')` → `pos 1`, `erred[0]` true, `metrics.correct 1`.
  - `extra at word end`: target `'la casa'`, tipear `'l','a','s'` → `extras[2]==='s'`, `pos 2`, errors 1; 6 extras → `extras[2].length 5`, errors 6; `backspace` quita la extra antes de mover `pos`.
  - `space resyncs`: target `'casa roja'`, tipear `'c',' '` → `pos 5`, `typed[1..3]` null, `erred[1..3]` true, errors 1; `backspace` → `pos 4`.
  - `double space at word start`: target `'a b'`, tipear `'a',' ',' '` → `pos 2`, errors 1.
  - `finishes at the end`: `'ab'` tipear `'x','b'` → `finishedAt` no null, `metrics.correct 1`, `accuracy 0.5`, `chars 2`.
  - `repairMetrics`: `'casa'` con `'x'@0`, `backspace@300`, `'c'@400`, `'a','s','a'` → `{ firstTryErrors 1, repaired 1, repairMs 300, kspc: 6/4 }`; en modo `stop` → `null`.
  - `stop mode unchanged`: `typeChar(createSession('ab'),'x',0).pos === 0`.
- [x] **Step 2:** `npx vitest run src/engine/typing/free.test.ts` → falla (`mode`/`backspace` no existen).
- [x] **Step 3: implementación**
  - `createSession(target, mode = 'stop')` agrega `mode`, `typed: []`, `extras: {}`.
  - `typeChar`: si `mode === 'stop'` → camino actual. Si `free`: implementar las cuatro ramas del spec §1; `wordStart(target, pos)` = índice después del último espacio antes de `pos`.
  - `backspace(s, t)`: keystroke `{ pos, expected: '', actual: '\b', correct: false, backspace: true, t, latency }`; extras primero; luego `pos − 1` y `typed.pop()`.
  - `metrics`: `keys = keystrokes.filter(k => !k.backspace)`; `free`: `correct = typed.filter((c,i)=>c===target[i]).length`, `errors = keys.filter(!correct).length`, `accuracy = keys.length ? 1 − errors/keys.length : 1`, wpm sobre `correct`.
  - `keySamples`, `rhythm`: ignorar `backspace`.
  - `repairMetrics`.
- [x] **Step 4:** `npm test` verde (los tests viejos de `typing.test.ts` intactos).
- [x] **Step 5:** commit `feat(typing): free mode — errors pass, extras, space resync, backspace; repair metrics`.

### Task 2: Captura — `onBackspace` en `useHiddenInput`, `mode` y `backspace()` en `useTypingSession`, render en `TypingArea`

**Files:**
- Modify: `src/app/hooks/useHiddenInput.ts`, `src/app/hooks/useTypingSession.ts`, `src/app/components/TypingArea.tsx`, `src/index.css`
- Test: `src/app/hooks/useHiddenInput.test.ts` (nuevo), `src/app/hooks/useTypingSession.test.ts`

**Interfaces:**
- Produces: `useHiddenInput({ onBackspace?: () => void, onKeyDown?, onKeyUp? })`; `useTypingSession(target, { mode?: 'stop' | 'free' })` devuelve `backspace()`; `TypingArea` sin props nuevas (lee `state.mode`, `typed`, `extras`).

- [x] **Step 1: tests** — `useHiddenInput.test.ts` con `renderHook`: keydown `Backspace` en el input llama `onBackspace` y hace `preventDefault`; sin callback solo `preventDefault`. `useTypingSession.test.ts`: con `mode: 'free'`, `input('x')` avanza y `backspace()` vuelve.
- [x] **Step 2:** correr → falla.
- [x] **Step 3:** implementar; `TypingArea`: clases `is-mistyped` (muestra `state.typed[i]`), `is-skipped`, y `<span class="type-extra">` por cada extra en `extras[i]` antes del índice `i`; CSS: `.type-char.is-mistyped { color: esc-edge; background: esc-soft; border-radius: 4px; text-decoration: underline esc }`, `.is-skipped { color: ink-mute; text-decoration: line-through }`, `.type-extra` igual a mistyped sin subrayado.
- [x] **Step 4:** `npm test` verde.
- [x] **Step 5:** commit `feat(typing-ui): backspace capture, free-mode rendering`.

### Task 3: Store v4 — `lastExamDay`, `blindSince`, `settings.anchor/conversoSeen`, `exam` en días, `setSessionForm`, kind `exam`

**Files:**
- Modify: `src/app/store/index.ts`, `src/app/store/migrate.ts`, `src/engine/stats/days.ts`, `src/app/lib/backup.ts`
- Test: `src/app/store/migrate.test.ts`, `src/app/store/store.test.ts`, `src/engine/stats/days.test.ts`, `src/app/lib/backup.test.ts`

**Interfaces:**
- Produces: `SessionKind` + `'exam'`; `SessionRecord` + `mode?, blind?, firstTryErrors?, kspc?, repaired?, repairMs?, rollover?, form?: FormAnswer`; `type FormAnswer = 'si' | 'medio' | 'no'`; `State.lastExamDay`, `State.blindSince`, `setLastExamDay(day)`, `setSessionForm(at, form)`; `recordSession` devuelve `string` (el `at`); `addSession(days, day, seconds, referenceWpm?, examWpm?)`; `DaySummary.exam?: number`; `Settings.anchor`, `Settings.conversoSeen`; `BACKUP_VERSION = 4`.

- [x] **Step 1: tests** — migrate v3→v4 agrega los cuatro campos y no toca lo demás; `recordSession` con `blind: true` fija `blindSince` una sola vez; `setSessionForm` parchea la sesión correcta; `addSession(..., 40, 40)` escribe `exam: 40` y `reference [40]`; `parseBackup` acepta v4 y rechaza `blindSince: 3`; `resetProgress` vuelve `lastExamDay/blindSince` a null.
- [x] **Step 2:** falla. **Step 3:** implementar. **Step 4:** verde. **Step 5:** commit `feat(store): v4 — weekly exam, blind mark, anchor, form answers`.

### Task 4: Semana, examen y texto fijo por mes (motor)

**Files:**
- Create: `src/engine/stats/exam.ts`, `src/engine/stats/exam.test.ts`
- Modify: `src/engine/stats/index.ts` (re-export), `src/engine/generator/index.ts` (`examText`), `src/engine/generator/generator.test.ts`

**Interfaces:**
- Produces: `weekKey(day: string): string` (lunes ISO, yyyy-mm-dd); `examDue(lastExamDay: string | null, today: string): boolean`; `monthKey(day: string): string` (`yyyy-mm`); `examText(pool, monthKey): string` (determinista, ≥ 1200 chars cuando el corpus alcanza).

- [x] **Step 1: tests** — `weekKey('2026-09-18') === '2026-09-14'`, `weekKey('2026-09-14') === '2026-09-14'`, `weekKey('2026-09-13') === '2026-09-07'`; `examDue(null, ...)` true; misma semana false; semana anterior true; `examText(pool,'2026-09') === examText(pool,'2026-09')` y `!== examText(pool,'2026-10')`, `length >= 1200`.
- [x] **Steps 2–5:** falla → implementar (`seedOf` = hash FNV-1a del string) → verde → commit `feat(exam): ISO week, due check, fixed monthly text`.

### Task 5: Reto sin ayuda con Backspace + examen semanal + auto-chequeo (`Practice`, `FormCheck`, `Home` tarjeta)

**Files:**
- Create: `src/app/components/FormCheck.tsx`
- Modify: `src/app/routes/Practice.tsx`, `src/app/routes/Home.tsx`
- Test: `e2e/converso.spec.ts` (nuevo)

**Interfaces:**
- Consumes: Task 1–4.
- Produces: `FormCheck({ onAnswer(form: FormAnswer | null) })` con `data-testid="form-check"`; `/practica/examen`; `Home` tarjeta `routine-challenge` con texto «Examen semanal» cuando `examDue`.

- [x] **Step 1: e2e** — sembrar estado onboardeado (v4) con lección `guia` completa; ir a `/practica/reto`: no existe `.kb-key`; tipear una letra equivocada → `.type-char.is-mistyped` visible; `Backspace` → desaparece; terminar con `?dur=` no aplica (60 s): usar `localStorage` para forzar `timed` no; en su lugar el test tipea 2 letras y verifica el render, y otro test siembra `lastExamDay: null` → en Inicio la tarjeta coral dice «Examen semanal» y lleva a `/practica/examen` sin `.kb-key`; `Esc` sigue reiniciando.
- [x] **Step 2:** falla. **Step 3:** implementar: `META.reto` → `mode: 'free', blind: true`; `META.examen` → `title 'Examen semanal', timed 180_000, blind, session 'exam', block 'challenge', reference true`; `text` del examen = `examText(pool, monthKey(dayKey()))`; `onFinish` graba `firstTryErrors/kspc/repaired/repairMs` (free) y `blind`; resultado del Reto con 4 `Stat`; `FormCheck` en el resultado de reto/examen → `setSessionForm(at, form)`; Enter vuelve solo cuando `FormCheck` respondió/saltó (estado `formDone`). `Home`: `examDue(lastExamDay, today) && !routine.challenge` → tarjeta examen. `setLastExamDay(today)` al terminar el examen.
- [x] **Step 4:** `npm run e2e -- converso` verde. **Step 5:** commit `feat(practice): blind Reto with backspace, weekly exam, form self-check`.

### Task 6: Chart — marca «sin ayuda» y rombo del examen

**Files:**
- Modify: `src/app/components/stats/ReferenceChart.tsx`, `src/app/routes/Stats.tsx`, `src/engine/stats/progress.ts` (`DayPoint.exam?`), `e2e/stats.spec.ts`

- [x] **Step 1: test** — `referenceByDay` devuelve `exam` cuando el día lo tiene (unit); e2e: sembrar `blindSince` y un día con `exam: 28` → `svg text` «sin ayuda» visible y `[data-testid="exam-point"]` presente.
- [x] **Steps 2–5:** implementar → verde → commit `feat(chart): blind mark and weekly exam diamonds`.

### Task 7: PPM en vivo → resumen al final

**Files:** `src/app/routes/LessonPlayer.tsx` (`Exercise`), `src/app/routes/Practice.tsx`; e2e existentes que lean «PPM ·» en vivo (revisar `e2e/flow.spec.ts`).

- [x] Quitar la línea en vivo, dejar «meta N PPM · Esc reinicia» / «Esc reinicia». `npm run e2e` verde. Commit `feat: live WPM line replaced by the end summary`.

### Task 8: Manos por dominio (`dominance`, `handsOpacity`)

**Files:**
- Modify: `src/engine/stats/progress.ts` (`dominance`), `src/app/components/KeyGuide.tsx`, `src/app/routes/LessonPlayer.tsx`, `src/app/routes/Practice.tsx`
- Test: `src/engine/stats/progress.test.ts`

**Interfaces:** `dominance(stat: KeyStat | undefined, goalWpm: number): number` (0..1); `KeyGuide({ handsOpacity?: number })`; helper `handsOpacityFor(keys, ch, goalWpm) = Math.max(0.3, 1 − dominance(keys[ch], goalWpm))` en `src/app/lib/fingers.ts`.

- [x] Tests: sin stat 0; `{samples 10, errorEma 0, latencyEma target}` → 1; `errorEma 0.09` → 0.5; `latencyEma 1.5·target` → 0.5; `samples 5` → 0.5. Implementar; `KeyGuide` aplica `style={{ opacity }}` al `<Hands>`; usar en intro (`c.highlight[0]`), `Exercise` y `Practice` (calentamiento/repaso). Commit `feat(hands): fade by key dominance, floor 30 %`.

### Task 9: Fluidez (rollover)

**Files:**
- Create: `src/engine/stats/rollover.ts` + test
- Modify: `src/app/hooks/useHiddenInput.ts` (`onKeyDown/onKeyUp` passthrough), `src/app/components/TypingArea.tsx` (`rollover?: RefObject<RolloverCounter>`), `src/app/routes/Practice.tsx`, `src/app/routes/LessonPlayer.tsx`, `src/app/components/games/RaceGame.tsx` (si usa `TypingArea`), `src/engine/stats/progress.ts` (`fluidity`), `src/app/routes/Stats.tsx`

**Interfaces:** `interface RolloverCounter { presses: number; overlaps: number }`; `newRollover()`; `trackKeyDown(c, key, held: Set<string>)`, `trackKeyUp(key, held)`; `rolloverRatio(c): number | undefined` (< 20 presses → undefined); `fluidity(sessions, today): number | null`.

- [x] Tests: 3 presses solapadas de 5 → ratio 0.6 con presses ≥ 20 (armar 20); repetición (`repeat`) no cuenta; `fluidity` pondera por chars en 7 días. Implementar; Stats: «Fluidez» reemplaza «Ritmo parejo»; borrar `rhythmHeadline` y su test. Commit `feat(stats): rollover fluidity replaces rhythm evenness`.

### Task 10: Dominio por dedo (`fingerDominance`, `Hands.tints/labels`, tarjeta)

**Files:**
- Modify: `src/engine/stats/progress.ts` (`fingerDominance`), `src/app/components/Hands.tsx`, `src/app/routes/Stats.tsx`, `src/app/lib/fingers.ts` (`typingFinger(layout, ch)`)
- Test: `src/engine/stats/progress.test.ts`, `e2e/stats.spec.ts`

**Interfaces:** `fingerDominance(keys, learned: string[], goalWpm, fingerOf: (ch) => Finger | undefined): Partial<Record<Finger, { value: number; keys: number }>>`; `Hands({ active?, tints?, labels?, wideGap? })`.

- [x] Tests unit (dos teclas del mismo dedo promedian) + e2e (tarjeta «Dominio por dedo» visible con `svg text` «%»). Commit `feat(stats): finger dominance map on the hands`.

### Task 11: Forma en Progreso (`formHeadline`) y auto-chequeo en la Carrera

**Files:** `src/engine/stats/progress.ts` (`formHeadline`), `src/app/routes/Stats.tsx` (tile), `src/app/components/games/GameResults.tsx` (`formCheck?`), `src/app/routes/LessonPlayer.tsx`, `src/app/routes/Play.tsx`.

- [x] Tests unit: últimas 10 con respuesta → `{ good, answered }`; null sin respuestas. Commit `feat(form): headline tile; self-check after the race`.

### Task 12: Ancla y tarjeta de converso

**Files:** `src/app/routes/Home.tsx`, `src/app/routes/Settings.tsx`, `e2e/converso.spec.ts`.

- [x] e2e: con `conversoSeen: false` la tarjeta «Antes de seguir» está; escribir «el mate» + Listo → desaparece y «Después de el mate, practico.» bajo el saludo; Ajustes muestra el campo. Commit `feat(home): converso card and implementation-intention anchor`.

### Task 13: Juego dentro de la rutina

**Files:** `src/engine/curriculum/warmup.ts` (+test) con `warmupGame(dayOfYear, learned): GameId | null`; `src/app/routes/Home.tsx`; `src/app/routes/Practice.tsx` (calentamiento con juego); `e2e/converso.spec.ts` (fecha fija con `page.clock`).

- [x] Tests unit: día 3 → rhythm si ≥ 6 letras; día 6 → balloons si wordsReady, si no rhythm; día 4 → null; < 6 letras → null. Commit `feat(routine): a game replaces the warm-up one day in three`.

### Task 14: Cierre — lint, build, e2e completo, docs, merge ff

- [x] `npx tsc -b` · `npm run lint` (4 advertencias) · `npm test` · `npm run e2e` · `npm run build`.
- [x] Actualizar `docs/backlog.md` (Ola 2 hecha → borrar de Pendientes), `.serena/memories/typelight-architecture.md` (modo free, examen, v4, fluidez, dominio por dedo, ancla, juego en rutina), `HANDOFF.md`, `> **Estado:**` del spec y del plan.
- [x] `git checkout master && git merge --ff-only ola-2 && git push && git branch -d ola-2`.
