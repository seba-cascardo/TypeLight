import { useMemo, type ReactNode } from 'react'
import {
  calendar,
  constancy,
  dayKey,
  fingerDominance,
  keySpeed,
  masteryCounts,
  masteryMap,
  referenceByDay,
  referenceHeadline,
  fluidity,
  snapshotBefore,
  streakAlive,
  unitMarks,
  weaknessScore,
  weeklyAccuracy,
} from '@/engine/stats'
import { Hands } from '../components/Hands'
import { Keyboard } from '../components/Keyboard'
import { Calendar } from '../components/stats/Calendar'
import { ReferenceChart } from '../components/stats/ReferenceChart'
import { PageTitle, Stars } from '../components/ui'
import { useProgress } from '../hooks/useCurriculum'
import { FINGER_NAME, typingFinger } from '../lib/fingers'
import { useStore } from '../store'

function Tile({ id, label, value, unit, note, up }: { id: string; label: string; value: string | number; unit?: string; note?: string; up?: boolean }) {
  return (
    <div className="rounded-2xl border border-line-soft bg-keycap px-4 py-3" data-testid={`tile-${id}`}>
      <div className="eyebrow">{label}</div>
      <div className="mt-1 font-display text-3xl font-extrabold leading-tight tabular-nums">
        {value} {unit && <span className="font-body text-sm font-semibold text-ink-mute">{unit}</span>}
      </div>
      {note && <div className={`text-sm ${up ? 'font-semibold text-enter-edge' : 'text-ink-soft'}`}>{note}</div>}
    </div>
  )
}

function Card({ title, sub, children, className = '' }: { title: string; sub: string; children: ReactNode; className?: string }) {
  return (
    <section className={`card p-6 ${className}`}>
      <h2 className="text-2xl">{title}</h2>
      <p className="mt-1 mb-4 text-sm text-ink-soft">{sub}</p>
      {children}
    </section>
  )
}

function Swatch({ className, label }: { className: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`inline-block h-3 w-3 rounded-sm ${className}`} />
      {label}
    </span>
  )
}

const signed = (n: number) => (n > 0 ? `↑ ${n}` : n < 0 ? `↓ ${Math.abs(n)}` : 'igual')
const pct = (v: number) => `${Math.round(v * 100)} %`

