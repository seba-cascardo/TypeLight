/**
 * Typing session state machine. Pure functions; the UI feeds it characters
 * from input events and renders the result.
 *
 * Mode: stop-on-error. A wrong key is counted as an error and the cursor stays
 * on the same character until the right key is pressed. The exercise ends when
 * the whole target has been typed correctly, so every finished exercise is a
 * fully correct repetition — the muscle memory only ever "sees" the right path.
 */
export interface Keystroke {
  pos: number
  expected: string
  actual: string
  correct: boolean
  t: number
  /** ms since the previous keystroke (undefined for the first one). */
  latency?: number
}

export interface TypingState {
  target: string
  pos: number
  keystrokes: Keystroke[]
  startedAt: number | null
  finishedAt: number | null
  /** Positions where at least one wrong key was pressed. */
  erred: boolean[]
  /** True right after a wrong key; cleared by the next keystroke. */
  lastWrong: boolean
}

export interface Metrics {
  wpm: number
  accuracy: number
  seconds: number
  chars: number
  correct: number
  errors: number
}

export const MAX_LATENCY = 2000

export function createSession(target: string): TypingState {
  return {
    target,
    pos: 0,
    keystrokes: [],
    startedAt: null,
    finishedAt: null,
    erred: Array.from({ length: target.length }, () => false),
    lastWrong: false,
  }
}

export function isFinished(s: TypingState): boolean {
  return s.finishedAt !== null
}

/** Feed one character (may be a multi-char string; processed sequentially). */
export function typeText(s: TypingState, text: string, t: number): TypingState {
  let next = s
  for (const ch of text) next = typeChar(next, ch, t)
  return next
}

export function typeChar(s: TypingState, ch: string, t: number): TypingState {
  if (s.finishedAt !== null || s.pos >= s.target.length) return s
  const expected = s.target[s.pos]
  const correct = ch === expected
  const prev = s.keystrokes[s.keystrokes.length - 1]
  const latency = prev ? Math.min(t - prev.t, MAX_LATENCY) : undefined
  const keystroke: Keystroke = { pos: s.pos, expected, actual: ch, correct, t, latency }
  const keystrokes = [...s.keystrokes, keystroke]
  const startedAt = s.startedAt ?? t
  if (!correct) {
    const erred = s.erred.slice()
    erred[s.pos] = true
    return { ...s, keystrokes, startedAt, erred, lastWrong: true }
  }
  const pos = s.pos + 1
  const finishedAt = pos >= s.target.length ? t : null
  return { ...s, keystrokes, startedAt, pos, finishedAt, lastWrong: false }
}

export function metrics(s: TypingState, now?: number): Metrics {
  const end = s.finishedAt ?? now ?? s.keystrokes[s.keystrokes.length - 1]?.t ?? s.startedAt ?? 0
  const seconds = s.startedAt === null ? 0 : Math.max(0, (end - s.startedAt) / 1000)
  const correct = s.keystrokes.filter((k) => k.correct).length
  const errors = s.keystrokes.length - correct
  const total = s.keystrokes.length
  const accuracy = total === 0 ? 1 : correct / total
  // Gross WPM over correctly typed characters; the first keystroke starts the clock.
  const wpm = seconds > 0 ? Math.round((correct / 5) / (seconds / 60)) : 0
  return { wpm, accuracy, seconds, chars: s.pos, correct, errors }
}

export interface KeySample {
  char: string
  latencies: number[]
  errors: number
  occurrences: number
}

/** Per expected character: latencies of correct presses, error counts, occurrences. */
export function keySamples(s: TypingState): Map<string, KeySample> {
  const map = new Map<string, KeySample>()
  const get = (c: string) => {
    let v = map.get(c)
    if (!v) {
      v = { char: c, latencies: [], errors: 0, occurrences: 0 }
      map.set(c, v)
    }
    return v
  }
  for (const k of s.keystrokes) {
    const v = get(k.expected)
    if (k.correct) {
      v.occurrences++
      if (k.latency !== undefined) v.latencies.push(k.latency)
    } else {
      v.errors++
    }
  }
  return map
}

/** End the session now (time limit reached) even if the target is incomplete. */
export function endSession(s: TypingState, t: number): TypingState {
  if (s.finishedAt !== null) return s
  return { ...s, finishedAt: t, startedAt: s.startedAt ?? t }
}

/**
 * How even the gaps between correct keystrokes were: 1 − coefficient of variation,
 * clamped to 0..1 (1 = metronome). Undefined with fewer than 8 usable gaps.
 * Gaps at MAX_LATENCY are pauses, not typing, and are left out.
 */
export function rhythm(s: TypingState): number | undefined {
  const gaps: number[] = []
  for (const k of s.keystrokes) {
    if (k.correct && k.latency !== undefined && k.latency < MAX_LATENCY) gaps.push(k.latency)
  }
  if (gaps.length < 8) return undefined
  const mean = gaps.reduce((a, b) => a + b, 0) / gaps.length
  if (mean <= 0) return undefined
  const variance = gaps.reduce((a, g) => a + (g - mean) ** 2, 0) / gaps.length
  return Math.max(0, Math.min(1, 1 - Math.sqrt(variance) / mean))
}
