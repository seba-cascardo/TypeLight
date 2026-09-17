import { describe, expect, it } from 'vitest'
import { shareText } from './share'

describe('share text', () => {
  it('lays out the day, the numbers and a five-box bar against the unit goal', () => {
    expect(shareText({ day: '2026-09-18', wpm: 34, accuracy: 0.96, goalWpm: 40 })).toBe('TypeLight · Reto 18/9 · 34 PPM · 96 % al primer intento · ⌨️ 🟩🟩🟩🟩⬜')
    expect(shareText({ day: '2026-09-18', wpm: 8, accuracy: 1, goalWpm: 40 })).toBe('TypeLight · Reto 18/9 · 8 PPM · 100 % al primer intento · ⌨️ 🟩⬜⬜⬜⬜')
    expect(shareText({ day: '2026-01-02', wpm: 50, accuracy: 0.9, goalWpm: 40 })).toBe('TypeLight · Reto 2/1 · 50 PPM · 90 % al primer intento · ⌨️ 🟩🟩🟩🟩🟩')
    expect(shareText({ day: '2026-09-18', wpm: 0, accuracy: 1, goalWpm: 40 })).toMatch(/⬜⬜⬜⬜⬜$/)
  })
})
