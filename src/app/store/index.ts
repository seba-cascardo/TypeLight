import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { GameId } from '@/engine/curriculum'
import type { LayoutId } from '@/engine/layouts'
import { addSession, bumpStreak, dayKey, setBlocks, setSnapshot, updateKeyStats, type Days, type KeyStats, type Stars, type Streak } from '@/engine/stats'
import type { KeySample } from '@/engine/typing'
import { migrateState } from './migrate'

export type Theme = 'auto' | 'light' | 'dark'

export interface Settings {
  name: string
  layoutId: LayoutId
  sound: boolean
  showHands: boolean
  onboarded: boolean
  theme: Theme
  /** ISO of the last downloaded backup, for the reminder. */
  lastBackupAt: string | null
  /** Implementation intention: "Después de ___, practico." Empty = none. */
  anchor: string
  /** The converso card in Inicio was closed. */
  conversoSeen: boolean
}

/** The one-minute test typed "the old way", before TypeLight: the bar the new fingering has to beat. */
export interface Legacy {
  wpm: number
  acc: number
  at: string
  /** Day the 7-day reference median first reached `wpm`. */
  beatenAt?: string
  /** The celebration card was closed. */
  beatenSeen?: true
}

export interface LessonResult {
  stars: Stars
  bestWpm: number
  bestAcc: number
  attempts: number
  completedAt: string
}

export type SessionKind = 'lesson' | 'warmup' | 'review' | 'challenge' | 'exam' | 'game'

/** The form self-check after a Reto, exam or race: home row and correct fingers? */
export type FormAnswer = 'si' | 'medio' | 'no'

export interface SessionRecord {
  at: string
  kind: SessionKind
  lessonId?: string
  wpm: number
  acc: number
  chars: number
  errors: number
  seconds: number
  /** Counts toward the reference speed (Reto, Velocidad texts, race game). Decided when recording. */
  reference?: true
  /** 0..1, how even the gaps between keys were (`rhythm` in engine/typing). */
  rhythm?: number
  gameId?: GameId
  /** `free` = text mode with Backspace (the Reto). Absent = stop-on-error. */
  mode?: 'free'
  /** Typed without keyboard, hands or next-key hint. */
  blind?: true
  /** Free mode: wrong keystrokes, keystrokes per final character, repaired errors and reaction time to the first Backspace. */
  firstTryErrors?: number
  kspc?: number
  repaired?: number
  repairMs?: number | null
  /** Share of keystrokes that began before the previous key was released (0..1). */
  rollover?: number
  form?: FormAnswer
}

export type RoutineBlock = 'warmup' | 'lesson' | 'review' | 'challenge'

export interface Routine {
  day: string
  warmup: boolean
  lesson: boolean
  review: boolean
  challenge: boolean
}

interface State {
  settings: Settings
  lessons: Record<string, LessonResult>
  keys: KeyStats
  sessions: SessionRecord[]
  streak: Streak
  routine: Routine
  days: Days
  legacy: Legacy | null
  /** Day of the last weekly exam (one per ISO week). */
  lastExamDay: string | null
  /** Day of the first reference session typed without help: the chart's discontinuity. */
  blindSince: string | null
  setSettings: (patch: Partial<Settings>) => void
  /** Records the session and returns its timestamp, so it can be annotated afterwards. */
  recordSession: (rec: Omit<SessionRecord, 'at'>, samples?: Iterable<KeySample>) => string
  setSessionForm: (at: string, form: FormAnswer | null) => void
  completeLesson: (id: string, stars: Stars, wpm: number, acc: number) => void
  markRoutine: (block: RoutineBlock) => void
  snapshotDay: (learned: number, mastered: number) => void
  setLegacy: (legacy: Legacy | null) => void
  setLastExamDay: (day: string | null) => void
  resetProgress: () => void
}

const emptyRoutine = (day: string): Routine => ({ day, warmup: false, lesson: false, review: false, challenge: false })

