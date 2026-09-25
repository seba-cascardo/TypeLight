import { describe, expect, it } from 'vitest'
import type { GameResult } from '@/engine/games'
import { gameExtra, gameSession } from './gameSession'

const base: GameResult = { gameId: 'race', score: 100, hits: 50, misses: 0, wrong: 1, bestCombo: 0, seconds: 30, accuracy: 0.98, detail: {} }

describe('game sessions', () => {
  it('the race records a reference session', () => {
    expect(gameSession({ ...base, typing: { wpm: 32, samples: [] } })).toMatchObject({ kind: 'game', gameId: 'race', wpm: 32, reference: true })
  })

  it('games typed through the engine hand their bigrams and words to the model, like a Reto', () => {
    const bigrams = [{ bigram: 'qu', latencies: [180], errors: 0 }]
    const words = [{ word: 'que', latency: 170, errors: 0 }]
    expect(gameExtra({ ...base, typing: { wpm: 32, samples: [], bigrams, words } })).toEqual({ bigrams, words })
    expect(gameExtra({ ...base, typing: { wpm: 32, samples: [] } })).toBeUndefined()
    expect(gameExtra(base)).toBeUndefined()
  })
})
