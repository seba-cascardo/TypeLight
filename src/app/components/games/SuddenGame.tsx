import { useCallback, useEffect, useMemo, useRef } from 'react'
import { challengeText, makeRng, poolOf } from '@/engine/generator'
import { bigramSamples, keySamples, metrics, rhythm, wordSamples, type TypingState } from '@/engine/typing'
import { TypingArea } from '../TypingArea'
import { useTypingSession } from '../../hooks/useTypingSession'
import type { GameProps } from './types'

/**
 * Muerte súbita: real text, stop-on-error, and the first error ends the round. The score is the
 * number of characters typed clean — the natural measure of a system without Backspace.
 */
export function SuddenGame({ pool, sound = true, best = 0, onFinish }: GameProps) {
  const text = useMemo(() => challengeText(poolOf(pool), { rng: makeRng(), minChars: 600 }), [pool])
  const finished = useRef(false)

  const finish = useCallback(
    (state: TypingState, byError: boolean) => {
      if (finished.current) return
      finished.current = true
      const m = metrics(state)
      const score = state.pos
      onFinish({
        gameId: 'sudden',
        score,
        hits: score,
        misses: 0,
        wrong: byError ? 1 : 0,
        bestCombo: score,
        seconds: m.seconds,
        accuracy: score + (byError ? 1 : 0) > 0 ? score / (score + (byError ? 1 : 0)) : 1,
        detail: { best: Math.max(best, score), byError: byError ? 1 : 0 },
        typing: { wpm: m.wpm, rhythm: rhythm(state), samples: [...keySamples(state).values()], bigrams: [...bigramSamples(state).values()], words: [...wordSamples(state).values()] },
      })
    },
    [best, onFinish],
  )

  const session = useTypingSession(text, { sound, onFinish: (state) => finish(state, false) })
  const { state } = session

  // The first wrong key ends it.
  useEffect(() => {
    if (state.lastWrong) finish(state, true)
  }, [state, finish])

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3 px-1 text-sm font-bold text-ink-mute">
        <span>
          <span className="font-display text-2xl text-ink tabular-nums" data-testid="sudden-count">
            {state.pos}
          </span>{' '}
          caracteres sin error
        </span>
        <span>
          Mejor: <span className="font-display text-xl text-ink tabular-nums">{Math.max(best, state.pos)}</span>
        </span>
        <span>El primer error termina · Esc reinicia</span>
      </div>
      <div className="card p-6 md:p-8">
        <TypingArea state={state} onInput={session.input} onRestart={() => session.restart()} />
      </div>
    </div>
  )
}
