import type { GameResult } from '@/engine/games'
import type { Layout } from '@/engine/layouts'

/** What every game receives; each one uses what it needs. */
export interface GameProps {
  layout: Layout
  /** Everything learned so far, space included. */
  pool: string[]
  goalWpm: number
  /** Weakest keys, for games that lean on them. */
  weak?: string[]
  sound?: boolean
  durationMs?: number
  /** Carrera: what the ghost runs at (best recent Reto, or the goal). */
  ghostWpm?: number
  /** Carrera: the ghost "you, 30 days ago" (median reference of 30–36 days back), when there is one. */
  ghostWpm30?: number | null
  /** Globos: only words containing one of these (Patrones). */
  patterns?: string[]
  /** Muerte súbita: best score so far, shown beside the live count. */
  best?: number
  /** Al compás: the notes are the letters of real words, a space between them. */
  words?: boolean
  /** Al compás: fastest tempo the ramp may reach (the warm-up stays under the comfortable speed). */
  maxWpm?: number
  onFinish: (r: GameResult) => void
}
