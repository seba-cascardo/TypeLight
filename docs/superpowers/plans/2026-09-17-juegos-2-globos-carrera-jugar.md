# Juegos 2: Globos de palabras, Carrera contra tu fantasma y Jugar libre — plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

> **Estado:** Ejecutado completo el 2026-09-17 y mergeado a `master` (rama `juegos-2`, ff). Desvíos: `race.ts` usa `dayKey(new Date(s.at))` en vez de `sessionDay` (tipo); `RaceGame` lleva reloj y humor en estado/efectos (React Compiler); e2e con `exact`/`level` y día local.

**Goal:** Sumar los dos juegos que faltan (Globos: palabras enteras; Carrera: frases reales contra un fantasma que corre a tu mejor Reto), ubicarlos en la ruta con los tres huecos nuevos (Patrones, Velocidad ×2) y abrir el modo libre "Jugar" en Inicio cuando la rutina está completa.

**Architecture:** Igual que en juegos-1: la lógica de cada ronda es un reducer puro con tests en `src/engine/games/`, y el componente React solo dibuja. Globos captura por el input oculto de la app (hook `useHiddenInput`, extraído de `TypingArea`) para que las teclas muertas sigan funcionando en el modo libre; Carrera reutiliza `useTypingSession` + `TypingArea` y por eso entrega también velocidad, ritmo y muestras por tecla (`GameResult.typing`). Un componente `Game` elige el juego por id; `LessonPlayer` y la ruta nueva `/jugar/:gameId` lo comparten, junto con `gameSession()` para grabar.

**Tech Stack:** Vite + React 19 + TypeScript strict, Tailwind v4, zustand 5, Vitest, Playwright 1.63.

**Spec:** `docs/superpowers/specs/2026-09-16-juegos-y-progreso-design.md` (§4 tabla de huecos, §6 Globos, §7 Carrera, §8 Jugar libre).

## Global Constraints

- Motor puro en `src/engine/` (sin React ni imports de `src/app/`). Prosa de UI en rioplatense; código, comentarios y commits en inglés. Sin librerías nuevas.
- Los IDs de lección existentes no cambian; los huecos que cambian de juego conservan el ID. Nuevos: `patrones-juego-patrones`, `velocidad-juego-carrera-1`, `velocidad-juego-carrera-2`.
- Todo juego acepta `durationMs` (`?dur=`); Carrera termina por texto, no por tiempo.
- Rama `juegos-2` sobre `master`, misma carpeta. Avisar a Seba antes de que pruebe (HMR).
- Verificación por tarea: `npx tsc -b && npm run lint && npm test`; al cierre `npm run e2e` y `npm run build`. El lint tiene 4 advertencias previas (2 en `main.tsx`, 2 en `LessonPlayer.tsx`): no sumar ninguna.

---

## Mapa de archivos

| Archivo | Responsabilidad |
|---|---|
| `src/engine/generator/index.ts` (modificar) | Exportar `candidateWords`. |
| `src/engine/curriculum/types.ts`, `build.ts`, `curriculum.test.ts` (modificar) | `GameId` completo; `Lesson.patterns`; `game()` devuelve la lección; huecos nuevos. |
| `src/engine/games/scoring.ts` + test (modificar) | `GameResult.typing`; estrellas de `balloons` y `race`. |
| `src/engine/games/balloons.ts` + test (crear) | Reducer de Globos + `balloonWords` + `samplesFrom`. |
| `src/engine/games/race.ts` + test (crear) | `ghostWpm`, `raceText`, `ghostPos`, `raceOutcome`. |
| `src/engine/games/index.ts` (modificar) | Re-exportar. |
| `src/app/hooks/useHiddenInput.ts` (crear) · `src/app/components/TypingArea.tsx` (modificar) | Captura por input oculto compartida. |
| `src/app/components/games/types.ts` (modificar) | `GameProps.ghostWpm`, `GameProps.patterns`. |
| `src/app/components/games/meta.ts` (crear) | Título, blurb, glifo y color por juego. |
| `src/app/components/games/Game.tsx` (crear) | Elige el componente por id. |
| `src/app/components/games/BalloonsGame.tsx`, `RaceGame.tsx` (crear) | Los dos juegos. |
| `src/app/components/games/GameResults.tsx` (modificar) | Vistas de `balloons` y `race`. |
| `src/app/lib/gameSession.ts` (crear) | `gameSession(r)` → registro de sesión. |
| `src/app/routes/LessonPlayer.tsx`, `Path.tsx`, `Home.tsx` (modificar) · `src/app/routes/Play.tsx` (crear) · `src/main.tsx` (modificar) | Integración, fila Jugar, ruta `/jugar/:gameId`. |
| `e2e/balloons.spec.ts`, `e2e/race.spec.ts`, `e2e/play.spec.ts` (crear) | Un e2e por juego y uno del modo libre. |
| `docs/backlog.md`, `.serena/memories/typelight-architecture.md`, `docs/superpowers/handoffs/HANDOFF.md` (modificar) | Cierre de etapa. |

---

### Task 0: Rama

- [x] **Step 1**

```bash
git -C C:/Projects/TypeLight checkout -b juegos-2
```

---

### Task 1: currículo — `GameId` completo, `patterns`, huecos nuevos

**Files:**
- Modify: `src/engine/curriculum/types.ts`, `src/engine/curriculum/build.ts`
- Test: `src/engine/curriculum/curriculum.test.ts`

**Interfaces:**
- Produces: `GameId = 'rain' | 'rhythm' | 'balloons' | 'race'`; `Lesson.patterns?: string[]` (solo en el juego de Patrones); `game(b, u, slug, title, id): Lesson`.

- [x] **Step 1: Test que falla**

En `curriculum.test.ts`, reemplazar el `expect(games).toEqual([...])` del test `places the games in the path with their ids` por:

```ts
    expect(games).toEqual([
      ['guia-juego-primeras-8', 'rain'],
      ['guia-juego-fila-guia', 'rhythm'],
      ['superior-juego-ruei', 'rain'],
      ['superior-juego-fila-superior', 'balloons'],
      ['inferior-juego-vmcx', 'rhythm'],
      ['inferior-juego-alfabeto', 'balloons'],
      ['patrones-juego-patrones', 'balloons'],
      ['mayusculas-juego-mayusculas', 'race'],
      ['numeros-juego-numeros', 'rhythm'],
      ['signos-juego-signos', 'rain'],
      ['velocidad-juego-carrera-1', 'race'],
      ['velocidad-juego-carrera-2', 'race'],
    ])
    const patrones = c.byId.get('patrones-juego-patrones')!
    expect(patrones.patterns).toEqual(['que', 'ent', 'ado', 'con', 'est', 'ien', 'mente'])
    expect(c.byId.get('velocidad-juego-carrera-1')!.goalWpm).toBe(34)
    expect(c.byId.get('velocidad-juego-carrera-2')!.goalWpm).toBe(50)
    expect(c.lessons.indexOf(c.byId.get('velocidad-juego-carrera-1')!)).toBe(c.lessons.indexOf(c.byId.get('velocidad-texto-4')!) + 1)
```

- [x] **Step 2: Correr y ver que falla**

Run: `npm test -- src/engine/curriculum`
Expected: FAIL.

- [x] **Step 3: Implementar**

`types.ts`:

```ts
export type GameId = 'rain' | 'rhythm' | 'balloons' | 'race'
```

y en `interface Lesson`, debajo de `game?: GameId`:

```ts
  /** Set on the Patrones game: only words containing one of these count. */
  patterns?: string[]
```

`build.ts`, la función `game` devuelve la lección:

```ts
/** A playable break with everything learned so far. */
function game(b: Builder, u: Unit, slug: string, title: string, id: GameId = 'rain'): Lesson {
  const l = add(b, u, `juego-${slug}`, title, 'game', [], [], [])
  l.game = id
  return l
}
```

Huecos que cambian:

```ts
  game(b, sup, 'fila-superior', 'Juego: globos de palabras', 'balloons')
```
```ts
  game(b, inf, 'alfabeto', 'Juego: globos de palabras', 'balloons')
```
```ts
  game(b, may, 'mayusculas', 'Juego: carrera contra tu fantasma', 'race')
```

Patrones: reemplazar el `for` de patrones por una versión que inserta el juego después de `mente`:

```ts
  const patterns = ['que', 'ent', 'ado', 'con', 'est', 'ien', 'mente', 'nte', 'los', 'para']
  patterns.forEach((pattern, i) => {
    const pool = [...b.pool]
    add(b, pat, `patron-${slugOf([...pattern])}`, `Patrón: ${pattern}`, 'practice', [], [], [
      { kind: 'pattern', pool, pattern, count: 12 },
      { kind: 'pattern', pool, pattern, count: 14 },
      { kind: 'words', pool, count: 16 },
    ])
    if (pattern === 'mente') {
      const l = game(b, pat, 'patrones', 'Juego: globos con patrones', 'balloons')
      l.patterns = patterns.slice(0, i + 1)
    }
  })
```

Velocidad: dentro del `goals.forEach`, después de `l.goalWpm = goal`:

```ts
    if (i === 3 || i === 7) {
      const race = game(b, vel, `carrera-${i === 3 ? 1 : 2}`, `Juego: carrera a ${goal} PPM`, 'race')
      race.goalWpm = goal
    }
```

- [x] **Step 4: Verificar y commitear**

Run: `npx tsc -b && npm test -- src/engine/curriculum`
Expected: PASS (el `tsc` falla en `GameResults.tsx`/`Path.tsx`/`scoring.ts` por el `switch` no exhaustivo: es esperado hasta las Tasks 2 y 6; si molesta, hacer las Tasks 1–2 y 6 antes del primer `tsc -b`. Alternativa aceptada: commitear el currículo junto con la Task 2).

```bash
git add src/engine/curriculum
git commit -m "feat(curriculum): balloons and race slots, patterns game, two races in Velocidad"
```

---

### Task 2: scoring — `GameResult.typing`, estrellas de Globos y Carrera; exportar `candidateWords`

**Files:**
- Modify: `src/engine/games/scoring.ts`, `src/engine/games/scoring.test.ts`, `src/engine/generator/index.ts`