export function Stats() {
  const sessions = useStore((s) => s.sessions)
  const keys = useStore((s) => s.keys)
  const results = useStore((s) => s.lessons)
  const days = useStore((s) => s.days)
  const streak = useStore((s) => s.streak)
  const legacy = useStore((s) => s.legacy)
  const blindSince = useStore((s) => s.blindSince)
  const { layout, learned, curriculum, goalWpm } = useProgress()
  const today = dayKey()

  const points = useMemo(() => referenceByDay(days), [days])
  const headline = referenceHeadline(points)
  const marks = useMemo(() => unitMarks(days), [days])
  const weekly = weeklyAccuracy(sessions, today)
  const levels = useMemo(() => masteryMap(keys, learned, goalWpm), [keys, learned, goalWpm])
  const fingers = useMemo(() => fingerDominance(keys, learned, goalWpm, (ch) => typingFinger(layout, ch)), [keys, learned, goalWpm, layout])
  const fingerTints = Object.fromEntries(Object.entries(fingers).map(([f, d]) => [f, 0.12 + 0.78 * d!.value]))
  const fingerLabels = Object.fromEntries(Object.entries(fingers).map(([f, d]) => [f, `${Math.round(d!.value * 100)} %`]))
  const weakestFingers = Object.entries(fingers)
    .sort((a, b) => a[1]!.value - b[1]!.value)
    .slice(0, 2)
  const counts = masteryCounts(levels)
  const weekAgo = snapshotBefore(days, today)
  const cells = calendar(days, today)
  const cons = constancy(days, today)
  const fluid = fluidity(sessions, today)
  const alive = streakAlive(streak, today)

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

  if (sessions.length === 0) {
    return (
      <div className="animate-rise">
        <PageTitle eyebrow="Progreso" title="Todavía no hay números." />
        <div className="card p-8 text-ink-soft">
          Cuando termines tu primer ejercicio, acá vas a ver qué teclas ya dominás y cuánto practicaste. Tu primer Reto pone el primer punto de velocidad.
        </div>
      </div>
    )
  }

  return (
    <div className="animate-rise">
      <PageTitle eyebrow="Progreso" title="Cómo vas avanzando." />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Tile
          id="reference"
          label="Velocidad de referencia"
          value={headline ? headline.value : '—'}
          unit="PPM"
          note={headline ? (headline.delta === null ? 'todavía sin comparación' : `${signed(headline.delta)} vs. la semana pasada`) : 'tu primer Reto pone el primer punto'}
          up={(headline?.delta ?? 0) > 0}
        />
        <Tile
          id="accuracy"
          label="Precisión · 7 días"
          value={weekly ? Math.round(weekly.acc * 100) : '—'}
          unit="%"
          note={weekly ? `sobre ${weekly.chars.toLocaleString('es-AR')} caracteres` : 'sin ejercicios esta semana'}
        />
        <Tile
          id="mastery"
          label="Teclas dominadas"
          value={counts.mastered}
          unit={`de ${counts.learned}`}
          note={weekAgo ? `${signed(counts.mastered - weekAgo.mastered)} esta semana` : 'aprendidas hasta hoy'}
          up={weekAgo !== null && counts.mastered > weekAgo.mastered}
        />
        <Tile id="constancy" label="Constancia" value={cons.fullOfLast7} unit="de 7 días" note={`racha de ${alive ? streak.count : 0} · ${cons.minutesPerDay} min por día`} />
      </div>

      <Card
        title="Velocidad de referencia"
        sub="Solo los Retos de un minuto, el examen semanal, los textos de la unidad Velocidad y las Carreras. Las lecciones, los drills y los otros juegos no mueven esta línea. Un punto por día (la mediana si hubo varios); los días sin Reto quedan vacíos."
        className="mt-4"
      >
        {points.length === 0 ? (
          <p className="text-ink-soft">Tu primer Reto pone el primer punto.</p>
        ) : (
          <ReferenceChart points={points} goal={goalWpm} marks={marks} today={today} legacy={legacy?.wpm} blindSince={blindSince ?? undefined} />
        )}
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs font-bold text-ink-soft">
          <Swatch className="rounded-full bg-mod" label="Reto del día (mediana)" />
          <Swatch className="bg-mod opacity-50" label="tendencia (3 retos)" />
          <Swatch className="bg-sun-edge" label="meta de la unidad" />
          <Swatch className="bg-ink-mute" label="llegaron teclas nuevas" />
          <Swatch className="rotate-45 border-2 border-esc-edge bg-keycap" label="examen semanal" />
          {blindSince && <Swatch className="bg-ink" label="desde acá, sin ayuda" />}
          {legacy && <Swatch className="bg-ink-mute" label="tu velocidad de antes" />}
        </div>
        <details className="mt-3 text-sm text-ink-soft">
          <summary className="cursor-pointer font-bold text-ink">¿Por qué este número y no otro?</summary>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Solo cuentan el Reto de un minuto, el examen semanal, los textos de la unidad Velocidad y las Carreras: texto real, de corrido, contra reloj.</li>
            <li>Si hubo varios en un día, vale la mediana: un intento suelto, bueno o malo, no mueve la línea.</li>
            <li>La precisión es al primer intento: cada tecla equivocada cuenta, aunque el ejercicio termine perfecto o lo repares.</li>
            <li>Desde la marca «sin ayuda», el Reto se tipea sin teclado ni manos y con Backspace: la velocidad es la del texto correcto al final. El examen semanal es la misma medida sin Backspace.</li>
          </ul>
        </details>
      </Card>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Card title="Dominio del teclado" sub="Cada tecla se gana sola: rápida y sin errores en sus últimos intentos. Practicar f y j solo mueve f y j; las teclas sin aprender no cuentan.">
          <Keyboard layout={layout} fingerColors={false} levels={levels} size="md" />
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs font-bold text-ink-soft">
            <Swatch className="border border-enter bg-enter-soft" label={`dominada · ${counts.mastered}`} />
            <Swatch className="border border-sun bg-sun-soft" label={`en camino · ${counts.onTrack}`} />
            <Swatch className="border border-esc bg-esc-soft" label={`floja · ${counts.weak}`} />
            <Swatch className="bg-paper-deep" label="sin aprender" />
          </div>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-paper-deep">
            <div className="h-full rounded-full bg-enter transition-all" style={{ width: `${counts.learned ? (counts.mastered / counts.learned) * 100 : 0}%` }} />
          </div>
          <div className="mt-2 flex justify-between text-xs font-bold text-ink-mute">
            <span>
              {counts.mastered} de {counts.learned} aprendidas
            </span>
            <span>{weekAgo ? `hace 7 días: ${weekAgo.mastered}` : 'todavía sin historia'}</span>
          </div>
        </Card>

        <Card title="Dominio por dedo" sub="Cada dedo, según sus teclas aprendidas: el promedio de qué tan tuyas son. Los pálidos son los que faltan; la app no ve qué dedo usás, así que esto vale lo que valga tu forma.">
          {Object.keys(fingers).length === 0 ? (
            <p className="text-ink-soft">Con unos ejercicios más aparecen acá.</p>
          ) : (
            <div data-testid="finger-map">
              <Hands tints={fingerTints} labels={fingerLabels} className="mx-auto block w-full max-w-md" />
              <p className="mt-3 text-xs font-bold text-ink-mute">
                {weakestFingers.length > 0 && `Piden más: ${weakestFingers.map(([f]) => FINGER_NAME[f as keyof typeof FINGER_NAME]).join(' y ')}.`}
              </p>
            </div>
          )}
        </Card>

        <Card title="Constancia" sub="La rutina de cuatro tarjetas, día por día. Verde = completa, amarillo = alguna, gris = nada. El tiempo no se infla con un ejercicio fácil.">
          <Calendar cells={cells} />
          <div className="mt-3 flex flex-wrap justify-between gap-2 text-xs font-bold text-ink-mute">
            <span>Rutina completa {cons.fullOfLast7} de los últimos 7 días</span>
            <span>{cons.totalMinutes} min en total</span>
          </div>
          <div className="mt-5" data-testid="fluidity">
            <div className="mb-1.5 flex justify-between text-sm">
              <span>
                <span className="font-bold">Fluidez</span> <span className="text-ink-soft">· qué fracción de teclas empezás antes de soltar la anterior</span>
              </span>
              <span className="font-bold tabular-nums">{fluid !== null ? pct(fluid) : '—'}</span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-paper-deep">
              <div className="h-full rounded-full bg-mod transition-all" style={{ width: `${fluid !== null ? fluid * 100 : 0}%` }} />
            </div>
            <p className="mt-1.5 text-xs text-ink-mute">
              {fluid !== null
                ? 'Últimos 7 días. Sube sola cuando la mano ya prepara la tecla siguiente: es el mejor predictor de velocidad que se conoce.'
                : 'Aparece con ejercicios de veinte teclas o más en los últimos 7 días.'}
            </p>
          </div>
        </Card>

        <Card title="Teclas que piden práctica" sub="El Repaso diario usa exactamente estas.">
          {weakest.length === 0 ? (
            <p className="text-ink-soft">Con unos ejercicios más aparecen acá.</p>
          ) : (
            <ul className="space-y-2">
              {weakest.map(({ c, stat }) => (
                <li key={c} className="flex items-center gap-3">
                  <span className="keycap keycap-sm w-10 text-lg">{c}</span>
                  <span className="text-sm text-ink-soft">
                    {keySpeed(stat)} teclas/min · {Math.round(stat.errorEma * 100)} % de error
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Unidades" sub="Lecciones terminadas y estrellas por unidad.">
          <ul className="grid gap-2">
            {curriculum.units.map((u) => {
              const done = u.lessons.filter((l) => results[l.id]?.stars).length
              const stars = u.lessons.reduce((a, l) => a + (results[l.id]?.stars ?? 0), 0)
              return (
                <li key={u.id} className="flex items-center justify-between rounded-xl bg-paper px-4 py-2.5">
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
        </Card>
      </div>

      <details className="card mt-4 p-6">
        <summary className="cursor-pointer font-display text-2xl font-extrabold">Mapa de calor de velocidad</summary>
        <p className="mt-1 mb-4 text-sm text-ink-soft">coral = lenta · verde = rápida · gris = sin datos. Velocidad pura, sin mirar errores.</p>
        {heat ? <Keyboard layout={layout} fingerColors={false} heat={heat} size="md" /> : <p className="text-ink-soft">Necesito al menos tres intentos por tecla para pintarlo.</p>}
      </details>
    </div>
  )
}
