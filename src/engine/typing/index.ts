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
 * - `word` (the reading mode, "stop on word"): like `free`, but the space does not move on while the
 *   word has an error (or an extra letter), a mid-word space is an error that passes instead of a
 *   skip, and the text does not finish with its last word wrong.
 */
export type TypingMode = 'stop' | 'free' | 'word'

/** Modes where the error passes and Backspace repairs it. */
export const repairs = (mode: TypingMode): boolean => mode !== 'stop'

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
  /** Word mode: a space refused because the word still has an error. The error was already counted. */
  blocked?: true
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

/** The word typed so far (up to `end`) matches the target and has no extra letters hanging at `end`. */
function wordClean(target: string, typed: readonly (string | null)[], extras: Record<number, string>, end: number): boolean {
  if (extras[end]) return false
  for (let i = wordStart(target, end); i < end; i++) if (typed[i] !== target[i]) return false
  return true
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
  const startedAt = s.startedAt ?? t
  if (s.mode === 'word' && ch === ' ' && correct && !wordClean(s.target, s.typed, s.extras, s.pos)) {
    // Stop on word: the space waits until the word is right. The error was counted when it was typed.
    const keystrokes = [...s.keystrokes, { ...stroke(s, s.pos, expected, ch, false, t, afterPause), blocked: true as const }]
    return { ...s, keystrokes, startedAt, lastWrong: true }
  }
  const keystrokes = [...s.keystrokes, stroke(s, s.pos, expected, ch, correct, t, afterPause)]
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
  const word = s.mode === 'word'
  const advance = (typed: (string | null)[], erred: boolean[], pos: number) => {
    // Word mode does not finish with the last word wrong: the typist repairs it first.
    const end = pos >= s.target.length && (!word || wordClean(s.target, typed, s.extras, pos))
    return { ...s, keystrokes, startedAt, typed, erred, pos, finishedAt: end ? t : null, lastWrong: !correct }
  }
  if (correct) return advance([...s.typed, ch], s.erred, s.pos + 1)
  if (ch === ' ' && (!word || s.pos === wordStart(s.target, s.pos))) {
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

/** Free and word modes: remove the last extra letter, or step back one position. */
export function backspace(s: TypingState, t: number): TypingState {
  if (!repairs(s.mode) || s.finishedAt !== null) return s
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
  return s.keystrokes.filter((k) => !k.backspace && !k.blocked)
}

export function metrics(s: TypingState, now?: number): Metrics {
  const end = s.finishedAt ?? now ?? s.keystrokes[s.keystrokes.length - 1]?.t ?? s.startedAt ?? 0
  const seconds = s.startedAt === null ? 0 : Math.max(0, (end - s.startedAt) / 1000)
  const keys = attempts(s)
  const right = keys.filter((k) => k.correct).length
  const errors = keys.length - right
  // Free mode: the final text is what counts (repaired = correct, left wrong = not). Stop mode: every correct key.
  const correct = repairs(s.mode) ? s.typed.filter((c, i) => c === s.target[i]).length : right
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

/** Free and word modes only: how the errors were handled. */
export function repairMetrics(s: TypingState): RepairMetrics | null {
  if (!repairs(s.mode)) return null
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

/* ───────── Finer-grained samples for the skill model v2 ───────── */

export interface BigramSample {
  bigram: string
  /** Latency of the second key when both keys were typed right in a row. */
  latencies: number[]
  /** Wrong keys typed right after a correct first key. */
  errors: number
}

/**
 * Per in-word bigram of the target (no spaces): clean transition latencies and errors on the second key.
 * The bigram is the unit that predicts speed (Dhakal 2018); this is where "same finger" and "alternating
 * hands" become measurable.
 */
export function bigramSamples(s: TypingState): Map<string, BigramSample> {
  const map = new Map<string, BigramSample>()
  const keys = attempts(s)
  for (let i = 0; i < keys.length; i++) {
    const k = keys[i]
    if (k.pos === 0 || k.expected === ' ') continue
    const before = s.target[k.pos - 1]
    if (before === ' ') continue
    const prev = keys[i - 1]
    const cleanPrev = prev !== undefined && prev.correct && prev.pos === k.pos - 1
    if (!cleanPrev) continue
    const bigram = before + k.expected
    let v = map.get(bigram)
    if (!v) {
      v = { bigram, latencies: [], errors: 0 }
      map.set(bigram, v)
    }
    if (!k.correct) v.errors++
    else if (k.latency !== undefined && k.latency < MAX_LATENCY) v.latencies.push(k.latency)
  }
  return map
}

export interface WordSample {
  word: string
  /** Mean latency per letter after the first (which carries the reading pause), or null without clean keys. */
  latency: number | null
  errors: number
}

const LETTER = /[\p{L}]/u

/** Per word of the target with three letters or more (punctuation stripped): letter latencies after the first, and errors. */
export function wordSamples(s: TypingState): Map<string, WordSample> {
  const map = new Map<string, WordSample>()
  const keys = attempts(s)
  const target = s.target
  let i = 0
  while (i < target.length) {
    if (target[i] === ' ') {
      i++
      continue
    }
    let end = i
    while (end < target.length && target[end] !== ' ') end++
    // letters only: the range from the first to the last letter of the token
    let first = i
    while (first < end && !LETTER.test(target[first])) first++
    let last = end - 1
    while (last >= first && !LETTER.test(target[last])) last--
    const word = target.slice(first, last + 1).toLowerCase()
    if ([...word].filter((c) => LETTER.test(c)).length >= 3) {
      let errors = 0
      const lat: number[] = []
      for (let j = 0; j < keys.length; j++) {
        const k = keys[j]
        if (k.pos < first || k.pos > last) continue
        if (!k.correct) {
          errors++
          continue
        }
        if (k.pos === first) continue
        const prev = keys[j - 1]
        if (prev && prev.correct && prev.pos === k.pos - 1 && k.latency !== undefined && k.latency < MAX_LATENCY) lat.push(k.latency)
      }
      const existing = map.get(word)
      const latency = lat.length ? lat.reduce((a, b) => a + b, 0) / lat.length : null
      if (existing) {
        existing.errors += errors
        if (latency !== null) existing.latency = existing.latency === null ? latency : (existing.latency + latency) / 2
      } else map.set(word, { word, latency, errors })
    }
    i = end
  }
  return map
}

export interface DeadKeyStats {
  /** Correct accented characters typed, and their mean latency. */
  n: number
  latency: number | null
  /** The plain vowel typed where an accented one was expected. */
  missed: number
  /** A bare accent, or an accented vowel where a plain one was expected. */
  loose: number
}

const ACCENTED = /^[áéíóúüÁÉÍÓÚÜ]$/
const BARE_ACCENT = /^[´¨`^]$/
const plain = (ch: string) => ch.normalize('NFD').replace(/[̀-ͯ]/g, '')

/** How the dead keys went in this session, or null when no accented character was involved. */
export function deadKeyStats(s: TypingState): DeadKeyStats | null {
  let n = 0
  let missed = 0
  let loose = 0
  const lat: number[] = []
  for (const k of attempts(s)) {
    const expAcc = ACCENTED.test(k.expected)
    if (k.correct) {
      if (expAcc) {
        n++
        if (k.latency !== undefined && k.latency < MAX_LATENCY) lat.push(k.latency)
      }
      continue
    }
    if (expAcc && k.actual === plain(k.expected)) missed++
    else if (BARE_ACCENT.test(k.actual) || (ACCENTED.test(k.actual) && !expAcc)) loose++
  }
  if (n + missed + loose === 0) return null
  return { n, latency: lat.length ? Math.round(lat.reduce((a, b) => a + b, 0) / lat.length) : null, missed, loose }
}

/** Longest run of consecutive correct attempts (Backspace neither counts nor breaks it). */
export function cleanRun(s: TypingState): number {
  let best = 0
  let run = 0
  for (const k of attempts(s)) {
    run = k.correct ? run + 1 : 0
    if (run > best) best = run
  }
  return best
}