**Interfaces:**
- Produces: `GameResult.typing?: { wpm: number; rhythm?: number; samples: KeySample[] }`; `starsForGame` para `balloons` (★★ acc ≥ 0.95 · ★★★ acc ≥ 0.97 y `detail.escaped === 0`) y `race` (★★ acc ≥ 0.95 · ★★★ `detail.won === 1` y acc ≥ 0.97); `candidateWords(pool, limit)` exportada.

- [x] **Step 1: Tests que fallan**

Agregar en `scoring.test.ts`:

```ts
  it('balloons: accuracy, three stars only with nothing escaped', () => {
    expect(starsForGame(result({ gameId: 'balloons', accuracy: 0.98, detail: { escaped: 0 } }))).toBe(3)
    expect(starsForGame(result({ gameId: 'balloons', accuracy: 0.98, detail: { escaped: 1 } }))).toBe(2)
    expect(starsForGame(result({ gameId: 'balloons', accuracy: 0.95, detail: { escaped: 0 } }))).toBe(2)
    expect(starsForGame(result({ gameId: 'balloons', accuracy: 0.9, detail: { escaped: 0 } }))).toBe(1)
  })

  it('race: accuracy, three stars only when the ghost lost', () => {
    expect(starsForGame(result({ gameId: 'race', accuracy: 0.98, detail: { won: 1 } }))).toBe(3)
    expect(starsForGame(result({ gameId: 'race', accuracy: 0.98, detail: { won: 0 } }))).toBe(2)
    expect(starsForGame(result({ gameId: 'race', accuracy: 0.9, detail: { won: 1 } }))).toBe(1)
  })
```

- [x] **Step 2: Implementar**

`scoring.ts`: agregar `import type { KeySample } from '../typing'`, el campo en `GameResult`:

```ts
  /** Games played through the typing engine (Carrera) also report what a lesson would. */
  typing?: { wpm: number; rhythm?: number; samples: KeySample[] }
```

y los casos:

```ts
    case 'balloons':
      return r.accuracy >= 0.97 && (r.detail.escaped ?? 0) === 0 ? 3 : r.accuracy >= 0.95 ? 2 : 1
    case 'race':
      return r.detail.won === 1 && r.accuracy >= 0.97 ? 3 : r.accuracy >= 0.95 ? 2 : 1
```

`generator/index.ts`: cambiar `function candidateWords(` por `export function candidateWords(` y documentarla:

```ts
/** Real words (plus the one-letter ones) typable with the pool, most frequent first, up to `limit`. */
export function candidateWords(pool: ReadonlySet<string>, limit: number): string[] {
```

- [x] **Step 3: Verificar y commitear**

Run: `npm test -- src/engine/games src/engine/generator`
Expected: PASS.

```bash
git add src/engine/games/scoring.ts src/engine/games/scoring.test.ts src/engine/generator/index.ts
git commit -m "feat(engine): stars for balloons and race; typing details on game results; export candidateWords"
```

---

### Task 3: reducer de Globos

**Files:**
- Create: `src/engine/games/balloons.ts`, `src/engine/games/balloons.test.ts`
- Modify: `src/engine/games/index.ts` (`export * from './balloons'`)

**Interfaces:**
- Consumes: `candidateWords`, `pseudoWord`, `Rng` del generador; `KeySample` de typing.
- Produces: `BALLOON_LIVES = 3`, `MAX_ALIVE = 5`, `COLUMNS = 6`; `spawnInterval(elapsedMs)`, `riseSpeed(elapsedMs)`; `balloonWords(pool, rng, patterns?)`; `Balloon { id; word; typed; bornAt; column; speed; goneAt; how }`; `BalloonRound`; `startBalloons(lives?)`, `alive(r)`, `shouldSpawn(r, now)`, `pickWord(words, r, weak, rng)`, `pickColumn(r, now, rng)`, `spawn(r, word, column, now)`, `typeChar(r, ch, now) → { round; outcome: 'hit' | 'pop' | 'wrong'; expected }`, `escape(r, ids, now)`, `prune(r, now, keepMs?)`; `KeyEvent { expected; correct; latency? }`, `samplesFrom(events): KeySample[]`.

- [x] **Step 1: Tests que fallan**

`src/engine/games/balloons.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { makeRng } from '../generator'
import { alive, balloonWords, escape, pickColumn, pickWord, prune, riseSpeed, samplesFrom, shouldSpawn, spawn, spawnInterval, startBalloons, typeChar } from './balloons'

const rng = () => makeRng(3)

describe('pace', () => {
  it('spawns faster and rises faster as the round goes on', () => {
    expect(spawnInterval(0)).toBe(1800)
    expect(spawnInterval(45_000)).toBe(1100)
    expect(spawnInterval(90_000)).toBe(1100)
    expect(riseSpeed(0)).toBe(14)
    expect(riseSpeed(45_000)).toBe(26)
  })
})

describe('balloonWords', () => {
  it('uses real words when the pool allows, filtered by patterns when given', () => {
    const pool = [...'abcdefghijklmnopqrstuvwxyzñ ']
    const words = balloonWords(pool, rng())
    expect(words.length).toBeGreaterThan(100)
    expect(words.every((w) => w.length >= 2 && w.length <= 8)).toBe(true)
    const withQue = balloonWords(pool, rng(), ['que'])
    expect(withQue.length).toBeGreaterThan(10)
    expect(withQue.every((w) => w.includes('que'))).toBe(true)
  })

  it('falls back to pseudo-words with a tiny pool', () => {
    const words = balloonWords(['f', 'j', ' '], rng())
    expect(words.length).toBe(40)
    expect(words.every((w) => /^[fj]+$/.test(w))).toBe(true)
  })
})

describe('round', () => {
  it('spawns into free columns while under the cap and the interval has passed', () => {
    let r = startBalloons()
    expect(shouldSpawn(r, 0)).toBe(true)
    r = spawn(r, 'casa', pickColumn(r, 0, rng()), 0)
    expect(shouldSpawn(r, 1000)).toBe(false)
    expect(shouldSpawn(r, 1800)).toBe(true)
    const col = r.balloons[0].column
    const others = new Set(Array.from({ length: 30 }, () => pickColumn(r, 500, rng())))
    expect(others.has(col)).toBe(false)
    for (let i = 0; i < 4; i++) r = spawn(r, `w${i}`, i, 2000 + i)
    expect(shouldSpawn(r, 10_000)).toBe(false)
  })

  it('never offers a word whose initial is already in the air', () => {
    let r = spawn(startBalloons(), 'casa', 0, 0)
    for (let i = 0; i < 20; i++) expect(pickWord(['cosa', 'dado', 'casa', 'dedo'], r, [], rng())![0]).toBe('d')
    r = spawn(r, 'dado', 1, 10)
    expect(pickWord(['cosa', 'dado'], r, [], rng())).toBeNull()
  })

  it('locks the oldest balloon by its initial, advances it, pops it and scores', () => {
    let r = spawn(spawn(startBalloons(), 'sal', 0, 0), 'sol', 1, 500)
    let out = typeChar(r, 'x', 600)
    expect(out.outcome).toBe('wrong')
    expect(out.round.wrong).toBe(1)
    r = out.round

    out = typeChar(r, 's', 700)
    expect(out).toMatchObject({ outcome: 'hit', expected: 's' })
    expect(out.round.active).toBe(1) // the oldest 's' balloon
    r = out.round
    out = typeChar(r, 'o', 800) // wrong: locked on "sal"
    expect(out).toMatchObject({ outcome: 'wrong', expected: 'a' })
    expect(out.round.active).toBe(1)
    r = typeChar(out.round, 'a', 900).round
    out = typeChar(r, 'l', 1000)
    expect(out.outcome).toBe('pop')
    expect(out.round.active).toBeNull()
    expect(out.round.popped).toBe(1)
    expect(out.round.combo).toBe(1)
    expect(out.round.score).toBe(30) // 3 letters × 10 × multiplier 1
    expect(out.round.balloons[0]).toMatchObject({ goneAt: 1000, how: 'popped' })
    expect(alive(out.round).map((b) => b.word)).toEqual(['sol'])
  })

  it('escaping balloons cost a life, the combo and the lock', () => {
    let r = spawn(spawn(startBalloons(), 'sal', 0, 0), 'dos', 1, 100)
    r = typeChar(r, 's', 200).round
    r = { ...r, combo: 4 }
    r = escape(r, [1], 3000)
    expect(r).toMatchObject({ lives: 2, escaped: 1, combo: 0, active: null })
    expect(r.balloons[0]).toMatchObject({ goneAt: 3000, how: 'escaped' })
    expect(escape(r, [], 3100)).toBe(r)
    expect(prune(r, 3800).balloons.map((b) => b.word)).toEqual(['dos'])
  })
})

describe('samplesFrom', () => {
  it('folds key events into per-key samples like the typing engine does', () => {
    const samples = samplesFrom([
      { expected: 'a', correct: true },
      { expected: 'a', correct: true, latency: 300 },
      { expected: 'a', correct: false },
      { expected: 'b', correct: true, latency: 500 },
    ])
    expect(samples).toEqual([
      { char: 'a', latencies: [300], errors: 1, occurrences: 2 },
      { char: 'b', latencies: [500], errors: 0, occurrences: 1 },
    ])
  })
})
```

- [x] **Step 2: Correr y ver que falla**

Run: `npm test -- src/engine/games/balloons`
Expected: FAIL — no se resuelve `./balloons`.

- [x] **Step 3: Implementar**

`src/engine/games/balloons.ts`:

