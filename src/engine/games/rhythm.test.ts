import { describe, expect, it } from 'vitest'
import { makeRng } from '../generator'
import { advance, beatMs, currentNote, judge, nextBeat, pickNote, press, schedule, startRound, tally } from './rhythm'

describe('beat floor', () => {
  it('a round with a floor never tightens past it', () => {
    expect(nextBeat(1000, 1, 950)).toBe(950)
    expect(nextBeat(1000, 1)).toBe(900)
    expect(startRound(1000, 950).floor).toBe(950)
  })
})

describe('beat and judgement', () => {
  it('derives the beat from the goal speed', () => {
    expect(beatMs(12)).toBe(1000)
    expect(beatMs(15)).toBe(800)
    expect(beatMs(0)).toBe(12000)
  })
  it('judges by absolute offset', () => {
    expect(judge(50)).toBe('justo')
    expect(judge(-80)).toBe('justo')
    expect(judge(-120)).toBe('bien')
    expect(judge(161)).toBe('fuera')
  })
  it('tightens the beat only after a good stretch, never under the floor', () => {
    expect(nextBeat(1000, 0.8)).toBe(900)
    expect(nextBeat(1000, 0.5)).toBe(1000)
    expect(nextBeat(260, 1)).toBe(250)
  })
})

describe('pickNote', () => {
  it('never repeats the previous note and leans on weak keys', () => {
    const rng = makeRng(7)
    const letters = ['f', 'j', 'd', 'k', 'q']
    let weakHits = 0
    let prev: string | null = null
    for (let i = 0; i < 60; i++) {
      const ch = pickNote(letters, ['q', 'z'], prev, rng)
      expect(letters).toContain(ch)
      expect(ch).not.toBe(prev)
      if (ch === 'q') weakHits++
      prev = ch
    }
    expect(weakHits).toBeGreaterThan(10)
    expect(pickNote(['f'], [], 'f', rng)).toBe('f')
  })
})

describe('round', () => {
  const rng = () => makeRng(1)

  it('schedules one note per beat inside the lookahead, starting two beats in', () => {
    const r = schedule(startRound(1000), 0, 4000, ['f', 'j'], [], rng())
    expect(r.notes.map((n) => n.at)).toEqual([2000, 3000, 4000])
    expect(r.nextAt).toBe(5000)
    expect(r.notes.every((n, i) => i === 0 || n.ch !== r.notes[i - 1].ch)).toBe(true)
    expect(schedule(r, 0, 4000, ['f', 'j'], [], rng())).toBe(r)
  })

  it('presses hit the current note and are judged by offset; other keys are wrong', () => {
    let r = schedule(startRound(1000), 0, 4000, ['f'], [], rng())
    expect(currentNote(r)?.at).toBe(2000)

    let out = press(r, 'j', 2000)
    expect(out.judgement).toBe('wrong')
    expect(out.round.wrong).toBe(1)
    r = out.round

    out = press(r, 'f', 2050)
    expect(out.judgement).toBe('justo')
    expect(out.round.combo).toBe(1)
    expect(out.round.score).toBe(20)
    r = out.round
    expect(currentNote(r)?.at).toBe(3000)

    out = press(r, 'f', 3130)
    expect(out.judgement).toBe('bien')
    expect(out.round.combo).toBe(2)
    expect(out.round.score).toBe(30)
    r = out.round

    out = press(r, 'f', 4300)
    expect(out.judgement).toBe('fuera')
    expect(out.round.combo).toBe(0)
    expect(out.round.notes[2].hit).toBe(true)
  })

  it('expires notes whose window closed and tightens the beat every stretch', () => {
    let r = schedule(startRound(1000), 0, 4000, ['f'], [], rng())
    let out = advance(r, 2100)
    expect(out.expired).toEqual([])
    out = advance(out.round, 2161)
    expect(out.expired.map((n) => n.at)).toEqual([2000])
    expect(out.round.notes[0]).toMatchObject({ result: 'fuera', hit: false })
    r = out.round

    // Two on-time presses out of three judged notes = 67 %: the beat stays.
    r = press(r, 'f', 3000).round
    r = press(r, 'f', 4000).round
    r = advance(r, 15_000).round
    expect(r.beat).toBe(1000)
    expect(r.stretchJudged).toBe(0)

    // A perfect stretch tightens it.
    r = schedule(r, 15_000, 4000, ['f'], [], rng())
    for (const n of r.notes.filter((n) => n.result === null)) r = press(r, 'f', n.at).round
    r = advance(r, 30_001).round
    expect(r.beat).toBe(900)
    expect(r.minBeat).toBe(900)
  })

  it('tallies judged notes', () => {
    let r = schedule(startRound(1000), 0, 4000, ['f'], [], rng())
    r = press(r, 'f', 2000).round
    r = press(r, 'f', 3120).round
    r = advance(r, 4200).round
    expect(tally(r)).toEqual({ justo: 1, bien: 1, fuera: 1, judged: 3, hits: 2, misses: 1, onTime: 2 / 3 })
  })
})
