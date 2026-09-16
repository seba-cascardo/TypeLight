import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { GameId } from '@/engine/curriculum'
import type { LayoutId } from '@/engine/layouts'
import { addSeconds, bumpStreak, dayKey, setBlocks, setSnapshot, updateKeyStats, type Days, type KeyStats, type Stars, type Streak } from '@/engine/stats'
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
}

export interface LessonResult {
  stars: Stars
  bestWpm: number
  bestAcc: number
  attempts: number
  completedAt: string
}

export type SessionKind = 'lesson' | 'warmup' | 'review' | 'challenge' | 'game'

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
  setSettings: (patch: Partial<Settings>) => void
  recordSession: (rec: Omit<SessionRecord, 'at'>, samples?: Iterable<KeySample>) => void
  completeLesson: (id: string, stars: Stars, wpm: number, acc: number) => void
  markRoutine: (block: RoutineBlock) => void
  snapshotDay: (learned: number, mastered: number) => void
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
})

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      settings: { name: '', layoutId: 'latam', sound: true, showHands: true, onboarded: false, theme: 'auto' },
      ...initialProgress(),

      setSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),

      recordSession: (rec, samples) =>
        set((s) => {
          const today = dayKey()
          const sessions = [...s.sessions, { ...rec, at: new Date().toISOString() }].slice(-1000)
          return {
            sessions,
            keys: samples ? updateKeyStats(s.keys, samples) : s.keys,
            streak: bumpStreak(s.streak, today),
            days: addSeconds(s.days, today, rec.seconds),
          }
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

      resetProgress: () => set({ ...initialProgress() }),
    }),
    {
      name: 'typelight.v1',
      version: 2,
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
