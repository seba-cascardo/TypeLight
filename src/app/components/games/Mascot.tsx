import type { Mood } from './moods'

const BODY: Record<Mood, [string, string]> = {
  idle: ['var(--color-enter)', 'var(--color-enter-edge)'],
  happy: ['var(--color-enter)', 'var(--color-enter-edge)'],
  thrilled: ['var(--color-enter)', 'var(--color-enter-edge)'],
  sad: ['var(--color-enter)', 'var(--color-enter-edge)'],
  worried: ['var(--color-sun)', 'var(--color-sun-edge)'],
  panic: ['var(--color-esc)', 'var(--color-esc-edge)'],
}

const ANIMATION: Record<Mood, string> = {
  idle: '',
  happy: 'animate-pop',
  thrilled: 'animate-cheer',
  sad: 'animate-shake',
  worried: 'animate-wobble',
  panic: 'animate-panic',
}

const INK = '#1e2124'

/** A keycap with a face: cheers hits, winces at a miss, sweats after two, panics after three. */
export function Mascot({ mood, combo, size = 64 }: { mood: Mood; combo: number; size?: number }) {
  const [fill, edge] = BODY[mood]
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} className={ANIMATION[mood]} aria-hidden="true">
      {mood === 'thrilled' && (
        <>
          <path d="M8 3 l1.6 3.4 3.4 1.6 -3.4 1.6 -1.6 3.4 -1.6 -3.4 -3.4 -1.6 3.4 -1.6z" fill="var(--color-sun)" />
          <path d="M57 8 l1.3 2.7 2.7 1.3 -2.7 1.3 -1.3 2.7 -1.3 -2.7 -2.7 -1.3 2.7 -1.3z" fill="var(--color-sun)" />
        </>
      )}
      <rect x="6" y="10" width="52" height="48" rx="12" fill={edge} />
      <rect x="6" y="6" width="52" height="46" rx="12" fill={fill} />
      <rect x="10" y="8" width="44" height="2" rx="1" fill="rgb(255 255 255 / 0.35)" />

      {/* sweat */}
      {(mood === 'worried' || mood === 'panic') && <path d="M54 16 q4.5 6.5 0 10 q-4.5 -3.5 0 -10" fill="var(--color-mod)" />}
      {mood === 'panic' && <path d="M12 22 q3.5 5 0 8 q-3.5 -3 0 -8" fill="var(--color-mod)" />}

      {/* brows */}
      {mood === 'worried' && (
        <>
          <path d="M16 25 L27 21" stroke={INK} strokeWidth="2.5" strokeLinecap="round" />
          <path d="M48 25 L37 21" stroke={INK} strokeWidth="2.5" strokeLinecap="round" />
        </>
      )}
      {mood === 'panic' && (
        <>
          <path d="M15 25 L28 18" stroke={INK} strokeWidth="3" strokeLinecap="round" />
          <path d="M49 25 L36 18" stroke={INK} strokeWidth="3" strokeLinecap="round" />
        </>
      )}

      {/* eyes */}
      {mood === 'happy' || mood === 'thrilled' ? (
        <>
          <path d="M18 30 q5 -7 10 0" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" />
          <path d="M36 30 q5 -7 10 0" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" />
        </>
      ) : mood === 'panic' ? (
        <>
          <circle cx="23" cy="31" r="6" fill="#fff" />
          <circle cx="41" cy="31" r="6" fill="#fff" />
          <circle cx="24" cy="32" r="1.6" fill={INK} />
          <circle cx="40" cy="32" r="1.6" fill={INK} />
        </>
      ) : (
        <>
          <circle cx="23" cy={mood === 'idle' ? 28 : 30} r="4" fill="#fff" />
          <circle cx="41" cy={mood === 'idle' ? 28 : 30} r="4" fill="#fff" />
          <circle cx={mood === 'idle' ? 24 : 22} cy={mood === 'idle' ? 29 : 31} r="1.8" fill={INK} />
          <circle cx={mood === 'idle' ? 42 : 40} cy={mood === 'idle' ? 29 : 31} r="1.8" fill={INK} />
        </>
      )}

      {/* mouth */}
      {mood === 'thrilled' ? (
        <>
          <path d="M20 37 q12 14 24 0z" fill={INK} />
          <path d="M26 42 q6 5 12 0 q-6 -2 -12 0z" fill="var(--color-esc)" />
        </>
      ) : mood === 'happy' ? (
        <path d="M22 38 q10 10 20 0" fill={INK} />
      ) : mood === 'sad' ? (
        <path d="M24 42 q8 -6 16 0" fill="none" stroke={INK} strokeWidth="3" strokeLinecap="round" />
      ) : mood === 'worried' ? (
        <path d="M23 41 q4.5 -5 9 0 t9 0" fill="none" stroke={INK} strokeWidth="3" strokeLinecap="round" />
      ) : mood === 'panic' ? (
        <ellipse cx="32" cy="42" rx="6" ry="5.5" fill={INK} />
      ) : (
        <path d="M25 39 q7 4 14 0" fill="none" stroke={INK} strokeWidth="3" strokeLinecap="round" />
      )}

      {combo >= 5 && (
        <text x="32" y="62" textAnchor="middle" fontSize="9" fontWeight="900" fill="var(--color-sun-edge)" fontFamily="var(--font-body)">
          ×{combo}
        </text>
      )}
    </svg>
  )
}
