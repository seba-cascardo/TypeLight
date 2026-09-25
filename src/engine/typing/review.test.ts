import { describe, expect, it } from 'vitest'
import { backspace, createSession, repairMetrics, typeText } from './index'

describe('review fixes', () => {
  it('word mode: a key at the end with the last word wrong is refused visibly, not dropped', () => {
    const s = typeText(typeText(createSession('sol', 'word'), 'sxl', 1000), 'l', 1100)
    expect(s.pos).toBe(3)
    expect(s.finishedAt).toBeNull()
    expect(s.lastWrong).toBe(true)
  })

  it('repairMs leaves the refused spaces out: one error, one reaction', () => {
    let s = typeText(createSession('casa azul', 'word'), 'cxsa', 1000)
    s = typeText(s, ' ', 1100) // refused: the word still has the error
    s = backspace(s, 1300)
    // the reaction is from the wrong key (at 1000) to the first Backspace (1300)
    expect(repairMetrics(s)?.repairMs).toBe(300)
  })

  it('counts the erred positions, so a letter missed twice and repaired reads 1 of 1', () => {
    let s = typeText(createSession('sol luna', 'free'), 'sx', 1000)
    s = backspace(s, 1100)
    s = typeText(s, 'y', 1200)
    s = backspace(s, 1300)
    s = typeText(s, 'ol luna', 1400)
    const r = repairMetrics(s)!
    expect(r.firstTryErrors).toBe(2)
    expect(r.erred).toBe(1)
    expect(r.repaired).toBe(1)
  })
})
