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
