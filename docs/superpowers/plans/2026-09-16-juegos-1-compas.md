# Juegos 1: infraestructura común + Al compás — plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dejar la ruta preparada para varios juegos (id por hueco, resultado y estrellas en el motor, pantalla de resultados única, sesiones `kind: 'game'`) y estrenar el primero, **Al compás**: un metrónomo a tu meta de PPM y teclas que hay que tocar a tiempo.

**Architecture:** La lógica de ronda de Al compás (notas, juicio justo/bien/fuera, rampa de tempo, conteo) es un reducer puro en `src/engine/games/rhythm.ts` con tests; el componente React solo dibuja el estado y le pasa `performance.now()` relativo al inicio. Los juegos comparten `GameProps`/`GameResult`, la mascota, `pickLetters` y una pantalla de resultados; `LessonPlayer` elige el componente por `lesson.game`.

**Tech Stack:** Vite + React 19 + TypeScript strict, Tailwind v4, zustand 5, Vitest, Playwright 1.63. rAF para el loop (se pausa con la pestaña oculta; los e2e usan `?dur=6000`).

**Spec:** `docs/superpowers/specs/2026-09-16-juegos-y-progreso-design.md` (secciones 4 y 5; la tabla de la sección 4 se aplica solo en los huecos de `rhythm`; Globos, Carrera y los huecos nuevos van en el plan `juegos-2`).

## Global Constraints

- Motor puro en `src/engine/`, sin React ni imports desde `src/app/`.
- Prosa de la UI en español rioplatense (voseo); código, identificadores, comentarios y commits en inglés.
- Sin librerías nuevas. Botones planos; colores solo por tokens de `src/index.css`.
- IDs de lección existentes no cambian (`guia-juego-fila-guia`, `inferior-juego-vmcx`, `numeros-juego-numeros` conservan el ID y cambian de juego).
- Todo juego acepta `durationMs` (`?dur=` en la URL) para los e2e. Playwright: la tecla es `'Enter'`.
- Rama de trabajo `juegos-1` sobre `master` (misma carpeta, sin worktree; Seba prueba en `:5173`). Avisarle antes de que pruebe: cada edición dispara HMR.
- Verificación por tarea: `npx tsc -b && npm test`; al cierre `npm run e2e` y `npm run build`.

---

## Mapa de archivos

| Archivo | Responsabilidad |
|---|---|
| `src/engine/curriculum/types.ts`, `build.ts`, `curriculum.test.ts` (modificar) | `GameId = 'rain' \| 'rhythm'`; `game(b, u, slug, title, id)`; tres huecos pasan a `rhythm`. |
| `src/engine/games/pool.ts` (crear) | `pickLetters(layout, pool)`: teclas de un solo toque (sale de `RainGame`). |
| `src/engine/games/scoring.ts` + test (crear) | `GameResult`, `starsForGame`. |
| `src/engine/games/rhythm.ts` + test (crear) | Reducer de la ronda: `beatMs`, `judge`, `nextBeat`, `pickNote`, `startRound`, `schedule`, `press`, `advance`, `tally`, `currentNote`. |
| `src/engine/games/index.ts` (crear) | Re-exporta los tres. |
| `src/app/components/games/types.ts` (crear) | `GameProps`. |
| `src/app/components/games/Mascot.tsx` (crear) | La mascota keycap (sale de `RainGame`). |
| `src/app/components/games/RainGame.tsx` (mover desde `components/`) | Usa `GameProps`, `Mascot`, `pickLetters`; emite `GameResult`. |
| `src/app/components/games/GameResults.tsx` (crear) | Pantalla de resultados para cualquier juego. |
| `src/app/components/games/RhythmGame.tsx` (crear) | Al compás. |
| `src/app/lib/sound.ts` (modificar) | `metronome()`. |
| `src/app/routes/LessonPlayer.tsx` (modificar) | Elige el juego por `lesson.game`, estrellas por `starsForGame`, graba sesión `game`, usa `GameResults`. |
| `src/app/routes/Path.tsx` (modificar) | Glifo por juego en la leyenda. |
| `e2e/rhythm.spec.ts` (crear) | Juega una ronda corta con `?dur=6000`. |
| `docs/backlog.md`, `.serena/memories/typelight-architecture.md` (modificar) | Estado y notas. |

---

### Task 0: Rama

- [ ] **Step 1: Crear la rama desde `master`**

```bash
git -C C:/Projects/TypeLight checkout -b juegos-1
```

Expected: `Switched to a new branch 'juegos-1'`.

---

### Task 1: `GameId` y huecos de la ruta

**Files:**
- Modify: `src/engine/curriculum/types.ts` (línea `export type GameId = 'rain'`)
- Modify: `src/engine/curriculum/build.ts` (función `game` y sus llamadas)
- Test: `src/engine/curriculum/curriculum.test.ts`

**Interfaces:**
- Produces: `GameId = 'rain' | 'rhythm'`; `game(b, u, slug, title, id: GameId = 'rain')`.

- [ ] **Step 1: Test que falla**

Agregar al final del `describe('curriculum', …)` en `src/engine/curriculum/curriculum.test.ts`:

```ts
  it('places the games in the path with their ids', () => {
    const c = buildCurriculum(LATAM)
    const games = c.lessons.filter((l) => l.kind === 'game').map((l) => [l.id, l.game])
    expect(games).toEqual([
      ['guia-juego-primeras-8', 'rain'],
      ['guia-juego-fila-guia', 'rhythm'],
      ['superior-juego-ruei', 'rain'],
      ['superior-juego-fila-superior', 'rain'],
      ['inferior-juego-vmcx', 'rhythm'],
      ['inferior-juego-alfabeto', 'rain'],
      ['mayusculas-juego-mayusculas', 'rain'],
      ['numeros-juego-numeros', 'rhythm'],
      ['signos-juego-signos', 'rain'],
    ])
  })
```

- [ ] **Step 2: Correr y ver que falla**

Run: `npm test -- src/engine/curriculum`
Expected: FAIL (los tres huecos siguen en `'rain'`).

- [ ] **Step 3: Implementar**

`src/engine/curriculum/types.ts`:

```ts
export type GameId = 'rain' | 'rhythm'
```

`src/engine/curriculum/build.ts`, reemplazar la función `game`:

```ts
/** A playable break with everything learned so far. */
function game(b: Builder, u: Unit, slug: string, title: string, id: GameId = 'rain') {
  const l = add(b, u, `juego-${slug}`, title, 'game', [], [], [])
  l.game = id
}
```

y sumar `GameId` al import de tipos: `import type { Curriculum, ExerciseSpec, GameId, IntroCard, Lesson, LessonKind, Unit, UnitAccent } from './types'`.

Reemplazar las tres llamadas:

```ts
  game(b, guia, 'fila-guia', 'Juego: al compás', 'rhythm')
```
```ts
  game(b, inf, 'vmcx', 'Juego: al compás', 'rhythm')
```
```ts
  game(b, num, 'numeros', 'Juego: al compás con números', 'rhythm')
```

- [ ] **Step 4: Verificar**

