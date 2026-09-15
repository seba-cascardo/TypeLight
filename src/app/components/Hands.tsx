import type { Finger } from '@/engine/layouts'
import { DORSUM_H, DORSUM_INK, DORSUM_W } from '../assets/handDorsum'
import { FINGER_COLOR, fingerGroup } from '../lib/fingers'

interface Props {
  /** Fingers to light up. */
  active?: Finger[]
  className?: string
}

/**
 * Two hands seen from above, built on a public-domain anatomical ink drawing
 * of the back of a right hand (see assets/handDorsum.ts). Under the ink goes a
 * hand-traced silhouette filled with skin, so the drawing reads as a coloured
 * illustration; the active finger gets a colour tint clipped to that
 * silhouette and a glowing fingertip. The left hand is the mirror image.
 */

type FingerId = 'P' | 'R' | 'M' | 'I' | 'T'

/** Silhouette traced on the drawing's 257×349 grid, clockwise from the wrist. */
const OUTLINE: [number, number][] = [
  [97, 349], [96, 322], [92, 302], [84, 284], [72, 264], [60, 242], [50, 220], [42, 202], [38, 182], [36, 162],
  [36, 144], [38, 130], [42, 122], [49, 118], [57, 121], [63, 132], [68, 150], [72, 170], [76, 190], [80, 204],
  [84, 192], [86, 160], [88, 122], [90, 82], [92, 52], [94, 32], [98, 22], [106, 18], [113, 22], [117, 32],
  [118, 60], [120, 100], [124, 134], [127, 142], [130, 122], [134, 82], [138, 42], [141, 18], [146, 9], [153, 8],
  [160, 14], [163, 30], [165, 62], [167, 102], [169, 140], [172, 146], [175, 122], [179, 82], [183, 46], [187, 28],
  [193, 20], [200, 22], [206, 32], [208, 60], [210, 100], [213, 140], [216, 156], [219, 138], [223, 108], [226, 86],
  [230, 70], [236, 64], [243, 68], [247, 80], [246, 104], [240, 132], [232, 160], [228, 180], [226, 202], [222, 232],
  [218, 262], [212, 292], [206, 322], [204, 349],
]

/** Finger axes on the same grid: tip → base, plus the tint width. */
const FINGERS: Record<FingerId, { tip: [number, number]; base: [number, number]; w: number }> = {
  T: { tip: [48, 132], base: [76, 206], w: 30 },
  I: { tip: [104, 30], base: [94, 152], w: 30 },
  M: { tip: [150, 18], base: [147, 152], w: 30 },
  R: { tip: [195, 32], base: [186, 158], w: 28 },
  P: { tip: [236, 76], base: [223, 172], w: 26 },
}

/** Catmull-Rom → cubic Bézier, closed. */
function smoothPath(pts: [number, number][]): string {
  const n = pts.length
  let d = `M ${pts[0][0]} ${pts[0][1]}`
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n]
    const p1 = pts[i]
    const p2 = pts[(i + 1) % n]
    const p3 = pts[(i + 2) % n]
    const c1x = p1[0] + (p2[0] - p0[0]) / 6
    const c1y = p1[1] + (p2[1] - p0[1]) / 6
    const c2x = p2[0] - (p3[0] - p1[0]) / 6
    const c2y = p2[1] - (p3[1] - p1[1]) / 6
    d += ` C ${c1x.toFixed(1)} ${c1y.toFixed(1)} ${c2x.toFixed(1)} ${c2y.toFixed(1)} ${p2[0]} ${p2[1]}`
  }
  return d + ' Z'
}

const SILHOUETTE = smoothPath(OUTLINE)

function fingerId(id: FingerId, side: 'L' | 'R'): Finger {
  return `${side}${id}` as Finger
}

function Hand({ side, active }: { side: 'L' | 'R'; active: Set<Finger> }) {
  const clip = `hand-clip-${side}`
  const lit = (Object.keys(FINGERS) as FingerId[]).filter((id) => active.has(fingerId(id, side)))
  return (
    <g transform={side === 'L' ? `translate(${DORSUM_W} 0) scale(-1 1)` : undefined}>
      <defs>
        <clipPath id={clip}>
          <path d={SILHOUETTE} />
        </clipPath>
      </defs>
      {/* skin under the ink */}
      <path d={SILHOUETTE} fill="url(#skinGrad)" />
      {/* active finger tint, clipped to the hand */}
      <g clipPath={`url(#${clip})`}>
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