```ts
import { candidateWords, pseudoWord, type Rng } from '../generator'
import type { KeySample } from '../typing'

export const BALLOON_LIVES = 3
export const MAX_ALIVE = 5
export const COLUMNS = 6
const ROUND_MS = 45_000

/** Spawn gap shrinks from 1.8 s to 1.1 s over the round. */
export function spawnInterval(elapsedMs: number): number {
  const t = Math.min(1, Math.max(0, elapsedMs) / ROUND_MS)
  return Math.round(1800 - 700 * t)
}

/** Rise speed grows from 14 to 26 px/s over the round. */
export function riseSpeed(elapsedMs: number): number {
  const t = Math.min(1, Math.max(0, elapsedMs) / ROUND_MS)
  return 14 + 12 * t
}

/**
 * Words for the round: real ones typable with the pool (2..8 letters), only those containing one of
 * `patterns` when given; 40 pseudo-words when fewer than 12 real ones fit.
 */
export function balloonWords(pool: readonly string[], rng: Rng, patterns?: readonly string[]): string[] {
  let words = candidateWords(new Set(pool), 1500).filter((w) => w.length >= 2 && w.length <= 8)
  if (patterns?.length) words = words.filter((w) => patterns.some((p) => w.includes(p)))
  if (words.length >= 12) return words
  const letters = pool.filter((c) => /^[a-zñáéíóúü]$/.test(c))
  if (letters.length === 0) return []
  const focus = new Set<string>()
  return Array.from({ length: 40 }, () => pseudoWord(letters, focus, rng))
}

export interface Balloon {
  id: number
  word: string
  /** Letters already typed. */
  typed: number
  bornAt: number
  column: number
  /** px per second, fixed at birth. */
  speed: number
  goneAt: number | null
  how: 'popped' | 'escaped' | null
}

export interface BalloonRound {
  balloons: Balloon[]
  /** The balloon locked by the first letter typed, if any. */
  active: number | null
  hits: number
  wrong: number
  popped: number
  escaped: number
  combo: number
  bestCombo: number
  score: number
  lives: number
  nextId: number
  lastSpawn: number
}

export function startBalloons(lives = BALLOON_LIVES): BalloonRound {
  return { balloons: [], active: null, hits: 0, wrong: 0, popped: 0, escaped: 0, combo: 0, bestCombo: 0, score: 0, lives, nextId: 1, lastSpawn: -Infinity }
}

export function alive(r: BalloonRound): Balloon[] {
  return r.balloons.filter((b) => b.goneAt === null)
}

export function shouldSpawn(r: BalloonRound, now: number): boolean {
  return alive(r).length < MAX_ALIVE && now - r.lastSpawn >= spawnInterval(now)
}

/** A word whose initial no live balloon uses (so the first key is never ambiguous); half the time one with a weak key. */
export function pickWord(words: readonly string[], r: BalloonRound, weak: readonly string[], rng: Rng): string | null {
  const taken = new Set(alive(r).map((b) => b.word[0]))
  const free = words.filter((w) => !taken.has(w[0]))
  if (free.length === 0) return null
  const weakSet = new Set(weak)
  const focus = weakSet.size ? free.filter((w) => [...w].some((c) => weakSet.has(c))) : []
  if (focus.length && rng.chance(0.5)) return rng.pick(focus)
  return rng.pick(free)
}

/** A column no balloon born in the last 2.5 s is using. */
export function pickColumn(r: BalloonRound, now: number, rng: Rng): number {
  const busy = new Set(alive(r).filter((b) => now - b.bornAt < 2500).map((b) => b.column))
  const free = Array.from({ length: COLUMNS }, (_, i) => i).filter((c) => !busy.has(c))
  return free.length ? rng.pick(free) : rng.int(COLUMNS)
}

export function spawn(r: BalloonRound, word: string, column: number, now: number): BalloonRound {
  const balloon: Balloon = { id: r.nextId, word, typed: 0, bornAt: now, column, speed: riseSpeed(now), goneAt: null, how: null }
  return { ...r, balloons: [...r.balloons, balloon], nextId: r.nextId + 1, lastSpawn: now }
}

const multiplier = (combo: number) => Math.min(5, 1 + Math.floor(combo / 5))

export type BalloonOutcome = 'hit' | 'pop' | 'wrong'

/**
 * A typed character. Without a lock, it locks the oldest live balloon starting with it; with one, it must
 * be the next letter of that word (stop-on-error). `expected` is what the key stats should count.
 */
export function typeChar(r: BalloonRound, ch: string, now: number): { round: BalloonRound; outcome: BalloonOutcome; expected: string | null } {
  let target = r.active === null ? undefined : r.balloons.find((b) => b.id === r.active && b.goneAt === null)
  if (!target) {
    const candidates = alive(r).filter((b) => b.word[0] === ch)
    if (candidates.length === 0) return { round: { ...r, wrong: r.wrong + 1, combo: 0, active: null }, outcome: 'wrong', expected: null }
    target = candidates.reduce((a, b) => (a.bornAt <= b.bornAt ? a : b))
  }
  const expected = target.word[target.typed]
  if (ch !== expected) return { round: { ...r, wrong: r.wrong + 1, combo: 0, active: target.id }, outcome: 'wrong', expected }
  const typed = target.typed + 1
  const done = typed >= target.word.length
  const id = target.id
  const balloons = r.balloons.map((b) => (b.id === id ? { ...b, typed, goneAt: done ? now : null, how: done ? ('popped' as const) : null } : b))
  if (!done) return { round: { ...r, balloons, active: id, hits: r.hits + 1 }, outcome: 'hit', expected }
  const combo = r.combo + 1
  return {
    round: {
      ...r,
      balloons,
      active: null,
      hits: r.hits + 1,
      popped: r.popped + 1,
      combo,
      bestCombo: Math.max(r.bestCombo, combo),
      score: r.score + target.word.length * 10 * multiplier(r.combo),
    },
    outcome: 'pop',
    expected,
  }
}

/** Balloons that reached the top: a life each, the combo and the lock are gone. */
export function escape(r: BalloonRound, ids: readonly number[], now: number): BalloonRound {
  if (ids.length === 0) return r
  const set = new Set(ids)
  const balloons = r.balloons.map((b) => (set.has(b.id) && b.goneAt === null ? { ...b, goneAt: now, how: 'escaped' as const } : b))
  return { ...r, balloons, escaped: r.escaped + ids.length, lives: Math.max(0, r.lives - ids.length), combo: 0, active: r.active !== null && set.has(r.active) ? null : r.active }
}

/** Drop balloons gone for longer than `keepMs` (their pop/escape animation is over). */
export function prune(r: BalloonRound, now: number, keepMs = 700): BalloonRound {
  const balloons = r.balloons.filter((b) => b.goneAt === null || now - b.goneAt < keepMs)
  return balloons.length === r.balloons.length ? r : { ...r, balloons }
}

export interface KeyEvent {
  expected: string
  correct: boolean
  /** ms since the previous key, when there was one. */
  latency?: number
}

/** Per expected character, like `keySamples` in the typing engine. */
export function samplesFrom(events: readonly KeyEvent[]): KeySample[] {
  const map = new Map<string, KeySample>()
  for (const e of events) {
    let v = map.get(e.expected)
    if (!v) {
      v = { char: e.expected, latencies: [], errors: 0, occurrences: 0 }
      map.set(e.expected, v)
    }
    if (e.correct) {
      v.occurrences++
      if (e.latency !== undefined) v.latencies.push(e.latency)
    } else v.errors++
  }
  return [...map.values()]
}
```

`index.ts`: `export * from './balloons'`.

- [x] **Step 4: Verificar y commitear**

Run: `npm test -- src/engine/games`
Expected: PASS. Si el test de `pickColumn` falla por la semilla, es porque `others` incluyó la columna ocupada: revisar que `busy` mire `now - b.bornAt < 2500` (500 − 0 < 2500 → ocupada).

```bash
git add src/engine/games
git commit -m "feat(engine): balloons round (word lock by initial, pops, escapes, key samples)"
```

---

### Task 4: motor de Carrera

**Files:**
- Create: `src/engine/games/race.ts`, `src/engine/games/race.test.ts`
- Modify: `src/engine/games/index.ts` (`export * from './race'`)

**Interfaces:**
- Consumes: `sentencesText`, `wordsText`, `Rng` del generador; `sessionDay`, `daysBetween` de stats.
- Produces: `ghostWpm(sessions, today, fallback)`, `raceText(pool, rng)`, `ghostPos(elapsedMs, wpm, length)`, `ghostFinishMs(wpm, length)`, `raceOutcome(playerMs, wpm, length) → { won; marginSeconds }`.

- [x] **Step 1: Tests que fallan**

`src/engine/games/race.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { makeRng, poolOf } from '../generator'
import { ghostFinishMs, ghostPos, ghostWpm, raceOutcome, raceText } from './race'

const at = (day: string) => `${day}T12:00:00.000Z`

describe('ghost', () => {
  it('runs at the best reference session of the last 7 days, else at the goal', () => {
    const sessions = [
      { at: at('2026-09-01'), wpm: 40, reference: true as const }, // too old
      { at: at('2026-09-12'), wpm: 22, reference: true as const },
      { at: at('2026-09-15'), wpm: 60 }, // a lesson, not a reference
      { at: at('2026-09-16'), wpm: 27, reference: true as const },
    ]
    expect(ghostWpm(sessions, '2026-09-16', 18)).toBe(27)
    expect(ghostWpm([], '2026-09-16', 18)).toBe(18)
  })

  it('covers chars at wpm × 5 per minute and finishes accordingly', () => {
    expect(ghostPos(60_000, 24, 500)).toBe(120)
    expect(ghostPos(600_000, 24, 100)).toBe(100)
    expect(ghostFinishMs(24, 120)).toBe(60_000)
  })

  it('decides the race by finish time with a margin in seconds', () => {
    expect(raceOutcome(55_000, 24, 120)).toEqual({ won: true, marginSeconds: 5 })
    expect(raceOutcome(61_500, 24, 120)).toEqual({ won: false, marginSeconds: -1.5 })
  })
})

describe('raceText', () => {
  it('prefers real sentences and falls back to words with a small pool', () => {
    const full = raceText(poolOf('abcdefghijklmnopqrstuvwxyzñáéíóúü,.ABCDEFGHIJKLMNOPQRSTUVWXYZÑ¿?¡!'), makeRng(1))
    expect(full).toMatch(/[.?!]/)
    expect(full.length).toBeGreaterThan(40)
    const small = raceText(poolOf('fjdk'), makeRng(1))
    expect(small.length).toBeGreaterThan(20)
    expect(small).not.toMatch(/[.?!]/)
  })
})
```

- [x] **Step 2: Correr y ver que falla**

