import { dominance, type KeyStats } from '@/engine/stats'
import { resolveChar, shiftCodeFor, type Finger, type Layout } from '@/engine/layouts'

export type FingerGroup = 'pinky' | 'ring' | 'middle' | 'index' | 'thumb'

export function fingerGroup(f: Finger): FingerGroup {
  switch (f) {
    case 'LP':
    case 'RP':
      return 'pinky'
    case 'LR':
    case 'RR':
      return 'ring'
    case 'LM':
    case 'RM':
      return 'middle'
    case 'LI':
    case 'RI':
      return 'index'
    default:
      return 'thumb'
  }
}

export const FINGER_COLOR: Record<FingerGroup, string> = {
  pinky: 'var(--color-finger-pinky)',
  ring: 'var(--color-finger-ring)',
  middle: 'var(--color-finger-middle)',
  index: 'var(--color-finger-index)',
  thumb: 'var(--color-finger-thumb)',
}

/** Opacity of the guide hands for the next key: they fade as the key is owned, never below 30 % (the app cannot see the finger). */
export function handsOpacityFor(keys: KeyStats, ch: string | null | undefined, goalWpm: number): number {
  if (!ch) return 1
  return Math.max(0.3, 1 - dominance(keys[ch], goalWpm))
}

/** Fingers involved in typing `ch`: the typing finger, plus shift pinky / AltGr thumb. */
export function fingersFor(layout: Layout, ch: string | null | undefined): Finger[] {
  if (!ch) return []
  const seq = resolveChar(layout, ch)
  if (!seq) return []
  const out = new Set<Finger>()
  for (const p of seq) {
    out.add(p.finger)
    if (p.shift) out.add(shiftCodeFor(p.finger) === 'ShiftLeft' ? 'LP' : 'RP')
    if (p.altGr) out.add('RT')
  }
  return [...out]
}
