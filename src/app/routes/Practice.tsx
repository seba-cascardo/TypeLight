import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router'
import { warmupGame } from '@/engine/curriculum'
import { adaptiveText, challengeText, drillText, examText, makeRng, ngramText, poolOf, wordsText } from '@/engine/generator'
import { starsForGame, type GameResult } from '@/engine/games'
import {
  dayKey,
  dayOfYear,
  keyReason,
  median,
  monthKey,
  newRollover,
  records,
  referenceByDay,
  resistedWords,
  rolloverRatio,
  seedOf,
  weakestBigrams,
  weakestKeys,
  weaknessQualities,
} from '@/engine/stats'
import { bigramSamples, cleanRun, deadKeyStats, keySamples, metrics, repairMetrics, rhythm, wordSamples, type RepairMetrics, type TypingMode, type TypingState } from '@/engine/typing'
import { shareText } from '../lib/share'
import { FormCheck } from '../components/FormCheck'
import { Game } from '../components/games/Game'
import { GameResults } from '../components/games/GameResults'
import { GAME_META } from '../components/games/meta'
import { KeyGuide } from '../components/KeyGuide'
import { Keycap } from '../components/Keycap'
import { TypingArea } from '../components/TypingArea'
import { Stat } from '../components/ui'
import { useProgress } from '../hooks/useCurriculum'
import { useTypingSession } from '../hooks/useTypingSession'
import { handsOpacityFor } from '../lib/fingers'
import { gameSession } from '../lib/gameSession'
import { useStore, type RoutineBlock, type SessionKind } from '../store'

type Kind = 'calentamiento' | 'repaso' | 'reto' | 'examen' | 'antes' | 'palabras'

interface Meta {
  title: string
  blurb: string
  block?: RoutineBlock
  session?: SessionKind
  variant: 'sun' | 'secondary' | 'coral'
  timed?: number
  mode: TypingMode
  /** No keyboard, hands or next-key hint: it measures transfer without help. */
  blind?: true
  reference?: true
}

const META: Record<Kind, Meta> = {
  calentamiento: {
    title: 'Calentamiento',
    blurb: 'Las teclas que ya conocés, sin apuro. Buscá el ritmo, no la velocidad.',
    block: 'warmup',
    session: 'warmup',
    variant: 'sun',
    mode: 'stop',
  },
  repaso: {
    title: 'Repaso adaptativo',
    blurb: 'Texto armado a propósito con tus teclas más lentas o con más errores.',
    block: 'review',
    session: 'review',
    variant: 'secondary',
    mode: 'stop',
  },
  reto: {
    title: 'Reto de un minuto',
    blurb: 'Texto real durante sesenta segundos, sin teclado ni manos. El error pasa: lo reparás con Backspace.',
    block: 'challenge',
    session: 'challenge',
    variant: 'coral',
    timed: 60_000,
    mode: 'free',
    blind: true,
    reference: true,
  },
  examen: {
    title: 'Examen semanal',
    blurb: 'Tres minutos sin ayuda ni Backspace: tu velocidad limpia. El mismo texto todo el mes.',
    block: 'challenge',
    session: 'exam',
    variant: 'coral',
    timed: 180_000,
    mode: 'stop',
    blind: true,
    reference: true,
  },
  antes: {
    title: 'Como antes',
    blurb: 'Un minuto tipeando como tipeabas antes de TypeLight, sin pensar en los dedos. Es la vara que vas a superar.',
    variant: 'sun',
    timed: 60_000,
    mode: 'stop',
  },
  palabras: {
    title: 'Palabras que se resistieron',
    blurb: 'Las que te costaron, tres veces cada una. No cuenta para la referencia ni para la rutina: es práctica dirigida.',
    session: 'review',
    variant: 'secondary',
    mode: 'stop',
  },
}

/** Words for `/practica/palabras`, from `?w=a,b,c`. */
function wordsParam(search: string): string[] {
  const raw = new URLSearchParams(search).get('w') ?? ''
  return [...new Set(raw.split(',').map((w) => w.trim().toLowerCase()).filter((w) => w.length >= 2))].slice(0, 12)
}

