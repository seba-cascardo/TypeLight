export type MascotMood = 'idle' | 'happy' | 'thrilled'

export interface MascotContext {
  /** A personal best landed today. */
  recordToday: boolean
  /** Milestone reached and not yet closed. */
  milestone: number | null
  /** Days since the last active day (null before any activity). */
  gap: number | null
  /** The streak can still continue today. */
  alive: boolean
  freezes: number
  streak: number
  activeDays: number
  routineDone: boolean
  /** Routine cards done today, 0..4. */
  done: number
  examDue: boolean
  game: 'rhythm' | 'balloons' | null
}

/** What to say to someone who comes back after a gap. Never guilt; the facts and a way in. */
export function returnLine(ctx: MascotContext): string | null {
  if (ctx.gap === null || ctx.gap < 2) return null
  if (ctx.gap === 2) return 'Ayer no practicaste. No pasa nada: hoy cuenta igual.'
  if (ctx.alive) {
    // A gap of N days needs N - 2 freezes (one missed day is always forgiven); at most two exist.
    const cover = ctx.gap - 2 >= 2 ? 'Dos comodines cubren el hueco' : 'Un comodín cubre el hueco'
    return `Volvés después de ${ctx.gap} días. ${cover}: hoy cuenta igual.`
  }
  return `Volvés después de ${ctx.gap} días. La racha vuelve a empezar hoy; tus ${ctx.activeDays} días activos no se borran.`
}

/** One line for Inicio, by priority. */
export function mascotLine(ctx: MascotContext): { mood: MascotMood; text: string } {
  if (ctx.recordToday) return { mood: 'thrilled', text: 'Récord personal hoy. Eso es tuyo.' }
  if (ctx.milestone !== null) return { mood: 'happy', text: `Hito: ${ctx.milestone} días activos. Mirá la tarjeta.` }
  const back = returnLine(ctx)
  if (back) return { mood: 'idle', text: back }
  if (ctx.routineDone) return { mood: 'happy', text: 'Rutina completa. Lo que sigue es regalo.' }
  if (ctx.done > 0) return { mood: 'happy', text: `${ctx.done} de 4. Seguimos.` }
  if (ctx.examDue) return { mood: 'idle', text: 'Hoy toca el examen: tres minutos limpios, sin apuro.' }
  if (ctx.game) return { mood: 'happy', text: 'Hoy el Calentamiento es un juego.' }
  if (ctx.streak >= 3) return { mood: 'happy', text: `${ctx.streak} días seguidos. Sin apuro.` }
  return { mood: 'idle', text: 'Diez minutos y listo.' }
}