const initialProgress = () => ({
  lessons: {} as Record<string, LessonResult>,
  keys: {} as KeyStats,
  sessions: [] as SessionRecord[],
  streak: { count: 0, lastDay: null } as Streak,
  routine: emptyRoutine(dayKey()),
  days: {} as Days,
  lastExamDay: null as string | null,
  blindSince: null as string | null,
})

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      settings: { name: '', layoutId: 'latam', sound: true, showHands: true, onboarded: false, theme: 'auto', lastBackupAt: null, anchor: '', conversoSeen: false },
      legacy: null,
      ...initialProgress(),

      setSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),

      recordSession: (rec, samples) => {
        const at = new Date().toISOString()
        set((s) => {
          const today = dayKey()
          const sessions = [...s.sessions, { ...rec, at }].slice(-1000)
          return {
            sessions,
            keys: samples ? updateKeyStats(s.keys, samples) : s.keys,
            streak: bumpStreak(s.streak, today),
            days: addSession(s.days, today, rec.seconds, rec.reference ? rec.wpm : undefined, rec.kind === 'exam' ? rec.wpm : undefined),
            blindSince: s.blindSince ?? (rec.reference && rec.blind ? today : null),
          }
        })
        return at
      },

      // Patches the newest session with that timestamp (two in the same millisecond would share it).
      setSessionForm: (at, form) =>
        set((s) => {
          if (!form) return {}
          const i = s.sessions.findLastIndex((r) => r.at === at)
          if (i === -1) return {}
          const sessions = s.sessions.slice()
          sessions[i] = { ...sessions[i], form }
          return { sessions }
        }),

      completeLesson: (id, stars, wpm, acc) =>
        set((s) => {
          const prev = s.lessons[id]
          const result: LessonResult = {
            stars: Math.max(prev?.stars ?? 0, stars) as Stars,
            bestWpm: Math.max(prev?.bestWpm ?? 0, wpm),
            bestAcc: Math.max(prev?.bestAcc ?? 0, acc),
            attempts: (prev?.attempts ?? 0) + 1,
            completedAt: new Date().toISOString(),
          }
          return { lessons: { ...s.lessons, [id]: result }, streak: bumpStreak(s.streak, dayKey()) }
        }),

      markRoutine: (block) => {
        const today = dayKey()
        const r = get().routine.day === today ? get().routine : emptyRoutine(today)
        const routine = { ...r, [block]: true }
        const blocks = [routine.warmup, routine.lesson, routine.review, routine.challenge].filter(Boolean).length
        set({ routine, days: setBlocks(get().days, today, blocks) })
      },

      snapshotDay: (learned, mastered) => {
        const days = setSnapshot(get().days, dayKey(), learned, mastered)
        if (days !== get().days) set({ days })
      },

      setLegacy: (legacy) => set({ legacy }),

      setLastExamDay: (day) => set({ lastExamDay: day }),

      resetProgress: () =>
        set((s) => ({
          ...initialProgress(),
          legacy: s.legacy ? { wpm: s.legacy.wpm, acc: s.legacy.acc, at: s.legacy.at } : null,
        })),
    }),
    {
      name: 'typelight.v1',
      version: 4,
      migrate: (persisted, version) => migrateState(persisted, version) as State,
    },
  ),
)

/** Today's routine, resetting stale days without mutating the store. */
export function useRoutine(): Routine {
  const routine = useStore((s) => s.routine)
  const today = dayKey()
  return routine.day === today ? routine : emptyRoutine(today)
}

export function useSettings(): Settings {
  return useStore((s) => s.settings)
}

export const PERSISTED_KEYS = ['settings', 'lessons', 'keys', 'sessions', 'streak', 'routine', 'days', 'legacy', 'lastExamDay', 'blindSince'] as const
export type PersistedState = Pick<State, (typeof PERSISTED_KEYS)[number]>

/** The data half of the store, exactly what persist writes. */
export function persistedState(s: State): PersistedState {
  return Object.fromEntries(PERSISTED_KEYS.map((k) => [k, s[k]])) as PersistedState
}

/** Replace the data half wholesale (backup import); persist saves it on the next tick. */
export function importState(state: PersistedState): void {
  useStore.setState(state)
}
