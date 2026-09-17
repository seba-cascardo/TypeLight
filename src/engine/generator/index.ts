import { BIGRAMS, TRIGRAMS } from '../corpus/ngrams'
import { ONE_LETTER, WORDS } from '../corpus/words'
import { NUMBER_SENTENCES, SENTENCES, SYMBOL_SENTENCES } from '../corpus/sentences'
import { GENERATED_SENTENCES } from '../corpus/sentences.generated'
import { makeRng, weightedIndex, type Rng } from './rng'

export { makeRng } from './rng'
export type { Rng } from './rng'

const VOWELS = new Set('aeiouáéíóúü')
const LOWER_LETTER = /^[a-zñáéíóúü]$/
const UPPER_LETTER = /^[A-ZÑÁÉÍÓÚÜ]$/

/** Letters usable inside pseudo-words: lower-case letters plus any non-letter new chars. */
function pseudoLetters(pool: ReadonlySet<string>, extra: Iterable<string> = []): string[] {
  const out = [...pool].filter((c) => LOWER_LETTER.test(c))
  for (const c of extra) if (!LOWER_LETTER.test(c) && !UPPER_LETTER.test(c) && c !== ' ' && !out.includes(c)) out.push(c)
  return out
}

export interface GenOpts {
  rng?: Rng
}

function usesOnly(text: string, pool: ReadonlySet<string>): boolean {
  for (const ch of text) if (!pool.has(ch)) return false
  return true
}

function weightedPick(chars: readonly string[], focus: ReadonlySet<string>, rng: Rng): string {
  const weights = chars.map((c) => (focus.has(c) ? 3 : 1))
  return chars[weightedIndex(weights, rng)]
}

/**
 * "fff jjj fjf jfj" — introduces new keys in isolation.
 * Early tokens repeat one key; later tokens alternate.
 */
export function drillText(
  newChars: readonly string[],
  tokens = 14,
  opts: GenOpts & { joined?: boolean } = {},
): string {
  const rng = opts.rng ?? makeRng()
  const chars = newChars.filter((c) => c !== ' ')
  if (chars.length === 0) return ''
  const out: string[] = []
  // First: each key repeated on its own, twice.
  for (let round = 0; round < 2; round++) for (const c of chars) out.push(c.repeat(3))
  while (out.length < tokens) {
    const len = 2 + rng.int(3)
    let token = ''
    for (let i = 0; i < len; i++) token += rng.pick(chars)
    out.push(token)
  }
  // `joined`: before the space bar is taught, the drill is one continuous run.
  return out.slice(0, Math.max(tokens, chars.length * 2)).join(opts.joined ? '' : ' ')
}

/**
 * Mixed sequences drawn from every learned key, biased towards the new ones.
 * Uses real words when enough exist, otherwise pronounceable pseudo-words.
 */
export function reviewText(
  newChars: readonly string[],
  pool: ReadonlySet<string>,
  tokens = 14,
  opts: GenOpts = {},
): string {
  const rng = opts.rng ?? makeRng()
  const focus = new Set(newChars)
  const caps = newChars.filter((c) => UPPER_LETTER.test(c))
  if (caps.length && caps.length === newChars.length) {
    return wordsText(new Set(pseudoLetters(pool).concat(' ')), tokens, { rng, focus: caps, capitals: caps })
  }
  const letters = pseudoLetters(pool, newChars)
  const real = candidateWords(pool, 400).filter((w) => [...w].some((c) => focus.has(c)))
  const out: string[] = []
  for (let i = 0; i < tokens; i++) {
    if (real.length >= 8 && rng.chance(0.6)) {
      out.push(rng.pick(real))
    } else {
      out.push(pseudoWord(letters, focus, rng))
    }
  }
  return out.join(' ')
}

/** Real words (plus the one-letter ones) typable with the pool, most frequent first, up to `limit`. */
export function candidateWords(pool: ReadonlySet<string>, limit: number): string[] {
  const res: string[] = []
  for (const w of ONE_LETTER) if (usesOnly(w, pool)) res.push(w)
  for (const w of WORDS) {
    if (usesOnly(w, pool)) {
      res.push(w)
      if (res.length >= limit) break
    }
  }
  return res
}

/** A pronounceable-ish made-up word from the available letters. */
export function pseudoWord(letters: readonly string[], focus: ReadonlySet<string>, rng: Rng): string {
  const vowels = letters.filter((c) => VOWELS.has(c))
  const consonants = letters.filter((c) => !VOWELS.has(c))
  if (vowels.length === 0 || consonants.length === 0) {
    const len = 2 + rng.int(3)
    let w = ''
    for (let i = 0; i < len; i++) w += weightedPick(letters, focus, rng)
    return w
  }
  const syllables = 1 + rng.int(3)
  let w = ''
  for (let s = 0; s < syllables; s++) {
    const shape = rng.pick(['CV', 'CV', 'CVC', 'VC', 'V'])
    for (const part of shape) {
      w += part === 'C' ? weightedPick(consonants, focus, rng) : weightedPick(vowels, focus, rng)
    }
  }
  return w
}

