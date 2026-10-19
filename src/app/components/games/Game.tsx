import type { ReactNode } from 'react'
import type { GameId } from '@/engine/curriculum'
import { CapsLockNotice } from '../CapsLockNotice'
import { BalloonsGame } from './BalloonsGame'
import { RaceGame } from './RaceGame'
import { RainGame } from './RainGame'
import { RhythmGame } from './RhythmGame'
import { SuddenGame } from './SuddenGame'
import type { GameProps } from './types'

/** The game component for a lesson or free-play id. */
export function Game({ id, ...props }: GameProps & { id: GameId }) {
  switch (id) {
    case 'rain':
      return <WithCapsLock><RainGame {...props} /></WithCapsLock>
    case 'rhythm':
      return <WithCapsLock><RhythmGame {...props} /></WithCapsLock>
    case 'balloons':
      return <WithCapsLock><BalloonsGame {...props} /></WithCapsLock>
    // Carrera and Muerte súbita type in a TypingArea, which shows the notice itself.
    case 'race':
      return <RaceGame {...props} />
    case 'sudden':
      return <SuddenGame {...props} />
  }
}

/** The games that read keys themselves compare against lowercase letters: with Caps Lock on, every key misses. */
function WithCapsLock({ children }: { children: ReactNode }) {
  return (
    <div className="relative">
      <CapsLockNotice />
      {children}
    </div>
  )
}
