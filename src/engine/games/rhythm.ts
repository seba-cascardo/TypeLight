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
