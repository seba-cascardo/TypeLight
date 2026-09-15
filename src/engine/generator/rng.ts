/** Small seeded PRNG (mulberry32) so exercises are reproducible in tests. */
export interface Rng {
  next(): number
  int(n: number): number
  pick<T>(arr: readonly T[]): T
  chance(p: number): boolean
  shuffle<T>(arr: T[]): T[]
}

export function makeRng(seed: number = Math.floor(Math.random() * 2 ** 31)): Rng {
  let a = seed >>> 0
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  return {
    next,
    int: (n) => Math.floor(next() * n),
    pick: (arr) => arr[Math.floor(next() * arr.length)],
    chance: (p) => next() < p,
    shuffle: (arr) => {
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1))
        ;[arr[i], arr[j]] = [arr[j], arr[i]]
      }
      return arr
    },
  }
}

/** Pick an index proportionally to weights. */
export function weightedIndex(weights: number[], rng: Rng): number {
  let total = 0
  for (const w of weights) total += w
  let r = rng.next() * total
  for (let i = 0; i < weights.length; i++) {
    r -= weights[i]
    if (r <= 0) return i
  }
  return weights.length - 1
}
