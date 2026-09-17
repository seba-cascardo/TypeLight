/** One row per local day (see `dayKey`). Written by the store as things happen; read by Progreso. */
export interface DaySummary {
  seconds: number
  /** Routine cards done that day, 0..4. */
  blocks: number
  /** Snapshot of the learned pool size and of mastered keys, taken whenever key stats change. */
  learned: number
  mastered: number
  /** WPM of each reference session recorded that day (Reto, Velocidad text, race). Survives the sessions cap. */
  reference: number[]
  /** Sessions recorded that day. */
  sessions: number
  /** WPM of the weekly exam, when it was taken that day (also listed in `reference`). */
  exam?: number
}

export type Days = Record<string, DaySummary>

const empty = (): DaySummary => ({ seconds: 0, blocks: 0, learned: 0, mastered: 0, reference: [], sessions: 0 })

/** Fold one finished session into its day; `referenceWpm` is given only for reference sessions, `examWpm` only for the weekly exam. */
export function addSession(days: Days, day: string, seconds: number, referenceWpm?: number, examWpm?: number): Days {
  const prev = days[day] ?? empty()
  return {
    ...days,
    [day]: {
      ...prev,
      seconds: prev.seconds + Math.max(0, seconds),
      sessions: prev.sessions + 1,
      reference: referenceWpm === undefined ? prev.reference : [...prev.reference, referenceWpm],
      ...(examWpm !== undefined && { exam: examWpm }),
    },
  }
}

export function setBlocks(days: Days, day: string, blocks: number): Days {
  const prev = days[day] ?? empty()
  if (days[day] && prev.blocks === blocks) return days
  return { ...days, [day]: { ...prev, blocks } }
}

export function setSnapshot(days: Days, day: string, learned: number, mastered: number): Days {
  const prev = days[day] ?? empty()
  if (days[day] && prev.learned === learned && prev.mastered === mastered) return days
  return { ...days, [day]: { ...prev, learned, mastered } }
}