export function Practice() {
  const { kind = '' } = useParams()
  const [search] = useSearchParams()
  if (!(kind in META)) return <Navigate to="/" replace />
  if (kind === 'calentamiento') return <WarmupOrGame />
  if (kind === 'palabras' && wordsParam(search.toString()).length === 0) return <Navigate to="/" replace />
  return <PracticeRun key={`${kind}-${search.get('w') ?? ''}`} kind={kind as Kind} />
}

/** One day in three the warm-up is a game (decided once per mount, like the bigram day). */
function WarmupOrGame() {
  const { learned } = useProgress()
  const [game] = useState(() => warmupGame(dayOfYear(), learned))
  if (game === 'rhythm' || game === 'balloons') return <WarmupGame key={game} game={game} />
  return <PracticeRun key="calentamiento" kind="calentamiento" />
}

function WarmupGame({ game }: { game: 'rhythm' | 'balloons' }) {
  const { layout, learned, goalWpm } = useProgress()
  const keyStats = useStore((s) => s.keys)
  const days = useStore((s) => s.days)
  const sound = useStore((s) => s.settings.sound)
  const recordSession = useStore((s) => s.recordSession)
  const markRoutine = useStore((s) => s.markRoutine)
  const [result, setResult] = useState<GameResult | null>(null)
  const [round, setRound] = useState(0)
  const navigate = useNavigate()
  // Al compás beats a little under the comfortable speed: 90 % of the 7-day reference median, or the unit goal without one.
  const beatWpm = useMemo(() => {
    const recent = referenceByDay(days).slice(-7)
    return recent.length ? Math.max(8, Math.round(median(recent.map((p) => p.wpm)) * 0.9)) : goalWpm
  }, [days, goalWpm])

  const onFinish = useCallback(
    (r: GameResult) => {
      setResult(r)
      recordSession(gameSession(r), r.typing?.samples)
      markRoutine('warmup')
    },
    [recordSession, markRoutine],
  )

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

  const meta = GAME_META[game]
  return (
    <div className="animate-rise">
      <header className="mb-6">
        <div className="eyebrow mb-1">Rutina de hoy · Calentamiento</div>
        <h1 className="text-3xl md:text-4xl">{meta.title}</h1>
        <p className="mt-1 text-ink-soft">
          {game === 'rhythm' ? `Hoy el Calentamiento es un juego. Pulso a ${beatWpm} PPM, un poco por debajo de tu ritmo: el mapeo nuevo al mando.` : 'Hoy el Calentamiento es un juego. Palabras enteras, de corrido, antes de que se escapen.'}
        </p>
      </header>
      {result ? (
        <GameResults
          result={result}
          stars={starsForGame(result)}
          onRetry={() => {
            setResult(null)
            setRound((n) => n + 1)
          }}
          backTo={{ to: '/', label: 'Volver a la rutina' }}
        />
      ) : (
        <Game
          key={round}
          id={game}
          layout={layout}
          pool={learned}
          goalWpm={game === 'rhythm' ? beatWpm : goalWpm}
          maxWpm={game === 'rhythm' ? Math.round(beatWpm / 0.9) : undefined}
          weak={weakestKeys(keyStats, learned, 3, dayKey())}
          sound={sound}
          onFinish={onFinish}
          durationMs={Number(new URLSearchParams(window.location.search).get('dur')) || 60_000}
        />
      )}
    </div>
  )
}

interface Result {
  m: ReturnType<typeof metrics>
  repair: RepairMetrics | null
  /** Timestamp of the recorded session, for the form self-check. */
  at: string | null
  /** Faster than every reference session before it. */
  record: boolean
  /** Words that carried an error or came out slow, for "practicar estas". */
  resisted: string[]
}

