import type { WordSample } from '../typing'
import { alphaFor } from './index'

/** Rolling stats for one word: mean letter latency and how often it carried an error. */
export interface WordStat {
  latencyEma: number
  /** Share of times the word was typed with at least one error. */
  errorEma: number
  samples: number
  lastSeen: string
}

export type WordStats = Record<string, WordStat>

export const MAX_WORDS = 400
export const MIN_WORD_SAMPLES = 2

/** Fold a session's word samples in (one sample per word occurrence); cap the table, dropping the least seen. */
export function updateWordStats(stats: WordStats, samples: Iterable<WordSample>, today: string): WordStats {
  const next: WordStats = { ...stats }
  for (const s of samples) {
    const erred = s.errors > 0 ? 1 : 0
    const prev = next[s.word]
    if (!prev) {
      next[s.word] = { latencyEma: s.latency ?? 600, errorEma: erred, samples: 1, lastSeen: today }
      continue
    }
    const a = alphaFor(1, prev.samples)
    next[s.word] = {
      latencyEma: s.latency === null ? prev.latencyEma : prev.latencyEma + a * (s.latency - prev.latencyEma),
      errorEma: prev.errorEma + a * (erred - prev.errorEma),
      samples: prev.samples + 1,
      lastSeen: today,
    }
  }
  const entries = Object.entries(next)
  if (entries.length <= MAX_WORDS) return next
  entries.sort((x, y) => x[1].samples - y[1].samples || (x[1].lastSeen < y[1].lastSeen ? -1 : 1))
  const drop = new Set(entries.slice(0, entries.length - MAX_WORDS).map(([k]) => k))
  return Object.fromEntries(entries.filter(([k]) => !drop.has(k)))
}

export function wordWeakness(st: WordStat): number {
  return st.errorEma * 4 + st.latencyEma / 400
}

/** The `n` words that most often carried an error or came out slow, among those seen at least twice. */
export function weakestWords(stats: WordStats, n = 6): string[] {
  return Object.entries(stats)
    .filter(([, st]) => st.samples >= MIN_WORD_SAMPLES)
    .map(([word, st]) => ({ word, score: wordWeakness(st) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, n)
    .map((x) => x.word)
}

/** Words that resisted in one session: with an error, or slower than 1.5× the session's mean letter latency. */
export function resistedWords(samples: Iterable<WordSample>, max = 5): string[] {
  const list = [...samples]
  const measured = list.filter((w) => w.latency !== null)
  const mean = measured.length ? measured.reduce((a, w) => a + (w.latency ?? 0), 0) / measured.length : 0
  return list
    .filter((w) => w.errors > 0 || (w.latency !== null && mean > 0 && w.latency > 1.5 * mean))
    .sort((a, b) => b.errors - a.errors || (b.latency ?? 0) - (a.latency ?? 0))
    .slice(0, max)
    .map((w) => w.word)
}