Run: `npx tsc -b && npm test -- src/engine/curriculum`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/engine/curriculum/types.ts src/engine/curriculum/build.ts src/engine/curriculum/curriculum.test.ts
git commit -m "feat(curriculum): game ids per slot; three slots become the rhythm game"
```

---

### Task 2: `games/pool.ts` y `games/scoring.ts`

**Files:**
- Create: `src/engine/games/pool.ts`, `src/engine/games/scoring.ts`, `src/engine/games/scoring.test.ts`, `src/engine/games/index.ts`

**Interfaces:**
- Produces: `pickLetters(layout: Layout, pool: string[]): string[]`; `GameResult { gameId: GameId; score; hits; misses; wrong; bestCombo; seconds; accuracy; detail: Record<string, number> }`; `starsForGame(r: GameResult): Stars`.

- [ ] **Step 1: Test que falla**

`src/engine/games/scoring.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { starsForGame, type GameResult } from './scoring'

const result = (partial: Partial<GameResult>): GameResult => ({
  gameId: 'rain',
  score: 0,
  hits: 10,
  misses: 0,
  wrong: 0,
  bestCombo: 0,
  seconds: 45,
  accuracy: 1,
  detail: {},
  ...partial,
})

describe('starsForGame', () => {
  it('rain: by accuracy, one star without any catch', () => {
    expect(starsForGame(result({ hits: 0, accuracy: 0 }))).toBe(1)
    expect(starsForGame(result({ accuracy: 0.96 }))).toBe(3)
    expect(starsForGame(result({ accuracy: 0.9 }))).toBe(2)
    expect(starsForGame(result({ accuracy: 0.5 }))).toBe(1)
  })

  it('rhythm: on-time share, then accuracy', () => {
    expect(starsForGame(result({ gameId: 'rhythm', accuracy: 0.98, detail: { onTime: 0.9 } }))).toBe(3)
    expect(starsForGame(result({ gameId: 'rhythm', accuracy: 0.9, detail: { onTime: 0.9 } }))).toBe(2)
    expect(starsForGame(result({ gameId: 'rhythm', accuracy: 1, detail: { onTime: 0.7 } }))).toBe(2)
    expect(starsForGame(result({ gameId: 'rhythm', accuracy: 1, detail: { onTime: 0.5 } }))).toBe(1)
  })
})
```

- [ ] **Step 2: Correr y ver que falla**

Run: `npm test -- src/engine/games`
Expected: FAIL — no se resuelve `./scoring`.

- [ ] **Step 3: Implementar**

`src/engine/games/pool.ts`:

```ts
import { resolveChar, type Layout } from '../layouts'

/** Characters from the pool that take a single key press (no space, no dead keys, no shift). */
export function pickLetters(layout: Layout, pool: readonly string[]): string[] {
  return pool.filter((c) => {
    if (c === ' ') return false
    const seq = resolveChar(layout, c)
    return seq !== null && seq.length === 1 && !seq[0].shift && !seq[0].altGr
  })
}
```

`src/engine/games/scoring.ts`:

```ts
import type { GameId } from '../curriculum/types'
import type { Stars } from '../stats'

/** What every game reports when the round ends. `detail` carries the game's own numbers. */
export interface GameResult {
  gameId: GameId
  score: number
  /** Right key on a target. */
  hits: number
  /** Targets that got away (fell, ran out, escaped). */
  misses: number
  /** Wrong keys. */
  wrong: number
  bestCombo: number
  seconds: number
  /** Each game defines it; rain counts misses against it, the rest use hits / (hits + wrong). */
  accuracy: number
  detail: Record<string, number>
}

export function starsForGame(r: GameResult): Stars {
  switch (r.gameId) {
    case 'rain':
      return r.hits === 0 ? 1 : r.accuracy >= 0.95 ? 3 : r.accuracy >= 0.85 ? 2 : 1
    case 'rhythm': {
      const onTime = r.detail.onTime ?? 0
      return onTime >= 0.85 && r.accuracy >= 0.97 ? 3 : onTime >= 0.7 ? 2 : 1
    }
  }
}
```

`src/engine/games/index.ts`:

```ts
export * from './pool'
export * from './scoring'
```

- [ ] **Step 4: Verificar**

Run: `npx tsc -b && npm test -- src/engine/games`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/engine/games
git commit -m "feat(engine): shared game result, stars per game and single-press letter pool"
```

---

### Task 3: reducer de Al compás

**Files:**
- Create: `src/engine/games/rhythm.ts`, `src/engine/games/rhythm.test.ts`
- Modify: `src/engine/games/index.ts` (agregar `export * from './rhythm'`)

**Interfaces:**
- Consumes: `Rng` de `../generator` (`chance`, `pick`).
- Produces: `Judgement = 'justo' | 'bien' | 'fuera'`; constantes `JUST_MS = 80`, `GOOD_MS = 160`, `MIN_BEAT_MS = 250`, `STRETCH_MS = 15_000`; `beatMs(goalWpm)`, `judge(offsetMs)`, `nextBeat(beat, onTime)`, `pickNote(letters, weak, prev, rng)`; `Note { id; ch; at; result; hit }`; `Round`; `startRound(beat)`, `schedule(round, now, lookaheadMs, letters, weak, rng)`, `currentNote(round)`, `press(round, ch, now) → { round, judgement }`, `advance(round, now) → { round, expired }`, `tally(round) → Tally`.

- [ ] **Step 1: Tests que fallan**