/**
 * Real words typable with the pool, weighted by frequency and biased to `focus`.
 * Falls back to pseudo-words when fewer than 12 real words are available.
 */
export function wordsText(
  pool: ReadonlySet<string>,
  count = 14,
  opts: GenOpts & { focus?: readonly string[]; capitals?: readonly string[] } = {},
): string {
  const rng = opts.rng ?? makeRng()
  const capitals = new Set(opts.capitals ?? [])
  // Upper-case focus letters mean "words that start with this letter, capitalized".
  const focusLower = (opts.focus ?? []).map((c) => c.toLowerCase())
  const focus = new Set(focusLower)
  const capitalFocus = new Set((opts.focus ?? []).filter((c) => capitals.has(c)).map((c) => c.toLowerCase()))
  const capitalizeMaybe = (w: string) => {
    const first = w[0].toUpperCase()
    if (!capitals.has(first)) return w
    const p = capitalFocus.size ? (capitalFocus.has(w[0]) ? 0.85 : 0.15) : 0.4
    return rng.chance(p) ? first + w.slice(1) : w
  }
  const words = candidateWords(pool, 1500)
  const letters = pseudoLetters(pool)
  const out: string[] = []
  if (words.length < 12) {
    for (let i = 0; i < count; i++) {
      if (words.length > 0 && rng.chance(0.4)) out.push(capitalizeMaybe(rng.pick(words)))
      else out.push(pseudoWord(letters, focus, rng))
    }
    return out.join(' ')
  }
  const rankWeight = (i: number) => 1 / Math.sqrt(i + 20)
  const focusWords: string[] = []
  const focusWeights: number[] = []
  const otherWords: string[] = []
  const otherWeights: number[] = []
  words.forEach((w, i) => {
    const wt = rankWeight(i) * (w.length === 1 ? 0.3 : 1)
    const hit = capitalFocus.size ? capitalFocus.has(w[0]) : [...w].some((c) => focus.has(c))
    if (focus.size && hit) {
      focusWords.push(w)
      focusWeights.push(wt)
    } else {
      otherWords.push(w)
      otherWeights.push(wt)
    }
  })
  const useFocus = focusWords.length >= 4
  let last = ''
  for (let i = 0; i < count; i++) {
    const fromFocus = useFocus && rng.chance(0.7)
    const list = fromFocus ? focusWords : otherWords.length ? otherWords : focusWords
    const wts = fromFocus ? focusWeights : otherWords.length ? otherWeights : focusWeights
    let w = list[weightedIndex(wts, rng)]
    if (w === last && list.length > 1) w = list[weightedIndex(wts, rng)]
    out.push(capitalizeMaybe(w))
    last = w
  }
  return out.join(' ')
}

export type SentenceCorpus = 'general' | 'numbers' | 'symbols'

const CORPORA: Record<SentenceCorpus, string[]> = {
  general: SENTENCES,
  numbers: NUMBER_SENTENCES,
  symbols: SYMBOL_SENTENCES,
}

const PUNCT = new Set(',.;:¿?¡!"()-')
const PAIRS: Record<string, string> = { '¿': '?', '?': '¿', '¡': '!', '!': '¡' }
const CAPITAL = /[A-ZÁÉÍÓÚÜÑ]/

/**
 * Adapt a sentence to what the pool can type: lower-case when no capital is known, drop the punctuation
 * the pool lacks (question/exclamation marks go as a pair). Accents and ñ are never removed — that would
 * change the word. Null when the result still needs keys outside the pool.
 */
export function fitSentence(s: string, pool: ReadonlySet<string>): string | null {
  const hasCaps = [...pool].some((c) => CAPITAL.test(c))
  let t = hasCaps ? s : s.toLowerCase()
  t = [...t].filter((c) => !PUNCT.has(c) || (pool.has(c) && (!(c in PAIRS) || pool.has(PAIRS[c])))).join('')
  t = t.replace(/\s+/g, ' ').trim()
  return t && usesOnly(t, pool) ? t : null
}

