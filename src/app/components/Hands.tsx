import type { Finger } from '@/engine/layouts'
import { FINGER_COLOR, fingerGroup } from '../lib/fingers'

interface Props {
  /** Fingers to light up. */
  active?: Finger[]
  className?: string
}

/**
 * Two hands seen from above, fingers up, in flat illustration.
 *
 * Method: every part (palm, thumb mound, four fingers, thumb) is drawn twice —
 * first as one "outline pass" in the line colour with a thick stroke, then as a
 * "fill pass" in skin colour on top. The union of the parts reads as a single
 * silhouette with one continuous edge, so fingers never look detached from the
 * palm. Details (creases, nails, palm lines) go on last. The left hand is
 * authored in a 190×210 box; the right hand is its mirror.
 */

const SKIN = 'var(--skin)'
const LINE = 'var(--skin-line)'
const NAIL = 'var(--skin-nail)'
const OUTLINE = 3.2

type FingerId = 'P' | 'R' | 'M' | 'I' | 'T'

interface FingerSpec {
  id: FingerId
  /** Base (knuckle) centre. */
  x: number
  y: number
  len: number
  /** Width at the base and at the tip. */
  wb: number
  wt: number
  /** Degrees from vertical; positive leans towards the thumb. */
  angle: number
}

// Proportions of a relaxed adult hand: palm ≈ 100 wide at the knuckles,
// middle finger ≈ 0.9 of the palm length, pinky ≈ 0.7 of the middle finger.
const FINGERS: FingerSpec[] = [
  { id: 'P', x: 50, y: 122, len: 60, wb: 23, wt: 19, angle: -9 },
  { id: 'R', x: 75, y: 110, len: 80, wb: 25, wt: 20, angle: -3 },
  { id: 'M', x: 101, y: 106, len: 86, wb: 26, wt: 21, angle: 0 },
  { id: 'I', x: 127, y: 111, len: 78, wb: 25, wt: 20, angle: 4 },
]
const THUMB: FingerSpec = { id: 'T', x: 152, y: 150, len: 64, wb: 28, wt: 23, angle: 42 }

/** Palm: wrist at the bottom, knuckle arch on top, thumb mound bulging on the right. */
const PALM =
  'M42 208 C34 180 30 156 32 136 C33 124 38 114 46 108 C64 96 86 92 104 94 C116 95 126 99 134 106 ' +
  'C138 112 140 122 141 134 C150 140 160 152 164 168 C167 182 160 196 150 204 C146 207 140 208 134 208 Z'

/** Tapered finger pointing up (−y), base centred at the origin, rounded tip, base sunk into the palm. */
function fingerPath(f: FingerSpec): string {
  const rb = f.wb / 2
  const rt = f.wt / 2
  const top = -(f.len - rt)
  return `M ${-rb} 10 L ${-rb} -4 L ${-rt} ${top} A ${rt} ${rt} 0 0 1 ${rt} ${top} L ${rb} -4 L ${rb} 10 Z`
}

/** The part of the finger that shows above the palm, as an open path (for the active outline). */
function fingerOutline(f: FingerSpec): string {
  const rb = f.wb / 2
  const rt = f.wt / 2
  const top = -(f.len - rt)
  return `M ${-rb} -2 L ${-rt} ${top} A ${rt} ${rt} 0 0 1 ${rt} ${top} L ${rb} -2`
}

function creasePath(f: FingerSpec, at: number): string {
  const w = f.wb + (f.wt - f.wb) * at
  const y = -f.len * at
  return `M ${-w * 0.3} ${y} Q 0 ${y - 2.5} ${w * 0.3} ${y}`
}

function fingerId(id: FingerId, side: 'L' | 'R'): Finger {
  return `${side}${id}` as Finger
}

function transformOf(f: FingerSpec, on: boolean): string {
  return `translate(${f.x} ${f.y}) rotate(${f.angle})${on ? ' translate(0 -6)' : ''}`
}

