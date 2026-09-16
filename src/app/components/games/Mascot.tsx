export type Mood = 'idle' | 'happy' | 'sad'

/** A keycap with a face that cheers catches and winces at misses. */
export function Mascot({ mood, combo }: { mood: Mood; combo: number }) {
  const happy = mood === 'happy'
  const sad = mood === 'sad'
  return (
    <svg
      viewBox="0 0 64 64"
      className={`h-16 w-16 ${happy ? 'animate-pop' : ''} ${sad ? 'animate-shake' : ''}`}
      aria-hidden="true"
    >
      <rect x="6" y="10" width="52" height="48" rx="12" fill="var(--color-enter-edge)" />
      <rect x="6" y="6" width="52" height="46" rx="12" fill="var(--color-enter)" />
      <rect x="10" y="8" width="44" height="2" rx="1" fill="rgb(255 255 255 / 0.35)" />
      {/* eyes */}
      {happy ? (
        <>
          <path d="M18 30 q5 -7 10 0" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" />
          <path d="M36 30 q5 -7 10 0" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" />
        </>
      ) : (
        <>
          <circle cx="23" cy={sad ? 30 : 28} r="4" fill="#fff" />
          <circle cx="41" cy={sad ? 30 : 28} r="4" fill="#fff" />
          <circle cx={sad ? 22 : 24} cy={sad ? 31 : 29} r="1.8" fill="#1e2124" />
          <circle cx={sad ? 40 : 42} cy={sad ? 31 : 29} r="1.8" fill="#1e2124" />
        </>
      )}
      {/* mouth */}
      {happy ? (
        <path d="M22 38 q10 10 20 0" fill="#1e2124" />
      ) : sad ? (
        <path d="M24 42 q8 -6 16 0" fill="none" stroke="#1e2124" strokeWidth="3" strokeLinecap="round" />
      ) : (
        <path d="M25 39 q7 4 14 0" fill="none" stroke="#1e2124" strokeWidth="3" strokeLinecap="round" />
      )}
      {combo >= 5 && (
        <text x="32" y="62" textAnchor="middle" fontSize="9" fontWeight="900" fill="var(--color-sun-edge)" fontFamily="var(--font-body)">
          ×{combo}
        </text>
      )}
    </svg>
  )
}