Run: `npm test -- src/engine/games/race`
Expected: FAIL.

- [x] **Step 3: Implementar**

`src/engine/games/race.ts`:

```ts
import { sentencesText, wordsText, type Rng } from '../generator'
import { daysBetween, sessionDay } from '../stats'

/** The ghost runs at the best reference session of the last 7 days, or at the goal when there is none. */
export function ghostWpm(sessions: readonly { at: string; wpm: number; reference?: true }[], today: string, fallback: number): number {
  let best = 0
  for (const s of sessions) {
    if (!s.reference) continue
    const gap = daysBetween(sessionDay(s), today)
    if (gap < 0 || gap > 6) continue
    best = Math.max(best, s.wpm)
  }
  return best > 0 ? best : fallback
}

/** Three real sentences when the pool allows them, otherwise a run of real words. */
export function raceText(pool: ReadonlySet<string>, rng: Rng): string {
  return sentencesText(pool, 3, { rng }) || wordsText(pool, 24, { rng })
}

/** Characters the ghost has covered after `elapsedMs`. */
export function ghostPos(elapsedMs: number, wpm: number, length: number): number {
  return Math.min(length, (elapsedMs / 1000) * ((wpm * 5) / 60))
}

export function ghostFinishMs(wpm: number, length: number): number {
  return (length / ((wpm * 5) / 60)) * 1000
}

/** Who got to the flag first, and by how many seconds (negative when the ghost won). */
export function raceOutcome(playerMs: number, wpm: number, length: number): { won: boolean; marginSeconds: number } {
  const g = ghostFinishMs(wpm, length)
  return { won: playerMs < g, marginSeconds: Math.round(((g - playerMs) / 1000) * 10) / 10 }
}
```

`index.ts`: `export * from './race'`.

- [x] **Step 4: Verificar y commitear**

Run: `npm test -- src/engine/games`
Expected: PASS.

```bash
git add src/engine/games
git commit -m "feat(engine): race ghost (best recent Reto), text and outcome"
```

---

### Task 5: `useHiddenInput` compartido

**Files:**
- Create: `src/app/hooks/useHiddenInput.ts`
- Modify: `src/app/components/TypingArea.tsx`

**Interfaces:**
- Produces: `useHiddenInput({ onText, onEscape?, autoFocus?, focusKey? }) → { inputProps, focused, focus }`; `inputProps` se esparce sobre un `<input>`.

- [x] **Step 1: El hook**

`src/app/hooks/useHiddenInput.ts`:

```ts
import { useCallback, useEffect, useRef, useState, type CompositionEvent, type FormEvent, type InputHTMLAttributes, type KeyboardEvent, type RefObject } from 'react'

interface Options {
  onText: (text: string) => void
  onEscape?: () => void
  /** Focus the input when mounted and whenever `focusKey` changes. */
  autoFocus?: boolean
  focusKey?: unknown
}

export interface HiddenInput {
  inputProps: InputHTMLAttributes<HTMLInputElement> & { ref: RefObject<HTMLInputElement | null> }
  focused: boolean
  focus: () => void
}

/**
 * Keystroke capture through a hidden <input>, so dead keys (´ + a → á) and IMEs compose like in any
 * text field. Listens to input/compositionend, not keydown; keydown only handles Escape and blocks Enter/Backspace.
 */
export function useHiddenInput({ onText, onEscape, autoFocus = true, focusKey }: Options): HiddenInput {
  const inputRef = useRef<HTMLInputElement>(null)
  const [focused, setFocused] = useState(false)
  const composing = useRef(false)
  // Some browsers fire compositionend and then an input event for the same text.
  const lastComposed = useRef<{ data: string; at: number } | null>(null)

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus()
  }, [autoFocus, focusKey])

  const onInput = useCallback(
    (e: FormEvent<HTMLInputElement>) => {
      const native = e.nativeEvent as InputEvent
      const el = e.currentTarget
      if (composing.current || native.inputType === 'insertCompositionText') return
      if (native.inputType === 'insertText' || native.inputType === 'insertFromPaste' || native.inputType === undefined) {
        const data = native.data ?? el.value
        const dup = lastComposed.current && lastComposed.current.data === data && performance.now() - lastComposed.current.at < 60
        if (native.inputType !== 'insertFromPaste' && !dup) onText(data)
      }
      el.value = ''
    },
    [onText],
  )

  const onCompositionEnd = useCallback(
    (e: CompositionEvent<HTMLInputElement>) => {
      composing.current = false
      if (e.data) {
        lastComposed.current = { data: e.data, at: performance.now() }
        onText(e.data)
      }
      e.currentTarget.value = ''
    },
    [onText],
  )

  const onKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onEscape?.()
      }
      if (e.key === 'Enter' || e.key === 'Backspace') e.preventDefault()
    },
    [onEscape],
  )

  const focus = useCallback(() => inputRef.current?.focus(), [])

  return {
    inputProps: {
      ref: inputRef,
      className: 'absolute h-px w-px opacity-0',
      style: { left: 0, top: 0 },
      autoCapitalize: 'off',
      autoComplete: 'off',
      autoCorrect: 'off',
      spellCheck: false,
      'aria-label': 'Escribí el texto',
      onInput,
      onCompositionStart: () => {
        composing.current = true
      },
      onCompositionEnd,
      onKeyDown,
      onFocus: () => setFocused(true),
      onBlur: () => setFocused(false),
    },
    focused,
    focus,
  }
}
```

- [x] **Step 2: `TypingArea` usa el hook**

Reemplazar todo lo que va desde `const inputRef = useRef<HTMLInputElement>(null)` hasta `const focus = () => inputRef.current?.focus()` (inclusive) por:

```ts
  const { inputProps, focused, focus } = useHiddenInput({ onText: onInput, onEscape: onRestart, autoFocus, focusKey: state.target })
```

el `<input …/>` completo por:

```tsx
      <input {...inputProps} />
```

y el import de React por `import type { TypingState } from '@/engine/typing'` + `import { useHiddenInput } from '../hooks/useHiddenInput'` (borrar `useCallback, useEffect, useRef, useState` y los tipos de eventos que quedaron sin uso).

- [x] **Step 3: Verificar (unitarios + los e2e que tipean)**

Run: `npx tsc -b && npm run lint && npm test && npx playwright test e2e/flow.spec.ts`
Expected: PASS, incluido `dead keys compose accented letters through the hidden input`.

```bash
git add src/app/hooks/useHiddenInput.ts src/app/components/TypingArea.tsx
git commit -m "refactor: hidden-input capture as a hook shared by the typing area and games"
```

---

### Task 6: meta de juegos, `Game`, `gameSession`, `GameResults` para Globos y Carrera, `Path`

**Files:**
- Create: `src/app/components/games/meta.ts`, `src/app/components/games/Game.tsx`, `src/app/lib/gameSession.ts`
- Modify: `src/app/components/games/types.ts`, `src/app/components/games/GameResults.tsx`, `src/app/routes/Path.tsx`

**Interfaces:**
- Produces: `GAME_META: Record<GameId, { title; blurb; glyph; variant: KeycapVariant }>`; `<Game id {...GameProps} />`; `gameSession(r: GameResult): Omit<SessionRecord, 'at'>`; `GameProps.ghostWpm?: number`, `GameProps.patterns?: string[]`.
- Consumes: `BalloonsGame`/`RaceGame` (Tasks 7–8): `Game.tsx` los importa; hasta que existan, dejar los dos `case` devolviendo `<RainGame …/>` con un `// TODO(juegos-2)` **no** — en su lugar crear los dos archivos vacíos-funcionales en esta misma tarea (Step 1) y rellenarlos en las Tasks 7 y 8.

- [x] **Step 1: Tipos y meta**

`types.ts`, agregar a `GameProps`:

```ts
  /** Carrera: what the ghost runs at (best recent Reto, or the goal). */
  ghostWpm?: number
  /** Globos: only words containing one of these (Patrones). */
  patterns?: string[]
```

`meta.ts`:

```ts
import type { GameId } from '@/engine/curriculum'
import type { KeycapVariant } from '../Keycap'

export interface GameMeta {
  title: string
  blurb: string
  glyph: string
  variant: KeycapVariant
}

export const GAME_META: Record<GameId, GameMeta> = {
  rain: { title: 'Lluvia de teclas', blurb: 'Reflejo: atrapá cada tecla antes de que caiga al agua.', glyph: '▼', variant: 'coral' },
  rhythm: { title: 'Al compás', blurb: 'Ritmo: tocá cada tecla justo cuando entra en la zona.', glyph: '♪', variant: 'lav' },
  balloons: { title: 'Globos de palabras', blurb: 'Palabras enteras, de corrido, antes de que se escapen.', glyph: '○', variant: 'secondary' },
  race: { title: 'Carrera contra tu fantasma', blurb: 'Frases reales contra tu mejor Reto.', glyph: '⚑', variant: 'primary' },
}
```

Esqueletos (se completan en las Tasks 7 y 8) — `BalloonsGame.tsx`:

```tsx
import type { GameProps } from './types'

export function BalloonsGame(_props: GameProps) {
  return null
}
```

`RaceGame.tsx`: igual con `RaceGame`.

`Game.tsx`:

```tsx
import type { GameId } from '@/engine/curriculum'
import { BalloonsGame } from './BalloonsGame'
import { RaceGame } from './RaceGame'
import { RainGame } from './RainGame'
import { RhythmGame } from './RhythmGame'
import type { GameProps } from './types'

/** The game component for a lesson or free-play id. */
export function Game({ id, ...props }: GameProps & { id: GameId }) {
  switch (id) {
    case 'rain':
      return <RainGame {...props} />
    case 'rhythm':
      return <RhythmGame {...props} />
    case 'balloons':
      return <BalloonsGame {...props} />
    case 'race':
      return <RaceGame {...props} />
  }
}
```

- [x] **Step 2: `gameSession`**

`src/app/lib/gameSession.ts`:

