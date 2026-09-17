import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { warmupGame, wordsReady, type GameId } from '@/engine/curriculum'
import { dayKey, dayOfYear, examDue, legacyBeaten, median, referenceByDay, referenceHeadline, streakAlive, weeklyAccuracy } from '@/engine/stats'
import { GAME_META } from '../components/games/meta'
import { Keycap } from '../components/Keycap'
import { Check, Stars } from '../components/ui'
import { useProgress } from '../hooks/useCurriculum'
import { useRoutine, useStore, type RoutineBlock } from '../store'
import { unitAccentClass } from '../lib/accents'
import { backupDue } from '../lib/backup'

type Block = { id: RoutineBlock; title: string; detail: string; minutes: string; variant: 'sun' | 'primary' | 'secondary' | 'coral' | 'lav' | 'mint'; to: string }

const BLOCKS: Block[] = [
  { id: 'warmup', title: 'Calentamiento', detail: 'Las teclas que ya sabés, a ritmo suave.', minutes: '~1 min', variant: 'sun', to: '/practica/calentamiento' },
  { id: 'lesson', title: 'Lección', detail: 'La siguiente de tu ruta.', minutes: '5 min', variant: 'primary', to: '' },
  { id: 'review', title: 'Repaso', detail: 'Tus tres teclas más flojas, adrede.', minutes: '2 min', variant: 'secondary', to: '/practica/repaso' },
  { id: 'challenge', title: 'Reto', detail: 'Un minuto de texto real, sin ayuda. Mide tu PPM.', minutes: '1 min', variant: 'coral', to: '/practica/reto' },
]

/** Once a week the coral card is the exam: three minutes, no help, no Backspace. */
const EXAM_BLOCK: Block = { id: 'challenge', title: 'Examen semanal', detail: 'Sin ayuda ni Backspace. Tu velocidad limpia.', minutes: '3 min', variant: 'coral', to: '/practica/examen' }

/** One day in three the warm-up is a game; it still counts as the warm-up. */
const GAME_BLOCK: Record<'rhythm' | 'balloons', Block> = {
  rhythm: { id: 'warmup', title: 'Al compás', detail: 'Hoy el Calentamiento es un juego: pulso un poco por debajo de tu ritmo.', minutes: '~1 min · juego', variant: 'lav', to: '/practica/calentamiento' },
  balloons: { id: 'warmup', title: 'Globos', detail: 'Hoy el Calentamiento es un juego: palabras enteras antes de que se escapen.', minutes: '~1 min · juego', variant: 'mint', to: '/practica/calentamiento' },
}

/** "Después de ___, practico." — lower-case anchor, and "de el" contracts to "del". */
function anchorSentence(anchor: string): string {
  const a = anchor.trim()
  const lower = `${a.charAt(0).toLowerCase()}${a.slice(1)}`
  return lower.startsWith('el ') ? `Después del ${lower.slice(3)}, practico.` : `Después de ${lower}, practico.`
}

/**
 * One-time card for the typist who already typed before TypeLight: what to expect and the
 * implementation intention that anchors the habit. Closes for good with "Listo".
 */
function ConversoCard() {
  const anchor = useStore((s) => s.settings.anchor)
  const setSettings = useStore((s) => s.setSettings)
  const [draft, setDraft] = useState(anchor)
  return (
    <section className="card mb-8 border-2 border-sun p-5 md:p-6" data-testid="converso-card">
      <div className="eyebrow mb-1">Antes de seguir</div>
      <h2 className="text-2xl md:text-3xl">Diez minutos, cinco días, unas diez semanas.</h2>
      <p className="mt-2 max-w-2xl text-ink-soft">
        Las primeras dos o tres semanas vas a ser más lento que con los dedos de antes. Es esperado: la precisión hace la velocidad. Lo que más ayuda a
        sostenerlo es decidir ahora cuándo practicás.
      </p>
      <form
        className="mt-4 flex flex-wrap items-center gap-3"
        onSubmit={(e) => {
          e.preventDefault()
          setSettings({ anchor: draft.trim(), conversoSeen: true })
        }}
      >
        <label className="flex flex-wrap items-center gap-2 font-bold">
          Después de
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="el mate de la mañana"
            aria-label="Tu ancla"
            className="card w-56 px-3 py-2 font-semibold outline-none focus:border-mod"
          />
          , practico.
        </label>
        <Keycap variant="primary" type="submit">
          Listo →
        </Keycap>
      </form>
    </section>
  )
}

function greeting(name: string): string {
  const h = new Date().getHours()
  const when = h < 5 ? 'Buenas noches' : h < 13 ? 'Buen día' : h < 20 ? 'Buenas tardes' : 'Buenas noches'
  return name ? `${when}, ${name}.` : `${when}.`
}

