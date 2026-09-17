import type { GameResult } from '@/engine/games'
import type { SessionRecord } from '../store'

/** What a finished game records: Carrera counts as reference speed; Al compás reports its on-time share as rhythm. */
export function gameSession(r: GameResult): Omit<SessionRecord, 'at'> {
  return {
    kind: 'game',
    gameId: r.gameId,
    wpm: r.typing?.wpm ?? 0,
    acc: r.accuracy,
    chars: r.hits,
    errors: r.wrong,
    seconds: r.seconds,
    ...(r.gameId === 'race' && { reference: true as const }),
    ...(r.gameId === 'rhythm' && { rhythm: r.detail.onTime }),
    ...(r.typing?.rhythm !== undefined && { rhythm: r.typing.rhythm }),
    ...(r.typing?.rollover !== undefined && { rollover: r.typing.rollover }),
  }
}