function Hand({ side, active }: { side: 'L' | 'R'; active: Set<Finger> }) {
  const on = (id: FingerId) => active.has(fingerId(id, side))
  const parts = [THUMB, ...FINGERS]
  const style = { transition: 'transform 140ms ease' }
  return (
    <g transform={side === 'R' ? 'translate(440 0) scale(-1 1)' : undefined}>
      {/* 1 · outline pass: everything in line colour, fattened by the stroke */}
      <g fill={LINE} stroke={LINE} strokeWidth={OUTLINE} strokeLinejoin="round">
        {parts.map((f) => (
          <path key={f.id} d={fingerPath(f)} transform={transformOf(f, on(f.id))} style={style} />
        ))}
        <path d={PALM} />
      </g>
      {/* 2 · fill pass: same shapes in skin, no stroke — the union becomes one silhouette */}
      <g fill="url(#skinGrad)">
        <path d={fingerPath(THUMB)} transform={transformOf(THUMB, on('T'))} style={style} />
        <path d={PALM} />
        {FINGERS.map((f) => (
          <path key={f.id} d={fingerPath(f)} transform={transformOf(f, on(f.id))} style={style} />
        ))}
      </g>
      {/* 3 · details */}
      <g fill="none" stroke={LINE} strokeLinecap="round">
        {/* knuckle line: a soft arc where each finger meets the palm */}
        {FINGERS.map((f) => (
          <path key={f.id} d={`M ${f.x - 8} ${f.y + 3} Q ${f.x} ${f.y - 3} ${f.x + 8} ${f.y + 3}`} strokeWidth="1.3" opacity="0.5" />
        ))}
        {/* thumb crease where it meets the mound */}
        <path d="M144 146 Q152 150 156 160" strokeWidth="1.3" opacity="0.4" />
        {/* palm lines */}
        <path d="M60 158 Q98 138 136 136" strokeWidth="1.3" opacity="0.4" />
        <path d="M52 176 Q86 158 118 156" strokeWidth="1.3" opacity="0.3" />
      </g>
      {parts.map((f) => {
        const rt = f.wt / 2
        const nailW = f.wt * 0.52
        const nailH = f.len * 0.15
        const nailY = -(f.len - rt * 0.15) + 1
        const lit = on(f.id)
        return (
          <g key={f.id} transform={transformOf(f, lit)} style={style}>
            {(f.id === 'T' ? [0.52] : [0.42, 0.72]).map((at) => (
              <path key={at} d={creasePath(f, at)} fill="none" stroke={LINE} strokeWidth="1.2" strokeLinecap="round" opacity="0.4" />
            ))}
            <rect x={-nailW / 2} y={nailY} width={nailW} height={nailH} rx={nailW * 0.4} fill={NAIL} stroke={LINE} strokeWidth="0.8" opacity="0.8" />
            {lit && (
              <>
                <path d={fingerPath(f)} fill={FINGER_COLOR[fingerGroup(fingerId(f.id, side))]} opacity="0.55" />
                <path d={fingerOutline(f)} fill="none" stroke="var(--color-ink)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
              </>
            )}
          </g>
        )
      })}
    </g>
  )
}

export function Hands({ active = [], className = '' }: Props) {
  const set = new Set(active)
  return (
    <svg viewBox="0 0 440 214" className={className} aria-hidden="true">
      <defs>
        {/* userSpaceOnUse so the palm and the fingers share one continuous shading */}
        <linearGradient id="skinGrad" gradientUnits="userSpaceOnUse" x1="20" y1="0" x2="180" y2="0">
          <stop offset="0" stopColor="var(--skin-shade)" />
          <stop offset="0.3" stopColor={SKIN} />
          <stop offset="1" stopColor={SKIN} />
        </linearGradient>
      </defs>
      <Hand side="L" active={set} />
      <Hand side="R" active={set} />
    </svg>
  )
}
