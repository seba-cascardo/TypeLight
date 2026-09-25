import { MASCOT_FACES } from '../../assets/mascot'
import type { Mood } from './moods'

const TINT: Record<Mood, string> = {
  idle: 'bg-mascot-calm',
  happy: 'bg-mascot-calm',
  thrilled: 'bg-mascot-calm',
  sad: 'bg-mascot-calm',
  worried: 'bg-mascot-nervous',
  panic: 'bg-mascot-panic',
}

const ANIMATION: Record<Mood, string> = {
  idle: '',
  happy: 'animate-pop',
  thrilled: 'animate-cheer',
  sad: 'animate-shake',
  worried: 'animate-wobble',
  panic: 'animate-panic',
}

/**
 * The mascot ("Toon Head" by Johan Melin, CC BY 4.0) in a mood-tinted circle: cheers hits, winces at a
 * miss, gets nervous after two, panics after three. Faces come from scripts/build-mascot.mjs.
 */
export function Mascot({ mood, combo, size = 64 }: { mood: Mood; combo: number; size?: number }) {
  return (
    <span
      className={`relative inline-block shrink-0 align-middle ${ANIMATION[mood]}`}
      style={{ width: size, height: size }}
      data-mood={mood}
      aria-hidden="true"
    >
      <span
        className={`block size-full overflow-hidden rounded-full ${TINT[mood]} [&>svg]:block [&>svg]:size-full`}
        dangerouslySetInnerHTML={{ __html: MASCOT_FACES[mood] }}
      />
      {combo >= 5 && (
        <span
          className="absolute left-1/2 -translate-x-1/2 rounded-full bg-paper px-1.5 font-black leading-snug text-sun-edge"
          style={{ bottom: -Math.round(size * 0.1), fontSize: Math.max(9, Math.round(size * 0.17)) }}
        >
          ×{combo}
        </span>
      )}
    </span>
  )
}
