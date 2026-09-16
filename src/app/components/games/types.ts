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
  onFinish: (r: GameResult) => void
}
