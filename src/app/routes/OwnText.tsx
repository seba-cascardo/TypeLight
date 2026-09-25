import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { newRollover, prepareOwnText, rolloverRatio } from '@/engine/stats'
import { bigramSamples, cleanRun, deadKeyStats, keySamples, metrics, repairMetrics, rhythm, wordSamples, type RepairMetrics, type TypingState } from '@/engine/typing'
import { Keycap } from '../components/Keycap'
import { TypingArea } from '../components/TypingArea'
import { Stat } from '../components/ui'
import { useProgress } from '../hooks/useCurriculum'
import { useTypingSession } from '../hooks/useTypingSession'
import { repairFields } from '../lib/sessionFields'
import { useStore } from '../store'

/**
 * Paste a mail or a paragraph and type it, in text mode (errors pass, Backspace repairs), without keyboard
 * or hands. It feeds the key, bigram and word models like any exercise, but never the reference speed
 * or the routine: it is the bridge to real use, not a measurement.
 */
export function OwnText() {
  const { layout } = useProgress()
  const [draft, setDraft] = useState('')
  const [text, setText] = useState<string | null>(null)
  const prepared = prepareOwnText(draft, layout)

  if (text !== null) return <OwnTextRun text={text} onAnother={() => setText(null)} />

  return (
    <div className="animate-rise">
      <header className="mb-6">
        <div className="eyebrow mb-1">Texto propio</div>
        <h1 className="text-3xl md:text-4xl">Pegá algo tuyo y tipealo.</h1>
        <p className="mt-1 max-w-2xl text-ink-soft">
          Un mail, un párrafo, lo que sea. Se tipea como el Reto: sin teclado ni manos, el error pasa y lo reparás con Backspace. No cuenta para la velocidad de
          referencia ni para la rutina; sí alimenta lo que la app sabe de tus teclas, transiciones y palabras.
        </p>
      </header>
      <div className="card grid gap-4 p-6">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Pegá un mail, un párrafo, lo que sea…"
          aria-label="Tu texto"
          rows={8}
          className="card w-full resize-y px-4 py-3 font-body text-lg outline-none focus:border-mod"
          data-testid="own-text-input"
        />
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-ink-soft">
          <span>
            {prepared.length} caracteres tipeables{draft.length > prepared.length + 20 ? ' (se quitaron los que tu teclado no tiene y los saltos de línea)' : ''}
            {prepared.length >= 1500 ? ' · tope de 1500' : ''}
          </span>
          <Keycap variant="primary" size="lg" disabled={prepared.length < 10} onClick={() => setText(prepared)} data-testid="own-text-go">
            Tipear →
          </Keycap>
        </div>
      </div>
    </div>
  )
}

interface Result {
  m: ReturnType<typeof metrics>
  repair: RepairMetrics | null
}

function OwnTextRun({ text, onAnother }: { text: string; onAnother: () => void }) {
  const sound = useStore((s) => s.settings.sound)
  const recordSession = useStore((s) => s.recordSession)
  const navigate = useNavigate()
  const [result, setResult] = useState<Result | null>(null)
  const rollover = useRef(newRollover())

  const onFinish = useCallback(
    (state: TypingState) => {
      const m = metrics(state)
      if (m.chars === 0) return
      const repair = repairMetrics(state)
      const dead = deadKeyStats(state)
      recordSession(
        {
          kind: 'review',
          wpm: m.wpm,
          acc: m.accuracy,
          chars: m.chars,
          errors: m.errors,
          seconds: m.seconds,
          rhythm: rhythm(state),
          rollover: rolloverRatio(rollover.current),
          cleanRun: cleanRun(state),
          blind: true,
          ...repairFields(repair, 'free'),
          ...(dead && { dead }),
        },
        keySamples(state).values(),
        { bigrams: bigramSamples(state).values(), words: wordSamples(state).values() },
      )
      setResult({ m, repair })
    },
    [recordSession],
  )

  const session = useTypingSession(text, { sound, onFinish, mode: 'free' })

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

  return (
    <div className="animate-rise">
      <header className="mb-6">
        <div className="eyebrow mb-1">Texto propio</div>
        <h1 className="text-3xl md:text-4xl">Tu texto, con tus dedos.</h1>
        <p className="mt-1 text-ink-soft">{text.length} caracteres. El error pasa; Backspace repara. Esc reinicia.</p>
      </header>
      {result ? (
        <div className="card animate-rise p-8 text-center">
          <div className="eyebrow mb-3">Texto propio · listo</div>
          <div className="mx-auto flex max-w-2xl flex-wrap justify-around gap-x-6 gap-y-4">
            <Stat label="Velocidad" value={result.m.wpm} unit="PPM" />
            <Stat label="Al primer intento" value={`${Math.round(result.m.accuracy * 100)} %`} tone={result.m.accuracy >= 0.97 ? 'enter' : result.m.accuracy >= 0.95 ? 'ink' : 'esc'} />
            {result.repair && (
              <>
                <Stat
                  label="Reparados"
                  value={
                    <>
                      {result.repair.repaired}
                      <span className="ml-1 text-base font-bold text-ink-mute">de {result.repair.erred}</span>
                    </>
                  }
                />
                <Stat label="Teclas por letra" value={result.repair.kspc.toFixed(2).replace('.', ',')} />
              </>
            )}
          </div>
          <p className="mt-4 text-sm text-ink-mute">No cuenta para la referencia: es el puente al uso real, no una medición.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Keycap variant="ghost" onClick={onAnother}>
              Otro texto
            </Keycap>
            <Keycap to="/" variant="primary" size="lg">
              Volver al inicio <span className="opacity-70">(Enter)</span> →
            </Keycap>
          </div>
        </div>
      ) : (
        <div className="grid gap-4">
          <div className="card p-6 md:p-8">
            <TypingArea state={session.state} onInput={session.input} onBackspace={session.backspace} onRestart={() => session.restart()} rollover={rollover} />
          </div>
          <div className="flex items-center justify-between px-1 text-sm font-bold text-ink-mute">
            <span>Sin teclado ni manos</span>
            <span>Esc reinicia</span>
          </div>
        </div>
      )}
    </div>
  )
}