`src/engine/games/rhythm.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { makeRng } from '../generator'
import { advance, beatMs, currentNote, judge, nextBeat, pickNote, press, schedule, startRound, tally } from './rhythm'

describe('beat and judgement', () => {
  it('derives the beat from the goal speed', () => {
    expect(beatMs(12)).toBe(1000)
    expect(beatMs(15)).toBe(800)
    expect(beatMs(0)).toBe(12000)
  })
  it('judges by absolute offset', () => {
    expect(judge(50)).toBe('justo')
    expect(judge(-80)).toBe('justo')
    expect(judge(-120)).toBe('bien')
    expect(judge(161)).toBe('fuera')
  })
  it('tightens the beat only after a good stretch, never under the floor', () => {
    expect(nextBeat(1000, 0.8)).toBe(900)
    expect(nextBeat(1000, 0.5)).toBe(1000)
    expect(nextBeat(260, 1)).toBe(250)
  })
})

describe('pickNote', () => {
  it('never repeats the previous note and leans on weak keys', () => {
    const rng = makeRng(7)
    const letters = ['f', 'j', 'd', 'k', 'q']
    let weakHits = 0
    let prev: string | null = null
    for (let i = 0; i < 60; i++) {
      const ch = pickNote(letters, ['q', 'z'], prev, rng)
      expect(letters).toContain(ch)
      expect(ch).not.toBe(prev)
      if (ch === 'q') weakHits++
      prev = ch
    }
    expect(weakHits).toBeGreaterThan(10)
    expect(pickNote(['f'], [], 'f', rng)).toBe('f')
  })
})

describe('round', () => {
  const rng = () => makeRng(1)

  it('schedules one note per beat inside the lookahead, starting two beats in', () => {
    const r = schedule(startRound(1000), 0, 4000, ['f', 'j'], [], rng())
    expect(r.notes.map((n) => n.at)).toEqual([2000, 3000, 4000])
    expect(r.nextAt).toBe(5000)
    expect(r.notes.every((n, i) => i === 0 || n.ch !== r.notes[i - 1].ch)).toBe(true)
    expect(schedule(r, 0, 4000, ['f', 'j'], [], rng())).toBe(r)
  })

  it('presses hit the current note and are judged by offset; other keys are wrong', () => {
    let r = schedule(startRound(1000), 0, 4000, ['f'], [], rng())
    expect(currentNote(r)?.at).toBe(2000)

    let out = press(r, 'j', 2000)
    expect(out.judgement).toBe('wrong')
    expect(out.round.wrong).toBe(1)
    r = out.round

    out = press(r, 'f', 2050)
    expect(out.judgement).toBe('justo')
    expect(out.round.combo).toBe(1)
    expect(out.round.score).toBe(20)
    r = out.round
    expect(currentNote(r)?.at).toBe(3000)

    out = press(r, 'f', 3130)
    expect(out.judgement).toBe('bien')
    expect(out.round.combo).toBe(2)
    expect(out.round.score).toBe(30)
    r = out.round

    out = press(r, 'f', 4300)
    expect(out.judgement).toBe('fuera')
    expect(out.round.combo).toBe(0)
    expect(out.round.notes[2].hit).toBe(true)
  })

  it('expires notes whose window closed and tightens the beat every stretch', () => {
    let r = schedule(startRound(1000), 0, 4000, ['f'], [], rng())
    let out = advance(r, 2100)
    expect(out.expired).toEqual([])
    out = advance(out.round, 2161)
    expect(out.expired.map((n) => n.at)).toEqual([2000])
    expect(out.round.notes[0]).toMatchObject({ result: 'fuera', hit: false })
    r = out.round

    // Two on-time presses out of three judged notes = 67 %: the beat stays.
    r = press(r, 'f', 3000).round
    r = press(r, 'f', 4000).round
    r = advance(r, 15_000).round
    expect(r.beat).toBe(1000)
    expect(r.stretchJudged).toBe(0)

    // A perfect stretch tightens it.
    r = schedule(r, 15_000, 4000, ['f'], [], rng())
    for (const n of r.notes.filter((n) => n.result === null)) r = press(r, 'f', n.at).round
    r = advance(r, 30_001).round
    expect(r.beat).toBe(900)
    expect(r.minBeat).toBe(900)
  })

  it('tallies judged notes', () => {
    let r = schedule(startRound(1000), 0, 4000, ['f'], [], rng())
    r = press(r, 'f', 2000).round
    r = press(r, 'f', 3120).round
    r = advance(r, 4200).round
    expect(tally(r)).toEqual({ justo: 1, bien: 1, fuera: 1, judged: 3, hits: 2, misses: 1, onTime: 2 / 3 })
  })
})
```

- [ ] **Step 2: Correr y ver que falla**

Run: `npm test -- src/engine/games/rhythm`
Expected: FAIL — no se resuelve `./rhythm`.

- [ ] **Step 3: Implementar**

`src/engine/games/rhythm.ts`:

```ts
import type { Rng } from '../generator'

export type Judgement = 'justo' | 'bien' | 'fuera'

export const JUST_MS = 80
export const GOOD_MS = 160
export const MIN_BEAT_MS = 250
export const STRETCH_MS = 15_000

/** Gap between notes at the goal speed (12 PPM → 1000 ms). */
export function beatMs(goalWpm: number): number {
  return Math.round(60000 / (Math.max(1, goalWpm) * 5))
}

export function judge(offsetMs: number): Judgement {
  const d = Math.abs(offsetMs)
  return d <= JUST_MS ? 'justo' : d <= GOOD_MS ? 'bien' : 'fuera'
}

/** The beat tightens by 10 % after a stretch with at least 80 % of its notes on time. */
export function nextBeat(beat: number, onTime: number): number {
  return onTime >= 0.8 ? Math.max(MIN_BEAT_MS, Math.round(beat * 0.9)) : beat
}

/** Next note: never the previous one; half the time one of the weak keys when there are any. */
export function pickNote(letters: readonly string[], weak: readonly string[], prev: string | null, rng: Rng): string {
  const notPrev = (list: readonly string[]) => list.filter((c) => c !== prev)
  const all = notPrev(letters)
  if (all.length === 0) return letters[0] ?? prev ?? ''
  const weakOk = notPrev(weak.filter((c) => letters.includes(c)))
  if (weakOk.length && rng.chance(0.5)) return rng.pick(weakOk)
  return rng.pick(all)
}

export interface Note {
  id: number
  ch: string
  /** When it should be hit, ms since the round started. */
  at: number
  result: Judgement | null
  /** True when the player pressed its key (whatever the judgement); false when it just ran out. */
  hit: boolean
}

export interface Round {
  notes: Note[]
  beat: number
  /** Fastest beat reached, ms. */
  minBeat: number
  wrong: number
  combo: number
  bestCombo: number
  score: number
  nextId: number
  /** Time of the next note to schedule. */
  nextAt: number
  /** Ramp bookkeeping: start of the current stretch and the notes judged in it. */
  stretchStart: number
  stretchJudged: number
  stretchOnTime: number
}

export function startRound(beat: number): Round {
  return { notes: [], beat, minBeat: beat, wrong: 0, combo: 0, bestCombo: 0, score: 0, nextId: 1, nextAt: beat * 2, stretchStart: 0, stretchJudged: 0, stretchOnTime: 0 }
}

/** Schedule notes up to `now + lookaheadMs`, one per beat. Returns the same round when nothing is due. */
export function schedule(r: Round, now: number, lookaheadMs: number, letters: readonly string[], weak: readonly string[], rng: Rng): Round {
  if (r.nextAt > now + lookaheadMs) return r
  const notes = [...r.notes]
  let nextAt = r.nextAt
  let nextId = r.nextId
  let prev = notes.length ? notes[notes.length - 1].ch : null
  while (nextAt <= now + lookaheadMs) {
    const ch = pickNote(letters, weak, prev, rng)
    notes.push({ id: nextId++, ch, at: nextAt, result: null, hit: false })
    prev = ch
    nextAt += r.beat
  }
  return { ...r, notes, nextAt, nextId }
}

/** The note the player is expected to hit next: the earliest one still unjudged. */
export function currentNote(r: Round): Note | undefined {
  return r.notes.find((n) => n.result === null)
}

const multiplier = (combo: number) => Math.min(5, 1 + Math.floor(combo / 5))

/** A key press at `now`: hits the current note (judged by its offset) or counts as wrong. */
export function press(r: Round, ch: string, now: number): { round: Round; judgement: Judgement | 'wrong' } {
  const note = currentNote(r)
  if (!note || note.ch !== ch) {
    return { round: { ...r, wrong: r.wrong + 1, combo: 0 }, judgement: 'wrong' }
  }
  const judgement = judge(now - note.at)
  const notes = r.notes.map((n) => (n.id === note.id ? { ...n, result: judgement, hit: true } : n))
  const onTime = judgement !== 'fuera'
  const combo = onTime ? r.combo + 1 : 0
  const score = r.score + (judgement === 'justo' ? 20 : judgement === 'bien' ? 10 : 0) * multiplier(r.combo)
  return {
    round: {
      ...r,
      notes,
      combo,
      bestCombo: Math.max(r.bestCombo, combo),
      score,
      stretchJudged: r.stretchJudged + 1,
      stretchOnTime: r.stretchOnTime + (onTime ? 1 : 0),
    },
    judgement,
  }
}

/** Notes whose window closed without a press become `fuera`; every stretch the beat may tighten. */
export function advance(r: Round, now: number): { round: Round; expired: Note[] } {
  const expired: Note[] = []
  const notes = r.notes.map((n) => {
    if (n.result === null && now - n.at > GOOD_MS) {
      const e: Note = { ...n, result: 'fuera' }
      expired.push(e)
      return e
    }
    return n
  })
  let next: Round = { ...r, notes, combo: expired.length ? 0 : r.combo, stretchJudged: r.stretchJudged + expired.length }
  if (now - r.stretchStart >= STRETCH_MS) {
    const ratio = next.stretchJudged ? next.stretchOnTime / next.stretchJudged : 0
    const beat = nextBeat(r.beat, ratio)
    next = { ...next, beat, minBeat: Math.min(next.minBeat, beat), stretchStart: now, stretchJudged: 0, stretchOnTime: 0 }
  }
  return { round: next, expired }
}

export interface Tally {
  justo: number
  bien: number
  fuera: number
  judged: number
  hits: number
  misses: number
  /** (justo + bien) / judged, 0 without judged notes. */
  onTime: number
}

export function tally(r: Round): Tally {
  let justo = 0
  let bien = 0
  let fuera = 0
  let hits = 0
  let misses = 0
  for (const n of r.notes) {
    if (n.result === null) continue
    if (n.result === 'justo') justo++
    else if (n.result === 'bien') bien++
    else fuera++
    if (n.hit) hits++
    else misses++
  }
  const judged = justo + bien + fuera
  return { justo, bien, fuera, judged, hits, misses, onTime: judged ? (justo + bien) / judged : 0 }
}
```

