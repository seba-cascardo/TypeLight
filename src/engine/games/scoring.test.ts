import { describe, expect, it } from 'vitest'
import { starsForGame, type GameResult } from './scoring'

const result = (partial: Partial<GameResult>): GameResult => ({
  gameId: 'rain',
  score: 0,
  hits: 10,
  misses: 0,
  wrong: 0,
  bestCombo: 0,
  seconds: 45,
  accuracy: 1,
  detail: {},
  ...partial,
})

describe('starsForGame', () => {
  it('rain: by accuracy, one star without any catch', () => {
    expect(starsForGame(result({ hits: 0, accuracy: 0 }))).toBe(1)
    expect(starsForGame(result({ accuracy: 0.96 }))).toBe(3)
    expect(starsForGame(result({ accuracy: 0.9 }))).toBe(2)
    expect(starsForGame(result({ accuracy: 0.5 }))).toBe(1)
  })

  it('rhythm: on-time share, then accuracy', () => {
    expect(starsForGame(result({ gameId: 'rhythm', accuracy: 0.98, detail: { onTime: 0.9 } }))).toBe(3)
    expect(starsForGame(result({ gameId: 'rhythm', accuracy: 0.9, detail: { onTime: 0.9 } }))).toBe(2)
    expect(starsForGame(result({ gameId: 'rhythm', accuracy: 1, detail: { onTime: 0.7 } }))).toBe(2)
    expect(starsForGame(result({ gameId: 'rhythm', accuracy: 1, detail: { onTime: 0.5 } }))).toBe(1)
  })
})
