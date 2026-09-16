import type { GameId } from '../curriculum/types'
import type { Stars } from '../stats'
import type { KeySample } from '../typing'

/** What every game reports when the round ends. `detail` carries the game's own numbers. */
export interface GameResult {
  gameId: GameId
  score: number
  /** Right key on a target. */
  hits: number
  /** Targets that got away (fell, ran out, escaped). */
  misses: number
  /** Wrong keys. */
  wrong: number
  bestCombo: number
  seconds: number
  /** Each game defines it; rain counts misses against it, the rest use hits / (hits + wrong). */
  accuracy: number
  detail: Record<string, number>
  /** Games played through the typing engine (Carrera) also report what a lesson would. */
  typing?: { wpm: number; rhythm?: number; samples: KeySample[] }
}

export function starsForGame(r: GameResult): Stars {
  switch (r.gameId) {
    case 'rain':
      return r.hits === 0 ? 1 : r.accuracy >= 0.95 ? 3 : r.accuracy >= 0.85 ? 2 : 1
    case 'rhythm': {
      const onTime = r.detail.onTime ?? 0
      return onTime >= 0.85 && r.accuracy >= 0.97 ? 3 : onTime >= 0.7 ? 2 : 1
    }
    case 'balloons':
      return r.accuracy >= 0.97 && (r.detail.escaped ?? 0) === 0 ? 3 : r.accuracy >= 0.95 ? 2 : 1
    case 'race':
      return r.detail.won === 1 && r.accuracy >= 0.97 ? 3 : r.accuracy >= 0.95 ? 2 : 1
  }
}