Y en `src/engine/games/index.ts` agregar `export * from './rhythm'`.

- [ ] **Step 4: Verificar**

Run: `npx tsc -b && npm test -- src/engine/games`
Expected: PASS. Si `pickNote` da menos de 10 `q` con la semilla 7, cambiar la semilla en el test (no la lógica) hasta que la mitad esperada aparezca.

- [ ] **Step 5: Commit**

```bash
git add src/engine/games
git commit -m "feat(engine): rhythm game round (beat, judgement, ramp, tally)"
```

---

### Task 4: infraestructura en la app (mascota, props comunes, resultados únicos, sesiones de juego)

**Files:**
- Create: `src/app/components/games/types.ts`, `src/app/components/games/Mascot.tsx`, `src/app/components/games/GameResults.tsx`
- Move: `src/app/components/RainGame.tsx` → `src/app/components/games/RainGame.tsx` (`git mv`)
- Modify: `src/app/lib/sound.ts`, `src/app/routes/LessonPlayer.tsx`, `src/app/routes/Path.tsx`

**Interfaces:**
- Consumes: `GameResult`, `starsForGame`, `pickLetters` (Task 2); `GameId` (Task 1).
- Produces: `GameProps { layout; pool; goalWpm; weak?; sound?; durationMs?; onFinish(r: GameResult) }`; `<Mascot mood combo />`; `<GameResults result stars onRetry nextLesson? />`; `metronome()`.

- [ ] **Step 1: Tipos y mascota**

`src/app/components/games/types.ts`:

```ts
import type { GameResult } from '@/engine/games'
import type { Layout } from '@/engine/layouts'

/** What every game receives; each one uses what it needs. */
export interface GameProps {
  layout: Layout
  /** Everything learned so far, space included. */
  pool: string[]
  goalWpm: number
  /** Weakest keys, for games that lean on them. */
  weak?: string[]
  sound?: boolean
  durationMs?: number
  onFinish: (r: GameResult) => void
}
```

`src/app/components/games/Mascot.tsx` (el bloque `Mood` + `Mascot` de `RainGame.tsx`, tal cual):

```tsx
export type Mood = 'idle' | 'happy' | 'sad'

/** A keycap with a face that cheers catches and winces at misses. */
export function Mascot({ mood, combo }: { mood: Mood; combo: number }) {
  const happy = mood === 'happy'
  const sad = mood === 'sad'
  return (
    <svg
      viewBox="0 0 64 64"
      className={`h-16 w-16 ${happy ? 'animate-pop' : ''} ${sad ? 'animate-shake' : ''}`}
      aria-hidden="true"
    >
      <rect x="6" y="10" width="52" height="48" rx="12" fill="var(--color-enter-edge)" />
      <rect x="6" y="6" width="52" height="46" rx="12" fill="var(--color-enter)" />
      <rect x="10" y="8" width="44" height="2" rx="1" fill="rgb(255 255 255 / 0.35)" />
      {/* eyes */}
      {happy ? (
        <>
          <path d="M18 30 q5 -7 10 0" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" />
          <path d="M36 30 q5 -7 10 0" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" />
        </>
      ) : (
        <>
          <circle cx="23" cy={sad ? 30 : 28} r="4" fill="#fff" />
          <circle cx="41" cy={sad ? 30 : 28} r="4" fill="#fff" />
          <circle cx={sad ? 22 : 24} cy={sad ? 31 : 29} r="1.8" fill="#1e2124" />
          <circle cx={sad ? 40 : 42} cy={sad ? 31 : 29} r="1.8" fill="#1e2124" />
        </>
      )}
      {/* mouth */}
      {happy ? (
        <path d="M22 38 q10 10 20 0" fill="#1e2124" />
      ) : sad ? (
        <path d="M24 42 q8 -6 16 0" fill="none" stroke="#1e2124" strokeWidth="3" strokeLinecap="round" />
      ) : (
        <path d="M25 39 q7 4 14 0" fill="none" stroke="#1e2124" strokeWidth="3" strokeLinecap="round" />
      )}
      {combo >= 5 && (
        <text x="32" y="62" textAnchor="middle" fontSize="9" fontWeight="900" fill="var(--color-sun-edge)" fontFamily="var(--font-body)">
          ×{combo}
        </text>
      )}
    </svg>
  )
}
```

- [ ] **Step 2: Mover y adaptar `RainGame`**

```bash
git mv src/app/components/RainGame.tsx src/app/components/games/RainGame.tsx
```

En `src/app/components/games/RainGame.tsx`:

Imports (reemplazar el bloque de arriba):

```ts
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { pickLetters } from '@/engine/games'
import { resolveChar } from '@/engine/layouts'
import { Keycap } from '../Keycap'
import { FINGER_COLOR, fingerGroup } from '../../lib/fingers'
import { chime, click, thud } from '../../lib/sound'
import { Mascot, type Mood } from './Mascot'
import type { GameProps } from './types'
```

Borrar: `export interface RainResult {…}`, `interface Props {…}`, `type Mood = …`, la función `pickLetters` local y la función `Mascot` completa (viven en `Mascot.tsx` y `engine/games`).

