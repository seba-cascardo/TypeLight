import type { Finger } from '@/engine/layouts'
import { DORSUM_H, DORSUM_INK, DORSUM_W } from '../assets/handDorsum'
import handMask from '../assets/hand-mask.png'
import { FINGER_COLOR, fingerGroup } from '../lib/fingers'

interface Props {
  /** Fingers to light up. */
  active?: Finger[]
  /** Progreso's finger map: tint opacity per finger (0..1), no fingertip marker. */
  tints?: Partial<Record<Finger, number>>
  /** Label drawn in a bubble at each fingertip (with `tints`). */
  labels?: Partial<Record<Finger, string>>
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

const IDS = Object.keys(FINGERS) as FingerId[]

function fingerId(id: FingerId, side: 'L' | 'R'): Finger {
  return `${side}${id}` as Finger
}

function Hand({ side, active, tints }: { side: 'L' | 'R'; active: Set<Finger>; tints?: Partial<Record<Finger, number>> }) {
  const mask = `hand-mask-${side}`
  const lit = tints ? IDS.filter((id) => (tints[fingerId(id, side)] ?? 0) > 0) : IDS.filter((id) => active.has(fingerId(id, side)))
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
              opacity={tints ? tints[fingerId(id, side)] : 0.75}
              style={{ mixBlendMode: 'multiply' }}
            />
          )
        })}
      </g>
      {/* the drawing itself */}
      <path d={DORSUM_INK} fill="var(--skin-line)" />
      {/* glowing fingertip on the active finger */}
      {!tints &&
        lit.map((id) => {
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

/** Label bubbles, drawn outside the mirrored group so the text reads left to right. Staggered so they don't collide. */
function Labels({ side, labels, dx }: { side: 'L' | 'R'; labels: Partial<Record<Finger, string>>; dx: number }) {
  return (
    <g>
      {IDS.map((id) => {
        const text = labels[fingerId(id, side)]
        if (!text) return null
        const f = FINGERS[id]
        const tx = dx + (side === 'L' ? DORSUM_W - f.tip[0] : f.tip[0])
        const ty = f.tip[1]
        const ox = id === 'T' ? (side === 'L' ? 46 : -46) : 0
        const oy = id === 'T' ? 0 : id === 'M' ? -46 : -20
        return (
          <g key={id} data-testid={`finger-${fingerId(id, side)}`}>
            <rect x={tx + ox - 27} y={ty + oy - 14} width="54" height="26" rx="8" fill="var(--color-keycap)" stroke="var(--color-ink)" strokeWidth="2" />
            <text x={tx + ox} y={ty + oy + 6} textAnchor="middle" fontSize="18" fontWeight="800" fontFamily="var(--font-display)" fill="var(--color-ink)">
              {text}
            </text>
          </g>
        )
      })}
    </g>
  )
}

export function Hands({ active = [], tints, labels, className = '' }: Props) {
  const set = new Set(active)
  // The finger map spreads the hands so the thumb bubbles fit between them.
  const gap = labels ? 130 : 40
  const top = labels ? -50 : 0
  return (
    <svg viewBox={`0 ${top} ${DORSUM_W * 2 + gap} ${DORSUM_H - top}`} className={className} aria-hidden="true">
      <defs>
        <linearGradient id="skinGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--skin)" />
          <stop offset="1" stopColor="var(--skin-shade)" />
        </linearGradient>
      </defs>
      <Hand side="L" active={set} tints={tints} />
      <g transform={`translate(${DORSUM_W + gap} 0)`}>
        <Hand side="R" active={set} tints={tints} />
      </g>
      {labels && (
        <>
          <Labels side="L" labels={labels} dx={0} />
          <Labels side="R" labels={labels} dx={DORSUM_W + gap} />
        </>
      )}
    </svg>
  )
}
