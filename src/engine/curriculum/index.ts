import {
  adaptiveText,
  drillText,
  makeRng,
  numbersText,
  poolOf,
  reviewText,
  sentencesText,
  symbolsText,
  wordsText,
  type Rng,
} from '../generator'
import type { Layout } from '../layouts'
import { buildCurriculum } from './build'
import type { Curriculum, ExerciseSpec, Lesson } from './types'

export * from './types'
export { buildCurriculum } from './build'
export { explainChar } from './explain'

const cache = new Map<string, Curriculum>()

export function curriculumFor(layout: Layout): Curriculum {
  let c = cache.get(layout.id)
  if (!c) {
    c = buildCurriculum(layout)
    cache.set(layout.id, c)
  }
  return c
}

/** Turn an exercise spec into concrete text. Never returns an empty string. */
export function generateExercise(spec: ExerciseSpec, rng: Rng = makeRng()): string {
  switch (spec.kind) {
    case 'drill':
      return drillText(spec.chars, spec.tokens, { rng })
    case 'review':
      return reviewText(spec.newChars, poolOf(spec.pool), spec.tokens, { rng })
    case 'words':
      return wordsText(poolOf(spec.pool), spec.count, { rng, focus: spec.focus, capitals: spec.capitals })
    case 'sentences': {
      const t = sentencesText(poolOf(spec.pool), spec.count, { rng, corpus: spec.corpus })
      if (t) return t
      const general = spec.corpus ? sentencesText(poolOf(spec.pool), spec.count, { rng }) : ''
      return general || wordsText(poolOf(spec.pool), 16, { rng })
    }
    case 'numbers':
      return numbersText(poolOf(spec.pool), spec.digits, spec.tokens, { rng })
    case 'symbols':
      return symbolsText(poolOf(spec.pool), spec.symbols, spec.tokens, { rng })
    case 'adaptive':
      return adaptiveText(poolOf(spec.pool), [], spec.count, { rng })
  }
}

export function nextLesson(c: Curriculum, completedIds: Set<string>): Lesson | undefined {
  return c.lessons.find((l) => !completedIds.has(l.id))
}

export function lessonAfter(c: Curriculum, id: string): Lesson | undefined {
  const l = c.byId.get(id)
  return l ? c.lessons[l.index + 1] : undefined
}
