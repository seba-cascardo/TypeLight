import type { SentenceCorpus } from '../generator'

export type UnitAccent = 'green' | 'blue' | 'coral' | 'sun' | 'lavender' | 'mint'

export interface Unit {
  id: string
  title: string
  blurb: string
  goalWpm: number
  accent: UnitAccent
  lessons: Lesson[]
}

export type LessonKind = 'keys' | 'review' | 'practice' | 'tip' | 'text' | 'unit-review' | 'game'

export type GameId = 'rain' | 'rhythm' | 'balloons' | 'race'

export interface IntroCard {
  title: string
  body: string
  /** Characters to highlight on the on-screen keyboard. */
  highlight: string[]
}

export type ExerciseSpec =
  | { kind: 'drill'; chars: string[]; tokens?: number; joined?: boolean }
  | { kind: 'review'; newChars: string[]; pool: string[]; tokens?: number }
  | { kind: 'words'; pool: string[]; focus?: string[]; count?: number; capitals?: string[] }
  | { kind: 'sentences'; pool: string[]; corpus?: SentenceCorpus; count?: number }
  | { kind: 'numbers'; pool: string[]; digits: string[]; tokens?: number }
  | { kind: 'symbols'; pool: string[]; symbols: string[]; tokens?: number }
  | { kind: 'pattern'; pool: string[]; pattern: string; count?: number }
  | { kind: 'adaptive'; pool: string[]; count?: number }

export interface Lesson {
  id: string
  unitId: string
  /** Global position in the path, 0-based. */
  index: number
  title: string
  kind: LessonKind
  /** Characters introduced by this lesson. */
  newChars: string[]
  /** Everything learned up to and including this lesson (no space). */
  pool: string[]
  intro: IntroCard[]
  exercises: ExerciseSpec[]
  goalWpm: number
  /** Set on 'game' lessons. */
  game?: GameId
  /** Set on the Patrones game: only words containing one of these count. */
  patterns?: string[]
}

export interface Curriculum {
  units: Unit[]
  lessons: Lesson[]
  byId: Map<string, Lesson>
}
