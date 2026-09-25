import { describe, expect, it } from 'vitest'
import { makeRng } from '../generator'
import { ES, LATAM, US, canType } from '../layouts'
import { buildCurriculum, explainChar, generateExercise, nextLesson } from './index'

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

  it('teaches f and j without spaces, then the space bar, then everything else', () => {
    const c = buildCurriculum(LATAM)
    const first = c.lessons.find((l) => l.kind === 'keys')!
    expect(first.newChars).toEqual(['f', 'j'])
    expect(first.pool).not.toContain(' ')
    for (let i = 0; i < 5; i++) {
      for (const spec of first.exercises) expect(generateExercise(spec, makeRng(i))).not.toMatch(/ /)
    }
    const space = c.lessons[first.index + 1]
    expect(space.newChars).toEqual([' '])
    expect(space.pool).toContain(' ')
    expect(generateExercise(space.exercises[0], makeRng(1))).toMatch(/ /)
    for (const l of c.lessons.slice(space.index + 1)) expect(l.pool).toContain(' ')
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

  it('nextLesson moves past the last completed lesson, even if an earlier one is pending', () => {
    const c = buildCurriculum(LATAM)
    expect(nextLesson(c, new Set())?.index).toBe(0)
    const done = new Set([c.lessons[0].id, c.lessons[1].id, c.lessons[3].id])
    expect(nextLesson(c, done)?.index).toBe(4)
    const all = new Set(c.lessons.map((l) => l.id))
    all.delete(c.lessons[2].id)
    expect(nextLesson(c, all)?.index).toBe(2)
    expect(nextLesson(c, new Set(c.lessons.map((l) => l.id)))).toBeUndefined()
  })

  it('places the games in the path with their ids', () => {
    const c = buildCurriculum(LATAM)
    const games = c.lessons.filter((l) => l.kind === 'game').map((l) => [l.id, l.game])
    expect(games).toEqual([
      ['guia-juego-primeras-8', 'rain'],
      ['guia-juego-fila-guia', 'rhythm'],
      ['superior-juego-ruei', 'rain'],
      ['superior-juego-fila-superior', 'balloons'],
      ['inferior-juego-vmcx', 'rhythm'],
      ['inferior-juego-alfabeto', 'balloons'],
      ['patrones-juego-patrones', 'balloons'],
      ['mayusculas-juego-mayusculas', 'race'],
      ['numeros-juego-numeros', 'rhythm'],
      ['signos-juego-signos', 'rain'],
      ['velocidad-juego-compas-palabras', 'rhythm'],
      ['velocidad-juego-carrera-1', 'race'],
      ['velocidad-juego-carrera-2', 'race'],
    ])
    // Al compás in Velocidad plays real words, letter by letter
    expect(c.byId.get('velocidad-juego-compas-palabras')!.words).toBe(true)
    const patrones = c.byId.get('patrones-juego-patrones')!
    expect(patrones.patterns).toEqual(['que', 'ent', 'ado', 'con', 'est', 'ien', 'mente'])
    expect(c.byId.get('velocidad-juego-carrera-1')!.goalWpm).toBe(34)
    expect(c.byId.get('velocidad-juego-carrera-2')!.goalWpm).toBe(50)
    expect(c.lessons.indexOf(c.byId.get('velocidad-juego-carrera-1')!)).toBe(c.lessons.indexOf(c.byId.get('velocidad-texto-4')!) + 1)
  })

  it('opens Velocidad with bigram and trigram drills that generate text within the pool', () => {
    const c = buildCurriculum(LATAM)
    const bi = c.byId.get('velocidad-bigramas')!
    const tri = c.byId.get('velocidad-trigramas')!
    expect(bi.unitId).toBe('velocidad')
    expect(tri.index).toBe(bi.index + 1)
    const pool = new Set([...bi.pool, ' '])
    for (const spec of bi.exercises) expect([...generateExercise(spec, makeRng(3))].every((ch) => pool.has(ch))).toBe(true)
    expect(generateExercise(tri.exercises[0], makeRng(4)).split(' ')[0]).toHaveLength(3)
  })
})
