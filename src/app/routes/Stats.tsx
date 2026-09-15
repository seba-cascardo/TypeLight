import { useMemo } from 'react'
import { keySpeed, weaknessScore } from '@/engine/stats'
import { Keyboard } from '../components/Keyboard'
import { PageTitle, Stars } from '../components/ui'
import { useProgress } from '../hooks/useCurriculum'
import { useStore } from '../store'

function dayLabel(iso: string): string {
  return new Date(iso).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })
}

export function Stats() {
  const sessions = useStore((s) => s.sessions)
  const keys = useStore((s) => s.keys)
  const results = useStore((s) => s.lessons)
  const { layout, learned, curriculum } = useProgress()

  const recent = sessions.slice(-40)
  const maxWpm = Math.max(20, ...recent.map((s) => s.wpm))

  const byDay = useMemo(() => {
    const map = new Map<string, { wpm: number[]; acc: number[]; n: number }>()
    for (const s of sessions) {
      const d = s.at.slice(0, 10)
      const v = map.get(d) ?? { wpm: [], acc: [], n: 0 }
      v.wpm.push(s.wpm)
      v.acc.push(s.acc)
      v.n++
      map.set(d, v)
    }
    return [...map.entries()].slice(-14).map(([d, v]) => ({
      day: d,
      wpm: Math.round(v.wpm.reduce((a, b) => a + b, 0) / v.wpm.length),
      acc: v.acc.reduce((a, b) => a + b, 0) / v.acc.length,
      n: v.n,
    }))
  }, [sessions])

  const heat = useMemo(() => {
    const speeds = learned.map((c) => [c, keySpeed(keys[c])] as const).filter((x): x is readonly [string, number] => x[1] !== null)
    if (speeds.length < 2) return undefined
    const min = Math.min(...speeds.map((x) => x[1]))
    const max = Math.max(...speeds.map((x) => x[1]))
    const out: Record<string, number> = {}
    for (const [c, v] of speeds) out[c] = max === min ? 0.5 : (v - min) / (max - min)
    return out
  }, [keys, learned])

  const weakest = useMemo(
    () =>
      learned
        .filter((c) => c !== ' ' && keys[c] && keys[c].samples >= 3)
        .map((c) => ({ c, stat: keys[c], score: weaknessScore(keys[c]) }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 6),
    [keys, learned],
  )

  const best = sessions.reduce((m, s) => Math.max(m, s.wpm), 0)
  const challenges = sessions.filter((s) => s.kind === 'challenge')
  const bestChallenge = challenges.reduce((m, s) => Math.max(m, s.wpm), 0)
  const minutes = Math.round(sessions.reduce((a, s) => a + s.seconds, 0) / 60)

  if (sessions.length === 0) {
    return (
      <div className="animate-rise">
        <PageTitle eyebrow="Progreso" title="Todavía no hay números." />
        <div className="card p-8 text-ink-soft">
          Cuando termines tu primer ejercicio, acá vas a ver tu velocidad, tu precisión y un mapa de calor de tus teclas.
        </div>
      </div>
    )
  }

  return (
    <div className="animate-rise">
      <PageTitle eyebrow="Progreso" title="Lo que dicen tus dedos.">
        <dl className="flex gap-6">
          <div>
            <dt className="eyebrow">Mejor</dt>
            <dd className="font-display text-3xl font-extrabold">{best} <span className="text-sm text-ink-mute">PPM</span></dd>
          </div>
          <div>
            <dt className="eyebrow">Mejor reto</dt>
            <dd className="font-display text-3xl font-extrabold">{bestChallenge || '—'} <span className="text-sm text-ink-mute">PPM</span></dd>
          </div>
          <div>
            <dt className="eyebrow">Práctica</dt>
            <dd className="font-display text-3xl font-extrabold">{minutes} <span className="text-sm text-ink-mute">min</span></dd>
          </div>
        </dl>
      </PageTitle>

      <section className="card mb-4 p-6">
        <div className="mb-4 flex items-end justify-between">
          <h2 className="text-2xl">Velocidad, ejercicio por ejercicio</h2>
          <span className="text-xs font-bold text-ink-mute">últimos {recent.length} · verde = precisión ≥ 97 %</span>
        </div>
        <svg viewBox={`0 0 ${recent.length * 14} 120`} className="h-40 w-full" preserveAspectRatio="none" role="img" aria-label="Velocidad por ejercicio">
          {[0.25, 0.5, 0.75, 1].map((f) => (
            <line key={f} x1="0" x2={recent.length * 14} y1={120 - f * 110} y2={120 - f * 110} stroke="var(--color-line-soft)" strokeWidth="1" />
          ))}
          {recent.map((s, i) => {
            const h = (s.wpm / maxWpm) * 110
            const fill = s.acc >= 0.97 ? 'var(--color-enter)' : s.acc >= 0.95 ? 'var(--color-sun)' : 'var(--color-esc)'
            return <rect key={i} x={i * 14 + 3} y={120 - h} width="8" height={h} rx="3" fill={fill} />
          })}
        </svg>
        <div className="mt-1 flex justify-between text-xs font-bold text-ink-mute">
          <span>{dayLabel(recent[0].at)}</span>
          <span>máx {maxWpm} PPM</span>
          <span>{dayLabel(recent[recent.length - 1].at)}</span>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="card p-6">
          <h2 className="mb-3 text-2xl">Por día</h2>
          <ul className="space-y-1.5">
            {byDay.map((d) => (
              <li key={d.day} className="flex items-center gap-3 text-sm">
                <span className="w-16 shrink-0 font-bold text-ink-mute">{dayLabel(d.day)}</span>
                <span className="h-3 rounded-full bg-mod" style={{ width: `${Math.min(100, (d.wpm / Math.max(1, maxWpm)) * 100)}%` }} />
                <span className="font-bold">{d.wpm} PPM</span>
                <span className="text-ink-mute">· {Math.round(d.acc * 100)} % · {d.n} {d.n === 1 ? 'ejercicio' : 'ejercicios'}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="card p-6">
          <h2 className="mb-3 text-2xl">Teclas que piden más práctica</h2>
          {weakest.length === 0 ? (
            <p className="text-ink-soft">Con unos ejercicios más aparecen acá.</p>
          ) : (
            <ul className="space-y-2">
              {weakest.map(({ c, stat }) => (
                <li key={c} className="flex items-center gap-3">
                  <span className="keycap keycap-sm w-10 font-mono text-lg">{c}</span>
                  <span className="text-sm text-ink-soft">
                    {keySpeed(stat)} teclas/min · {Math.round(stat.errorEma * 100)} % de error
                  </span>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-4 text-xs text-ink-mute">El repaso diario usa exactamente estas teclas.</p>
        </section>
      </div>

      <section className="card mt-4 p-6">
        <div className="mb-3 flex items-end justify-between">
          <h2 className="text-2xl">Mapa de calor</h2>
          <span className="text-xs font-bold text-ink-mute">coral = lenta · verde = rápida · gris = sin datos</span>
        </div>
        {heat ? <Keyboard layout={layout} fingerColors={false} heat={heat} size="md" /> : <p className="text-ink-soft">Necesito al menos tres intentos por tecla para pintarlo.</p>}
      </section>

      <section className="card mt-4 p-6">
        <h2 className="mb-3 text-2xl">Unidades</h2>
        <ul className="grid gap-2 sm:grid-cols-2">
          {curriculum.units.map((u) => {
            const done = u.lessons.filter((l) => results[l.id]?.stars).length
            const stars = u.lessons.reduce((a, l) => a + (results[l.id]?.stars ?? 0), 0)
            return (
              <li key={u.id} className="flex items-center justify-between rounded-xl bg-paper px-4 py-3">
                <span className="font-bold">{u.title}</span>
                <span className="flex items-center gap-3 text-sm text-ink-soft">
                  {done}/{u.lessons.length}
                  <span className="inline-flex items-center gap-1">
                    <Stars count={3} size="sm" /> {stars}/{u.lessons.length * 3}
                  </span>
                </span>
              </li>
            )
          })}
        </ul>
      </section>
    </div>
  )
}