```ts
import type { GameResult } from '@/engine/games'
import type { SessionRecord } from '../store'

/** What a finished game records: Carrera counts as reference speed; Al compás reports its on-time share as rhythm. */
export function gameSession(r: GameResult): Omit<SessionRecord, 'at'> {
  return {
    kind: 'game',
    gameId: r.gameId,
    wpm: r.typing?.wpm ?? 0,
    acc: r.accuracy,
    chars: r.hits,
    errors: r.wrong,
    seconds: r.seconds,
    ...(r.gameId === 'race' && { reference: true as const }),
    ...(r.gameId === 'rhythm' && { rhythm: r.detail.onTime }),
    ...(r.typing?.rhythm !== undefined && { rhythm: r.typing.rhythm }),
  }
}
```

- [x] **Step 3: `GameResults` — vistas nuevas**

Agregar en `view()` de `GameResults.tsx`:

```ts
    case 'balloons': {
      const escaped = r.detail.escaped ?? 0
      return {
        headline: ['Terminado. Palabra por palabra, mañana salen más.', 'Buen ojo. Un poco más de calma y son tres.', 'Ni un globo se escapó.'],
        stats: [
          { label: 'Puntos', value: r.score, tone: 'enter' },
          { label: 'Globos', value: r.detail.popped ?? 0 },
          { label: 'Escapados', value: escaped, tone: escaped === 0 ? 'enter' : 'esc' },
          { label: 'Precisión', value: pct(r.accuracy), tone: r.accuracy >= 0.97 ? 'enter' : r.accuracy >= 0.95 ? 'ink' : 'esc' },
        ],
        footnote: `Mejor racha: ${r.bestCombo} palabras seguidas. Tres estrellas con 97 % de precisión y ningún globo escapado.`,
      }
    }
    case 'race': {
      const won = r.detail.won === 1
      const margin = Math.abs(r.detail.marginSeconds ?? 0)
      return {
        headline: ['Llegaste. La precisión primero: el fantasma espera.', won ? 'Le ganaste, pero con errores. Limpio y son tres.' : `Te faltaron ${margin} s. Mañana lo alcanzás.`, `Le ganaste por ${margin} s.`],
        stats: [
          { label: 'Vos', value: r.detail.wpm ?? 0, tone: won ? 'enter' : 'ink' },
          { label: 'Fantasma', value: r.detail.ghostWpm ?? 0 },
          { label: 'Precisión', value: pct(r.accuracy), tone: r.accuracy >= 0.97 ? 'enter' : r.accuracy >= 0.95 ? 'ink' : 'esc' },
          { label: 'Errores', value: r.wrong, tone: r.wrong === 0 ? 'enter' : 'ink' },
        ],
        footnote: won ? 'El fantasma corre a tu mejor Reto de la semana: la próxima va más rápido.' : 'El fantasma corre a tu mejor Reto de la semana (o a la meta de la unidad).',
      }
    }
```

- [x] **Step 4: `Path` usa `GAME_META`**

En `Path.tsx`: borrar `const GAME_GLYPH …`, importar `import { GAME_META } from '../components/games/meta'` y usar `GAME_META[l.game ?? 'rain'].glyph`. Quitar `type GameId` del import de curriculum si quedó sin uso.

- [x] **Step 5: Verificar y commitear**

Run: `npx tsc -b && npm run lint && npm test`
Expected: PASS, 4 advertencias de lint como antes.

```bash
git add src/app/components/games src/app/lib/gameSession.ts src/app/routes/Path.tsx
git commit -m "feat(games): game meta, Game switch, session mapping and result views for balloons and race"
```

---

### Task 7: `BalloonsGame`

**Files:**
- Rewrite: `src/app/components/games/BalloonsGame.tsx`
- Create: `e2e/balloons.spec.ts`

**Interfaces:**
- Consumes: reducer de la Task 3, `useHiddenInput`, `Mascot`/`moods`, `GameProps.patterns`, `weak`.
- Produces: DOM para e2e — cada globo vivo lleva `data-balloon`, `data-word`, `data-typed`; el activo además `data-active="1"`.

- [x] **Step 1: El componente**

```tsx
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { makeRng } from '@/engine/generator'
import {
  alive,
  balloonWords,
  escape,
  pickColumn,
  pickWord,
  prune,
  samplesFrom,
  shouldSpawn,
  spawn,
  startBalloons,
  typeChar,
  COLUMNS,
  type BalloonRound,
  type KeyEvent,
} from '@/engine/games'
import { Keycap } from '../Keycap'
import { useHiddenInput } from '../../hooks/useHiddenInput'
import { chime, click, thud } from '../../lib/sound'
import { Mascot } from './Mascot'
import { hitMood, missMood, MOOD_MS, type Mood } from './moods'
import type { GameProps } from './types'

const GROUND = 34
const BALLOON_H = 92
const POP_MS = 320

interface Pop {
  id: number
  x: number
  y: number
  at: number
}

/**
 * Globos de palabras: words drift up; the first letter typed locks the oldest balloon that starts with it,
 * the rest of the word pops it. Reaching the top costs a life. The round state lives in the engine.
 */
export function BalloonsGame({ layout, pool, weak = [], patterns, sound = true, durationMs = 45_000, onFinish }: GameProps) {
  void layout
  const rng = useRef(makeRng())
  const words = useMemo(() => balloonWords(pool, makeRng(), patterns), [pool, patterns])
  const field = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ w: 800, h: 420 })
  const [phase, setPhase] = useState<'ready' | 'playing' | 'done'>('ready')
  const [, setFrame] = useState(0)

  const round = useRef<BalloonRound>(startBalloons())
  const startedAt = useRef(0)
  const lastKeyAt = useRef<number | null>(null)
  const events = useRef<KeyEvent[]>([])
  const pops = useRef<Pop[]>([])
  const mood = useRef<{ mood: Mood; at: number }>({ mood: 'idle', at: 0 })
  const missStreak = useRef(0)
  const shake = useRef(-1000)
  const nextId = useRef(1)
  const finished = useRef(false)

  useEffect(() => {
    const el = field.current
    if (!el) return
    const update = () => setSize({ w: el.clientWidth, h: el.clientHeight })
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const scale = Math.min(1.5, Math.max(1, size.h / 420))
  const columnX = (column: number) => ((column + 0.5) / COLUMNS) * size.w
  /** Top of a balloon: it starts just above the ground and rises at its own speed. */
  const balloonY = (bornAt: number, speed: number, now: number) => size.h - GROUND - BALLOON_H * scale - ((now - bornAt) * speed * scale) / 1000
  const setMood = (m: Mood, now: number) => {
    mood.current = { mood: m, at: now }
  }

  const finish = useCallback(() => {
    if (finished.current) return
    finished.current = true
    setPhase('done')
    if (sound) chime()
    const r = round.current
    onFinish({
      gameId: 'balloons',
      score: r.score,
      hits: r.hits,
      misses: r.escaped,
      wrong: r.wrong,
      bestCombo: r.bestCombo,
      seconds: (performance.now() - startedAt.current) / 1000,
      accuracy: r.hits + r.wrong ? r.hits / (r.hits + r.wrong) : 0,
      detail: { popped: r.popped, escaped: r.escaped },
      typing: { wpm: 0, samples: samplesFrom(events.current) },
    })
  }, [onFinish, sound])

  // Main loop: spawn, detect escapes, animate.
  useEffect(() => {
    if (phase !== 'playing') return
    let raf = 0
    const loop = () => {
      const now = performance.now() - startedAt.current
      if (now >= durationMs) {
        finish()
        return
      }
      let r = round.current
      if (shouldSpawn(r, now)) {
        const word = pickWord(words, r, weak, rng.current)
        if (word) r = spawn(r, word, pickColumn(r, now, rng.current), now)
      }
      const gone = alive(r).filter((b) => balloonY(b.bornAt, b.speed, now) < -BALLOON_H * scale)
      if (gone.length) {
        r = escape(r, gone.map((b) => b.id), now)
        missStreak.current += gone.length
        setMood(missMood(missStreak.current), now)
        shake.current = now
        if (sound) thud()
      }
      r = prune(r, now)
      round.current = r
      pops.current = pops.current.filter((p) => now - p.at < 650)
      if (mood.current.mood !== 'idle' && now - mood.current.at > MOOD_MS[mood.current.mood]) mood.current = { mood: 'idle', at: now }
      if (r.lives <= 0) {
        finish()
        return
      }
      setFrame((f) => f + 1)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, durationMs, words, weak, finish, sound, size.h, size.w])

  const onText = useCallback(
    (text: string) => {
      if (phase !== 'playing') return
      const now = performance.now() - startedAt.current
      for (const ch of text) {
        const out = typeChar(round.current, ch, now)
        const latency = lastKeyAt.current === null ? undefined : Math.min(2000, now - lastKeyAt.current)
        lastKeyAt.current = now
        if (out.expected !== null) events.current.push({ expected: out.expected, correct: out.outcome !== 'wrong', latency })
        if (out.outcome === 'wrong') {
          missStreak.current++
          setMood(missMood(missStreak.current), now)
          shake.current = now
          if (sound) thud()
        } else {
          missStreak.current = 0
          if (sound) click()
          if (out.outcome === 'pop') {
            const b = round.current.balloons.find((x) => x.id === round.current.active) ?? out.round.balloons.find((x) => x.goneAt === now)
            if (b) pops.current.push({ id: nextId.current++, x: columnX(b.column), y: balloonY(b.bornAt, b.speed, now) + (BALLOON_H * scale) / 2, at: now })
            setMood(hitMood(out.round.combo), now)
          }
        }
        round.current = out.round
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [phase, sound, size.h, size.w],
  )
  const { inputProps, focused, focus } = useHiddenInput({ onText, autoFocus: phase === 'playing', focusKey: phase })

  const start = () => {
    round.current = startBalloons()
    rng.current = makeRng()
    events.current = []
    pops.current = []
    lastKeyAt.current = null
    mood.current = { mood: 'idle', at: 0 }
    missStreak.current = 0
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
  const remaining = phase === 'playing' ? Math.max(0, Math.ceil((durationMs - now) / 1000)) : Math.round(durationMs / 1000)
  const shaking = now - shake.current < 220

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3 px-1 text-sm font-bold text-ink-mute">
        <span className="flex items-center gap-3">
          <span>
            <span className="font-display text-2xl text-ink">{r.score}</span> puntos
          </span>
          {r.combo >= 3 && <span className="rounded-full bg-sun-soft px-2 py-0.5 text-xs font-black text-sun-edge">racha ×{r.combo}</span>}
        </span>
        <span className="flex items-center gap-1.5" aria-label={`${r.lives} vidas`}>
          {Array.from({ length: 3 }, (_, i) => (
            <svg key={i} width="20" height="18" viewBox="0 0 20 18" aria-hidden="true">
              <path
                d="M10 17 L2.2 9.3 A4.4 4.4 0 0 1 8.4 3.1 L10 4.7 L11.6 3.1 A4.4 4.4 0 0 1 17.8 9.3 Z"
                fill={i < r.lives ? 'var(--color-esc)' : 'var(--color-paper-deep)'}
                stroke={i < r.lives ? 'var(--color-esc-edge)' : 'var(--color-line)'}
                strokeWidth="1.5"
              />
            </svg>
          ))}
        </span>
        <span className="keycap keycap-sm font-display text-xl tabular-nums">0:{String(remaining).padStart(2, '0')}</span>
      </div>

      <div
        ref={field}
        className={`card game-field relative overflow-hidden ${shaking ? 'animate-shake' : ''}`}
        style={{ background: 'linear-gradient(180deg, var(--color-mod-soft), var(--color-keycap) 70%)' }}
        onMouseDown={(e) => {
          e.preventDefault()
          focus()
        }}
      >
        <input {...inputProps} />

        {r.balloons.map((b) => {
          const y = balloonY(b.bornAt, b.speed, Math.min(now, b.goneAt ?? now))
          const active = r.active === b.id
          const escaping = b.goneAt === null && y < 70
          const popped = b.how === 'popped'
          return (
            <div
              key={b.id}
              className="absolute flex flex-col items-center"
              style={{
                left: columnX(b.column),
                top: y,
                transform: `translateX(-50%) scale(${scale * (active ? 1.12 : 1)})`,
                transformOrigin: 'top center',
                opacity: b.goneAt !== null ? 0 : escaping ? 0.55 : 1,
                transition: b.goneAt !== null ? `opacity ${POP_MS}ms ease-out, transform ${POP_MS}ms ease-out` : 'transform 120ms ease-out',
                ...(popped && { transform: `translateX(-50%) scale(${scale * 1.5})` }),
              }}
              data-balloon={b.goneAt === null ? '1' : undefined}
              data-word={b.goneAt === null ? b.word : undefined}
              data-typed={b.goneAt === null ? b.typed : undefined}
              data-active={active && b.goneAt === null ? '1' : undefined}
            >
              <span
                className={`relative rounded-full border bg-keycap px-3.5 py-1.5 font-body text-lg font-bold tracking-wide whitespace-nowrap ${active ? 'border-enter shadow-[0_0_0_4px_var(--color-enter-soft)]' : escaping ? 'border-dashed border-line' : 'border-line'}`}
              >
                <span className="text-enter-edge">{b.word.slice(0, b.typed)}</span>
                <span className={active ? 'underline decoration-sun decoration-[3px] underline-offset-4' : ''}>{b.word[b.typed] ?? ''}</span>
                <span>{b.word.slice(b.typed + 1)}</span>
                <span className="absolute bottom-[-7px] left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border-r border-b border-line bg-keycap" />
              </span>
              <span className="mt-2 h-6 w-px bg-ink-mute opacity-60" />
              <span className="h-2 w-3.5 rounded-b-md bg-sun-edge" />
            </div>
          )
        })}

        {pops.current.map((p) => (
          <div key={p.id} className="pointer-events-none absolute" style={{ left: p.x, top: p.y }}>
            {Array.from({ length: 8 }, (_, i) => {
              const a = (i / 8) * Math.PI * 2
              return (
                <span
                  key={i}
                  className="rain-particle"
                  style={{ ['--dx' as string]: `${Math.cos(a) * 52}px`, ['--dy' as string]: `${Math.sin(a) * 52 - 10}px`, background: 'var(--color-enter)' }}
                />
              )
            })}
            <span className="absolute -translate-x-1/2 -translate-y-1/2 font-display text-lg font-extrabold text-enter-edge">+</span>
          </div>
        ))}

        <div className="absolute inset-x-0 bottom-0 bg-paper-deep" style={{ height: GROUND }} />
        <div className="absolute right-4" style={{ bottom: GROUND + 8 }}>
          <Mascot mood={mood.current.mood} combo={r.combo} size={Math.round(64 * scale)} />
        </div>

        {phase === 'playing' && !focused && (
          <button type="button" onClick={focus} className="absolute inset-0 grid place-items-center bg-paper/70 font-bold text-ink-soft backdrop-blur-[2px]">
            Hacé clic acá y seguí escribiendo
          </button>
        )}

        {phase === 'ready' && (
          <div className="absolute inset-0 grid place-items-center bg-paper/70 backdrop-blur-[2px]">
            <div className="max-w-md text-center">
              <h2 className="text-3xl">Globos de palabras</h2>
              <p className="mt-2 text-ink-soft">
                Suben globos con palabras. Tipeá la primera letra para elegir uno y seguí hasta el final: explota. Si llega al techo, perdés una vida. Tres vidas, {Math.round(durationMs / 1000)} segundos.
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

Notas para quien implementa: `typing.wpm` es 0 (Globos no mide velocidad) pero `samples` alimenta el Repaso; `data-*` solo en globos vivos. El `pop` toma el globo que acaba de irse (`goneAt === now`).

- [x] **Step 2: Typecheck, lint, probar a mano**

Run: `npx tsc -b && npm run lint`
Expected: sin errores; si el lint marca `void layout`, borrar `layout` de la desestructuración (`{ pool, weak = [], patterns, sound = true, durationMs = 45_000, onFinish }`) y dejar `layout` sin usar en la prop.

Probar en `http://localhost:5173/leccion/superior-juego-fila-superior` (sembrar `superior-unit-review` hecho, como en el e2e).

