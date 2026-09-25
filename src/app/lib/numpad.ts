import type { Finger } from '@/engine/layouts'

export interface PadKey {
  code: string
  label: string
  /** The character it types with Num Lock on. */
  ch?: string
  finger: Finger
  /** Grid position on a 4 × 5 grid, 1-based; `w`/`h` span columns/rows. */
  col: number
  row: number
  w?: number
  h?: number
  /** The 5 carries the bump, like F and J. */
  home?: boolean
}

/** The standard number pad, fingered with the right hand: index 7 4 1 · middle / 8 5 2 · ring * 9 6 3 · pinky − + · thumb 0. */
export const NUMPAD: readonly PadKey[] = [
  { code: 'NumLock', label: 'Bloq Num', finger: 'RI', col: 1, row: 1 },
  { code: 'NumpadDivide', label: '/', ch: '/', finger: 'RM', col: 2, row: 1 },
  { code: 'NumpadMultiply', label: '*', ch: '*', finger: 'RR', col: 3, row: 1 },
  { code: 'NumpadSubtract', label: '−', ch: '-', finger: 'RP', col: 4, row: 1 },
  { code: 'Numpad7', label: '7', ch: '7', finger: 'RI', col: 1, row: 2 },
  { code: 'Numpad8', label: '8', ch: '8', finger: 'RM', col: 2, row: 2 },
  { code: 'Numpad9', label: '9', ch: '9', finger: 'RR', col: 3, row: 2 },
  { code: 'NumpadAdd', label: '+', ch: '+', finger: 'RP', col: 4, row: 2, h: 2 },
  { code: 'Numpad4', label: '4', ch: '4', finger: 'RI', col: 1, row: 3 },
  { code: 'Numpad5', label: '5', ch: '5', finger: 'RM', col: 2, row: 3, home: true },
  { code: 'Numpad6', label: '6', ch: '6', finger: 'RR', col: 3, row: 3 },
  { code: 'Numpad1', label: '1', ch: '1', finger: 'RI', col: 1, row: 4 },
  { code: 'Numpad2', label: '2', ch: '2', finger: 'RM', col: 2, row: 4 },
  { code: 'Numpad3', label: '3', ch: '3', finger: 'RR', col: 3, row: 4 },
  { code: 'NumpadEnter', label: 'Enter', finger: 'RP', col: 4, row: 4, h: 2 },
  { code: 'Numpad0', label: '0', ch: '0', finger: 'RT', col: 1, row: 5, w: 2 },
  { code: 'NumpadDecimal', label: '.', finger: 'RR', col: 3, row: 5 },
]

const BY_CHAR = new Map(NUMPAD.filter((k) => k.ch).map((k) => [k.ch!, k]))

export const padCode = (ch: string | null | undefined): string | undefined => (ch ? BY_CHAR.get(ch)?.code : undefined)
export const padFinger = (ch: string | null | undefined): Finger | undefined => (ch ? BY_CHAR.get(ch)?.finger : undefined)

export type PadVerdict = 'ok' | 'use-pad' | 'numlock'

/**
 * In number pad lessons: a pad key with Num Lock on passes; the same digit or operator from the main keyboard
 * is refused ('use-pad'); a pad key that sends navigation (Num Lock off) is 'numlock'. Anything else passes.
 */
export function numpadVerdict(e: { key: string; code: string }): PadVerdict {
  if (e.code.startsWith('Numpad')) return e.key.length === 1 || e.key === 'Enter' ? 'ok' : 'numlock'
  return BY_CHAR.has(e.key) ? 'use-pad' : 'ok'
}
