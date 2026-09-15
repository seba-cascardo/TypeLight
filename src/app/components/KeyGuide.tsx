import { useMemo } from 'react'
import type { Finger, Layout } from '@/engine/layouts'
import { fingersFor } from '../lib/fingers'
import { Hands } from './Hands'
import { Keyboard } from './Keyboard'
import { usePressedKeys } from '../hooks/usePressedKeys'

interface Props {
  layout: Layout
  nextChar?: string | null
  highlight?: string[]
  showHands?: boolean
  size?: 'sm' | 'md' | 'lg'
  /** 'row' puts the hands beside the keyboard; 'stack' puts them underneath. */
  arrange?: 'row' | 'stack'
}

/** On-screen keyboard + hands, lit up for the next character. */
export function KeyGuide({ layout, nextChar, highlight, showHands = true, size = 'md', arrange = 'row' }: Props) {
  const pressed = usePressedKeys()
  const fingers = useMemo(() => {
    const set = new Set<Finger>(fingersFor(layout, nextChar))
    for (const h of highlight ?? []) for (const f of fingersFor(layout, h)) set.add(f)
    return [...set]
  }, [layout, nextChar, highlight])
  return (
    <div className={`flex flex-col gap-3 ${arrange === 'row' ? 'md:flex-row md:items-end' : 'items-center'}`}>
      <div className="w-full min-w-0 flex-1">
        <Keyboard layout={layout} nextChar={nextChar} highlight={highlight} pressed={pressed} size={size} />
      </div>
      {showHands && <Hands active={fingers} className={arrange === 'row' ? 'w-44 shrink-0 self-center md:w-52' : 'w-56'} />}
    </div>
  )
}
