import { describe, expect, it } from 'vitest'
import { newRollover, rolloverRatio, trackKeyDown, trackKeyUp } from './rollover'

describe('rollover', () => {
  it('counts presses that start before the previous key is released', () => {
    const c = newRollover()
    // a down, b down while a is held (overlap), a up, b up, c down (clean)
    trackKeyDown(c, 'a')
    trackKeyDown(c, 'b')
    trackKeyUp(c, 'a')
    trackKeyUp(c, 'b')
    trackKeyDown(c, 'c')
    trackKeyUp(c, 'c')
    expect(c.presses).toBe(3)
    expect(c.overlaps).toBe(1)
  })

  it('a key held down and pressed again does not overlap with itself', () => {
    const c = newRollover()
    trackKeyDown(c, 'a')
    trackKeyDown(c, 'a')
    expect(c.presses).toBe(2)
    expect(c.overlaps).toBe(0)
  })

  it('ratio needs at least 20 presses', () => {
    const c = newRollover()
    for (let i = 0; i < 19; i++) {
      trackKeyDown(c, 'a')
      trackKeyUp(c, 'a')
    }
    expect(rolloverRatio(c)).toBeUndefined()
    trackKeyDown(c, 'a')
    trackKeyDown(c, 'b')
    trackKeyUp(c, 'a')
    trackKeyUp(c, 'b')
    expect(c.presses).toBe(21)
    expect(rolloverRatio(c)).toBeCloseTo(1 / 21)
  })
})
