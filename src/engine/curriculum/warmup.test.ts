import { describe, expect, it } from 'vitest'
import { warmupGame } from './warmup'

const few = ['f', 'j', 'd', 'k', ' ']
const six = ['f', 'j', 'd', 'k', 's', 'l', ' ']
const many = ['f', 'j', 'd', 'k', 's', 'l', 'a', 'ñ', 'g', 'h', ' ']

describe('warmupGame', () => {
  it('is a game one day in three, alternating Al compás and Globos', () => {
    expect(warmupGame(3, many)).toBe('rhythm')
    expect(warmupGame(6, many)).toBe('balloons')
    expect(warmupGame(9, many)).toBe('rhythm')
    expect(warmupGame(12, many)).toBe('balloons')
  })

  it('is the plain warm-up on the other days', () => {
    expect(warmupGame(4, many)).toBeNull()
    expect(warmupGame(5, many)).toBeNull()
  })

  it('needs six letters for Al compás and words (8 letters + space) for Globos', () => {
    expect(warmupGame(3, few)).toBeNull()
    expect(warmupGame(6, six)).toBe('rhythm')
    expect(warmupGame(6, ['f', 'j', 'd', 'k', 's', 'l', 'a', 'ñ'])).toBe('rhythm')
  })
})