Firma del componente:

```ts
const LIVES = 3

export function RainGame({ layout, pool, durationMs = 45_000, sound = true, onFinish }: GameProps) {
```

y reemplazar cada `lives` por `LIVES` (en `stats.current`, en `start()` y en el `Array.from({ length: lives }` del HUD).

`finish` emite `GameResult`:

```ts
  const finish = useCallback(() => {
    if (finished.current) return
    finished.current = true
    const s = stats.current
    setPhase('done')
    if (sound) chime()
    const total = s.hits + s.misses + s.wrong
    onFinish({
      gameId: 'rain',
      score: s.score,
      hits: s.hits,
      misses: s.misses,
      wrong: s.wrong,
      bestCombo: s.bestCombo,
      seconds: (performance.now() - startedAt.current) / 1000,
      accuracy: total ? s.hits / total : 0,
      detail: {},
    })
  }, [onFinish, sound])
```

- [ ] **Step 3: Sonido de metrónomo**

Agregar al final de `src/app/lib/sound.ts`:

```ts
/** Soft, short metronome tick. */
export function metronome() {
  safely((c) => {
    const t = c.currentTime
    const osc = c.createOscillator()
    osc.type = 'sine'
    osc.frequency.value = 1400
    const gain = c.createGain()
    gain.gain.setValueAtTime(0.08, t)
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04)
    osc.connect(gain).connect(c.destination)
    osc.start(t)
    osc.stop(t + 0.05)
  })
}
```

- [ ] **Step 4: Pantalla de resultados única**

`src/app/components/games/GameResults.tsx`:

```tsx
import type { ReactNode } from 'react'
import type { Lesson } from '@/engine/curriculum'
import type { GameResult } from '@/engine/games'
import type { Stars as StarCount } from '@/engine/stats'
import { Keycap } from '../Keycap'
import { Stars, Stat } from '../ui'

type Tone = 'ink' | 'enter' | 'esc' | 'mod'

interface View {
  /** Headline for 1, 2 and 3 stars. */
  headline: [string, string, string]
  stats: { label: string; value: ReactNode; tone?: Tone }[]
  footnote: string
}

const pct = (v: number) => `${Math.round(v * 100)} %`

function view(r: GameResult): View {
  switch (r.gameId) {
    case 'rain':
      return {
        headline: ['Terminado. Con más práctica, la lluvia se vuelve lenta.', 'Buen reflejo. Un poco más de calma y son tres.', 'Ni una gota al piso.'],
        stats: [
          { label: 'Puntos', value: r.score, tone: 'enter' },
          { label: 'Atrapadas', value: r.hits },
          { label: 'Al piso', value: r.misses, tone: r.misses === 0 ? 'enter' : 'esc' },
          { label: 'Precisión', value: pct(r.accuracy), tone: r.accuracy >= 0.95 ? 'enter' : r.accuracy >= 0.85 ? 'ink' : 'esc' },
        ],
        footnote: `Mejor racha: ${r.bestCombo} seguidas. Tres estrellas con 95 % de precisión.`,
      }
    case 'rhythm': {
      const onTime = r.detail.onTime ?? 0
      return {
        headline: ['Terminado. El pulso se aprende de a poco: repetilo mañana.', 'Buen pulso. Un poco más de calma y son tres.', 'Como un metrónomo.'],
        stats: [
          { label: 'A tiempo', value: pct(onTime), tone: onTime >= 0.85 ? 'enter' : onTime >= 0.7 ? 'ink' : 'esc' },
          { label: 'Justo', value: r.detail.justo ?? 0, tone: 'enter' },
          { label: 'Errores', value: r.wrong, tone: r.wrong === 0 ? 'enter' : 'ink' },
          { label: 'Pulso máximo', value: `${r.detail.maxTempo ?? 0}/min` },
        ],
        footnote: `Mejor racha: ${r.bestCombo} seguidas. Tres estrellas con 85 % a tiempo y 97 % de precisión.`,
      }
    }
  }
}

interface Props {
  result: GameResult
  stars: StarCount
  onRetry: () => void
  nextLesson?: Lesson
  /** Where "back" goes when there is no next lesson (free play uses the home). */
  backTo?: { to: string; label: string }
}

export function GameResults({ result, stars, onRetry, nextLesson, backTo = { to: '/ruta', label: 'Volver a la ruta' } }: Props) {
  const v = view(result)
  return (
    <div className="card p-8 text-center">
      <div className="eyebrow mb-3">Juego terminado</div>
      <div className="animate-pop inline-block">
        <Stars count={stars} size="lg" />
      </div>
      <h2 className="mt-3 text-3xl">{v.headline[Math.min(2, Math.max(0, stars - 1))]}</h2>
      <div className="mx-auto mt-6 flex max-w-lg justify-around">
        {v.stats.map((s) => (
          <Stat key={s.label} label={s.label} value={s.value} tone={s.tone} />
        ))}
      </div>
      <p className="mt-4 text-sm text-ink-mute">{v.footnote}</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Keycap variant="ghost" onClick={onRetry}>
          Jugar de nuevo
        </Keycap>
        {nextLesson ? (
          <Keycap to={`/leccion/${nextLesson.id}`} variant="primary" size="lg">
            Siguiente: {nextLesson.title} <span className="opacity-70">(Enter)</span> →
          </Keycap>
        ) : (
          <Keycap to={backTo.to} variant="primary" size="lg">
            {backTo.label}
          </Keycap>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 5: `LessonPlayer` elige el juego, puntúa con el motor y graba la sesión**

En `src/app/routes/LessonPlayer.tsx`:

Imports — reemplazar `import { RainGame, type RainResult } from '../components/RainGame'` por:

```ts
import { starsForGame, type GameResult } from '@/engine/games'
import { weakestKeys } from '@/engine/stats'
import { GameResults } from '../components/games/GameResults'
import { RainGame } from '../components/games/RainGame'
```

(`starsFor` y `type Stars as StarCount` siguen importándose de `@/engine/stats`; sumar `weakestKeys` a esa línea en vez de una línea aparte si preferís.)

En `Player`, junto a los otros selectores del store:

```ts
  const keyStats = useStore((s) => s.keys)
```

Estado: `const [gameResult, setGameResult] = useState<GameResult | null>(null)`.

Reemplazar `onGameFinish` completo:

```ts
  const onGameFinish = useCallback(
    (r: GameResult) => {
      const s = starsForGame(r)
      setGameResult(r)
      setStars(s)
      recordSession({
        kind: 'game',
        gameId: r.gameId,
        wpm: 0,
        acc: r.accuracy,
        chars: r.hits,
        errors: r.wrong,
        seconds: r.seconds,
        ...(r.gameId === 'rhythm' && { rhythm: r.detail.onTime }),
      })
      completeLesson(lesson.id, s, 0, r.accuracy)
      markRoutine('lesson')
      setPhase('results')
    },
    [lesson.id, completeLesson, markRoutine, recordSession],
  )
