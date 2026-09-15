import type { Finger } from '@/engine/layouts'
import { FINGER_COLOR, fingerGroup } from '../lib/fingers'

interface Props {
  /** Fingers to light up. */
  active?: Finger[]
  className?: string
}

/**
 * Two hands seen from above, fingers pointing up, drawn as flat illustration:
 * tapered fingers with joint creases and nails, a palm with a knuckle arch and
 * a thumb mound. The left hand is authored in a 170×200 box; the right one is
 * its mirror image. The active finger lifts and takes its key colour.
 */

const SKIN = 'var(--skin)'
const SHADE = 'var(--skin-shade)'
const LINE = 'var(--skin-line)'
const NAIL = 'var(--skin-nail)'

interface FingerSpec {
  id: 'P' | 'R' | 'M' | 'I' | 'T'
  x: number
  y: number
  len: number
  wb: number
  wt: number
  angle: number
}

const FINGERS: FingerSpec[] = [
  { id: 'P', x: 40, y: 114, len: 64, wb: 22, wt: 18, angle: -11 },
  { id: 'R', x: 64, y: 102, len: 84, wb: 24, wt: 20, angle: -4 },
  { id: 'M', x: 90, y: 97, len: 92, wb: 25, wt: 21, angle: 0 },
  { id: 'I', x: 116, y: 102, len: 82, wb: 24, wt: 20, angle: 5 },
]
const THUMB: FingerSpec = { id: 'T', x: 148, y: 142, len: 70, wb: 30, wt: 24, angle: 44 }

const PALM =
  'M36 196 C30 170 26 150 26 130 C26 116 30 108 34 104 C50 92 70 88 90 88 C110 88 126 92 134 100 ' +
  'C138 106 140 114 142 124 C152 134 160 148 160 164 C160 176 150 186 140 190 C134 192 128 194 122 196 Z'

/** Tapered finger pointing up (−y), base centred at the origin. `closed` adds the base edge (for fills). */
function fingerPath(f: FingerSpec, closed = true): string {
  const rb = f.wb / 2
  const rt = f.wt / 2
  const top = -(f.len - rt)
  return `M ${-rb} 4 L ${-rt} ${top} A ${rt} ${rt} 0 0 1 ${rt} ${top} L ${rb} 4${closed ? ' Z' : ''}`
}

function creasePath(f: FingerSpec, at: number): string {
  const w = f.wb + (f.wt - f.wb) * at
  const y = -f.len * at
  return `M ${-w * 0.34} ${y} Q 0 ${y - 3.5} ${w * 0.34} ${y}`
}

function Finger({ f, on }: { f: FingerSpec; on: boolean }) {
  const rt = f.wt / 2
  const nailH = f.len * 0.17
  const nailW = f.wt * 0.58
  const nailY = -(f.len - rt * 0.25) + 2
  const lift = on ? ' translate(0 -7)' : ''
  const creases = f.id === 'T' ? [0.5] : [0.4, 0.7]
  return (
    <g transform={`translate(${f.x} ${f.y}) rotate(${f.angle})${lift}`} style={{ transition: 'transform 140ms ease' }}>
      <path d={fingerPath(f)} fill="url(#skinGrad)" />
      <path d={fingerPath(f, false)} fill="none" stroke={LINE} strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" />
      {creases.map((at) => (
        <path key={at} d={creasePath(f, at)} fill="none" stroke={LINE} strokeWidth="1.4" strokeLinecap="round" opacity="0.55" />
      ))}
      <rect x={-nailW / 2} y={nailY} width={nailW} height={nailH} rx={nailW * 0.42} fill={NAIL} stroke={LINE} strokeWidth="1" opacity="0.95" />
      {on && (
        <>
          <path d={fingerPath(f)} fill={FINGER_COLOR[fingerGroup(fingerId(f.id, 'L'))]} opacity="0.55" />
          <path d={fingerPath(f, false)} fill="none" stroke="var(--color-ink)" strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" />
        </>
      )}
    </g>
  )
}

function fingerId(id: FingerSpec['id'], side: 'L' | 'R'): Finger {
  return `${side}${id}` as Finger
}

function Hand({ side, active }: { side: 'L' | 'R'; active: Set<Finger> }) {
  const on = (id: FingerSpec['id']) => active.has(fingerId(id, side))
  return (
    <g transform={side === 'R' ? 'translate(420 0) scale(-1 1)' : undefined}>
      {/* thumb sits behind the palm mound */}
      <Finger f={THUMB} on={on('T')} />
      {/* palm: fill hides the finger bases; a separate open stroke keeps the knuckle edge soft */}
      <path d={PALM} fill="url(#palmGrad)" />
      <path
        d="M36 196 C30 170 26 150 26 130 C26 116 30 108 34 104 M134 100 C138 106 140 114 142 124 C152 134 160 148 160 164 C160 176 150 186 140 190 C134 192 128 194 122 196"
        fill="none"
        stroke={LINE}
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      {/* knuckle dimples */}
      {FINGERS.map((f) => (
        <path
          key={f.id}
          d={`M ${f.x - 7} ${f.y - 2} Q ${f.x} ${f.y - 7} ${f.x + 7} ${f.y - 2}`}
          fill="none"
          stroke={LINE}
          strokeWidth="1.3"
          strokeLinecap="round"
          opacity="0.5"
        />
      ))}
      {/* palm creases */}
      <path d="M56 150 Q90 132 128 128" fill="none" stroke={LINE} strokeWidth="1.3" strokeLinecap="round" opacity="0.45" />
      <path d="M48 166 Q80 150 112 148" fill="none" stroke={LINE} strokeWidth="1.3" strokeLinecap="round" opacity="0.35" />
      {FINGERS.map((f) => (
        <Finger key={f.id} f={f} on={on(f.id)} />
      ))}
    </g>
  )
}

export function Hands({ active = [], className = '' }: Props) {
  const set = new Set(active)
  return (
    <svg viewBox="0 0 420 200" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="skinGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={SHADE} />
          <stop offset="0.45" stopColor={SKIN} />
          <stop offset="1" stopColor={SKIN} />
        </linearGradient>
        <linearGradient id="palmGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={SHADE} />
          <stop offset="0.5" stopColor={SKIN} />
          <stop offset="1" stopColor={SKIN} />
        </linearGradient>
      </defs>
      <Hand side="L" active={set} />
      <Hand side="R" active={set} />
    </svg>
  )
}
