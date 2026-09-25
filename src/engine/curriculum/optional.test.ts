import { describe, expect, it } from 'vitest'
import { makeRng } from '../generator'
import { ES, LATAM, US } from '../layouts'
import { buildCurriculum, generateExercise, nextLesson } from './index'

describe('optional units', () => {
  it('come last, after Velocidad: símbolos de código, then the number pad', () => {
    for (const layout of [US, ES, LATAM]) {
      const c = buildCurriculum(layout)
      const ids = c.units.map((u) => u.id)
      expect(ids.slice(-3)).toEqual(['velocidad', 'codigo', 'numpad'])
      for (const u of c.units) {
        expect(u.optional === true, u.id).toBe(u.id === 'codigo' || u.id === 'numpad')
        for (const l of u.lessons) expect(l.optional === true, l.id).toBe(u.optional === true)
      }
      const firstOptional = c.lessons.findIndex((l) => l.optional)
      expect(c.lessons.slice(firstOptional).every((l) => l.optional)).toBe(true)
    }
  })

  it('teach the code symbols the main path left out, per layout', () => {
    const taught = (layout: typeof US) =>
      buildCurriculum(layout)
        .lessons.filter((l) => l.unitId === 'codigo' && l.kind === 'keys')
        .flatMap((l) => l.newChars)
    expect(taught(US)).toEqual(['`', '~', '^'])
    expect(taught(LATAM)).toEqual(['[', ']', '{', '}', '<', '>', '\\', '|', '`', '~', '^'])
    // on the Spanish (Spain) layout ` and ^ are dead keys with no literal form
    expect(taught(ES)).toEqual(['[', ']', '{', '}', '<', '>', '\\', '|', '~'])
  })

  it('the number pad lessons are marked and only ever ask for pad keys', () => {
    const c = buildCurriculum(LATAM)
    const pad = c.lessons.filter((l) => l.unitId === 'numpad' && l.kind !== 'tip')
    expect(pad.length).toBeGreaterThanOrEqual(7)
    for (const l of pad) {
      expect(l.numpad, l.id).toBe(true)
      for (const spec of l.exercises) {
        const t = generateExercise(spec, makeRng(7))
        expect(t, l.id).toMatch(/^[0-9+\-*/ ]+$/)
      }
    }
  })

  it('every optional lesson generates text in every layout', () => {
    for (const layout of [US, ES, LATAM]) {
      for (const l of buildCurriculum(layout).lessons.filter((x) => x.optional)) {
        for (const spec of l.exercises) expect(generateExercise(spec, makeRng(11)).length, `${layout.id} ${l.id}`).toBeGreaterThan(5)
      }
    }
  })

  it('nextLesson finishes the main path first, then suggests the optional units', () => {
    const c = buildCurriculum(LATAM)
    const main = c.lessons.filter((l) => !l.optional)
    const optional = c.lessons.filter((l) => l.optional)
    // an optional lesson done early does not pull the path forward
    const early = new Set([c.lessons[0].id, optional[0].id])
    expect(nextLesson(c, early)?.id).toBe(c.lessons[1].id)
    // with the main path complete, the first pending optional lesson
    const mainDone = new Set(main.map((l) => l.id))
    expect(nextLesson(c, mainDone)?.id).toBe(optional[0].id)
    mainDone.add(optional[0].id)
    expect(nextLesson(c, mainDone)?.id).toBe(optional[1].id)
  })
})
