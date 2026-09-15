export type Finger = 'LP' | 'LR' | 'LM' | 'LI' | 'LT' | 'RT' | 'RI' | 'RM' | 'RR' | 'RP'
export type Hand = 'L' | 'R'
export type DeadKind = 'acute' | 'grave' | 'diaeresis' | 'circumflex' | 'tilde'

export interface KeyDef {
  /** KeyboardEvent.code */
  code: string
  /** Character produced without modifiers. Empty for dead keys and modifiers. */
  base: string
  shift?: string
  altGr?: string
  /** If set, the base position is a dead key of this kind. */
  dead?: DeadKind
  /** If set, the shifted position is a dead key of this kind. */
  shiftDead?: DeadKind
  finger: Finger
  /** Width in key units (1 = letter key). */
  width?: number
  /** Legend override for non-character keys. */
  label?: string
  /** Home-row resting key. */
  home?: boolean
}

export type LayoutId = 'us' | 'es' | 'latam'

export interface Layout {
  id: LayoutId
  name: string
  /** Short description shown in the picker. */
  hint: string
  rows: KeyDef[][]
}

/** One physical key press needed to produce (part of) a character. */
export interface KeyPress {
  code: string
  finger: Finger
  shift: boolean
  altGr: boolean
  /** The character this press produces on its own ('' for dead keys). */
  produces: string
}

export const FINGER_NAMES: Record<Finger, string> = {
  LP: 'meñique izquierdo',
  LR: 'anular izquierdo',
  LM: 'medio izquierdo',
  LI: 'índice izquierdo',
  LT: 'pulgar izquierdo',
  RT: 'pulgar derecho',
  RI: 'índice derecho',
  RM: 'medio derecho',
  RR: 'anular derecho',
  RP: 'meñique derecho',
}

export function handOf(f: Finger): Hand {
  return f.startsWith('L') ? 'L' : 'R'
}
