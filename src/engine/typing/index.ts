/**
 * Typing session state machine. Pure functions; the UI feeds it characters
 * from input events and renders the result.
 *
 * Two modes:
 * - `stop` (lessons, warm-up, review, exam): a wrong key is counted as an error and the cursor
 *   stays on the same character until the right key is pressed, so every finished exercise is a
 *   fully correct repetition — the muscle memory only ever "sees" the right path.
 * - `free` (the daily Reto): the error passes and is repaired with Backspace, like real text.
 *   Extra letters hang at the end of the word, a space in the middle of a word skips to the next
 *   one, and the final text — not the keystrokes — is what counts as correct.
 */
export type TypingMode = 'stop' | 'free'

export interface Keystroke {
  pos: number
  expected: string
  actual: string
  correct: boolean
  t: number
  /** ms since the previous keystroke (undefined for the first one). */
  latency?: number
  /** A Backspace in free mode: neither an attempt nor an error. */
  backspace?: true
}

export interface TypingState {
  target: string
  mode: TypingMode
  pos: number
  keystrokes: Keystroke[]
  startedAt: number | null
  finishedAt: number | null
  /** Positions where at least one wrong key was pressed. */
  erred: boolean[]
  /** True right after a wrong key; cleared by the next keystroke. */
  lastWrong: boolean
  /** Free mode: what was typed at each position before `pos` (null = skipped by a space). */
  typed: (string | null)[]
  /** Free mode: extra letters typed before the space (or the end) at a given target index. */
  extras: Record<number, string>
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
export const MAX_EXTRAS = 5

export function createSession(target: string, mode: TypingMode = 'stop'): TypingState {
  return {
    target,
    mode,
    pos: 0,
    keystrokes: [],
    startedAt: null,
    finishedAt: null,
    erred: Array.from({ length: target.length }, () => false),
    lastWrong: false,
    typed: [],
    extras: {},
  }
}

export function isFinished(s: TypingState): boolean {
  return s.finishedAt !== null
}

/** Index where the word containing `pos` starts. */
export function wordStart(target: string, pos: number): number {
  const i = target.lastIndexOf(' ', pos - 1)
  return i === -1 ? 0 : i + 1
}

/** Feed one character (may be a multi-char string; processed sequentially). `afterPause` caps the first latency. */
export function typeText(s: TypingState, text: string, t: number, afterPause = false): TypingState {
  let next = s
  let first = true
  for (const ch of text) {
    next = typeChar(next, ch, t, afterPause && first)
    first = false
  }
  return next
}

function stroke(s: TypingState, pos: number, expected: string, actual: string, correct: boolean, t: number, afterPause: boolean): Keystroke {
  const prev = s.keystrokes[s.keystrokes.length - 1]
  // A gap that spans a hidden tab is a pause, not typing.
  const latency = prev ? (afterPause ? MAX_LATENCY : Math.min(t - prev.t, MAX_LATENCY)) : undefined
  return { pos, expected, actual, correct, t, latency }
}

export function typeChar(s: TypingState, ch: string, t: number, afterPause = false): TypingState {
  if (s.finishedAt !== null || s.pos >= s.target.length) return s
  const expected = s.target[s.pos]
  const correct = ch === expected
  const keystrokes = [...s.keystrokes, stroke(s, s.pos, expected, ch, correct, t, afterPause)]
  const startedAt = s.startedAt ?? t
  if (s.mode === 'stop') {
    if (!correct) {
      const erred = s.erred.slice()
      erred[s.pos] = true
      return { ...s, keystrokes, startedAt, erred, lastWrong: true }
    }
    const pos = s.pos + 1
    const finishedAt = pos >= s.target.length ? t : null
    return { ...s, keystrokes, startedAt, pos, finishedAt, lastWrong: false }
  }
  return typeFree(s, ch, expected, correct, keystrokes, startedAt, t)
}

function typeFree(s: TypingState, ch: string, expected: string, correct: boolean, keystrokes: Keystroke[], startedAt: number, t: number): TypingState {
  const advance = (typed: (string | null)[], erred: boolean[], pos: number) => {
    const finishedAt = pos >= s.target.length ? t : null
    return { ...s, keystrokes, startedAt, typed, erred, pos, finishedAt, lastWrong: !correct }
  }
  if (correct) return advance([...s.typed, ch], s.erred, s.pos + 1)
  if (ch === ' ') {
    // Mid-word space: skip the rest of the word. At a word start it is just a stray key.
    if (s.pos === wordStart(s.target, s.pos)) return { ...s, keystrokes, startedAt, lastWrong: true }
    const nextSpace = s.target.indexOf(' ', s.pos)
    const end = nextSpace === -1 ? s.target.length : nextSpace
    const typed = [...s.typed]
    const erred = s.erred.slice()
    for (let i = s.pos; i < end; i++) {
      typed.push(null)
      erred[i] = true
    }
    if (nextSpace !== -1) typed.push(' ')
    return advance(typed, erred, nextSpace === -1 ? end : end + 1)
  }
  if (expected === ' ') {
    // Extra letter at the end of a word: it hangs there until a Backspace removes it.
    const have = s.extras[s.pos] ?? ''
    const extras = have.length >= MAX_EXTRAS ? s.extras : { ...s.extras, [s.pos]: have + ch }
    return { ...s, keystrokes, startedAt, extras, lastWrong: true }
  }
  const erred = s.erred.slice()
  erred[s.pos] = true
  return advance([...s.typed, ch], erred, s.pos + 1)
}

/** Free mode: remove the last extra letter, or step back one position. */
export function backspace(s: TypingState, t: number): TypingState {
  if (s.mode !== 'free' || s.finishedAt !== null) return s
  const have = s.extras[s.pos]
  if (!have && s.pos === 0) return s
  const keystrokes = [...s.keystrokes, { ...stroke(s, s.pos, '', '\b', false, t, false), backspace: true as const }]
  if (have) {
    const extras = { ...s.extras }
    if (have.length > 1) extras[s.pos] = have.slice(0, -1)
    else delete extras[s.pos]
    return { ...s, keystrokes, extras, lastWrong: false }
  }
  return { ...s, keystrokes, pos: s.pos - 1, typed: s.typed.slice(0, -1), lastWrong: false }
}

function attempts(s: TypingState): Keystroke[] {
  return s.keystrokes.filter((k) => !k.backspace)
}

export function metrics(s: TypingState, now?: number): Metrics {
  const end = s.finishedAt ?? now ?? s.keystrokes[s.keystrokes.length - 1]?.t ?? s.startedAt ?? 0
  const seconds = s.startedAt === null ? 0 : Math.max(0, (end - s.startedAt) / 1000)
  const keys = attempts(s)
  const right = keys.filter((k) => k.correct).length
  const errors = keys.length - right
  // Free mode: the final text is what counts (repaired = correct, left wrong = not). Stop mode: every correct key.
  const correct = s.mode === 'free' ? s.typed.filter((c, i) => c === s.target[i]).length : right
  const accuracy = keys.length === 0 ? 1 : right / keys.length
  // Gross WPM over correctly typed characters; the first keystroke starts the clock.
  const wpm = seconds > 0 ? Math.round((correct / 5) / (seconds / 60)) : 0
  return { wpm, accuracy, seconds, chars: s.pos, correct, errors }
}

export interface RepairMetrics {
  /** Wrong keystrokes (= `metrics().errors`). */
  firstTryErrors: number
  /** Keystrokes per character of final text, Backspace included. 1.00 is perfect. */
  kspc: number
  /** Erred positions that ended up right. */
  repaired: number
  /** Median ms from a wrong keystroke to the Backspace that started its repair; null without repairs. */
  repairMs: number | null
}

/** Free-mode only: how the errors were handled. */
export function repairMetrics(s: TypingState): RepairMetrics | null {
  if (s.mode !== 'free') return null
  const keys = attempts(s)
  const firstTryErrors = keys.filter((k) => !k.correct).length
  const kspc = s.keystrokes.length / Math.max(1, s.pos)
  const repaired = s.erred.filter((e, i) => e && i < s.pos && s.typed[i] === s.target[i]).length
  // Reaction time: from each wrong keystroke to the first Backspace after it (errors never followed by one are left out).
  const lat: number[] = []
  for (let i = 0; i < s.keystrokes.length; i++) {
    const k = s.keystrokes[i]
    if (k.correct || k.backspace) continue
    const next = s.keystrokes.slice(i + 1).find((x) => x.backspace)
    if (next) lat.push(next.t - k.t)
  }
  lat.sort((a, b) => a - b)
  const repairMs = lat.length === 0 ? null : lat.length % 2 ? lat[lat.length >> 1] : Math.round((lat[(lat.length >> 1) - 1] + lat[lat.length >> 1]) / 2)
  return { firstTryErrors, kspc, repaired, repairMs }
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
  for (const k of attempts(s)) {
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
  for (const k of attempts(s)) {
    if (k.correct && k.latency !== undefined && k.latency < MAX_LATENCY) gaps.push(k.latency)
  }
  if (gaps.length < 8) return undefined
  const mean = gaps.reduce((a, b) => a + b, 0) / gaps.length
  if (mean <= 0) return undefined
  const variance = gaps.reduce((a, g) => a + (g - mean) ** 2, 0) / gaps.length
  return Math.max(0, Math.min(1, 1 - Math.sqrt(variance) / mean))
}
