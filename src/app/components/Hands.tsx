import type { Finger } from '@/engine/layouts'
import { FINGER_COLOR, fingerGroup } from './Keyboard'

interface Props {
  /** Fingers to light up. */
  active?: Finger[]
  className?: string
}

const SKIN = 'var(--color-keycap)'
const LINE = 'var(--color-line)'

/**
 * One hand seen from above, fingers pointing up. Drawn in a 150×150 box;
 * the right hand is the mirror image.
 */
function Hand({ side, active }: { side: 'L' | 'R'; active: Set<Finger> }) {
  const f = (name: 'P' | 'R' | 'M' | 'I' | 'T'): Finger => `${side}${name}` as Finger
  const on = (finger: Finger) => active.has(finger)
  const fill = (finger: Finger) => (on(finger) ? FINGER_COLOR[fingerGroup(finger)] : SKIN)
  const stroke = (finger: Finger) => (on(finger) ? 'var(--color-ink)' : LINE)
  const fingers: { finger: Finger; x: number; y: number; w: number; h: number }[] = [
    { finger: f('P'), x: 10, y: 46, w: 22, h: 56 },
    { finger: f('R'), x: 36, y: 22, w: 24, h: 80 },
    { finger: f('M'), x: 64, y: 12, w: 25, h: 90 },
    { finger: f('I'), x: 93, y: 24, w: 24, h: 78 },
  ]
  return (
    <g transform={side === 'R' ? 'translate(150 0) scale(-1 1)' : undefined}>
      {/* thumb sits behind the palm */}
      <rect
        x="112"
        y="76"
        width="24"
        height="58"
        rx="12"
        fill={fill(f('T'))}
        stroke={stroke(f('T'))}
        strokeWidth="3"
        transform={`rotate(-42 124 105)${on(f('T')) ? ' translate(0 -5)' : ''}`}
        style={{ transition: 'transform 140ms ease, fill 140ms ease' }}
      />
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
          transform={on(fg.finger) ? 'translate(0 -6)' : undefined}
          style={{ transition: 'transform 140ms ease, fill 140ms ease' }}
        />
      ))}
      {/* palm on top, hiding the finger roots */}
      <path
        d="M12 92 Q12 80 24 80 L108 80 Q120 80 120 92 L120 118 Q120 148 90 148 L42 148 Q12 148 12 118 Z"
        fill={SKIN}
        stroke={LINE}
        strokeWidth="3"
        strokeLinejoin="round"
      />
    </g>
  )
}

export function Hands({ active = [], className = '' }: Props) {
  const set = new Set(active)
  return (
    <svg viewBox="0 0 320 150" className={className} aria-hidden="true">
      <Hand side="L" active={set} />
      <g transform="translate(170 0)">
        <Hand side="R" active={set} />
      </g>
    </svg>
  )
}
