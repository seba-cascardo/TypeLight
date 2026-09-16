export type Mood = 'idle' | 'happy' | 'thrilled' | 'sad' | 'worried' | 'panic'

/** How long each reaction stays on the face before it settles back to idle, ms. */
export const MOOD_MS: Record<Mood, number> = { idle: 0, happy: 600, thrilled: 900, sad: 700, worried: 900, panic: 1100 }

/** Escalating reactions: one miss is a wince, a run of them gets nervous, then panicky. */
export function missMood(streak: number): Mood {
  return streak >= 3 ? 'panic' : streak === 2 ? 'worried' : 'sad'
}

export function hitMood(combo: number): Mood {
  return combo >= 10 ? 'thrilled' : 'happy'
}
