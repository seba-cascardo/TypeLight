import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { makeRng, poolOf } from '@/engine/generator'
import { ghostPos, raceOutcome, raceText } from '@/engine/games'
import { newRollover, rolloverRatio } from '@/engine/stats'
import { keySamples, metrics, rhythm, type TypingState } from '@/engine/typing'
import { TypingArea } from '../TypingArea'
import { useTypingSession } from '../../hooks/useTypingSession'
import { Mascot } from './Mascot'
import { hitMood, missMood, MOOD_MS, type Mood } from './moods'
import type { GameProps } from './types'

/**
 * Carrera contra tu fantasma: three real sentences; your car moves with every correct character, the ghost
 * at a steady speed (your best Reto of the week, or the unit goal). Errors stop you, not the ghost.
 */
export function RaceGame({ pool, goalWpm, ghostWpm = goalWpm, sound = true, onFinish }: GameProps) {
  const text = useMemo(() => raceText(poolOf(pool), makeRng()), [pool])
  const length = text.length
  const [now, setNow] = useState(0)
  const [face, setFace] = useState<Mood>('idle')
  const moodAt = useRef(0)
  const missStreak = useRef(0)
  const seen = useRef(0)
  const finished = useRef(false)
  const rollover = useRef(newRollover())

  const handleFinish = useCallback(
    (state: TypingState) => {
      if (finished.current) return
      finished.current = true
      const m = metrics(state)
      const outcome = raceOutcome(m.seconds * 1000, ghostWpm, length)
      onFinish({
        gameId: 'race',
        score: outcome.won ? 100 + Math.round(outcome.marginSeconds * 10) : 40,
        hits: m.correct,
        misses: 0,
        wrong: m.errors,
        bestCombo: 0,
        seconds: m.seconds,
        accuracy: m.accuracy,
        detail: { won: outcome.won ? 1 : 0, marginSeconds: outcome.marginSeconds, wpm: m.wpm, ghostWpm },
        typing: { wpm: m.wpm, rhythm: rhythm(state), rollover: rolloverRatio(rollover.current), samples: [...keySamples(state).values()] },
      })
    },
    [ghostWpm, length, onFinish],
  )
  const session = useTypingSession(text, { sound, onFinish: handleFinish })
  const { state } = session

  // Smooth ghost while the race is on; the mascot settles back to idle on the same clock.
  useEffect(() => {
    if (state.startedAt === null || state.finishedAt !== null) return
    let raf = 0
    const loop = () => {
      const t = performance.now()
      setNow(t)
      setFace((f) => (f !== 'idle' && t - moodAt.current > MOOD_MS[f] ? 'idle' : f))
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [state.startedAt, state.finishedAt])

  // Mascot: each new keystroke either escalates the miss streak or calms it down.
  useEffect(() => {
    const keys = state.keystrokes
    if (keys.length < seen.current) seen.current = 0
    let next: Mood | null = null
    for (; seen.current < keys.length; seen.current++) {
      if (keys[seen.current].correct) {
        missStreak.current = 0
        let streak = 0
        for (let i = seen.current; i >= 0 && keys[i].correct; i--) streak++
        next = hitMood(streak)
      } else {
        missStreak.current++
        next = missMood(missStreak.current)
      }
    }
    if (next) {
      moodAt.current = performance.now()
      setFace(next)
    }
  }, [state.keystrokes])

  const elapsed = state.startedAt === null ? 0 : Math.max(0, (state.finishedAt ?? now) - state.startedAt)
  const ghost = ghostPos(elapsed, ghostWpm, length) / length
  const player = state.pos / length
  const live = session.live
  const ghostAhead = state.startedAt !== null && ghost > player + 0.02

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3 px-1 text-sm font-bold text-ink-mute">
        <span>
          <span className="font-display text-2xl text-ink tabular-nums">{live.wpm}</span> PPM ·{' '}
          <span className={live.accuracy < 0.95 ? 'text-esc-edge' : 'text-ink'}>{Math.round(live.accuracy * 100)} %</span> precisión
        </span>
        <span>
          Fantasma a <span className="font-display text-xl text-ink tabular-nums">{ghostWpm}</span> PPM · {ghostWpm === goalWpm ? 'la meta de la unidad' : 'tu mejor Reto de la semana'}
        </span>
        <span className="keycap keycap-sm font-display text-xl tabular-nums">
          {Math.floor(elapsed / 60000)}:{String(Math.floor((elapsed / 1000) % 60)).padStart(2, '0')}
        </span>
      </div>

      <div className="card game-field relative overflow-hidden" style={{ background: 'linear-gradient(var(--color-keycap), var(--color-paper))' }}>
        {[
          { who: 'vos', at: player, top: '18%', you: true },
          { who: 'fantasma', at: ghost, top: '40%', you: false },
        ].map((lane) => (
          <div key={lane.who} className="absolute right-6 left-6 h-14 rounded-2xl bg-paper-deep" style={{ top: lane.top }}>
            <span className="absolute -top-5 left-3 text-[11px] font-bold tracking-widest text-ink-mute uppercase">{lane.who}</span>
            <span className="absolute top-1/2 right-3 left-3 border-t-2 border-dashed border-line" />
            <span
              className={`absolute top-2 flex h-10 items-center gap-2 rounded-xl border px-3 font-display text-sm font-extrabold transition-[left] duration-100 ${lane.you ? 'border-enter bg-enter-soft text-enter-edge' : 'border-transparent bg-mod/30 text-ink-soft'}`}
              style={{ left: `calc(12px + ${lane.at} * (100% - 120px))` }}
            >
              ⌨ {lane.you ? 'vos' : `${ghostWpm} PPM`}
            </span>
          </div>
        ))}
        <div className="absolute top-[14%] right-8 h-[38%] border-l-[3px] border-ink-mute">
          <span
            className="absolute -top-0.5 left-0 h-4 w-6 border border-ink-mute"
            style={{ background: 'repeating-conic-gradient(var(--color-ink) 0 25%, var(--color-keycap) 0 50%) 0 0 / 8px 8px' }}
          />
        </div>

        <p className="absolute top-[58%] left-6 max-w-md text-sm font-bold text-ink-soft">
          {state.startedAt === null ? 'El fantasma arranca cuando vos arrancás. Un error te frena; a él no.' : ghostAhead ? 'Va adelante. Sin apuro: cada error te frena.' : 'Vas adelante. Mantené el ritmo.'}
        </p>

        <div className="absolute right-6 bottom-6 left-6 rounded-2xl bg-keycap/80 p-5">
          <TypingArea state={state} onInput={session.input} onRestart={() => session.restart()} rollover={rollover} />
        </div>

        <div className="absolute top-[56%] right-6">
          <Mascot mood={ghostAhead && face === 'idle' ? 'worried' : face} combo={0} />
        </div>
      </div>
    </div>
  )
}