/** Distinct real sentences typable with the pool, up to `count`; house sentences weigh 3, generated ones 1. */
export function pickSentences(
  pool: ReadonlySet<string>,
  count: number,
  opts: GenOpts & { corpus?: SentenceCorpus } = {},
): string[] {
  const rng = opts.rng ?? makeRng()
  const corpus = opts.corpus ?? 'general'
  const sources: [readonly string[], number][] = corpus === 'general' ? [[SENTENCES, 3], [GENERATED_SENTENCES, 1]] : [[CORPORA[corpus], 1]]
  const fits: string[] = []
  const weights: number[] = []
  for (const [list, weight] of sources) {
    for (const s of list) {
      const f = fitSentence(s, pool)
      if (f) {
        fits.push(f)
        weights.push(weight)
      }
    }
  }
  const out: string[] = []
  while (out.length < count && fits.length > 0) {
    const i = weightedIndex(weights, rng)
    out.push(fits[i])
    fits.splice(i, 1)
    weights.splice(i, 1)
  }
  return out
}

/** Real sentences typable with the pool, joined. Returns '' if none fit, so callers can fall back. */
export function sentencesText(
  pool: ReadonlySet<string>,
  count = 2,
  opts: GenOpts & { corpus?: SentenceCorpus } = {},
): string {
  return pickSentences(pool, count, opts).join(' ')
}

/** A Reto's text: distinct sentences until `minChars`, topped up with words; words only when no sentence fits. */
export function challengeText(pool: ReadonlySet<string>, opts: GenOpts & { minChars?: number } = {}): string {
  const rng = opts.rng ?? makeRng()
  const min = opts.minChars ?? 420
  const out: string[] = []
  let total = 0
  const push = (chunk: string) => {
    total += (out.length ? 1 : 0) + chunk.length
    out.push(chunk)
  }
  for (const s of pickSentences(pool, 12, { rng })) {
    if (total >= min) break
    push(s)
  }
  let guard = 0
  while (total < min && guard++ < 12) push(wordsText(pool, 20, { rng }))
  return out.join(' ')
}

/** FNV-1a over a string, for reproducible seeds. */
function seedOf(key: string): number {
  let h = 0x811c9dc5
  for (const c of key) {
    h ^= c.codePointAt(0) ?? 0
    h = Math.imul(h, 0x01000193) >>> 0
  }
  return h
}

/** The weekly exam's text: the same all month for a given pool. Sentences first, words when they run out. */
export function examText(pool: ReadonlySet<string>, monthKey: string, minChars = 1500): string {
  const rng = makeRng(seedOf(monthKey))
  const out: string[] = []
  let total = 0
  const push = (chunk: string) => {
    total += (out.length ? 1 : 0) + chunk.length
    out.push(chunk)
  }
  for (const s of pickSentences(pool, 60, { rng })) {
    if (total >= minChars) break
    push(s)
  }
  let guard = 0
  while (total < minChars && guard++ < 40) push(wordsText(pool, 20, { rng }))
  return out.join(' ')
}

/** Text for the adaptive review: words heavy on the weakest keys, and on the weakest bigrams when given. */
export function adaptiveText(
  pool: ReadonlySet<string>,
  weak: readonly string[],
  count = 16,
  opts: GenOpts & { bigrams?: readonly string[] } = {},
): string {
  const rng = opts.rng ?? makeRng()
  const focus = new Set(weak)
  const letters = pseudoLetters(pool, weak)
  const candidates = candidateWords(pool, 1500)
  const words = candidates.filter((w) => [...w].some((c) => focus.has(c)))
  const bigramWords = opts.bigrams?.length ? candidates.filter((w) => opts.bigrams!.some((g) => w.includes(g))) : []
  const out: string[] = []
  for (let i = 0; i < count; i++) {
    if (bigramWords.length >= 6 && rng.chance(0.4)) out.push(rng.pick(bigramWords))
    else if (words.length >= 6 && rng.chance(0.7)) out.push(rng.pick(words))
    else out.push(pseudoWord(letters, focus, rng))
  }
  return out.join(' ')
}

/** Lower-case letter pool → also allow the space bar. */
export function poolOf(chars: Iterable<string>, withSpace = true): Set<string> {
  const s = new Set(chars)
  if (withSpace) s.add(' ')
  return s
}

/**
 * Ngram-Type style drill: `combination` n-grams, each repeated `repetition` times in a row, then a real word
 * that contains one of them, and again. Weighted by frequency, ×3 for n-grams with a weak key.
 */