- [x] **Step 3: e2e**

`e2e/balloons.spec.ts`:

```ts
import { expect, test } from '@playwright/test'

test('balloons game: type whole words, pop them, finish with stars and key samples', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => {
    const done = { stars: 3, bestWpm: 30, bestAcc: 1, attempts: 1, completedAt: '2026-01-01T00:00:00Z' }
    localStorage.setItem(
      'typelight.v1',
      JSON.stringify({
        state: {
          settings: { name: 'Seba', layoutId: 'latam', sound: false, showHands: true, onboarded: true, theme: 'auto' },
          lessons: { 'superior-unit-review': done },
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
  await page.goto('/leccion/superior-juego-fila-superior?dur=6000')
  await expect(page.getByRole('heading', { name: 'Globos de palabras', exact: true })).toBeVisible()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('heading', { name: 'Globos de palabras', exact: true })).toBeHidden()

  // Play: type the next letter of the active balloon, or start the oldest one.
  const deadline = Date.now() + 8000
  let shot = false
  while (Date.now() < deadline) {
    const next = await page.evaluate(() => {
      const active = document.querySelector<HTMLElement>('[data-active="1"]')
      const target = active ?? document.querySelector<HTMLElement>('[data-balloon="1"]')
      if (!target) return null
      return target.dataset.word![Number(target.dataset.typed)] ?? null
    })
    if (next) {
      await page.keyboard.type(next)
      if (!shot) {
        shot = true
        await page.waitForTimeout(200)
        await page.screenshot({ path: 'e2e/screens/balloons-play.png' })
      }
    }
    await page.waitForTimeout(60)
    if (await page.getByText('Juego terminado').isVisible()) break
  }
  await expect(page.getByText('Juego terminado')).toBeVisible()
  await expect(page.getByText('Escapados')).toBeVisible()
  const state = await page.evaluate(() => JSON.parse(localStorage.getItem('typelight.v1')!).state)
  expect(state.lessons['superior-juego-fila-superior'].stars).toBeGreaterThanOrEqual(1)
  const last = state.sessions[state.sessions.length - 1]
  expect(last).toMatchObject({ kind: 'game', gameId: 'balloons' })
  expect(Object.keys(state.keys).length).toBeGreaterThan(0)
  await page.screenshot({ path: 'e2e/screens/balloons-results.png' })
})
```

`LessonPlayer` todavía no graba `samples` (Task 9): este e2e pasa recién después de la Task 9. Correrlo ahí.

```bash
git add src/app/components/games/BalloonsGame.tsx e2e/balloons.spec.ts
git commit -m "feat(games): Globos de palabras — lock a balloon by its initial, type the word, pop it"
```

---

### Task 8: `RaceGame`

**Files:**
- Rewrite: `src/app/components/games/RaceGame.tsx`
- Create: `e2e/race.spec.ts`

**Interfaces:**
- Consumes: `raceText`, `ghostPos`, `raceOutcome`; `useTypingSession`, `TypingArea`; `metrics`, `rhythm`, `keySamples`; `GameProps.ghostWpm`.
- Produces: la frase se renderiza con `.type-char` (el e2e la lee como en `flow.spec.ts`).

- [x] **Step 1: El componente**

