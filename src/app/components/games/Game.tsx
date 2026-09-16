import type { GameId } from '@/engine/curriculum'
import { BalloonsGame } from './BalloonsGame'
import { RaceGame } from './RaceGame'
import { RainGame } from './RainGame'
import { RhythmGame } from './RhythmGame'
import type { GameProps } from './types'

/** The game component for a lesson or free-play id. */
export function Game({ id, ...props }: GameProps & { id: GameId }) {
  switch (id) {
    case 'rain':
      return <RainGame {...props} />
    case 'rhythm':
      return <RhythmGame {...props} />
    case 'balloons':
      return <BalloonsGame {...props} />
    case 'race':
      return <RaceGame {...props} />
  }
}
