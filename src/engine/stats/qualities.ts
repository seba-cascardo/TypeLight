import { fingerFor, rowFor, type Layout } from '../layouts'
import { bigramClasses, type BigramStats } from './bigrams'
import type { KeyStats } from './index'

const PLAIN_LETTER = /^[a-zñ]$/
const ACCENTED = /^[áéíóúü]$/
const VOWEL = /^[aeiou]$/

const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null)

/**
 * What the weakness is made of, in words: a hand, a row, same-finger transitions, doubled letters or
 * the dead key. Fixed priority, at most two. Only keys with enough samples count.
 */
export function weaknessQualities(keys: KeyStats, bigrams: BigramStats, layout: Layout, learned: readonly string[]): string[] {
  const out: string[] = []
  const known = learned.filter((c) => keys[c] && keys[c].samples >= 5)
  const letters = known.filter((c) => PLAIN_LETTER.test(c))
  const lat = (c: string) => keys[c].latencyEma

  const left = mean(letters.filter((c) => fingerFor(layout, c)?.startsWith('L')).map(lat))
  const right = mean(letters.filter((c) => fingerFor(layout, c)?.startsWith('R')).map(lat))
  if (left !== null && right !== null) {
    if (right > left * 1.2) out.push('mano derecha')
    else if (left > right * 1.2) out.push('mano izquierda')
  }

  const home = mean(letters.filter((c) => rowFor(layout, c) === 2).map(lat))
  if (home !== null) {
    const rows: [number, string][] = [
      [1, 'fila superior'],
      [3, 'fila inferior'],
      [0, 'fila de números'],
    ]
    for (const [row, name] of rows) {
      const v = mean(known.filter((c) => rowFor(layout, c) === row).map(lat))
      if (v !== null && v > home * 1.2) {
        out.push(name)
        break
      }
    }
  }

  const classes = bigramClasses(bigrams, layout)
  const alt = classes.alt?.latency
  if (alt) {
    if (classes.finger && classes.finger.latency > alt * 1.3) out.push('mismo dedo')
    if (classes.repeat && classes.repeat.latency > alt * 1.3) out.push('letras dobles')
  }

  const accented = mean(known.filter((c) => ACCENTED.test(c)).map(lat))
  const vowels = mean(known.filter((c) => VOWEL.test(c)).map(lat))
  if (accented !== null && vowels !== null && accented > vowels * 1.4) out.push('tecla muerta')

  return out.slice(0, 2)
}
