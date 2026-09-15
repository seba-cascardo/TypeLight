import { useMemo } from 'react'
import { resolveChar, shiftCodeFor, type Finger, type Layout } from '@/engine/layouts'
import { Hands } from './Hands'
import { Keyboard } from './Keyboard'
import { usePressedKeys } from '../hooks/usePressedKeys'

interface Props {
  layout: Layout
  nextChar?: string | null
  highlight?: string[]
  showHands?: boolean
  size?: 'sm' | 'md' | 'lg'
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

/** On-screen keyboard + hands, lit up for the next character. */
export function KeyGuide({ layout, nextChar, highlight, showHands = true, size = 'md' }: Props) {
  const pressed = usePressedKeys()
  const fingers = useMemo(() => {
    const set = new Set<Finger>(fingersFor(layout, nextChar))
    for (const h of highlight ?? []) for (const f of fingersFor(layout, h)) set.add(f)
    return [...set]
  }, [layout, nextChar, highlight])
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-end">
      <div className="min-w-0 flex-1">
        <Keyboard layout={layout} nextChar={nextChar} highlight={highlight} pressed={pressed} size={size} />
      </div>
      {showHands && <Hands active={fingers} className="w-44 shrink-0 self-center md:w-52" />}
    </div>
  )
}
