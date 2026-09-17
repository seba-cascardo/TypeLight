import { fingerFor, type Layout } from '../layouts'
import type { BigramSample } from '../typing'
import { alphaFor } from './index'

/** Rolling stats for one in-word bigram. Latency of the second key when both were right. */
export interface BigramStat {
  latencyEma: number
  errorEma: number
  samples: number
}

export type BigramStats = Record<string, BigramStat>

export const MAX_BIGRAMS = 600
/** A bigram needs this many samples before it is judged. */
export const MIN_BIGRAM_SAMPLES = 5

/** Fold a session's bigram samples in with the same sample-weighted step as the keys; cap the table by samples. */
export function updateBigramStats(stats: BigramStats, samples: Iterable<BigramSample>): BigramStats {
  const next: BigramStats = { ...stats }
  for (const s of samples) {
    const attempts = s.latencies.length + s.errors
    if (attempts === 0) continue
    const errRate = s.errors / attempts
    const mean = s.latencies.length ? s.latencies.reduce((a, b) => a + b, 0) / s.latencies.length : undefined
    const prev = next[s.bigram]
    if (!prev) {
      next[s.bigram] = { latencyEma: mean ?? 600, errorEma: errRate, samples: attempts }
      continue
    }
    const a = alphaFor(attempts, prev.samples)
    next[s.bigram] = {
      latencyEma: mean === undefined ? prev.latencyEma : prev.latencyEma + a * (mean - prev.latencyEma),
      errorEma: prev.errorEma + a * (errRate - prev.errorEma),
      samples: prev.samples + attempts,
    }
  }
  const entries = Object.entries(next)
  if (entries.length <= MAX_BIGRAMS) return next
  // drop the least sampled; on ties the oldest entries (insertion order) go first
  entries.sort((x, y) => x[1].samples - y[1].samples)
  const drop = new Set(entries.slice(0, entries.length - MAX_BIGRAMS).map(([k]) => k))
  return Object.fromEntries(entries.filter(([k]) => !drop.has(k)))
}

/** Dhakal 2018's four classes: the alternating-hand and same-finger pairs are what separate slow from fast. */
export type BigramClass = 'alt' | 'hand' | 'finger' | 'repeat'

export const BIGRAM_CLASS_NAME: Record<BigramClass, string> = {
  alt: 'alternancia de manos',
  hand: 'misma mano',
  finger: 'mismo dedo',
  repeat: 'letra doble',
}

export function bigramClass(layout: Layout, bigram: string): BigramClass | null {
  const [a, b] = [...bigram]
  if (!a || !b || a === ' ' || b === ' ') return null
  if (a === b) return 'repeat'
  const fa = fingerFor(layout, a)
  const fb = fingerFor(layout, b)
  if (!fa || !fb) return null
  if (fa === fb) return 'finger'
  return fa[0] === fb[0] ? 'hand' : 'alt'
}

export interface ClassSummary {
  /** Samples-weighted mean latency, ms. */
  latency: number
  samples: number
}

/** Mean latency per class over the bigrams with enough samples. */
export function bigramClasses(stats: BigramStats, layout: Layout): Partial<Record<BigramClass, ClassSummary>> {
  const acc: Partial<Record<BigramClass, { sum: number; samples: number }>> = {}
  for (const [bigram, st] of Object.entries(stats)) {
    if (st.samples < MIN_BIGRAM_SAMPLES) continue
    const cls = bigramClass(layout, bigram)
    if (!cls) continue
    const a = (acc[cls] ??= { sum: 0, samples: 0 })
    a.sum += st.latencyEma * st.samples
    a.samples += st.samples
  }
  const out: Partial<Record<BigramClass, ClassSummary>> = {}
  for (const [cls, a] of Object.entries(acc) as [BigramClass, { sum: number; samples: number }][]) {
    out[cls] = { latency: Math.round(a.sum / a.samples), samples: a.samples }
  }
  return out
}

export function bigramWeakness(st: BigramStat): number {
  return st.latencyEma / 400 + st.errorEma * 4
}

/** The `n` weakest bigrams typeable with `pool`, among those with enough samples. */
export function weakestBigrams(stats: BigramStats, pool: ReadonlySet<string>, n = 3): string[] {
  return Object.entries(stats)
    .filter(([bigram, st]) => st.samples >= MIN_BIGRAM_SAMPLES && [...bigram].every((c) => pool.has(c)))
    .map(([bigram, st]) => ({ bigram, score: bigramWeakness(st) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, n)
    .map((x) => x.bigram)
}
