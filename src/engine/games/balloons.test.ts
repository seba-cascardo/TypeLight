import { describe, expect, it } from 'vitest'
import { makeRng } from '../generator'
import { alive, balloonWords, escape, pickColumn, pickWord, prune, riseSpeed, samplesFrom, shouldSpawn, spawn, spawnInterval, startBalloons, typeChar } from './balloons'

const rng = () => makeRng(3)

describe('pace', () => {
  it('spawns faster and rises faster as the round goes on', () => {
    expect(spawnInterval(0)).toBe(1800)
    expect(spawnInterval(45_000)).toBe(1100)
    expect(spawnInterval(90_000)).toBe(1100)
    expect(riseSpeed(0)).toBe(14)
    expect(riseSpeed(45_000)).toBe(26)
  })
})

describe('balloonWords', () => {
  it('uses real words when the pool allows, filtered by patterns when given', () => {
    const pool = [...'abcdefghijklmnopqrstuvwxyzñ ']
    const words = balloonWords(pool, rng())
    expect(words.length).toBeGreaterThan(100)
    expect(words.every((w) => w.length >= 2 && w.length <= 8)).toBe(true)
    const withQue = balloonWords(pool, rng(), ['que'])
    expect(withQue.length).toBeGreaterThan(10)
    expect(withQue.every((w) => w.includes('que'))).toBe(true)
  })

  it('falls back to pseudo-words with a tiny pool', () => {
    const words = balloonWords(['f', 'j', ' '], rng())
    expect(words.length).toBe(40)
    expect(words.every((w) => /^[fj]+$/.test(w))).toBe(true)
  })
})

describe('round', () => {
  it('spawns into free columns while under the cap and the interval has passed', () => {
    let r = startBalloons()
    expect(shouldSpawn(r, 0)).toBe(true)
    r = spawn(r, 'casa', pickColumn(r, 0, rng()), 0)
    expect(shouldSpawn(r, 1000)).toBe(false)
    expect(shouldSpawn(r, 1800)).toBe(true)
    const col = r.balloons[0].column
    const others = new Set(Array.from({ length: 30 }, () => pickColumn(r, 500, rng())))
    expect(others.has(col)).toBe(false)
    for (let i = 0; i < 4; i++) r = spawn(r, `w${i}`, i, 2000 + i)
    expect(shouldSpawn(r, 10_000)).toBe(false)
  })

  it('never offers a word whose initial is already in the air', () => {
    let r = spawn(startBalloons(), 'casa', 0, 0)
    for (let i = 0; i < 20; i++) expect(pickWord(['cosa', 'dado', 'casa', 'dedo'], r, [], rng())![0]).toBe('d')
    r = spawn(r, 'dado', 1, 10)
    expect(pickWord(['cosa', 'dado'], r, [], rng())).toBeNull()
  })

  it('locks the oldest balloon by its initial, advances it, pops it and scores', () => {
    let r = spawn(spawn(startBalloons(), 'sal', 0, 0), 'sol', 1, 500)
    let out = typeChar(r, 'x', 600)
    expect(out.outcome).toBe('wrong')
    expect(out.round.wrong).toBe(1)
    r = out.round

    out = typeChar(r, 's', 700)
    expect(out).toMatchObject({ outcome: 'hit', expected: 's' })
    expect(out.round.active).toBe(1) // the oldest 's' balloon
    r = out.round
    out = typeChar(r, 'o', 800) // wrong: locked on "sal"
    expect(out).toMatchObject({ outcome: 'wrong', expected: 'a' })
    expect(out.round.active).toBe(1)
    r = typeChar(out.round, 'a', 900).round
    out = typeChar(r, 'l', 1000)
    expect(out.outcome).toBe('pop')
    expect(out.round.active).toBeNull()
    expect(out.round.popped).toBe(1)
    expect(out.round.combo).toBe(1)
    expect(out.round.score).toBe(30) // 3 letters × 10 × multiplier 1
    expect(out.round.balloons[0]).toMatchObject({ goneAt: 1000, how: 'popped' })
    expect(alive(out.round).map((b) => b.word)).toEqual(['sol'])
  })

  it('escaping balloons cost a life, the combo and the lock', () => {
    let r = spawn(spawn(startBalloons(), 'sal', 0, 0), 'dos', 1, 100)
    r = typeChar(r, 's', 200).round
    r = { ...r, combo: 4 }
    r = escape(r, [1], 3000)
    expect(r).toMatchObject({ lives: 2, escaped: 1, combo: 0, active: null })
    expect(r.balloons[0]).toMatchObject({ goneAt: 3000, how: 'escaped' })
    expect(escape(r, [], 3100)).toBe(r)
    expect(prune(r, 3800).balloons.map((b) => b.word)).toEqual(['dos'])
  })
})

describe('samplesFrom', () => {
  it('folds key events into per-key samples like the typing engine does', () => {
    const samples = samplesFrom([
      { expected: 'a', correct: true },
      { expected: 'a', correct: true, latency: 300 },
      { expected: 'a', correct: false },
      { expected: 'b', correct: true, latency: 500 },
    ])
    expect(samples).toEqual([
      { char: 'a', latencies: [300], errors: 1, occurrences: 2 },
      { char: 'b', latencies: [500], errors: 0, occurrences: 1 },
    ])
  })
})
