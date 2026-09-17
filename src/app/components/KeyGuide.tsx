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
  /** 0..1: the hands fade as the next key is owned (see `handsOpacityFor`). */
  handsOpacity?: number
  size?: 'sm' | 'md' | 'lg'
  /** 'row' puts the hands beside the keyboard; 'stack' puts them underneath. */
  arrange?: 'row' | 'stack'
}

/** On-screen keyboard + hands, lit up for the next character. */
export function KeyGuide({ layout, nextChar, highlight, showHands = true, handsOpacity = 1, size = 'md', arrange = 'stack' }: Props) {
  const pressed = usePressedKeys()
  const fingers = useMemo(() => {
    const set = new Set<Finger>(fingersFor(layout, nextChar))
    for (const h of highlight ?? []) for (const f of fingersFor(layout, h)) set.add(f)
    return [...set]
  }, [layout, nextChar, highlight])
  return (
    <div className={`flex flex-col gap-2 ${arrange === 'row' ? 'md:flex-row md:items-end md:gap-4' : 'items-center'}`}>
      <div className="w-full min-w-0 flex-1">
        <Keyboard layout={layout} nextChar={nextChar} highlight={highlight} pressed={pressed} size={size} />
      </div>
      {showHands && (
        <div style={{ opacity: handsOpacity, transition: 'opacity 300ms ease' }} data-testid="hands" data-opacity={handsOpacity.toFixed(2)} className={arrange === 'row' ? 'shrink-0 self-center' : 'w-full max-w-lg'}>
          <Hands active={fingers} className={arrange === 'row' ? 'w-52 md:w-64' : 'w-full'} />
        </div>
      )}
    </div>
  )
}