export function ngramText(
  pool: ReadonlySet<string>,
  n: 2 | 3,
  opts: GenOpts & { combination?: number; repetition?: number; tokens?: number; weak?: readonly string[] } = {},
): string {
  const rng = opts.rng ?? makeRng()
  const { combination = 3, repetition = 3, tokens = 15 } = opts
  const reps = Math.max(1, repetition)
  const weak = new Set(opts.weak ?? [])
  const fits = (n === 2 ? BIGRAMS : TRIGRAMS).filter(([g]) => usesOnly(g, pool))
  if (fits.length < 6) return wordsText(pool, tokens, { rng })
  const weights = fits.map(([g, w]) => w * ([...g].some((c) => weak.has(c)) ? 3 : 1))
  const want = Math.min(Math.max(1, combination), fits.length)
  const chosen: string[] = []
  let guard = 0
  while (chosen.length < want && guard++ < 200) {
    const g = fits[weightedIndex(weights, rng)][0]
    if (!chosen.includes(g)) chosen.push(g)
  }
  if (chosen.length === 0) return wordsText(pool, tokens, { rng })
  const words = candidateWords(pool, 1500).filter((w) => chosen.some((g) => w.includes(g)))
  const out: string[] = []
  while (out.length < tokens) {
    for (let r = 0; r < reps; r++) for (const g of chosen) if (out.length < tokens) out.push(g)
    if (words.length && out.length < tokens) out.push(rng.pick(words))
  }
  return out.join(' ')
}

/** Real words containing an n-gram (que, ción, ent…), weighted by frequency. */
export function patternText(pool: ReadonlySet<string>, pattern: string, count = 14, opts: GenOpts = {}): string {
  const rng = opts.rng ?? makeRng()
  const words = candidateWords(pool, 3000).filter((w) => w.includes(pattern))
  if (words.length < 6) return wordsText(pool, count, { rng })
  const weights = words.map((_, i) => 1 / Math.sqrt(i + 10))
  const out: string[] = []
  let last = ''
  for (let i = 0; i < count; i++) {
    let w = words[weightedIndex(weights, rng)]
    if (w === last && words.length > 1) w = words[weightedIndex(weights, rng)]
    out.push(w)
    last = w
  }
  return out.join(' ')
}

/** Numbers built from the learned digits, mixed with a few words. */
export function numbersText(
  pool: ReadonlySet<string>,
  digits: readonly string[],
  tokens = 14,
  opts: GenOpts = {},
): string {
  const rng = opts.rng ?? makeRng()
  const letters = new Set([...pool].filter((c) => !/[0-9]/.test(c)))
  const words = candidateWords(letters, 300)
  const out: string[] = []
  for (let i = 0; i < tokens; i++) {
    if (words.length > 10 && rng.chance(0.35)) {
      out.push(rng.pick(words))
      continue
    }
    const len = 1 + rng.int(4)
    let n = ''
    for (let j = 0; j < len; j++) n += rng.pick(digits)
    out.push(n)
  }
  return out.join(' ')
}

const OPENERS: Record<string, string> = { '(': ')', '[': ']', '{': '}', '¿': '?', '¡': '!', '<': '>', '"': '"', "'": "'" }
const CLOSERS = new Set([')', ']', '}', '?', '!', '>'])
const TRAILING = new Set([',', ';', ':', '.'])

/** Words dressed with the given symbols using natural-ish templates. */
export function symbolsText(
  pool: ReadonlySet<string>,
  symbols: readonly string[],
  tokens = 14,
  opts: GenOpts = {},
): string {
  const rng = opts.rng ?? makeRng()
  const letters = new Set([...pool].filter((c) => /[a-zñáéíóúü]/i.test(c) || c === ' '))
  const words = candidateWords(letters, 400)
  const digits = [...pool].filter((c) => /[0-9]/.test(c))
  const word = () => (words.length ? rng.pick(words) : 'ala')
  const number = () => {
    if (!digits.length) return word()
    let n = ''
    const len = 1 + rng.int(3)
    for (let j = 0; j < len; j++) n += rng.pick(digits)
    return n
  }
  const out: string[] = []
  const usable = symbols.filter((s) => pool.has(s))
  if (!usable.length) return wordsText(pool, tokens, { rng })
  for (let i = 0; i < tokens; i++) {
    if (rng.chance(0.3)) {
      out.push(word())
      continue
    }
    const s = rng.pick(usable)
    const close = OPENERS[s]
    if (close && pool.has(close)) out.push(`${s}${word()}${close}`)
    else if (CLOSERS.has(s)) {
      const open = Object.entries(OPENERS).find(([, c]) => c === s)?.[0]
      out.push(open && pool.has(open) ? `${open}${word()}${s}` : `${word()}${s}`)
    } else if (TRAILING.has(s)) out.push(`${word()}${s}`)
    else if (s === '-' || s === '_' || s === '/' || s === '@' || s === '.') out.push(`${word()}${s}${word()}`)
    else if (s === '$' || s === '#' || s === '%') out.push(s === '%' ? `${number()}%` : `${s}${number()}`)
    else if ('=+*&<>|\\'.includes(s)) out.push(`${number()} ${s} ${number()}`)
    else out.push(`${word()}${s}`)
  }
  return out.join(' ')
}
