import { Mascot } from '../games/Mascot'
import type { MascotMood } from '../../lib/mascot'

/** The mascot from the games, one line beside the greeting. Silenceable in Ajustes. */
export function MascotLine({ mood, text }: { mood: MascotMood; text: string }) {
  return (
    <p className="mt-2 flex items-center gap-2.5 text-lg text-ink-soft" data-testid="mascot-line">
      <Mascot mood={mood} combo={0} size={40} />
      <span>{text}</span>
    </p>
  )
}
