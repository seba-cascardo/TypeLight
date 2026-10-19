import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { afterEach, describe, expect, it } from 'vitest'
import { GHOST_SOURCES, type GameResult, type GhostSource } from '@/engine/games'
import { GameResults } from './GameResults'

const race = (won: boolean, ghostWpm: number, source: GhostSource): GameResult => ({
  gameId: 'race',
  score: won ? 120 : 40,
  hits: 200,
  misses: 0,
  wrong: 2,
  bestCombo: 0,
  seconds: 70,
  accuracy: 0.99,
  detail: { won: won ? 1 : 0, marginSeconds: won ? 2 : -2, wpm: 36, ghostWpm, ghostSource: GHOST_SOURCES.indexOf(source) },
})

function footnote(result: GameResult) {
  render(
    <MemoryRouter>
      <GameResults result={result} stars={2} onRetry={() => {}} />
    </MemoryRouter>,
  )
  return screen.getByText(/El fantasma/).textContent
}

describe('GameResults · Carrera', () => {
  afterEach(cleanup)

  it('says where the ghost came from', () => {
    expect(footnote(race(true, 34, 'lesson'))).toBe('El fantasma corrió a la meta de esta lección: 34 PPM.')
    cleanup()
    expect(footnote(race(true, 48, 'week'))).toBe('El fantasma corrió a tu mejor de la semana: 48 PPM. La próxima va más rápido.')
    cleanup()
    expect(footnote(race(false, 20, 'goal'))).toBe('El fantasma corrió a la meta de la unidad: 20 PPM.')
    cleanup()
    expect(footnote(race(false, 25, 'month'))).toBe('El fantasma corrió a vos hace 30 días: 25 PPM.')
  })
})
