import { Link } from 'react-router'
import { dayKey, referenceByDay, referenceHeadline, streakAlive } from '@/engine/stats'
import { Keycap } from '../components/Keycap'
import { Check, Stars } from '../components/ui'
import { useProgress } from '../hooks/useCurriculum'
import { useRoutine, useStore, type RoutineBlock } from '../store'
import { unitAccentClass } from '../lib/accents'

const BLOCKS: { id: RoutineBlock; title: string; detail: string; minutes: string; variant: 'sun' | 'primary' | 'secondary' | 'coral'; to: string }[] = [
  { id: 'warmup', title: 'Calentamiento', detail: 'Las teclas que ya sabés, a ritmo suave.', minutes: '1 min', variant: 'sun', to: '/practica/calentamiento' },
  { id: 'lesson', title: 'Lección', detail: 'La siguiente de tu ruta.', minutes: '5 min', variant: 'primary', to: '' },
  { id: 'review', title: 'Repaso', detail: 'Tus tres teclas más flojas, adrede.', minutes: '2 min', variant: 'secondary', to: '/practica/repaso' },
  { id: 'challenge', title: 'Reto', detail: 'Un minuto de texto real. Mide tu PPM.', minutes: '1 min', variant: 'coral', to: '/practica/reto' },
]

function greeting(name: string): string {
  const h = new Date().getHours()
  const when = h < 5 ? 'Buenas noches' : h < 13 ? 'Buen día' : h < 20 ? 'Buenas tardes' : 'Buenas noches'
  return name ? `${when}, ${name}.` : `${when}.`
}

export function Home() {
  const name = useStore((s) => s.settings.name)
  const streak = useStore((s) => s.streak)
  const sessions = useStore((s) => s.sessions)
  const results = useStore((s) => s.lessons)
  const routine = useRoutine()
  const { curriculum, next, completed } = useProgress()

  const doneCount = BLOCKS.filter((b) => routine[b.id]).length
  const alive = streakAlive(streak, dayKey())
  const recent = sessions.slice(-10)
  const reference = referenceHeadline(referenceByDay(sessions))
  const recentAcc = recent.length ? recent.reduce((a, s) => a + s.acc, 0) / recent.length : null
  const unit = next ? curriculum.units.find((u) => u.id === next.unitId) : undefined
  const totalStars = Object.values(results).reduce((a, r) => a + r.stars, 0)

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
      </header>

      {/* La rutina de hoy: una fila de cuatro teclas */}
      <section className="mb-10">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {BLOCKS.map((b) => {
            const done = routine[b.id]
            const to = b.id === 'lesson' ? (next ? `/leccion/${next.id}` : '/ruta') : b.to
            return (
              <Link
                key={b.id}
                to={to}
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
              <dt className="text-xs font-bold text-ink-mute">Precisión reciente</dt>
              <dd className="font-display text-3xl font-extrabold">
                {recentAcc === null ? '—' : `${Math.round(recentAcc * 100)} %`}
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
              <dd className="font-display text-3xl font-extrabold">{sessions.length}</dd>
            </div>
          </dl>
          <Link to="/estadisticas" className="mt-4 inline-block text-sm font-bold text-mod-edge underline">
            Ver progreso completo
          </Link>
        </div>
      </section>
    </div>
  )
}
