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
