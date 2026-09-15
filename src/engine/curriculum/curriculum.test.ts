import { describe, expect, it } from 'vitest'
import { makeRng } from '../generator'
import { ES, LATAM, US, canType } from '../layouts'
import { buildCurriculum, explainChar, generateExercise } from './index'

describe('curriculum', () => {
  it('builds a full path for each layout with unique ids', () => {
    for (const layout of [US, ES, LATAM]) {
      const c = buildCurriculum(layout)
      const ids = c.lessons.map((l) => l.id)
      expect(new Set(ids).size).toBe(ids.length)
      expect(c.lessons.length).toBeGreaterThan(80)
      expect(c.units.map((u) => u.id)).toContain('velocidad')
      c.lessons.forEach((l, i) => expect(l.index).toBe(i))
    }
  })

  it('introduces ñ on Spanish layouts and ; on US', () => {
    expect(buildCurriculum(LATAM).lessons.some((l) => l.newChars.includes('ñ'))).toBe(true)
    expect(buildCurriculum(US).lessons.some((l) => l.newChars.includes(';'))).toBe(true)
    expect(buildCurriculum(US).units.some((u) => u.id === 'acentos')).toBe(false)
    expect(buildCurriculum(ES).units.some((u) => u.id === 'acentos')).toBe(true)
  })

  it('covers every letter, digit and the main symbols of the layout', () => {
    const c = buildCurriculum(LATAM)
    const all = new Set(c.lessons.at(-1)!.pool)
    for (const ch of 'abcdefghijklmnopqrstuvwxyzñáéíóú0123456789¿?¡!,.:;()"') expect(all.has(ch)).toBe(true)
    for (const ch of 'ABCDEFGHIJKLMNOPQRSTUVWXYZÑ') expect(all.has(ch)).toBe(true)
  })

  it('only schedules characters typable on the layout', () => {
    for (const layout of [US, ES, LATAM]) {
      const c = buildCurriculum(layout)
      for (const l of c.lessons) for (const ch of l.pool) expect(canType(layout, ch)).toBe(true)
    }
  })

  it('generates non-empty text for every exercise, using only learned characters', () => {
    for (const layout of [US, LATAM]) {
      const c = buildCurriculum(layout)
      for (const l of c.lessons) {
        const allowed = new Set([...l.pool, ' '])
        l.exercises.forEach((spec, i) => {
          const text = generateExercise(spec, makeRng(l.index * 10 + i))
          expect(text.length, `${l.id} #${i}`).toBeGreaterThan(5)
          for (const ch of text) expect(allowed.has(ch), `${l.id} #${i}: '${ch}' in "${text}"`).toBe(true)
        })
      }
    }
  })

  it('explains keys in terms of fingers and movement', () => {
    expect(explainChar(LATAM, 'f').body).toMatch(/índice izquierdo/)
    expect(explainChar(LATAM, 'f').title).toBe('La tecla f')
    expect(explainChar(LATAM, 'f').body).toMatch(/fila guía/)
    expect(explainChar(LATAM, 'r').body).toMatch(/sube una fila/)
    expect(explainChar(LATAM, 'v').body).toMatch(/baja una fila/)
    expect(explainChar(LATAM, 'g').body).toMatch(/hacia el centro/)
    expect(explainChar(LATAM, 'F').body).toMatch(/Shift derecho/)
    expect(explainChar(LATAM, 'á').body).toMatch(/dos pasos/)
    expect(explainChar(LATAM, '@').body).toMatch(/Alt Gr/)
    expect(explainChar(US, '4').body).toMatch(/sube 2 filas/)
  })
})
