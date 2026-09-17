import { describe, expect, it } from 'vitest'
import { mascotLine, returnLine, type MascotContext } from './mascot'

const base: MascotContext = { recordToday: false, milestone: null, gap: 1, alive: true, freezes: 0, streak: 1, activeDays: 1, routineDone: false, examDue: false, game: null }

describe('mascot line', () => {
  it('picks one line by priority, never a guilt trip', () => {
    expect(mascotLine({ ...base, recordToday: true, milestone: 7 })).toEqual({ mood: 'thrilled', text: 'Récord personal hoy. Eso es tuyo.' })
    expect(mascotLine({ ...base, milestone: 7 }).text).toMatch(/hito/i)
    expect(mascotLine({ ...base, gap: 3, alive: false, activeDays: 9 }).text).toMatch(/Volvés/)
    expect(mascotLine({ ...base, routineDone: true })).toEqual({ mood: 'happy', text: 'Rutina completa. Lo que sigue es regalo.' })
    expect(mascotLine({ ...base, examDue: true }).text).toMatch(/examen/)
    expect(mascotLine({ ...base, game: 'rhythm' }).text).toMatch(/juego/)
    expect(mascotLine({ ...base, streak: 4 }).text).toBe('4 días seguidos. Sin apuro.')
    expect(mascotLine(base)).toEqual({ mood: 'idle', text: 'Diez minutos y listo.' })
  })

  it('returnLine forgives one day, covers with freezes, and restarts without erasing the active days', () => {
    expect(returnLine({ ...base, gap: 1 })).toBeNull()
    expect(returnLine({ ...base, gap: null })).toBeNull()
    expect(returnLine({ ...base, gap: 2 })).toBe('Ayer no practicaste. No pasa nada: hoy cuenta igual.')
    expect(returnLine({ ...base, gap: 3, alive: true, freezes: 1 })).toBe('Volvés después de 3 días. Un comodín cubre el hueco: hoy cuenta igual.')
    expect(returnLine({ ...base, gap: 5, alive: false, activeDays: 12 })).toBe('Volvés después de 5 días. La racha vuelve a empezar hoy; tus 12 días activos no se borran.')
  })
})