```

Reemplazar el bloque `if (phase === 'game') { … }`:

```tsx
  if (phase === 'game') {
    const gameProps = {
      layout,
      pool: lesson.pool,
      goalWpm: lesson.goalWpm,
      weak: weakestKeys(keyStats, lesson.pool, 3),
      sound,
      onFinish: onGameFinish,
      durationMs: Number(new URLSearchParams(window.location.search).get('dur')) || undefined,
    }
    return (
      <div className="animate-rise">
        {header}
        {lesson.game === 'rhythm' ? <RhythmGame key={String(gameResult === null)} {...gameProps} /> : <RainGame key={String(gameResult === null)} {...gameProps} />}
      </div>
    )
  }
```

(`RhythmGame` se crea en la Task 5; hasta entonces, para que compile, dejar solo `<RainGame … />` y agregar el ternario en la Task 5.)

Reemplazar el bloque `if (phase === 'results' && gameResult) { … }` completo por:

```tsx
  if (phase === 'results' && gameResult) {
    return (
      <div className="animate-rise">
        {header}
        <GameResults result={gameResult} stars={stars} onRetry={retry} nextLesson={nextLesson} />
      </div>
    )
  }
```

- [ ] **Step 6: Glifo por juego en la ruta**

En `src/app/routes/Path.tsx`, sumar `type GameId` al import de `@/engine/curriculum` y, antes de `function legend`:

```ts
const GAME_GLYPH: Record<GameId, string> = { rain: '▼', rhythm: '♪' }
```

y el caso `'game'`:

```ts
    case 'game':
      return { main: GAME_GLYPH[l.game ?? 'rain'], sub: 'juego' }
```

- [ ] **Step 7: Verificar con la Lluvia**

Run: `npx tsc -b && npm run lint && npm test && npx playwright test e2e/game.spec.ts`
Expected: sin errores de tipos ni lint nuevo; unitarios PASS; el e2e de la Lluvia PASS (misma pantalla de resultados, ahora desde `GameResults`). Comprobar además en `localStorage` (el e2e ya lee `lessons[…]`) que `sessions` termina con `{ kind: 'game', gameId: 'rain' }`: agregar al final de `e2e/game.spec.ts`, antes de la captura:

```ts
  const last = await page.evaluate(() => { const s = JSON.parse(localStorage.getItem('typelight.v1')!).state.sessions; return s[s.length - 1] })
  expect(last).toMatchObject({ kind: 'game', gameId: 'rain' })
```

- [ ] **Step 8: Commit**

```bash
git add -A src/app/components/games src/app/lib/sound.ts src/app/routes/LessonPlayer.tsx src/app/routes/Path.tsx e2e/game.spec.ts
git commit -m "refactor(games): shared props, mascot, results screen and game sessions; rain emits GameResult"
```

---

### Task 5: `RhythmGame` — Al compás

**Files:**
- Create: `src/app/components/games/RhythmGame.tsx`
- Modify: `src/app/routes/LessonPlayer.tsx` (import + ternario de la Task 4 Step 5)
- Create: `e2e/rhythm.spec.ts`

**Interfaces:**
- Consumes: `GameProps`, `Mascot`, `metronome/click/thud/chime`, `pickLetters`, reducer de la Task 3, `FINGER_COLOR/fingerGroup`, `resolveChar`.
- Produces: `<RhythmGame {...GameProps} />`; DOM: la nota actual lleva `data-current="1"`, `data-ch`, `data-offset` (ms hasta su momento; negativo = ya pasó).

- [ ] **Step 1: El componente**

`src/app/components/games/RhythmGame.tsx`:

```tsx
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { makeRng } from '@/engine/generator'
import { advance, beatMs, currentNote, pickLetters, press, schedule, startRound, tally, type Judgement, type Round } from '@/engine/games'
import { resolveChar } from '@/engine/layouts'
import { Keycap } from '../Keycap'
import { FINGER_COLOR, fingerGroup } from '../../lib/fingers'
import { chime, click, metronome, thud } from '../../lib/sound'
import { Mascot, type Mood } from './Mascot'
import type { GameProps } from './types'

const KEY = 56
/** Left edge of the hit zone inside the field. */
const ZONE_X = 72
/** Notes travel right → left at a constant speed, px per ms. */
const SPEED = 0.16
const TRACK_TOP = 150
const JUDGE_MS = 600

type Feedback = Judgement | 'wrong'

interface Floating {
  id: number
  text: Feedback
  at: number
}

const FEEDBACK_LABEL: Record<Feedback, string> = { justo: 'justo', bien: 'bien', fuera: 'fuera', wrong: 'otra tecla' }
const FEEDBACK_COLOR: Record<Feedback, string> = {
  justo: 'text-enter-edge',
  bien: 'text-sun-edge',
  fuera: 'text-esc-edge',
  wrong: 'text-esc-edge',
}
const FEEDBACK_BAR: Record<Feedback, string> = {
  justo: 'var(--color-enter)',
  bien: 'var(--color-sun)',
  fuera: 'var(--color-esc)',
  wrong: 'var(--color-ink-mute)',
}

/**
 * Al compás: a metronome at the unit's goal speed; keys slide into the hit zone and each press is
 * judged justo / bien / fuera. The round state lives in the engine; this component only draws it.
 */
