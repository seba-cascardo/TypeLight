import { useCallback, useEffect, useMemo, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router'
import { adaptiveText, drillText, makeRng, poolOf, sentencesText, wordsText } from '@/engine/generator'
import { weakestKeys } from '@/engine/stats'
import { keySamples, metrics, type TypingState } from '@/engine/typing'
import { KeyGuide } from '../components/KeyGuide'
import { Keycap } from '../components/Keycap'
import { TypingArea } from '../components/TypingArea'
import { Stat } from '../components/ui'
import { useProgress } from '../hooks/useCurriculum'
import { useTypingSession } from '../hooks/useTypingSession'
import { useStore, type RoutineBlock, type SessionKind } from '../store'

type Kind = 'calentamiento' | 'repaso' | 'reto'

const META: Record<Kind, { title: string; blurb: string; block: RoutineBlock; session: SessionKind; variant: 'sun' | 'secondary' | 'coral'; timed?: number }> = {
  calentamiento: {
    title: 'Calentamiento',
    blurb: 'Las teclas que ya conocés, sin apuro. Buscá el ritmo, no la velocidad.',
    block: 'warmup',
    session: 'warmup',
    variant: 'sun',
  },
  repaso: {
    title: 'Repaso adaptativo',
    blurb: 'Texto armado a propósito con tus teclas más lentas o con más errores.',
    block: 'review',
    session: 'review',
    variant: 'secondary',
  },
  reto: {
    title: 'Reto de un minuto',
    blurb: 'Texto real durante sesenta segundos. Al final, tu velocidad de hoy.',
    block: 'challenge',
    session: 'challenge',
    variant: 'coral',
    timed: 60_000,
  },
}

export function Practice() {
  const { kind = '' } = useParams()
  if (!(kind in META)) return <Navigate to="/" replace />
  return <PracticeRun key={kind} kind={kind as Kind} />
}

function PracticeRun({ kind }: { kind: Kind }) {
  const meta = META[kind]
  const { layout, learned, goalWpm } = useProgress()
  const keyStats = useStore((s) => s.keys)
  const sound = useStore((s) => s.settings.sound)
  const showHands = useStore((s) => s.settings.showHands)
  const recordSession = useStore((s) => s.recordSession)
  const markRoutine = useStore((s) => s.markRoutine)
  const [round, setRound] = useState(0)
  const [result, setResult] = useState<ReturnType<typeof metrics> | null>(null)
  const navigate = useNavigate()

  // Enter on the result card goes back to the routine.
  useEffect(() => {
    if (!result) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        navigate('/')
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [result, navigate])

  const pool = useMemo(() => poolOf(learned.length >= 2 ? learned : ['f', 'j']), [learned])
  const weak = useMemo(() => weakestKeys(keyStats, learned, 3), [keyStats, learned])

  const text = useMemo(() => {
    const rng = makeRng()
    void round
    if (kind === 'calentamiento') {
      if (learned.length < 6) return drillText(learned.filter((c) => c !== ' '), 16, { rng })
      return wordsText(pool, 16, { rng })
    }
    if (kind === 'repaso') {
      if (learned.length < 4) return drillText(learned.filter((c) => c !== ' '), 16, { rng })
      return adaptiveText(pool, weak, 18, { rng })
    }
    // Reto: enough text for a full minute at 60 wpm.
    const parts: string[] = []
    let total = 0
    let guard = 0
    while (total < 420 && guard++ < 12) {
      const s = sentencesText(pool, 2, { rng })
      const w = s || wordsText(pool, 20, { rng })
      parts.push(w)
      total += w.length
    }
    return parts.join(' ')
  }, [kind, pool, weak, learned, round])

  const onFinish = useCallback(
    (state: TypingState) => {
      const m = metrics(state)
      if (m.chars === 0) return
      recordSession({ kind: meta.session, wpm: m.wpm, acc: m.accuracy, chars: m.chars, errors: m.errors, seconds: m.seconds }, keySamples(state).values())
      markRoutine(meta.block)
      setResult(m)
    },
    [meta.session, meta.block, recordSession, markRoutine],
  )

  const session = useTypingSession(text, { sound, onFinish, timeLimitMs: meta.timed })
  const nextChar = session.finished ? null : session.state.target[session.state.pos]
  const m = session.live
  const remaining = meta.timed ? Math.max(0, Math.ceil((meta.timed - session.elapsedMs) / 1000)) : null

  const again = () => {
    setResult(null)
    setRound((r) => r + 1)
  }

  return (
    <div className="animate-rise">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="eyebrow mb-1">Rutina de hoy</div>
          <h1 className="text-3xl md:text-4xl">{meta.title}</h1>
          <p className="mt-1 text-ink-soft">{meta.blurb}</p>
        </div>
        {kind === 'repaso' && weak.length > 0 && (
          <div className="flex items-center gap-2 text-sm font-bold text-ink-soft">
            Hoy insistimos con
            {weak.map((k) => (
              <span key={k} className="keycap keycap-secondary keycap-sm">
                {k}
              </span>
            ))}
          </div>
        )}
        {remaining !== null && (
          <div className={`keycap keycap-sm font-display text-2xl tabular-nums ${remaining <= 10 && session.state.startedAt ? 'keycap-coral' : ''}`}>
            {String(Math.floor(remaining / 60)).padStart(1, '0')}:{String(remaining % 60).padStart(2, '0')}
          </div>
        )}
      </header>

      {result ? (
        <div className="card animate-rise p-8 text-center">
          <div className="eyebrow mb-3">{meta.title} · listo</div>
          <div className="mx-auto flex max-w-md justify-around">
            <Stat label="Velocidad" value={result.wpm} unit="PPM" tone={result.wpm >= goalWpm ? 'enter' : 'ink'} />
            <Stat label="Precisión" value={`${Math.round(result.accuracy * 100)} %`} tone={result.accuracy >= 0.97 ? 'enter' : result.accuracy >= 0.95 ? 'ink' : 'esc'} />
            <Stat label="Errores" value={result.errors} tone={result.errors === 0 ? 'enter' : 'ink'} />
          </div>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Keycap variant="ghost" onClick={again}>
              Otra vez
            </Keycap>
            <Keycap to="/" variant="primary" size="lg">
              Volver a la rutina <span className="opacity-70">(Enter)</span> →
            </Keycap>
          </div>
        </div>
      ) : (
        <div className="grid gap-4">
          <div className="card p-6 md:p-8">
            <TypingArea state={session.state} onInput={session.input} onRestart={() => session.restart()} />
          </div>
          <div className="flex items-center justify-between px-1 text-sm font-bold text-ink-mute">
            <span>
              <span className="text-ink">{m.wpm}</span> PPM · <span className={m.accuracy < 0.95 ? 'text-esc-edge' : 'text-ink'}>{Math.round(m.accuracy * 100)} %</span> precisión · <span className="text-ink">{m.errors}</span> {m.errors === 1 ? 'error' : 'errores'}
            </span>
            <span>Esc reinicia</span>
          </div>
          <div className="card p-4 md:p-5">
            <KeyGuide layout={layout} nextChar={nextChar} showHands={showHands} />
          </div>
        </div>
      )}
    </div>
  )
}
