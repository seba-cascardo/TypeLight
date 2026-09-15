import type { Finger } from '@/engine/layouts'
import { DORSUM_H, DORSUM_INK, DORSUM_W } from '../assets/handDorsum'
import handMask from '../assets/hand-mask.png'
import { FINGER_COLOR, fingerGroup } from '../lib/fingers'

interface Props {
  /** Fingers to light up. */
  active?: Finger[]
  className?: string
}

/**
 * Two hands seen from above, built on a public-domain anatomical ink drawing
 * of the back of a right hand (see assets/handDorsum.ts). Under the ink goes
 * the hand's silhouette filled with skin — a mask derived from the drawing
 * itself by scripts/build-hand-mask.py, so it hugs the ink exactly — and the
 * active finger gets a colour tint clipped to that silhouette plus a marker on
 * the fingertip. The left hand is the mirror image.
 */

type FingerId = 'P' | 'R' | 'M' | 'I' | 'T'

/** Finger axes on the same grid: tip → base, plus the tint width. */
const FINGERS: Record<FingerId, { tip: [number, number]; base: [number, number]; w: number }> = {
  T: { tip: [48, 132], base: [74, 198], w: 30 },
  I: { tip: [104, 30], base: [95, 144], w: 30 },
  M: { tip: [150, 18], base: [147, 144], w: 30 },
  R: { tip: [195, 32], base: [187, 150], w: 28 },
  P: { tip: [236, 76], base: [224, 164], w: 26 },
}

function fingerId(id: FingerId, side: 'L' | 'R'): Finger {
  return `${side}${id}` as Finger
}

function Hand({ side, active }: { side: 'L' | 'R'; active: Set<Finger> }) {
  const mask = `hand-mask-${side}`
  const lit = (Object.keys(FINGERS) as FingerId[]).filter((id) => active.has(fingerId(id, side)))
  return (
    <g transform={side === 'L' ? `translate(${DORSUM_W} 0) scale(-1 1)` : undefined}>
      <defs>
        <mask id={mask} maskUnits="userSpaceOnUse" x="0" y="0" width={DORSUM_W} height={DORSUM_H}>
          <image href={handMask} x="0" y="0" width={DORSUM_W} height={DORSUM_H} />
        </mask>
      </defs>
      {/* skin under the ink, cut to the silhouette */}
      <rect x="0" y="0" width={DORSUM_W} height={DORSUM_H} fill="url(#skinGrad)" mask={`url(#${mask})`} />
      {/* active finger tint, cut to the hand */}
      <g mask={`url(#${mask})`}>
        {lit.map((id) => {
          const f = FINGERS[id]
          return (
            <line
              key={id}
              x1={f.tip[0]}
              y1={f.tip[1]}
              x2={f.base[0]}
              y2={f.base[1]}
              stroke={FINGER_COLOR[fingerGroup(fingerId(id, side))]}
              strokeWidth={f.w}
              strokeLinecap="round"
              opacity="0.75"
              style={{ mixBlendMode: 'multiply' }}
            />
          )
        })}
      </g>
      {/* the drawing itself */}
      <path d={DORSUM_INK} fill="var(--skin-line)" />
      {/* glowing fingertip on the active finger */}
      {lit.map((id) => {
        const f = FINGERS[id]
        return (
          <g key={id} className="hand-tip">
            <circle cx={f.tip[0]} cy={f.tip[1]} r="9" fill="var(--color-keycap)" stroke="var(--color-ink)" strokeWidth="2.5" />
            <circle cx={f.tip[0]} cy={f.tip[1]} r="4" fill={FINGER_COLOR[fingerGroup(fingerId(id, side))]} />
          </g>
        )
      })}
    </g>
  )
}

export function Hands({ active = [], className = '' }: Props) {
  const set = new Set(active)
  const gap = 40
  return (
    <svg viewBox={`0 0 ${DORSUM_W * 2 + gap} ${DORSUM_H}`} className={className} aria-hidden="true">
      <defs>
        <linearGradient id="skinGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--skin)" />
          <stop offset="1" stopColor="var(--skin-shade)" />
        </linearGradient>
      </defs>
      <Hand side="L" active={set} />
      <g transform={`translate(${DORSUM_W + gap} 0)`}>
        <Hand side="R" active={set} />
      </g>
    </svg>
  )
}