export function RhythmGame({ layout, pool, goalWpm, weak = [], sound = true, durationMs = 45_000, onFinish }: GameProps) {
  const letters = useMemo(() => pickLetters(layout, pool), [layout, pool])
  const colorOf = useMemo(() => {
    const map: Record<string, string> = {}
    for (const ch of letters) map[ch] = FINGER_COLOR[fingerGroup(resolveChar(layout, ch)![0].finger)]
    return map
  }, [layout, letters])
  const field = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(800)
  const [phase, setPhase] = useState<'ready' | 'playing' | 'done'>('ready')
  const [, setFrame] = useState(0)

  const round = useRef<Round>(startRound(beatMs(goalWpm)))
  const rng = useRef(makeRng())
  const startedAt = useRef(0)
  const nextTickAt = useRef(0)
  const beatCount = useRef(0)
  const floating = useRef<Floating[]>([])
  const recent = useRef<Feedback[]>([])
  const mood = useRef<{ mood: Mood; at: number }>({ mood: 'idle', at: 0 })
  const nextId = useRef(1)
  const finished = useRef(false)

  useEffect(() => {
    const el = field.current
    if (!el) return
    const update = () => setWidth(el.clientWidth)
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const lookahead = (width - ZONE_X) / SPEED
  const noteX = (at: number, now: number) => ZONE_X + (at - now) * SPEED
  const setMood = (m: Mood, now: number) => {
    mood.current = { mood: m, at: now }
  }
  const feedback = (text: Feedback, now: number) => {
    floating.current.push({ id: nextId.current++, text, at: now })
    recent.current.push(text)
    if (recent.current.length > 20) recent.current = recent.current.slice(-20)
  }

  const finish = useCallback(() => {
    if (finished.current) return
    finished.current = true
    setPhase('done')
    if (sound) chime()
    const r = round.current
    const t = tally(r)
    onFinish({
      gameId: 'rhythm',
      score: r.score,
      hits: t.hits,
      misses: t.misses,
      wrong: r.wrong,
      bestCombo: r.bestCombo,
      seconds: (performance.now() - startedAt.current) / 1000,
      accuracy: t.hits + r.wrong ? t.hits / (t.hits + r.wrong) : 0,
      detail: { onTime: t.onTime, justo: t.justo, bien: t.bien, fuera: t.fuera, maxTempo: Math.round(60000 / r.minBeat) },
    })
  }, [onFinish, sound])

  // Main loop: schedule notes, expire the ones that ran out, tick the metronome, redraw.
  useEffect(() => {
    if (phase !== 'playing') return
    let raf = 0
    const loop = () => {
      const now = performance.now() - startedAt.current
      if (now >= durationMs) {
        finish()
        return
      }
      let r = schedule(round.current, now, lookahead, letters, weak, rng.current)
      const step = advance(r, now)
      r = step.round
      for (const n of step.expired) {
        void n
        feedback('fuera', now)
        setMood('sad', now)
        if (sound) thud()
      }
      if (now >= nextTickAt.current) {
        beatCount.current++
        nextTickAt.current = now - nextTickAt.current > r.beat ? now + r.beat : nextTickAt.current + r.beat
        if (sound) metronome()
      }
      round.current = r
      floating.current = floating.current.filter((f) => now - f.at < JUDGE_MS)
      if (mood.current.mood !== 'idle' && now - mood.current.at > 700) mood.current = { mood: 'idle', at: now }
      setFrame((f) => f + 1)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, durationMs, lookahead, letters, weak, finish, sound])

  // Keyboard input.
  useEffect(() => {
    if (phase !== 'playing') return
    const onKey = (e: KeyboardEvent) => {
      if (e.key.length !== 1 || e.ctrlKey || e.metaKey || e.altKey) return
      e.preventDefault()
      const now = performance.now() - startedAt.current
      const out = press(round.current, e.key, now)
      round.current = out.round
      feedback(out.judgement, now)
      if (out.judgement === 'wrong' || out.judgement === 'fuera') {
        setMood('sad', now)
        if (sound) thud()
      } else {
        setMood('happy', now)
        if (sound) click()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, sound])

  const start = () => {
    round.current = startRound(beatMs(goalWpm))
    rng.current = makeRng()
    floating.current = []
    recent.current = []
    mood.current = { mood: 'idle', at: 0 }
    beatCount.current = 0
    nextTickAt.current = 0
    finished.current = false
    startedAt.current = performance.now()
    setPhase('playing')
  }

  useEffect(() => {
    if (phase !== 'ready') return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        start()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  const now = phase === 'playing' ? performance.now() - startedAt.current : 0
  const r = round.current
  const t = tally(r)
  const current = currentNote(r)
  const remaining = phase === 'playing' ? Math.max(0, Math.ceil((durationMs - now) / 1000)) : Math.round(durationMs / 1000)
  const perMinute = Math.round(60000 / r.beat)
  const visible = r.notes.filter((n) => n.result === null && noteX(n.at, now) < width + KEY)

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3 px-1 text-sm font-bold text-ink-mute">
        <span className="flex items-center gap-4">
          <span>
            <span className="font-display text-2xl text-ink tabular-nums">{Math.round(t.onTime * 100)} %</span> a tiempo
          </span>
          {r.combo >= 5 && <span className="rounded-full bg-sun-soft px-2 py-0.5 text-xs font-black text-sun-edge">racha ×{r.combo}</span>}
          <span>
            <span className="font-display text-xl text-ink tabular-nums">{r.wrong}</span> errores
          </span>
        </span>
        <span className="keycap keycap-sm font-display text-xl tabular-nums">0:{String(remaining).padStart(2, '0')}</span>
      </div>

      <div ref={field} className="card relative h-[420px] overflow-hidden" style={{ background: 'linear-gradient(var(--color-keycap), var(--color-paper))' }}>
        {/* beat indicator and tempo */}
        <div className="absolute top-5 left-5 flex items-center gap-2.5" aria-hidden="true">
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              className={`block h-3 w-3 rounded-full transition-all ${phase === 'playing' && beatCount.current % 4 === i ? 'bg-mod shadow-[0_0_0_5px_var(--color-mod-soft)]' : 'bg-line'}`}
            />
          ))}
          <span className="ml-2 text-sm font-bold text-ink-soft">tac · tac · tac · tac</span>
        </div>
        <div className="absolute top-4 right-5 text-right text-xs font-bold text-ink-mute">
          pulso
          <span className="block font-display text-2xl font-extrabold text-ink tabular-nums">{perMinute} / min</span>
          {Math.round(perMinute / 5)} PPM{r.beat === beatMs(goalWpm) ? ', tu meta' : ''}
        </div>

        {/* track and hit zone */}
        <div className="absolute inset-x-0 border-y-2 border-line bg-paper-deep" style={{ top: TRACK_TOP, height: KEY + 24 }} />
        <div
          className="absolute rounded-2xl border-[3px] border-dashed border-mod bg-mod-soft/80"
          style={{ left: ZONE_X - 10, top: TRACK_TOP - 12, width: KEY + 20, height: KEY + 48 }}
          aria-hidden="true"
        />

        {/* notes */}
        {visible.map((n) => {
          const x = noteX(n.at, now)
          const isCurrent = current?.id === n.id
          return (
            <div
              key={n.id}
              className={`kb-key absolute items-center justify-center text-2xl font-extrabold text-ink ${isCurrent ? 'ring-4 ring-mod/40' : ''}`}
              style={{ left: x, top: TRACK_TOP + 12, width: KEY, height: KEY, background: colorOf[n.ch], padding: 0, opacity: x > width - KEY ? 0.4 : 1 }}
              data-current={isCurrent ? '1' : undefined}
              data-ch={isCurrent ? n.ch : undefined}
              data-offset={isCurrent ? Math.round(n.at - now) : undefined}
            >
              {n.ch}
            </div>
          )
        })}

        {/* judgements float up from the zone */}
        {floating.current.map((f) => (
          <span
            key={f.id}
            className={`animate-rise pointer-events-none absolute font-display text-lg font-extrabold ${FEEDBACK_COLOR[f.text]}`}
            style={{ left: ZONE_X + KEY / 2, top: TRACK_TOP - 40, transform: 'translateX(-50%)' }}
          >
            {FEEDBACK_LABEL[f.text]}
          </span>
        ))}

        {/* last 20 presses */}
        <div className="absolute right-5 bottom-6 left-5">
          <div className="eyebrow mb-1.5">Tus últimos 20 toques</div>
          <div className="flex h-2.5 overflow-hidden rounded-full bg-paper-deep">
            {recent.current.map((f, i) => (
              <span key={i} className="block h-full flex-1" style={{ background: FEEDBACK_BAR[f] }} />
            ))}
          </div>
        </div>

        <div className="absolute right-4 bottom-14">
          <Mascot mood={mood.current.mood} combo={r.combo} />
        </div>

        {phase === 'ready' && (
          <div className="absolute inset-0 grid place-items-center bg-paper/70 backdrop-blur-[2px]">
            <div className="max-w-md text-center">
              <h2 className="text-3xl">Al compás</h2>
              <p className="mt-2 text-ink-soft">
                Un metrónomo marca el pulso a tu meta ({goalWpm} PPM). Las teclas llegan a la zona: tocá cada una justo cuando entra. Si venís bien, el pulso se acelera. {Math.round(durationMs / 1000)} segundos.
              </p>
              <Keycap variant="primary" size="lg" className="mt-5" onClick={start} autoFocus>
                Empezar (Enter) →
              </Keycap>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Conectarlo en `LessonPlayer`**

Import: `import { RhythmGame } from '../components/games/RhythmGame'` y el ternario de la Task 4 Step 5 (`lesson.game === 'rhythm' ? <RhythmGame …/> : <RainGame …/>`).

- [ ] **Step 3: Typecheck, lint, probar a mano**

Run: `npx tsc -b && npm run lint`
Expected: sin errores.

Abrir `http://localhost:5173/leccion/guia-juego-fila-guia` (con la lección anterior completa, o sembrar `guia-unit-review` en `localStorage` como hace el e2e) y jugar una ronda: el pulso suena, las notas entran en la zona, los juicios flotan, la barra de 20 toques se llena, al terminar aparece "Juego terminado" con "A tiempo".

- [ ] **Step 4: e2e**

`e2e/rhythm.spec.ts`:

```ts
import { expect, test } from '@playwright/test'

test('rhythm game: hit the notes on the beat, finish, get stars and a game session', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => {
    const done = { stars: 3, bestWpm: 30, bestAcc: 1, attempts: 1, completedAt: '2026-01-01T00:00:00Z' }
    localStorage.setItem(
      'typelight.v1',
      JSON.stringify({
        state: {
          settings: { name: 'Seba', layoutId: 'latam', sound: false, showHands: true, onboarded: true, theme: 'auto' },
          lessons: { 'guia-unit-review': done },
          keys: {},
          sessions: [],
          days: {},
          streak: { count: 0, lastDay: null },
          routine: { day: '2000-01-01', warmup: false, lesson: false, review: false, challenge: false },
        },
        version: 2,
      }),
    )
  })
  await page.goto('/leccion/guia-juego-fila-guia?dur=6000')
  await expect(page.getByRole('heading', { name: 'Al compás', exact: true })).toBeVisible()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('heading', { name: 'Al compás', exact: true })).toBeHidden()

  // Play: press the current note's key when it is about to enter the zone.
  const deadline = Date.now() + 8000
  let shot = false
  while (Date.now() < deadline) {
    const cur = await page.evaluate(() => {
      const el = document.querySelector<HTMLElement>('[data-current="1"]')
      return el ? { ch: el.dataset.ch!, offset: Number(el.dataset.offset) } : null
    })
    if (cur && cur.offset <= 60) {
      await page.keyboard.type(cur.ch)
      if (!shot) {
        shot = true
        await page.screenshot({ path: 'e2e/screens/rhythm-play.png' })
      }
    }
    await page.waitForTimeout(40)
    if (await page.getByText('Juego terminado').isVisible()) break
  }
  await expect(page.getByText('Juego terminado')).toBeVisible()
  await expect(page.getByText('A tiempo')).toBeVisible()
  const state = await page.evaluate(() => JSON.parse(localStorage.getItem('typelight.v1')!).state)
  expect(state.lessons['guia-juego-fila-guia'].stars).toBeGreaterThanOrEqual(1)
  const last = state.sessions[state.sessions.length - 1]
  expect(last).toMatchObject({ kind: 'game', gameId: 'rhythm' })
  expect(typeof last.rhythm).toBe('number')
  await page.screenshot({ path: 'e2e/screens/rhythm-results.png' })
})
```

Run: `npx playwright test e2e/rhythm.spec.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/components/games/RhythmGame.tsx src/app/routes/LessonPlayer.tsx e2e/rhythm.spec.ts
git commit -m "feat(games): Al compás — metronome at the goal speed, notes judged justo/bien/fuera"
```

---

### Task 6: cierre

**Files:**
- Modify: `docs/backlog.md`, `.serena/memories/typelight-architecture.md`

- [ ] **Step 1: Todo en verde**

Run: `npm test && npm run e2e && npm run build`
Expected: unitarios PASS; Playwright 7 PASS (6 previos + `rhythm`); build OK.

- [ ] **Step 2: Docs**

`docs/backlog.md`, ítem 1: anotar "Hecho: infraestructura de juegos + Al compás (plan `2026-09-16-juegos-1-compas.md`). Siguen Globos, Carrera y la fila Jugar (`juegos-2`)."

`.serena/memories/typelight-architecture.md`, reemplazar la viñeta **Juego "Lluvia de teclas"** por:

```md
- **Juegos** (`src/app/components/games/`, motor en `src/engine/games/`): lecciones `kind: 'game'` con `lesson.game: GameId`; `LessonPlayer` elige el componente. Contrato común `GameProps` → `GameResult` (`engine/games/scoring.ts` da las estrellas por juego); resultados en `GameResults`; cada juego graba una sesión `kind: 'game'` con `gameId`. Física por tiempo con rAF (se pausa en pestañas ocultas; e2e con `?dur=6000`). **Lluvia** (`RainGame`): reflejo por tecla. **Al compás** (`RhythmGame`): reducer puro `engine/games/rhythm.ts` (pulso = `beatMs(goalWpm)`, juicio ±80/±160 ms, rampa −10 % cada 15 s con ≥ 80 % a tiempo, mínimo 250 ms); graba `rhythm = fracción a tiempo`. La nota actual expone `data-current/data-ch/data-offset` para los e2e.
```

- [ ] **Step 3: Commit y rama**

```bash
git add docs/backlog.md .serena/memories/typelight-architecture.md docs/superpowers/plans/2026-09-16-juegos-1-compas.md
git commit -m "docs: games infrastructure and Al compás notes"
```

Luego `superpowers:finishing-a-development-branch` (merge ff a `master`, como en Progreso).

---

## Self-review

- **Cobertura del spec (§4 infraestructura, §5 Al compás):** `GameId` y `game()` con id → Task 1; contrato `GameProps`/`GameResult`, `starsForGame`, `GameResults`, sesión `kind: 'game'` (la Lluvia pasa a grabar), `Mascot` y `pickLetters` compartidos, glifos en la ruta, `?dur=` → Tasks 2, 4; motor de Al compás (beat, juicio, rampa, secuencia sesgada a teclas flojas, sin vidas, 45 s) → Task 3; pantalla (banda, zona, notas, juicios flotantes, puntos de compás, tempo, barra de 20 toques, mascota, HUD), metrónomo, `keydown`, sesión con `rhythm = onTime` → Tasks 4–5; e2e → Task 5. Fuera de este plan y anotado: `useHiddenInput`, Globos, Carrera, huecos nuevos, Jugar libre (`juegos-2`).
- **Placeholders:** ninguno.
- **Consistencia:** `advance` (motor) vs `metronome()` (sonido) sin colisión; `GameResult.detail.onTime/justo/maxTempo` producidos en Task 5 y leídos en Tasks 2 y 4; `data-current/data-ch/data-offset` en Task 5 y en el e2e; `weak` viene de `weakestKeys(keyStats, lesson.pool, 3)` en Task 4 y lo consume `pickNote` vía `schedule` en Task 5.
