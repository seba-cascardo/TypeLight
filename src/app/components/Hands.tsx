import type { Finger } from '@/engine/layouts'
import { FINGER_COLOR, fingerGroup } from './Keyboard'

interface Props {
  /** Fingers to light up. */
  active?: Finger[]
  className?: string
}

const PALM = 'var(--color-keycap)'
const STROKE = 'var(--color-line)'

function Hand({ side, active }: { side: 'L' | 'R'; active: Set<Finger> }) {
  const f = (name: 'P' | 'R' | 'M' | 'I' | 'T'): Finger => `${side}${name}` as Finger
  const fill = (finger: Finger) => (active.has(finger) ? FINGER_COLOR[fingerGroup(finger)] : PALM)
  const stroke = (finger: Finger) => (active.has(finger) ? 'var(--color-ink)' : STROKE)
  const lift = (finger: Finger) => (active.has(finger) ? 'translate(0 -6)' : undefined)
  const fingers: { finger: Finger; x: number; y: number; w: number; h: number }[] = [
    { finger: f('P'), x: 16, y: 44, w: 17, h: 52 },
    { finger: f('R'), x: 37, y: 24, w: 18, h: 72 },
    { finger: f('M'), x: 59, y: 16, w: 19, h: 80 },
    { finger: f('I'), x: 82, y: 26, w: 18, h: 70 },
  ]
  return (
    <g transform={side === 'R' ? 'translate(130 0) scale(-1 1)' : undefined}>
      {/* palm */}
      <rect x="16" y="78" width="84" height="66" rx="28" fill={PALM} stroke={STROKE} strokeWidth="3" />
      {fingers.map((fg) => (
        <rect
          key={fg.finger}
          x={fg.x}
          y={fg.y}
          width={fg.w}
          height={fg.h}
          rx={fg.w / 2}
          fill={fill(fg.finger)}
          stroke={stroke(fg.finger)}
          strokeWidth="3"
          transform={lift(fg.finger)}
          style={{ transition: 'transform 140ms ease, fill 140ms ease' }}
        />
      ))}
      {/* thumb */}
      <rect
        x="96"
        y="82"
        width="18"
        height="52"
        rx="9"
        fill={fill(f('T'))}
        stroke={stroke(f('T'))}
        strokeWidth="3"
        transform={`rotate(-38 105 108) ${active.has(f('T')) ? 'translate(0 -6)' : ''}`}
        style={{ transition: 'transform 140ms ease, fill 140ms ease' }}
      />
      {/* palm again on top of finger roots for a clean overlap */}
      <rect x="18" y="80" width="80" height="62" rx="26" fill={PALM} />
    </g>
  )
}

export function Hands({ active = [], className = '' }: Props) {
  const set = new Set(active)
  return (
    <svg viewBox="0 0 280 150" className={className} aria-hidden="true">
      <Hand side="L" active={set} />
      <g transform="translate(150 0)">
        <Hand side="R" active={set} />
      </g>
    </svg>
  )
}