function PracticeRun({ kind }: { kind: Kind }) {
  const meta = META[kind]
  const { layout, learned, goalWpm, curriculum } = useProgress()
  const keyStats = useStore((s) => s.keys)
  const bigramStats = useStore((s) => s.bigrams)
  const [search] = useSearchParams()
  const sound = useStore((s) => s.settings.sound)
  const showHands = useStore((s) => s.settings.showHands)
  const recordSession = useStore((s) => s.recordSession)
  const setSessionForm = useStore((s) => s.setSessionForm)
  const markRoutine = useStore((s) => s.markRoutine)
  const setLegacy = useStore((s) => s.setLegacy)
  const setLastExamDay = useStore((s) => s.setLastExamDay)
  const [round, setRound] = useState(0)
  const [result, setResult] = useState<Result | null>(null)
  const [formDone, setFormDone] = useState(false)
  const rollover = useRef(newRollover())
  const navigate = useNavigate()
  // A stable per-mount coin flip: a day change mid-exercise must not regenerate the text underneath the typist.
  const [bigramDay] = useState(() => dayOfYear() % 2 === 1)
  const [month] = useState(() => monthKey(dayKey()))
  const [day] = useState(() => dayKey())
  const [copied, setCopied] = useState<string | null>(null)
  const asksForm = kind === 'reto' || kind === 'examen'

  // Enter on the result card goes back to the routine (or, after "antes", to Progreso) — once the form check is answered or skipped.
  useEffect(() => {
    if (!result || (asksForm && !formDone)) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        navigate(kind === 'antes' ? '/estadisticas' : '/')
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [result, formDone, asksForm, navigate, kind])

  const pool = useMemo(
    () => (kind === 'antes' ? poolOf(curriculum.lessons[curriculum.lessons.length - 1].pool) : poolOf(learned.length >= 2 ? learned : ['f', 'j'])),
    [kind, curriculum, learned],
  )
  const weak = useMemo(() => weakestKeys(keyStats, learned, 3, dayKey()), [keyStats, learned])
  const weakBigrams = useMemo(() => weakestBigrams(bigramStats, pool, 3), [bigramStats, pool])
  const qualities = useMemo(() => weaknessQualities(keyStats, bigramStats, layout, learned), [keyStats, bigramStats, layout, learned])
  const practiceWords = useMemo(() => wordsParam(search.toString()), [search])
  // Odd days warm up on the bigrams that lean on the weakest keys, once there are enough keys to make bigrams; even days (or fewer keys) use real words.
  const bigramWarmup = kind === 'calentamiento' && bigramDay && learned.length >= 6

  const text = useMemo(() => {
    // The Reto of the day is the same text all day (seeded by the date): everyone with the app types the same thing.
    const rng = kind === 'reto' ? makeRng(seedOf(day)) : makeRng()
    void round
    // Until the space bar has been taught, drills are continuous runs.
    const joined = !learned.includes(' ')
    if (kind === 'antes') return challengeText(pool, { rng })
    if (kind === 'palabras') return rng.shuffle(practiceWords.flatMap((w) => [w, w, w])).join(' ')
    if (kind === 'examen') return joined ? drillText(learned, 40, { rng, joined }) : examText(pool, month)
    if (kind === 'calentamiento') {
      if (learned.length < 6) return drillText(learned, joined ? 8 : 16, { rng, joined })
      return bigramWarmup ? ngramText(pool, 2, { weak, tokens: 16, rng }) : wordsText(pool, 16, { rng })
    }
    if (kind === 'repaso') {
      if (learned.length < 5) return drillText(learned, joined ? 8 : 16, { rng, joined })
      return adaptiveText(pool, weak, 18, { rng, bigrams: weakBigrams })
    }
    if (joined) return drillText(learned, 12, { rng, joined })
    return challengeText(pool, { rng })
  }, [kind, pool, weak, weakBigrams, learned, round, bigramWarmup, month, day, practiceWords])

  const onFinish = useCallback(
    (state: TypingState) => {
      const m = metrics(state)
      if (m.chars === 0) return
      const repair = repairMetrics(state)
      if (kind === 'antes') {
        setLegacy({ wpm: m.wpm, acc: m.accuracy, at: new Date().toISOString() })
        setResult({ m, repair, at: null, record: false, resisted: [] })
        return
      }
      const words = wordSamples(state)
      const dead = deadKeyStats(state)
      // A personal best is judged against everything recorded before this session.
      const previousBest = meta.reference ? records(useStore.getState().days, []).bestReference?.wpm ?? 0 : Infinity
      // The very first Reto is not a "record": there is nothing to beat yet.
      const record = previousBest > 0 && m.wpm > previousBest
      const at = recordSession(
        {
          kind: meta.session!,
          wpm: m.wpm,
          acc: m.accuracy,
          chars: m.chars,
          errors: m.errors,
          seconds: m.seconds,
          rhythm: rhythm(state),
          rollover: rolloverRatio(rollover.current),
          cleanRun: cleanRun(state),
          ...(meta.reference && { reference: true as const }),
          ...(meta.blind && { blind: true as const }),
          ...(repair && { mode: 'free' as const, firstTryErrors: repair.firstTryErrors, kspc: repair.kspc, repaired: repair.repaired, repairMs: repair.repairMs }),
          ...(dead && { dead }),
        },
        keySamples(state).values(),
        { bigrams: bigramSamples(state).values(), words: words.values() },
      )
      if (meta.block) markRoutine(meta.block)
      if (kind === 'examen') setLastExamDay(dayKey())
      setResult({ m, repair, at, record, resisted: meta.reference ? resistedWords(words.values()) : [] })
    },
    [kind, meta, recordSession, markRoutine, setLegacy, setLastExamDay],
  )

  const session = useTypingSession(text, { sound, onFinish, timeLimitMs: meta.timed, mode: meta.mode })
  const nextChar = session.finished ? null : session.state.target[session.state.pos]
  const remaining = meta.timed ? Math.max(0, Math.ceil((meta.timed - session.elapsedMs) / 1000)) : null

  const copy = async () => {
    if (!result) return
    const line = shareText({ day, wpm: result.m.wpm, accuracy: result.m.accuracy, goalWpm })
    try {
      await navigator.clipboard.writeText(line)
      setCopied('Copiado. Pegalo donde quieras.')
    } catch {
      setCopied('No se pudo copiar: ' + line)
    }
  }

  const again = () => {
    setResult(null)
    setFormDone(false)
    setCopied(null)
    rollover.current = newRollover()
    setRound((r) => r + 1)
    // The Reto's text is the same all day: a new round needs an explicit restart, not just a new text.
    session.restart()
  }

  const r = result?.m
  return (
    <div className="animate-rise">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="eyebrow mb-1">{kind === 'antes' ? 'Ajustes · tu velocidad de antes' : 'Rutina de hoy'}</div>
          <h1 className="text-3xl md:text-4xl">{bigramWarmup ? 'Calentamiento · bigramas' : meta.title}</h1>
          <p className="mt-1 text-ink-soft">{meta.blurb}</p>
        </div>
        {kind === 'repaso' && weak.length > 0 && (
          <div className="text-sm font-bold text-ink-soft" data-testid="why-today">
            <div className="flex items-center gap-2">
              Hoy insistimos con
              {weak.map((k) => (
                <span key={k} className="keycap keycap-secondary keycap-sm">
                  {k}
                </span>
              ))}
            </div>
            <ul className="mt-1.5 grid gap-0.5 text-xs font-semibold text-ink-mute">
              {weak.map((k) => (
                <li key={k}>
                  <span className="font-extrabold text-ink">{k}</span> · {keyReason(keyStats[k], dayKey())}
                </li>
              ))}
            </ul>
            {qualities.length > 0 && (
              <p className="mt-1.5 text-xs font-semibold text-ink-mute" data-testid="qualities">
                Hoy pesa: {qualities.join(' y ')}.
              </p>
            )}
          </div>
        )}
        {remaining !== null && (
          <div className={`keycap keycap-sm font-display text-2xl tabular-nums ${remaining <= 10 && session.state.startedAt ? 'keycap-coral' : ''}`}>
            {String(Math.floor(remaining / 60)).padStart(1, '0')}:{String(remaining % 60).padStart(2, '0')}
          </div>
        )}
      </header>

      {result && r ? (
        <div className="card animate-rise p-8 text-center">
          <div className="eyebrow mb-3">{meta.title} · listo</div>
          {result.record && (
            <div className="animate-pop mb-4 inline-flex items-center gap-2 rounded-full bg-sun px-4 py-1.5 font-display text-lg font-extrabold text-ink" data-testid="record-chip">
              ★ Récord personal
            </div>
          )}
          <div className="mx-auto flex max-w-2xl flex-wrap justify-around gap-x-6 gap-y-4">
            <Stat label="Velocidad" value={r.wpm} unit="PPM" tone={r.wpm >= goalWpm ? 'enter' : 'ink'} />
            <Stat
              label={result.repair ? 'Al primer intento' : 'Precisión'}
              value={`${Math.round(r.accuracy * 100)} %`}
              tone={r.accuracy >= 0.97 ? 'enter' : r.accuracy >= 0.95 ? 'ink' : 'esc'}
            />
            {result.repair ? (
              <>
                <Stat
                  label="Reparados"
                  value={
                    <>
                      {result.repair.repaired}
                      <span className="ml-1 text-base font-bold text-ink-mute">de {result.repair.firstTryErrors}</span>
                    </>
                  }
                  tone={result.repair.firstTryErrors === 0 ? 'enter' : 'ink'}
                />
                <Stat label="Teclas por letra" value={result.repair.kspc.toFixed(2).replace('.', ',')} tone={result.repair.kspc <= 1.02 ? 'enter' : 'ink'} />
              </>
            ) : (
              <Stat label="Errores" value={r.errors} tone={r.errors === 0 ? 'enter' : 'ink'} />
            )}
          </div>
          {result.repair && (
            <p className="mt-3 text-sm text-ink-mute">
              {result.repair.repairMs !== null
                ? `Reaccionaste al error en ${(result.repair.repairMs / 1000).toFixed(1).replace('.', ',')} s. `
                : result.repair.firstTryErrors > 0
                  ? 'Ningún error reparado. '
                  : ''}
              La velocidad es el texto correcto al final: lo reparado cuenta, lo que quedó mal no.
            </p>
          )}
          {kind === 'antes' && (
            <p className="mt-4 text-sm text-ink-soft">Guardado como tu velocidad de antes. Cuando la mediana de tus Retos la supere, te aviso en Inicio.</p>
          )}
          {result.resisted.length > 0 && (
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-sm font-bold text-ink-soft" data-testid="resisted">
              <span>Se te resistieron:</span>
              {result.resisted.map((w) => (
                <span key={w} className="keycap keycap-sm">
                  {w}
                </span>
              ))}
              <Keycap to={`/practica/palabras?w=${encodeURIComponent(result.resisted.join(','))}`} variant="secondary" size="sm">
                Practicar estas →
              </Keycap>
            </div>
          )}
          {asksForm && (
            <FormCheck
              key={result.at ?? 'x'}
              onAnswer={(form) => {
                if (result.at) setSessionForm(result.at, form)
                setFormDone(true)
              }}
            />
          )}
          {kind === 'reto' && (
            <div className="mt-5 text-sm text-ink-soft" data-testid="share">
              <Keycap variant="ghost" size="sm" onClick={copy}>
                Copiar resultado
              </Keycap>
              {copied && <span className="ml-3 font-bold">{copied}</span>}
              <p className="mt-1.5 text-xs text-ink-mute">El Reto de hoy es el mismo texto para cualquiera que tenga la app: se puede comparar.</p>
            </div>
          )}
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Keycap variant="ghost" onClick={again}>
              Otra vez
            </Keycap>
            <Keycap to={kind === 'antes' ? '/estadisticas' : '/'} variant="primary" size="lg">
              {kind === 'antes' ? 'Ver progreso' : 'Volver a la rutina'} <span className="opacity-70">(Enter)</span> →
            </Keycap>
          </div>
        </div>
      ) : (
        <div className="grid gap-4">
          <div className="card p-6 md:p-8">
            <TypingArea state={session.state} onInput={session.input} onBackspace={session.backspace} onRestart={() => session.restart()} rollover={rollover} />
          </div>
          <div className="flex items-center justify-between px-1 text-sm font-bold text-ink-mute">
            <span>{meta.blind ? 'Sin teclado ni manos' : ''}</span>
            <span>Esc reinicia</span>
          </div>
          {kind !== 'antes' && !meta.blind && (
            <div className="card p-4 md:p-5">
              <KeyGuide layout={layout} nextChar={nextChar} showHands={showHands} handsOpacity={handsOpacityFor(keyStats, nextChar, goalWpm)} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
