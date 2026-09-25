import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router'
import { BOOKS, bookProgress, lastRead, nextSpot, readingText, type Book, type Spot } from '@/engine/reading'
import { newRollover, rolloverRatio } from '@/engine/stats'
import { bigramSamples, cleanRun, deadKeyStats, keySamples, metrics, repairMetrics, rhythm, wordSamples, type RepairMetrics, type TypingState } from '@/engine/typing'
import { Keycap } from '../components/Keycap'
import { TypingArea } from '../components/TypingArea'
import { useProgress } from '../hooks/useCurriculum'
import { useTypingSession } from '../hooks/useTypingSession'
import { useStore, type ReadingSpot } from '../store'

/** What each book's chapters are called on its card. */
const CHAPTERS: Record<string, [string, string]> = {
  'quiroga-selva': ['cuento', 'cuentos'],
  'arlt-aguafuertes': ['aguafuerte', 'aguafuertes'],
}

const spotOf = (r: ReadingSpot | undefined): Spot | null | undefined => (r === undefined ? undefined : r.done ? null : { chapter: r.chapter, page: r.page })

/**
 * The reading mode's library: public-domain Rioplatense books, typed page by page with the place kept.
 * Practice, not measurement: no reference speed, no routine block.
 */
export function Library() {
  const reading = useStore((s) => s.reading)
  const setReadingSpot = useStore((s) => s.setReadingSpot)
  const last = lastRead(reading)
  return (
    <div className="animate-rise">
      <header className="mb-6">
        <div className="eyebrow mb-1">Modo lectura</div>
        <h1 className="text-3xl md:text-4xl">Libros para tipear de corrido.</h1>
        <p className="mt-1 max-w-2xl text-ink-soft">
          Página por página, con tu lugar guardado. El error pasa, pero la palabra se corrige con Backspace antes de seguir: el espacio espera. No cuenta para la
          velocidad de referencia ni para la rutina.
        </p>
      </header>
      <div className="grid gap-4 md:grid-cols-2">
        {BOOKS.map((b) => {
          const spot = spotOf(reading[b.id])
          const p = bookProgress(b, spot)
          const [one, many] = CHAPTERS[b.id] ?? ['capítulo', 'capítulos']
          const done = spot === null
          return (
            <section key={b.id} className="card flex flex-col gap-3 p-6" data-testid={`book-${b.id}`}>
              <div className="flex items-center justify-between gap-2">
                <div className="eyebrow">
                  {b.author} · {b.year}
                </div>
                {last === b.id && <span className="rounded-full bg-sun-soft px-2 py-0.5 text-xs font-black text-sun-edge">el último</span>}
              </div>
              <h2 className="text-2xl">{b.title}</h2>
              <p className="text-sm text-ink-soft">
                {b.chapters.length} {b.chapters.length === 1 ? one : many} · {p.total} páginas
                {spot ? ` · vas por «${b.chapters[spot.chapter].title}»` : done ? ' · terminado' : ''}
              </p>
              <div className="h-2 w-full overflow-hidden rounded-full bg-paper-deep">
                <div className="h-full rounded-full bg-lav" style={{ width: `${(p.done / p.total) * 100}%` }} />
              </div>
              <div className="mt-1 flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-ink-mute">
                <span>
                  {p.done} de {p.total} páginas
                </span>
                {done ? (
                  <Keycap variant="ghost" size="sm" onClick={() => setReadingSpot(b.id, { chapter: 0, page: 0 })}>
                    Leer de nuevo
                  </Keycap>
                ) : (
                  <Keycap to={`/lectura/${b.id}`} variant="primary" size="sm">
                    {spot ? 'Seguir leyendo →' : 'Empezar →'}
                  </Keycap>
                )}
              </div>
            </section>
          )
        })}
      </div>
      <p className="mt-6 max-w-3xl text-xs text-ink-mute">
        Textos de dominio público tomados de{' '}
        <a className="underline" href="https://es.wikisource.org" target="_blank" rel="noreferrer">
          es.wikisource.org
        </a>
        . Adaptados para tipear: puntuación de teclado (— como -, comillas rectas), los acentos de 1918 que la RAE sacó después (fué, vió), y afuera los textos
        con tuteo.
      </p>
    </div>
  )
}

export function Reader() {
  const { bookId } = useParams()
  const book = BOOKS.find((b) => b.id === bookId)
  if (!book) return <Navigate to="/lectura" replace />
  return <ReaderRun book={book} />
}