```tsx
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { makeRng, poolOf } from '@/engine/generator'
import { ghostPos, raceOutcome, raceText } from '@/engine/games'
import { keySamples, metrics, rhythm, type TypingState } from '@/engine/typing'
import { TypingArea } from '../TypingArea'
import { useTypingSession } from '../../hooks/useTypingSession'
import { Mascot } from './Mascot'
import { hitMood, missMood, MOOD_MS, type Mood } from './moods'
import type { GameProps } from './types'

/**
 * Carrera contra tu fantasma: three real sentences; your car moves with every correct character, the ghost
 * at a steady speed (your best Reto of the week, or the unit goal). Errors stop you, not the ghost.
 */
export function RaceGame({ pool, goalWpm, ghostWpm = goalWpm, sound = true, onFinish }: GameProps) {
  const text = useMemo(() => raceText(poolOf(pool), makeRng()), [pool])
  const length = text.length
  const [, setFrame] = useState(0)
  const mood = useRef<{ mood: Mood; at: number }>({ mood: 'idle', at: 0 })
  const missStreak = useRef(0)
  const lastErrors = useRef(0)
  const finished = useRef(false)

  const handleFinish = useCallback(
    (state: TypingState) => {
      if (finished.current) return
      finished.current = true
      const m = metrics(state)
      const outcome = raceOutcome(m.seconds * 1000, ghostWpm, length)
      onFinish({
        gameId: 'race',
        score: outcome.won ? 100 + Math.round(outcome.marginSeconds * 10) : 40,
        hits: m.correct,
        misses: 0,
        wrong: m.errors,
        bestCombo: 0,
        seconds: m.seconds,
        accuracy: m.accuracy,
        detail: { won: outcome.won ? 1 : 0, marginSeconds: outcome.marginSeconds, wpm: m.wpm, ghostWpm },
        typing: { wpm: m.wpm, rhythm: rhythm(state), samples: [...keySamples(state).values()] },
      })
    },
    [ghostWpm, length, onFinish],
  )
  const session = useTypingSession(text, { sound, onFinish: handleFinish })
  const { state } = session

  // Smooth ghost while the race is on.
  useEffect(() => {
    if (state.startedAt === null || state.finishedAt !== null) return
    let raf = 0
    const loop = () => {
      setFrame((f) => f + 1)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [state.startedAt, state.finishedAt])

  // Mascot: errors escalate, correct keys calm it down.
  const now = performance.now()
  if (state.keystrokes.length) {
    const errors = state.keystrokes.filter((k) => !k.correct).length
    if (errors !== lastErrors.current) {
      lastErrors.current = errors
      missStreak.current++
      mood.current = { mood: missMood(missStreak.current), at: now }
    } else if (state.keystrokes[state.keystrokes.length - 1].correct && mood.current.mood !== 'happy' && mood.current.mood !== 'thrilled' && now - mood.current.at > MOOD_MS[mood.current.mood]) {
      missStreak.current = 0
      const streak = state.keystrokes.length - state.keystrokes.findLastIndex((k) => !k.correct) - 1
      mood.current = { mood: hitMood(streak >= 10 ? 10 : 0), at: now }
    }
  }
  if (mood.current.mood !== 'idle' && now - mood.current.at > MOOD_MS[mood.current.mood]) mood.current = { mood: 'idle', at: now }

  const elapsed = state.startedAt === null ? 0 : (state.finishedAt ?? now) - state.startedAt
  const ghost = ghostPos(elapsed, ghostWpm, length) / length
  const player = state.pos / length
  const live = session.live
  const ghostAhead = ghost > player + 0.02

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3 px-1 text-sm font-bold text-ink-mute">
        <span>
          <span className="font-display text-2xl text-ink tabular-nums">{live.wpm}</span> PPM · <span className={live.accuracy < 0.95 ? 'text-esc-edge' : 'text-ink'}>{Math.round(live.accuracy * 100)} %</span> precisión
        </span>
        <span>
          Fantasma a <span className="font-display text-xl text-ink tabular-nums">{ghostWpm}</span> PPM · {ghostWpm === goalWpm ? 'la meta de la unidad' : 'tu mejor Reto de la semana'}
        </span>
        <span className="keycap keycap-sm font-display text-xl tabular-nums">
          {Math.floor(elapsed / 60000)}:{String(Math.floor((elapsed / 1000) % 60)).padStart(2, '0')}
        </span>
      </div>

      <div className="card game-field relative overflow-hidden" style={{ background: 'linear-gradient(var(--color-keycap), var(--color-paper))' }}>
        {/* lanes */}
        {[
          { who: 'vos', at: player, top: '18%', you: true },
          { who: 'fantasma', at: ghost, top: '40%', you: false },
        ].map((lane) => (
          <div key={lane.who} className="absolute right-6 left-6 h-14 rounded-2xl bg-paper-deep" style={{ top: lane.top }}>
            <span className="absolute -top-5 left-3 text-[11px] font-bold tracking-widest text-ink-mute uppercase">{lane.who}</span>
            <span className="absolute top-1/2 right-3 left-3 border-t-2 border-dashed border-line" />
            <span
              className={`absolute top-2 flex h-10 items-center gap-2 rounded-xl border px-3 font-display text-sm font-extrabold transition-[left] duration-100 ${lane.you ? 'border-enter bg-enter-soft text-enter-edge' : 'border-transparent bg-mod/30 text-ink-soft'}`}
              style={{ left: `calc(12px + ${lane.at} * (100% - 120px))` }}
            >
              ⌨ {lane.you ? 'vos' : `${ghostWpm} PPM`}
            </span>
          </div>
        ))}
        <div className="absolute top-[14%] right-8 h-[38%] border-l-[3px] border-ink-mute">
          <span className="absolute -top-0.5 left-0 h-4 w-6 border border-ink-mute" style={{ background: 'repeating-conic-gradient(var(--color-ink) 0 25%, var(--color-keycap) 0 50%) 0 0 / 8px 8px' }} />
        </div>

        {/* the sentence */}
        <div className="absolute right-6 bottom-6 left-6 rounded-2xl bg-keycap/80 p-5">
          <TypingArea state={state} onInput={session.input} onRestart={() => session.restart()} />
        </div>

        <div className="absolute top-[58%] right-6">
          <Mascot mood={ghostAhead && mood.current.mood === 'idle' ? 'worried' : mood.current.mood} combo={0} />
        </div>
      </div>
    </div>
  )
}
```

`Array.prototype.findLastIndex` existe en `lib: ES2023`; si `tsc` se queja, reemplazar por un `for` descendente.

- [x] **Step 2: Typecheck, lint, probar a mano**

Run: `npx tsc -b && npm run lint`
Expected: sin errores.

Probar en `http://localhost:5173/leccion/mayusculas-juego-mayusculas` (sembrar `mayusculas-unit-review` hecho).

- [x] **Step 3: e2e**

`e2e/race.spec.ts`:

```ts
import { expect, test, type Page } from '@playwright/test'

async function remaining(page: Page): Promise<string> {
  return page.evaluate(() =>
    [...document.querySelectorAll('.type-char')]
      .filter((s) => !s.classList.contains('is-done'))
      .map((s) => (s.classList.contains('is-space') || s.textContent === '\u00a0' || s.textContent === '' ? ' ' : s.textContent))
      .join(''),
  )
}

test('race game: beat the ghost, record a reference session', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => {
    const done = { stars: 3, bestWpm: 30, bestAcc: 1, attempts: 1, completedAt: '2026-01-01T00:00:00Z' }
    localStorage.setItem(
      'typelight.v1',
      JSON.stringify({
        state: {
          settings: { name: 'Seba', layoutId: 'latam', sound: false, showHands: true, onboarded: true, theme: 'auto' },
          lessons: { 'mayusculas-unit-review': done },
          keys: {},
          sessions: [{ at: new Date().toISOString(), kind: 'challenge', wpm: 25, acc: 0.98, chars: 120, errors: 2, seconds: 60, reference: true }],
          days: {},
          streak: { count: 0, lastDay: null },
          routine: { day: '2000-01-01', warmup: false, lesson: false, review: false, challenge: false },
        },
        version: 2,
      }),
    )
  })
  await page.goto('/leccion/mayusculas-juego-mayusculas')
  await expect(page.getByText(/Fantasma a 25 PPM/)).toBeVisible()
  await expect(page.locator('.type-char.is-current')).toBeVisible()
  await page.keyboard.type(await remaining(page), { delay: 10 })
  await expect(page.getByText('Juego terminado')).toBeVisible()
  await expect(page.getByText(/Le ganaste por/)).toBeVisible()
  const state = await page.evaluate(() => JSON.parse(localStorage.getItem('typelight.v1')!).state)
  expect(state.lessons['mayusculas-juego-mayusculas'].stars).toBe(3)
  const last = state.sessions[state.sessions.length - 1]
  expect(last).toMatchObject({ kind: 'game', gameId: 'race', reference: true })
  expect(last.wpm).toBeGreaterThan(25)
  await page.screenshot({ path: 'e2e/screens/race-results.png' })
})
```

Pasa después de la Task 9 (que graba `reference` vía `gameSession`).

```bash
git add src/app/components/games/RaceGame.tsx e2e/race.spec.ts
git commit -m "feat(games): Carrera contra tu fantasma — real sentences against your best recent Reto"
```

---

### Task 9: `LessonPlayer` usa `Game` + `gameSession`; Jugar libre (`Play.tsx`, ruta, fila en Inicio)

**Files:**
- Modify: `src/app/routes/LessonPlayer.tsx`, `src/app/routes/Home.tsx`, `src/main.tsx`
- Create: `src/app/routes/Play.tsx`, `e2e/play.spec.ts`

- [x] **Step 1: `LessonPlayer`**

Imports: reemplazar `import { RainGame } …` y `import { RhythmGame } …` por `import { Game } from '../components/games/Game'`; agregar `import { gameSession } from '../lib/gameSession'`, `import { ghostWpm } from '@/engine/games'` (sumar al import existente de `@/engine/games`), `dayKey` al import de `@/engine/stats`. Selector: `const sessions = useStore((s) => s.sessions)`.

`onGameFinish`: reemplazar el `recordSession({...})` por:

```ts
      recordSession(gameSession(r), r.typing?.samples)
```

`gameProps`: agregar

```ts
      ghostWpm: ghostWpm(sessions, dayKey(), lesson.goalWpm),
      patterns: lesson.patterns,
```

y el render:

```tsx
        <Game key={String(gameResult === null)} id={lesson.game ?? 'rain'} {...gameProps} />
```

- [x] **Step 2: `Play.tsx`**

