import { useMemo } from 'react'
import { curriculumFor, mainLessons, nextLesson, type Curriculum, type Lesson } from '@/engine/curriculum'
import { LAYOUTS, type Layout } from '@/engine/layouts'
import { useStore } from '../store'

export interface Progress {
  layout: Layout
  curriculum: Curriculum
  completed: Set<string>
  /** First lesson not yet completed. */
  next: Lesson | undefined
  /** Characters learned so far (from the last completed lesson). */
  learned: string[]
  /** Highest-index completed lesson. */
  last: Lesson | undefined
  /** Whether a lesson can be opened: previous lesson done, or same unit as the next one. */
  isUnlocked: (lesson: Lesson) => boolean
  goalWpm: number
}

export function useProgress(): Progress {
  const layoutId = useStore((s) => s.settings.layoutId)
  const results = useStore((s) => s.lessons)
  return useMemo(() => {
    const layout = LAYOUTS[layoutId]
    const curriculum = curriculumFor(layout)
    const completed = new Set(Object.keys(results).filter((id) => curriculum.byId.has(id) && results[id].stars > 0))
    const next = nextLesson(curriculum, completed)
    // What is "learned" comes from the main path only: an optional lesson done early adds nothing to the Reto.
    let last: Lesson | undefined
    for (const l of mainLessons(curriculum)) if (completed.has(l.id)) last = l
    const learned = last ? last.pool : curriculum.lessons[1]?.pool ?? []
    const isUnlocked = (lesson: Lesson) => {
      if (lesson.index === 0 || completed.has(lesson.id)) return true
      const prev = curriculum.lessons[lesson.index - 1]
      // Optional units open anytime: their first lesson is always open, the rest follow each other.
      if (lesson.optional && prev.unitId !== lesson.unitId) return true
      if (completed.has(prev.id)) return true
      // Soft lock: anything in the unit you are currently working on is open.
      return next !== undefined && lesson.unitId === next.unitId
    }
    const goalWpm = last?.goalWpm ?? 10
    return { layout, curriculum, completed, next, learned, last, isUnlocked, goalWpm }
  }, [layoutId, results])
}