export function Home() {
  const name = useStore((s) => s.settings.name)
  const streak = useStore((s) => s.streak)
  const sessions = useStore((s) => s.sessions)
  const days = useStore((s) => s.days)
  const results = useStore((s) => s.lessons)
  const lastBackupAt = useStore((s) => s.settings.lastBackupAt)
  const legacy = useStore((s) => s.legacy)
  const setLegacy = useStore((s) => s.setLegacy)
  const lastExamDay = useStore((s) => s.lastExamDay)
  const anchor = useStore((s) => s.settings.anchor)
  const conversoSeen = useStore((s) => s.settings.conversoSeen)
  const routine = useRoutine()
  const examToday = examDue(lastExamDay, dayKey()) && !routine.challenge
  const { curriculum, next, completed, learned } = useProgress()
  const game = warmupGame(dayOfYear(), learned)
  const blocks = BLOCKS.map((b) => (b.id === 'challenge' && examToday ? EXAM_BLOCK : b.id === 'warmup' && game ? GAME_BLOCK[game] : b))

  const doneCount = BLOCKS.filter((b) => routine[b.id]).length
  const activeDays = Object.values(days).filter((d) => d.seconds > 0).length
  const alive = streakAlive(streak, dayKey())
  const points = referenceByDay(days)
  const reference = referenceHeadline(points)
  const recentMedian = points.length ? median(points.slice(-7).map((p) => p.wpm)) : null
  const exercises = Object.values(days).reduce((a, d) => a + d.sessions, 0)
  const weekly = weeklyAccuracy(sessions, dayKey())
  const unit = next ? curriculum.units.find((u) => u.id === next.unitId) : undefined
  const totalStars = Object.values(results).reduce((a, r) => a + r.stars, 0)
  const playable: GameId[] = wordsReady(learned) ? ['rain', 'rhythm', 'balloons', 'race'] : ['rain', 'rhythm']

  useEffect(() => {
    if (legacy && !legacy.beatenAt && legacyBeaten(points, legacy.wpm)) setLegacy({ ...legacy, beatenAt: dayKey() })
  }, [legacy, points, setLegacy])

  return (
    <div className="animate-rise">
      <header className="mb-8">
        <div className="eyebrow mb-2">{new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
        <h1 className="text-4xl md:text-5xl">{greeting(name)}</h1>
        <p className="mt-2 text-lg text-ink-soft">
          {doneCount === 4
            ? 'Rutina completa. Lo que sigue es regalo.'
            : doneCount === 0
              ? 'Cuatro teclas para hoy. Diez minutos, no más.'
              : `${doneCount} de 4. Seguimos.`}
        </p>
        {anchor && (
          <p className="mt-2 inline-flex items-center gap-2 text-sm font-bold text-ink-soft" data-testid="anchor">
            <span className="inline-block h-2 w-2 rounded-full bg-enter" aria-hidden="true" />
            {anchorSentence(anchor)}
          </p>
        )}
      </header>

      {!conversoSeen && <ConversoCard />}

      {legacy?.beatenAt && !legacy.beatenSeen && (
        <section className="card mb-8 flex flex-wrap items-center justify-between gap-3 border-2 border-enter p-5" data-testid="legacy-beaten">
          <div>
            <div className="eyebrow mb-1">Hito</div>
            <p className="font-display text-xl font-extrabold">Superaste tu forma vieja.</p>
            <p className="text-ink-soft">
              La mediana de tus Retos ya está en {recentMedian ?? legacy.wpm} PPM con los dedos correctos, contra {legacy.wpm} de antes.
            </p>
          </div>
          <Keycap variant="ghost" size="sm" onClick={() => setLegacy({ ...legacy, beatenSeen: true })}>
            Cerrar
          </Keycap>
        </section>
      )}

      {backupDue(lastBackupAt, dayKey(), activeDays) && (
        <p className="mb-6 rounded-xl bg-sun-soft/60 px-4 py-2 text-sm font-semibold text-ink-soft" data-testid="backup-reminder">
          {lastBackupAt ? 'Hace más de un mes que no guardás una copia de tu progreso.' : 'Tu progreso vive solo en este navegador.'}{' '}
          <Link to="/ajustes" className="font-bold text-mod-edge underline">
            Ajustes → Descargar copia
          </Link>
        </p>
      )}

      {/* La rutina de hoy: una fila de cuatro teclas */}
      <section className="mb-10">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {blocks.map((b) => {
            const done = routine[b.id]
            const to = b.id === 'lesson' ? (next ? `/leccion/${next.id}` : '/ruta') : b.to
            return (
              <Link
                key={b.id}
                to={to}
                data-testid={`routine-${b.id}`}
                data-done={done ? 'true' : 'false'}
                className={`keycap keycap-${b.variant} flex-col items-start gap-1 px-4 py-4 text-left ${done ? 'opacity-80' : ''}`}
                style={{ borderRadius: 16 }}
              >
                <div className="flex w-full items-center justify-between">
                  <span className="text-[0.7rem] font-black uppercase tracking-widest opacity-80">{b.minutes}</span>
                  <Check done={done} />
                </div>
                <span className="font-display text-xl font-extrabold leading-tight md:text-2xl">{b.title}</span>
                <span className="text-sm font-semibold leading-snug opacity-90">
                  {b.id === 'lesson' && next ? next.title : b.detail}
                </span>
              </Link>
            )
          })}
        </div>
      </section>

      {doneCount === 4 && (
        <section className="mb-10" data-testid="play-row">
          <div className="eyebrow mb-3">Jugar · con todo lo que ya sabés</div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {playable.map((id) => (
              <Link key={id} to={`/jugar/${id}`} className={`keycap keycap-${GAME_META[id].variant} flex-col items-start gap-1 px-4 py-4 text-left`} style={{ borderRadius: 16 }}>
                <span className="font-display text-2xl leading-none">{GAME_META[id].glyph}</span>
                <span className="font-display text-xl font-extrabold leading-tight">{GAME_META[id].title}</span>
                <span className="text-sm font-semibold leading-snug opacity-90">{GAME_META[id].blurb}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="grid gap-4 md:grid-cols-[1.4fr_1fr]">
        <div className="card p-6">
          <div className="eyebrow mb-2">Tu ruta</div>
          {next && unit ? (
            <>
              <h2 className="text-2xl">
                <span className={`mr-2 inline-block rounded-md px-2 py-0.5 text-sm font-black text-white ${unitAccentClass(unit.accent)}`}>
                  {unit.title}
                </span>
                {next.title}
              </h2>
              <p className="mt-2 text-ink-soft">
                {next.kind === 'keys' && next.newChars.length
                  ? `Teclas nuevas: ${next.newChars.map((c) => (c === ' ' ? 'espacio' : c)).join(', ')}.`
                  : unit.blurb}
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Keycap to={`/leccion/${next.id}`} variant="primary">
                  Ir a la lección →
                </Keycap>
                <Keycap to="/ruta" variant="ghost">
                  Ver toda la ruta
                </Keycap>
              </div>
            </>
          ) : (
            <>
              <h2 className="text-2xl">Ruta completa.</h2>
              <p className="mt-2 text-ink-soft">Conocés todas las teclas. Ahora, la rutina diaria y los retos hacen el resto.</p>
            </>
          )}
          <div className="mt-6 h-2 w-full overflow-hidden rounded-full bg-paper-deep">
            <div
              className="h-full rounded-full bg-enter transition-all"
              style={{ width: `${(completed.size / curriculum.lessons.length) * 100}%` }}
            />
          </div>
          <div className="mt-2 flex justify-between text-xs font-bold text-ink-mute">
            <span>
              {completed.size} de {curriculum.lessons.length} lecciones
            </span>
            <span className="inline-flex items-center gap-1">
              <Stars count={3} size="sm" /> {totalStars}
            </span>
          </div>
        </div>

        <div className="card p-6">
          <div className="eyebrow mb-3">Últimos números</div>
          <dl className="grid grid-cols-2 gap-4">
            <div>
              <dt className="text-xs font-bold text-ink-mute">Velocidad de referencia</dt>
              <dd className="font-display text-3xl font-extrabold">
                {reference ? reference.value : '—'} <span className="text-sm text-ink-mute">PPM</span>
              </dd>
            </div>
            <div>
              <dt className="text-xs font-bold text-ink-mute">Precisión · 7 días</dt>
              <dd className="font-display text-3xl font-extrabold">
                {weekly ? `${Math.round(weekly.acc * 100)} %` : '—'}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-bold text-ink-mute">Racha</dt>
              <dd className="font-display text-3xl font-extrabold">
                {alive ? streak.count : 0} <span className="text-sm text-ink-mute">{alive && streak.count === 1 ? 'día' : 'días'}</span>
              </dd>
            </div>
            <div>
              <dt className="text-xs font-bold text-ink-mute">Ejercicios</dt>
              <dd className="font-display text-3xl font-extrabold">{exercises}</dd>
            </div>
          </dl>
          {!legacy && (
            <Link to="/ajustes" className="mt-3 block text-sm font-bold text-ink-soft underline">
              Medí tu velocidad de antes →
            </Link>
          )}
          {legacy && <p className="mt-3 text-sm text-ink-soft">Tu velocidad de antes: {legacy.wpm} PPM.</p>}
          <Link to="/estadisticas" className="mt-4 inline-block text-sm font-bold text-mod-edge underline">
            Ver progreso completo
          </Link>
        </div>
      </section>
    </div>
  )
}