```tsx
import { useCallback, useEffect, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router'
import type { GameId } from '@/engine/curriculum'
import { ghostWpm, starsForGame, type GameResult } from '@/engine/games'
import { dayKey, weakestKeys } from '@/engine/stats'
import { Game } from '../components/games/Game'
import { GameResults } from '../components/games/GameResults'
import { GAME_META } from '../components/games/meta'
import { useProgress } from '../hooks/useCurriculum'
import { gameSession } from '../lib/gameSession'
import { useStore } from '../store'

export function Play() {
  const { gameId = '' } = useParams()
  if (!(gameId in GAME_META)) return <Navigate to="/" replace />
  return <PlayRun key={gameId} gameId={gameId as GameId} />
}

/** Free play with everything learned: counts for the streak and the minutes, not for the routine. */
function PlayRun({ gameId }: { gameId: GameId }) {
  const { layout, learned, goalWpm } = useProgress()
  const keyStats = useStore((s) => s.keys)
  const sessions = useStore((s) => s.sessions)
  const sound = useStore((s) => s.settings.sound)
  const recordSession = useStore((s) => s.recordSession)
  const navigate = useNavigate()
  const [result, setResult] = useState<GameResult | null>(null)
  const [round, setRound] = useState(0)
  const meta = GAME_META[gameId]

  const onFinish = useCallback(
    (r: GameResult) => {
      setResult(r)
      recordSession(gameSession(r), r.typing?.samples)
    },
    [recordSession],
  )

  useEffect(() => {
    if (!result) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        navigate('/')
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [result, navigate])

  return (
    <div className="animate-rise">
      <header className="mb-6">
        <div className="eyebrow mb-1">Jugar libre</div>
        <h1 className="text-3xl md:text-4xl">{meta.title}</h1>
        <p className="mt-1 text-ink-soft">{meta.blurb} Con todo lo que ya sabés. No cuenta para la rutina; sí para la racha y los minutos.</p>
      </header>
      {result ? (
        <GameResults
          result={result}
          stars={starsForGame(result)}
          onRetry={() => {
            setResult(null)
            setRound((n) => n + 1)
          }}
          backTo={{ to: '/', label: 'Volver al inicio' }}
        />
      ) : (
        <Game
          key={round}
          id={gameId}
          layout={layout}
          pool={learned}
          goalWpm={goalWpm}
          weak={weakestKeys(keyStats, learned, 3)}
          ghostWpm={ghostWpm(sessions, dayKey(), goalWpm)}
          sound={sound}
          onFinish={onFinish}
          durationMs={Number(new URLSearchParams(window.location.search).get('dur')) || undefined}
        />
      )}
    </div>
  )
}
```

`src/main.tsx`: `import { Play } from './app/routes/Play'` y la ruta `{ path: '/jugar/:gameId', element: <Play /> },` después de `/practica/:kind`.

- [x] **Step 3: Fila "Jugar" en Inicio**

`Home.tsx`: imports `import type { GameId } from '@/engine/curriculum'` y `import { GAME_META } from '../components/games/meta'`; en `Home()`, `const { curriculum, next, completed, learned } = useProgress()` y:

```ts
  const wordsReady = learned.includes(' ') && learned.filter((c) => /^[a-zñ]$/.test(c)).length >= 8
  const playable: GameId[] = wordsReady ? ['rain', 'rhythm', 'balloons', 'race'] : ['rain', 'rhythm']
```

Después de la `<section className="mb-10">` de la rutina:

```tsx
      {doneCount === 4 && (
        <section className="mb-10" data-testid="play-row">
          <div className="eyebrow mb-3">Jugar · con todo lo que ya sabés</div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {playable.map((id) => (
              <Link key={id} to={`/jugar/${id}`} className={`keycap keycap-${GAME_META[id].variant} flex-col items-start gap-1 px-4 py-4 text-left`} style={{ borderRadius: 16 }}>
                <span className="font-display text-2xl leading-none">{GAME_META[id].glyph}</span>
                <span className="font-display text-xl font-extrabold leading-tight">{GAME_META[id].title}</span>
                <span className="text-sm font-semibold leading-snug opacity-90">{GAME_META[id].blurb}</span>
              </Link>
            ))}
          </div>
        </section>
      )}
```

- [x] **Step 4: e2e del modo libre**

`e2e/play.spec.ts`:

```ts
import { expect, test } from '@playwright/test'

const today = new Date().toISOString().slice(0, 10)

function seed(routineDone: boolean) {
  return {
    state: {
      settings: { name: 'Seba', layoutId: 'latam', sound: false, showHands: true, onboarded: true, theme: 'auto' },
      lessons: { 'guia-66-6a-practice': { stars: 3, bestWpm: 30, bestAcc: 1, attempts: 1, completedAt: '2026-01-01T00:00:00Z' } },
      keys: {},
      sessions: [],
      days: {},
      streak: { count: 0, lastDay: null },
      routine: { day: today, warmup: routineDone, lesson: routineDone, review: routineDone, challenge: routineDone },
    },
    version: 2,
  }
}

test('free play appears only with the routine complete and records a game session without touching it', async ({ page }) => {
  await page.goto('/')
  await page.evaluate((s) => localStorage.setItem('typelight.v1', JSON.stringify(s)), seed(false))
  await page.goto('/')
  await expect(page.getByTestId('play-row')).toHaveCount(0)

  await page.evaluate((s) => localStorage.setItem('typelight.v1', JSON.stringify(s)), seed(true))
  await page.goto('/')
  await expect(page.getByTestId('play-row')).toBeVisible()
  // Only f, j and space are learned: word games stay hidden.
  await expect(page.getByTestId('play-row').getByRole('link')).toHaveCount(2)
  await page.screenshot({ path: 'e2e/screens/home-play.png' })

  await page.getByRole('link', { name: /Al compás/ }).click()
  await expect(page).toHaveURL(/\/jugar\/rhythm/)
  await page.goto('/jugar/rhythm?dur=3000')
  await expect(page.getByRole('heading', { name: 'Al compás', exact: true })).toBeVisible()
  await page.keyboard.press('Enter')
  await expect(page.getByText('Juego terminado')).toBeVisible({ timeout: 10_000 })
  await expect(page.getByRole('link', { name: 'Volver al inicio' })).toBeVisible()
  const state = await page.evaluate(() => JSON.parse(localStorage.getItem('typelight.v1')!).state)
  expect(state.sessions[state.sessions.length - 1]).toMatchObject({ kind: 'game', gameId: 'rhythm' })
  expect(state.routine).toMatchObject({ warmup: true, lesson: true, review: true, challenge: true })
  expect(Object.keys(state.lessons)).toEqual(['guia-66-6a-practice'])
})
```

- [x] **Step 5: Verificar todo y commitear**

Run: `npx tsc -b && npm run lint && npm test && npm run e2e`
Expected: unitarios PASS; Playwright 10 PASS (7 previos + balloons + race + play). Si `race.spec.ts` no llega a "Le ganaste": el bot tipea a ~100 PPM contra 25; revisar que `reference: true` de la sesión sembrada llegue a `ghostWpm` (la sesión es de hoy).

```bash
git add src/app/routes/LessonPlayer.tsx src/app/routes/Play.tsx src/app/routes/Home.tsx src/main.tsx e2e/play.spec.ts
git commit -m "feat: free play (/jugar) with a Jugar row on Home once the routine is done; lessons pick games by id"
```

---

### Task 10: cierre de etapa

**Files:**
- Modify: `docs/backlog.md`, `.serena/memories/typelight-architecture.md`, `docs/superpowers/handoffs/HANDOFF.md`

- [x] **Step 1: Build**

Run: `npm run build`
Expected: OK.

- [x] **Step 2: Docs**

`docs/backlog.md`: borrar el ítem 1 de "Próxima etapa" (queda "(Sin pendientes acordados por ahora.)") y dejar las ideas sueltas.

Memoria Serena, viñeta **Juegos**: sumar "**Globos** (`BalloonsGame`, reducer `engine/games/balloons.ts`): enganche por inicial, iniciales únicas en el aire, `samplesFrom` alimenta el Repaso; captura por `useHiddenInput`. **Carrera** (`RaceGame`, `engine/games/race.ts`): `useTypingSession` + `TypingArea`; fantasma = mejor sesión `reference` de 7 días o `goalWpm`; graba `reference: true`. `Game.tsx` elige por id; `GAME_META` (título/glifo/color); `gameSession()` mapea resultado → sesión. Modo libre `/jugar/:gameId` (`Play.tsx`), fila "Jugar" en Inicio con la rutina completa (Globos/Carrera desde 8 letras + espacio)."

`HANDOFF.md`: reescribir para la ventana siguiente (Alcance: etapa 2 cerrada; Arrancá acá: no hay pendiente acordado, preguntar a Seba tras uso real; Descartado: sin entradas nuevas de esta etapa, conservar las vigentes; Decisiones: sumar filas para Progreso opción 1, juegos por hueco, Jugar libre).

- [x] **Step 3: Commit y rama**

```bash
git add docs
git commit -m "docs: close the games + progress stage; handoff for the next window"
```

Luego `superpowers:finishing-a-development-branch`.

---

## Self-review

- **Cobertura del spec:** §4 tabla completa de huecos (12) y `patterns` → Task 1; `GameResult.typing`, estrellas → Task 2; §6 Globos (palabras reales/pseudo, patrones, enganche por inicial, iniciales únicas, puntaje largo × 10 × mult, vidas, ritmo de aparición 1,8 → 1,1 s y subida 14 → 26 px/s, input oculto, muestras por tecla) → Tasks 3, 5, 7; §7 Carrera (fantasma = mejor Reto de 7 días o meta, 3 frases o palabras, parar en el error, `won`/margen, `reference`, `wpm`, `rhythm`, muestras) → Tasks 4, 8, 9; §8 Jugar libre (ruta, resultados con "Volver al inicio", graba sesión sin rutina, fila en Inicio con 4/4, Globos/Carrera desde 8 letras + espacio) → Task 9; glifos/`GAME_META` → Task 6; e2e por juego y del modo libre → Tasks 7–9; docs y handoff → Task 10.
- **Placeholders:** ninguno (los esqueletos de la Task 6 son código que compila y se reemplaza en 7–8).
- **Consistencia:** `GameProps.ghostWpm/patterns` (Task 6) ↔ `LessonPlayer`/`Play` (Task 9) ↔ `RaceGame`/`BalloonsGame` (7–8); `data-balloon/data-word/data-typed/data-active` (7) ↔ e2e; `GameResult.typing.samples` (2) ↔ `gameSession` + `recordSession(…, samples)` (9); `sessionDay` de `engine/stats` (Progreso) ↔ `race.ts` (4).