function ReaderRun({ book }: { book: Book }) {
  const { layout } = useProgress()
  const saved = useStore((s) => s.reading[book.id])
  const setReadingSpot = useStore((s) => s.setReadingSpot)
  const [spot, setSpot] = useState<Spot>(() => (saved && !saved.done ? { chapter: saved.chapter, page: saved.page } : { chapter: 0, page: 0 }))
  const [ended, setEnded] = useState(false)
  const chapter = book.chapters[spot.chapter]
  const text = useMemo(() => readingText(chapter.pages[spot.page], layout), [chapter, spot.page, layout])

  // The place is saved as soon as a page is typed: leaving after it does not repeat it.
  const onPageDone = useCallback(() => setReadingSpot(book.id, nextSpot(book, spot)), [book, spot, setReadingSpot])
  const onNext = useCallback(() => {
    const next = nextSpot(book, spot)
    if (next) setSpot(next)
    else setEnded(true)
  }, [book, spot])

  const jump = (i: number) => {
    const to = { chapter: i, page: 0 }
    setSpot(to)
    setReadingSpot(book.id, to)
  }

  if (ended) {
    return (
      <div className="animate-rise">
        <div className="card p-8 text-center">
          <div className="eyebrow mb-3">Libro terminado</div>
          <h1 className="text-3xl">{book.title}</h1>
          <p className="mt-2 text-ink-soft">
            {book.author}, de punta a punta con tus dedos. {bookProgress(book, null).total} páginas.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Keycap to="/lectura" variant="primary" size="lg">
              Volver a la biblioteca →
            </Keycap>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="animate-rise">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Link to="/lectura" className="text-xs font-black uppercase tracking-wider text-ink-mute hover:text-ink">
              ← Biblioteca
            </Link>
            <span className="text-xs font-black uppercase tracking-wider text-ink-mute">
              {book.author} · {book.title}
            </span>
          </div>
          <h1 className="mt-1 text-3xl md:text-4xl">{chapter.title}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-sm font-bold text-ink-soft">
          <span data-testid="page-of">
            página {spot.page + 1} de {chapter.pages.length}
          </span>
          <label className="inline-flex items-center gap-2">
            <span className="sr-only">Ir a</span>
            <select
              id="reading-chapter"
              value={spot.chapter}
              onChange={(e) => jump(Number(e.target.value))}
              className="max-w-[16rem] rounded-lg border border-line bg-keycap px-2 py-1 text-sm"
              data-testid="chapter-select"
            >
              {book.chapters.map((c, i) => (
                <option key={c.title} value={i}>
                  {c.title}
                </option>
              ))}
            </select>
          </label>
        </div>
      </header>
      <ReadingPage key={`${spot.chapter}-${spot.page}`} text={text} onDone={onPageDone} onNext={onNext} />
    </div>
  )
}

interface PageResult {
  m: ReturnType<typeof metrics>
  repair: RepairMetrics | null
}

function ReadingPage({ text, onDone, onNext }: { text: string; onDone: () => void; onNext: () => void }) {
  const sound = useStore((s) => s.settings.sound)
  const recordSession = useStore((s) => s.recordSession)
  const [result, setResult] = useState<PageResult | null>(null)
  const rollover = useRef(newRollover())

  const onFinish = useCallback(
    (state: TypingState) => {
      const m = metrics(state)
      if (m.chars === 0) return
      const repair = repairMetrics(state)
      const dead = deadKeyStats(state)
      recordSession(
        {
          kind: 'reading',
          wpm: m.wpm,
          acc: m.accuracy,
          chars: m.chars,
          errors: m.errors,
          seconds: m.seconds,
          rhythm: rhythm(state),
          rollover: rolloverRatio(rollover.current),
          cleanRun: cleanRun(state),
          blind: true,
          ...(repair && { mode: 'word' as const, firstTryErrors: repair.firstTryErrors, kspc: repair.kspc, repaired: repair.repaired, repairMs: repair.repairMs }),
          ...(dead && { dead }),
        },
        keySamples(state).values(),
        { bigrams: bigramSamples(state).values(), words: wordSamples(state).values() },
      )
      onDone()
      setResult({ m, repair })
    },
    [recordSession, onDone],
  )

  const session = useTypingSession(text, { sound, onFinish, mode: 'word' })

  useEffect(() => {
    if (!result) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        onNext()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [result, onNext])

  return (
    <div className="grid gap-4">
      <div className="card p-6 md:p-8">
        <TypingArea state={session.state} onInput={session.input} onBackspace={session.backspace} onRestart={() => session.restart()} rollover={rollover} />
        {result && (
          <div className="animate-pop mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-lav-soft px-4 py-3" data-testid="page-done">
            <span className="font-bold text-ink">
              ✓ {result.m.wpm} PPM · {Math.round(result.m.accuracy * 100)} % al primer intento
              {result.repair && result.repair.firstTryErrors > 0 ? ` · ${result.repair.repaired} de ${result.repair.firstTryErrors} reparados` : ''}
            </span>
            <Keycap variant="primary" size="sm" onClick={onNext} autoFocus>
              Seguir (Enter) →
            </Keycap>
          </div>
        )}
      </div>
      <div className="flex items-center justify-between px-1 text-sm font-bold text-ink-mute">
        <span>El error pasa; el espacio espera a que la palabra esté bien. Backspace repara.</span>
        <span>Esc reinicia la página</span>
      </div>
    </div>
  )
}
