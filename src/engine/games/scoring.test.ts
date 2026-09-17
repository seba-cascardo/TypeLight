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

describe('sudden death stars', () => {
  it('rewards characters before the first error', () => {
    const r = (score: number) => ({ gameId: 'sudden' as const, score, hits: score, misses: 0, wrong: 1, bestCombo: score, seconds: 30, accuracy: 1, detail: {} })
    expect(starsForGame(r(130))).toBe(3)
    expect(starsForGame(r(60))).toBe(2)
    expect(starsForGame(r(10))).toBe(1)
  })
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

  it('balloons: accuracy, three stars only with nothing escaped', () => {
    expect(starsForGame(result({ gameId: 'balloons', accuracy: 0.98, detail: { escaped: 0 } }))).toBe(3)
    expect(starsForGame(result({ gameId: 'balloons', accuracy: 0.98, detail: { escaped: 1 } }))).toBe(2)
    expect(starsForGame(result({ gameId: 'balloons', accuracy: 0.95, detail: { escaped: 0 } }))).toBe(2)
    expect(starsForGame(result({ gameId: 'balloons', accuracy: 0.9, detail: { escaped: 0 } }))).toBe(1)
  })

  it('race: accuracy, three stars only when the ghost lost', () => {
    expect(starsForGame(result({ gameId: 'race', accuracy: 0.98, detail: { won: 1 } }))).toBe(3)
    expect(starsForGame(result({ gameId: 'race', accuracy: 0.98, detail: { won: 0 } }))).toBe(2)
    expect(starsForGame(result({ gameId: 'race', accuracy: 0.9, detail: { won: 1 } }))).toBe(1)
  })
})
