import { useCallback, useEffect, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router'
import { generateExercise, type Lesson } from '@/engine/curriculum'
import { makeRng } from '@/engine/generator'
import { starsFor, type Stars as StarCount } from '@/engine/stats'
import { keySamples, metrics, type TypingState } from '@/engine/typing'
import { KeyGuide } from '../components/KeyGuide'
import { Keycap } from '../components/Keycap'
import { TypingArea } from '../components/TypingArea'
import { Stars, Stat } from '../components/ui'
import { useProgress } from '../hooks/useCurriculum'
import { useTypingSession } from '../hooks/useTypingSession'
import { useStore } from '../store'
import { unitAccentClass } from './Path'

type Phase = 'intro' | 'exercise' | 'results'

interface Totals {
  correct: number
  errors: number
  seconds: number
  chars: number
  errorsByKey: Record<string, number>
}

const emptyTotals = (): Totals => ({ correct: 0, errors: 0, seconds: 0, chars: 0, errorsByKey: {} })

function generateTexts(lesson: Lesson): string[] {
  return lesson.exercises.map((spec) => generateExercise(spec, makeRng()))
}

export function LessonPlayer() {
  const { id = '' } = useParams()
  const { curriculum, layout, isUnlocked } = useProgress()
  const lesson = curriculum.byId.get(id)
  if (!lesson) return <Navigate to="/ruta" replace />
  if (!isUnlocked(lesson)) return <Navigate to="/ruta" replace />
  return <Player key={`${lesson.id}-${layout.id}`} lesson={lesson} />
}

function Player({ lesson }: { lesson: Lesson }) {
  const navigate = useNavigate()
  const { curriculum, layout } = useProgress()
  const sound = useStore((s) => s.settings.sound)
  const showHands = useStore((s) => s.settings.showHands)
  const recordSession = useStore((s) => s.recordSession)
  const completeLesson = useStore((s) => s.completeLesson)
  const markRoutine = useStore((s) => s.markRoutine)
  const unit = curriculum.units.find((u) => u.id === lesson.unitId)!
  const nextLesson = curriculum.lessons[lesson.index + 1]

  const [phase, setPhase] = useState<Phase>(lesson.intro.length ? 'intro' : 'exercise')
  const [card, setCard] = useState(0)
  const [texts, setTexts] = useState(() => generateTexts(lesson))
  const [step, setStep] = useState(0)
  const [totals, setTotals] = useState<Totals>(emptyTotals)
  const [stars, setStars] = useState<StarCount>(0)
  const [stepDone, setStepDone] = useState(false)

  const finishLesson = useCallback(
    (t: Totals) => {
      const m = {
        wpm: t.seconds > 0 ? Math.round((t.correct / 5) / (t.seconds / 60)) : 0,
        accuracy: t.correct + t.errors > 0 ? t.correct / (t.correct + t.errors) : 1,
        chars: t.chars,
        correct: t.correct,
        errors: t.errors,
        seconds: t.seconds,
      }
      const s = starsFor(m, lesson.goalWpm)
      setStars(s)
      completeLesson(lesson.id, s, m.wpm, m.accuracy)
      markRoutine('lesson')
      setPhase('results')
    },
    [lesson.id, lesson.goalWpm, completeLesson, markRoutine],
  )

  const onExerciseFinish = useCallback(
    (state: TypingState) => {
      const m = metrics(state)
      const samples = keySamples(state)
      recordSession({ kind: 'lesson', lessonId: lesson.id, wpm: m.wpm, acc: m.accuracy, chars: m.chars, errors: m.errors, seconds: m.seconds }, samples.values())
      const errorsByKey = { ...totals.errorsByKey }
      for (const s of samples.values()) if (s.errors) errorsByKey[s.char] = (errorsByKey[s.char] ?? 0) + s.errors
      const t: Totals = {
        correct: totals.correct + m.correct,
        errors: totals.errors + m.errors,
        seconds: totals.seconds + m.seconds,
        chars: totals.chars + m.chars,
        errorsByKey,
      }
      setTotals(t)
      setStepDone(true)
      if (step + 1 >= texts.length) finishLesson(t)
    },
    [lesson.id, recordSession, totals, step, texts.length, finishLesson],
  )

  const nextStep = useCallback(() => {
    setStepDone(false)
    setStep((s) => s + 1)
  }, [])

  // Enter advances between exercises.
  useEffect(() => {
    if (phase !== 'exercise' || !stepDone) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        nextStep()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [phase, stepDone, nextStep])

  const completeTip = () => {
    completeLesson(lesson.id, 3, 0, 1)
    markRoutine('lesson')
    if (nextLesson) navigate(`/leccion/${nextLesson.id}`)
    else navigate('/ruta')
  }

  const retry = () => {
    setTexts(generateTexts(lesson))
    setStep(0)
    setTotals(emptyTotals())
    setStepDone(false)
    setPhase('exercise')
  }

  const header = (
    <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <div>
        <div className="flex items-center gap-2">
          <Link to="/ruta" className="text-xs font-black uppercase tracking-wider text-ink-mute hover:text-ink">
            ← Ruta
          </Link>
          <span className={`rounded-md px-2 py-0.5 text-xs font-black uppercase tracking-wider text-white ${unitAccentClass(unit.accent)}`}>
            {unit.title}
          </span>
        </div>
        <h1 className="mt-1 text-3xl md:text-4xl">{lesson.title}</h1>
      </div>
      {phase === 'exercise' && (
        <div className="flex items-center gap-2">
          {texts.map((_, i) => (
            <span
              key={i}
              className={`h-2.5 rounded-full transition-all ${i < step || (i === step && stepDone) ? 'w-8 bg-enter' : i === step ? 'w-8 bg-sun' : 'w-4 bg-paper-deep'}`}
            />
          ))}
        </div>
      )}
    </header>
  )

  if (phase === 'intro') {
    const c = lesson.intro[card]
    const last = card === lesson.intro.length - 1
    const isTip = lesson.kind === 'tip'
    return (
      <div className="animate-rise">
        {header}
        <div className="grid gap-6 md:grid-cols-[1fr_1.3fr]" key={card}>
          <div className="card animate-rise p-6 md:p-8">
            <div className="eyebrow mb-3">
              {card + 1} de {lesson.intro.length}
            </div>
            {c.highlight.length === 1 && c.highlight[0] !== ' ' ? (
              <div className="keycap keycap-sun mb-4 h-20 w-20 font-mono text-4xl" style={{ borderRadius: 16 }}>
                {c.highlight[0]}
              </div>
            ) : null}
            <h2 className="text-3xl">{c.title}</h2>
            <p className="mt-3 text-lg leading-relaxed text-ink-soft">{c.body}</p>
            <div className="mt-6 flex flex-wrap gap-2">
              {card > 0 && (
                <Keycap variant="ghost" onClick={() => setCard(card - 1)}>
                  ← Anterior
                </Keycap>
              )}
              {!last && (
                <Keycap variant="secondary" onClick={() => setCard(card + 1)} autoFocus>
                  Siguiente →
                </Keycap>
              )}
              {last && isTip && (
                <Keycap variant="primary" onClick={completeTip} autoFocus>
                  Entendido →
                </Keycap>
              )}
              {last && !isTip && (
                <Keycap variant="primary" onClick={() => setPhase('exercise')} autoFocus>
                  Empezar el ejercicio →
                </Keycap>
              )}
            </div>
          </div>
          <div className="card p-4 md:p-5">
            <KeyGuide layout={layout} nextChar={c.highlight.length === 1 ? c.highlight[0] : null} highlight={c.highlight} showHands={showHands} />
          </div>
        </div>
      </div>
    )
  }

  if (phase === 'results') {
    const wpm = totals.seconds > 0 ? Math.round((totals.correct / 5) / (totals.seconds / 60)) : 0
    const acc = totals.correct + totals.errors > 0 ? totals.correct / (totals.correct + totals.errors) : 1
    const worst = Object.entries(totals.errorsByKey)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
    return (
      <div className="animate-rise">
        {header}
        <div className="card p-8 text-center">
          <div className="eyebrow mb-3">Lección terminada</div>
          <div className="animate-pop inline-block">
            <Stars count={stars} size="lg" />
          </div>
          <h2 className="mt-3 text-3xl">
            {stars === 3 ? 'Impecable.' : stars === 2 ? 'Muy bien. Ahora, un poco más de ritmo.' : 'Hecho. La precisión primero: repetila con calma.'}
          </h2>
          <div className="mx-auto mt-6 flex max-w-md justify-around">
            <Stat label="Velocidad" value={wpm} unit="PPM" tone={wpm >= lesson.goalWpm ? 'enter' : 'ink'} />
            <Stat label="Precisión" value={`${Math.round(acc * 100)} %`} tone={acc >= 0.97 ? 'enter' : acc >= 0.95 ? 'ink' : 'esc'} />
            <Stat label="Errores" value={totals.errors} tone={totals.errors === 0 ? 'enter' : 'ink'} />
          </div>
          <p className="mt-4 text-sm text-ink-mute">
            Meta de esta unidad: {lesson.goalWpm} PPM con 97 % de precisión para las tres estrellas.
          </p>
          {worst.length > 0 && (
            <div className="mt-5 flex items-center justify-center gap-2 text-sm font-bold text-ink-soft">
              <span>Teclas que se resistieron:</span>
              {worst.map(([k, n]) => (
                <span key={k} className="keycap keycap-sm font-mono">
                  {k === ' ' ? '␣' : k} <span className="text-ink-mute">×{n}</span>
                </span>
              ))}
            </div>
          )}
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Keycap variant="ghost" onClick={retry}>
              Repetir
            </Keycap>
            {nextLesson ? (
              <Keycap to={`/leccion/${nextLesson.id}`} variant="primary" size="lg">
                Siguiente: {nextLesson.title} →
              </Keycap>
            ) : (
              <Keycap to="/ruta" variant="primary" size="lg">
                Volver a la ruta
              </Keycap>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="animate-rise">
      {header}
      <Exercise
        key={`${step}-${texts[step]}`}
        text={texts[step]}
        sound={sound}
        onFinish={onExerciseFinish}
        done={stepDone}
        onNext={step + 1 < texts.length ? nextStep : undefined}
        showHands={showHands}
        goalWpm={lesson.goalWpm}
      />
    </div>
  )
}

interface ExerciseProps {
  text: string
  sound: boolean
  onFinish: (state: TypingState) => void
  done: boolean
  onNext?: () => void
  showHands: boolean
  goalWpm: number
}

export function Exercise({ text, sound, onFinish, done, onNext, showHands, goalWpm }: ExerciseProps) {
  const { layout } = useProgress()
  const session = useTypingSession(text, { sound, onFinish })
  const nextChar = session.finished ? null : session.state.target[session.state.pos]
  const m = session.live
  return (
    <div className="grid gap-4">
      <div className="card relative p-6 md:p-8">
        <TypingArea state={session.state} onInput={session.input} onRestart={() => session.restart()} />
        {done && (
          <div className="animate-pop mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-enter-soft px-4 py-3">
            <span className="font-bold text-enter-edge">
              ✓ {m.wpm} PPM · {Math.round(m.accuracy * 100)} % de precisión
            </span>
            {onNext && (
              <Keycap variant="primary" size="sm" onClick={onNext} autoFocus>
                Siguiente ejercicio (Enter) →
              </Keycap>
            )}
          </div>
        )}
      </div>
      <div className="flex items-center justify-between px-1 text-sm font-bold text-ink-mute">
        <span>
          <span className="text-ink">{m.wpm}</span> PPM · <span className={m.accuracy < 0.95 ? 'text-esc-edge' : 'text-ink'}>{Math.round(m.accuracy * 100)} %</span> precisión
          · <span className="text-ink">{m.errors}</span> {m.errors === 1 ? 'error' : 'errores'}
        </span>
        <span>meta {goalWpm} PPM · Esc reinicia</span>
      </div>
      <div className="card p-4 md:p-5">
        <KeyGuide layout={layout} nextChar={nextChar} showHands={showHands} />
      </div>
    </div>
  )
}
