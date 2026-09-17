import { useMemo, type ReactNode } from 'react'
import {
  BIGRAM_CLASS_NAME,
  activeWeeks,
  bigramClasses,
  calendar,
  constancy,
  forecast,
  dayKey,
  fingerDominance,
  keySpeed,
  masteryCounts,
  masteryMap,
  referenceByDay,
  referenceHeadline,
  fluidity,
  formHeadline,
  records,
  snapshotBefore,
  streakAlive,
  unitMarks,
  weekActiveDays,
  weaknessScore,
  weaknessQualities,
  weakestBigrams,
  weakestWords,
  weeklyAccuracy,
  type BigramClass,
} from '@/engine/stats'
import { poolOf } from '@/engine/generator'
import { Link } from 'react-router'
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
  const bigrams = useStore((s) => s.bigrams)
  const words = useStore((s) => s.words)
  const weeklyGoal = useStore((s) => s.settings.weeklyGoal)
  const { layout, learned, curriculum, goalWpm } = useProgress()
  const today = dayKey()

  const points = useMemo(() => referenceByDay(days), [days])
  const headline = referenceHeadline(points)
  const marks = useMemo(() => unitMarks(days), [days])
  const weekly = weeklyAccuracy(sessions, today)
  const levels = masteryMap(keys, learned, goalWpm, today)
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
  const form = formHeadline(sessions)
  const best = useMemo(() => records(days, sessions), [days, sessions])
  const trend = forecast(points, goalWpm, today)
  const classes = useMemo(() => bigramClasses(bigrams, layout), [bigrams, layout])
  const slowBigrams = useMemo(() => weakestBigrams(bigrams, poolOf(learned), 3), [bigrams, learned])
  const qualities = useMemo(() => weaknessQualities(keys, bigrams, layout, learned), [keys, bigrams, layout, learned])
  const weakWords = useMemo(() => weakestWords(words, 6), [words])
  const cleanBest = sessions.reduce((a, s) => Math.max(a, s.cleanRun ?? 0), 0)
  const cleanToday = sessions.filter((s) => dayKey(new Date(s.at)) === today).reduce((a, s) => Math.max(a, s.cleanRun ?? 0), 0)
  const dead = useMemo(() => {
    const recent = sessions.filter((s) => s.dead).slice(-30)
    if (recent.length === 0) return null
    const n = recent.reduce((a, s) => a + (s.dead?.n ?? 0), 0)
    const lat = recent.filter((s) => s.dead?.latency != null && (s.dead?.n ?? 0) > 0)
    const latency = lat.length ? Math.round(lat.reduce((a, s) => a + (s.dead?.latency ?? 0) * (s.dead?.n ?? 0), 0) / Math.max(1, lat.reduce((a, s) => a + (s.dead?.n ?? 0), 0))) : null
    const plainVowels = ['a', 'e', 'i', 'o', 'u'].filter((c) => keys[c]).map((c) => keys[c].latencyEma)
    const plain = plainVowels.length ? Math.round(plainVowels.reduce((a, b) => a + b, 0) / plainVowels.length) : null
    return { n, latency, plain, missed: recent.reduce((a, s) => a + (s.dead?.missed ?? 0), 0), loose: recent.reduce((a, s) => a + (s.dead?.loose ?? 0), 0) }
  }, [sessions, keys])
  const weekDays = weekActiveDays(days, today)
  const weeksMet = activeWeeks(days, weeklyGoal)
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

  const weakest = learned
    .filter((c) => c !== ' ' && keys[c] && keys[c].samples >= 3)
    .map((c) => ({ c, stat: keys[c], score: weaknessScore(keys[c], today) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 6)

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

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
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
        <Tile
          id="constancy"
          label="Constancia"
          value={cons.fullOfLast7}
          unit="de 7 días"
          note={`racha ${alive ? streak.count : 0} · mejor ${streak.best} · ${streak.activeDays} ${streak.activeDays === 1 ? 'día activo' : 'días activos'}`}
        />
        <Tile
          id="form"
          label="Forma"
          value={form ? form.good : '—'}
          unit={form ? `de ${form.answered}` : undefined}
          note={form ? 'con fila guía y dedos correctos, según vos' : 'respondé el chequeo al cerrar un Reto'}
          up={form !== null && form.good === form.answered}
        />
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
        {trend && (
          <p className="mt-3 text-sm font-bold text-ink-soft" data-testid="forecast">
            {trend.reached
              ? `Ya estás por encima de la meta de la unidad (${goalWpm} PPM).`
              : `A este ritmo (+${trend.slope.toFixed(1).replace('.', ',')} PPM por día), la meta de la unidad (${goalWpm} PPM) llega en ~${trend.daysToGoal} ${trend.daysToGoal === 1 ? 'día' : 'días'}.`}
          </p>
        )}
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
          <div className="mt-4" data-testid="week-progress">
            <div className="mb-1.5 flex justify-between text-sm">
              <span>
                <span className="font-bold">Esta semana</span> <span className="text-ink-soft">· meta de {weeklyGoal} días</span>
              </span>
              <span className="font-bold tabular-nums">
                {weekDays} de {weeklyGoal}
              </span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-paper-deep">
              <div className={`h-full rounded-full transition-all ${weekDays >= weeklyGoal ? 'bg-enter' : 'bg-sun'}`} style={{ width: `${Math.min(100, (weekDays / weeklyGoal) * 100)}%` }} />
            </div>
            <p className="mt-1.5 text-xs text-ink-mute">
              {weeksMet} {weeksMet === 1 ? 'semana' : 'semanas'} con la meta cumplida · {streak.freezes} {streak.freezes === 1 ? 'comodín' : 'comodines'} de racha (uno cada 5 días activos, máximo 2; un día perdido siempre se perdona).
            </p>
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

        <Card title="Transiciones" sub="El bigrama es la unidad que predice la velocidad: cuánto tardás en pasar de una tecla a la siguiente, según qué manos y dedos se turnan. Lo alimentan las lecciones, el Repaso, el Reto y el examen.">
          {Object.keys(classes).length === 0 ? (
            <p className="text-ink-soft">Con unos ejercicios más aparecen acá.</p>
          ) : (
            <div data-testid="transitions">
              <ul className="grid gap-2">
                {(['alt', 'hand', 'finger', 'repeat'] as BigramClass[]).map((cls) => {
                  const c = classes[cls]
                  if (!c) return null
                  return (
                    <li key={cls} className="flex items-center justify-between rounded-xl bg-paper px-4 py-2.5">
                      <span className="font-bold">{BIGRAM_CLASS_NAME[cls]}</span>
                      <span className="text-sm text-ink-soft">
                        <span className="font-display text-lg font-extrabold text-ink">{c.latency}</span> ms · {c.samples} muestras
                      </span>
                    </li>
                  )
                })}
              </ul>
              {slowBigrams.length > 0 && (
                <div className="mt-3 flex flex-wrap items-center gap-2 text-sm font-bold text-ink-soft">
                  <span>Las que más cuestan:</span>
                  {slowBigrams.map((g) => (
                    <span key={g} className="keycap keycap-sm">
                      {g} <span className="text-ink-mute">{Math.round(bigrams[g].latencyEma)} ms</span>
                    </span>
                  ))}
                </div>
              )}
              {qualities.length > 0 && (
                <p className="mt-3 text-sm font-bold text-ink-soft" data-testid="qualities">
                  Hoy pesa: {qualities.join(' y ')}.
                </p>
              )}
              {dead && (
                <p className="mt-3 text-sm text-ink-soft" data-testid="dead-keys">
                  <span className="font-bold text-ink">Tildes</span> · {dead.latency !== null ? `${dead.latency} ms con tilde` : 'sin latencia todavía'}
                  {dead.plain !== null ? ` vs. ${dead.plain} ms sin tilde` : ''} · {dead.missed} {dead.missed === 1 ? 'tilde olvidada' : 'tildes olvidadas'} · {dead.loose} {dead.loose === 1 ? 'suelta' : 'sueltas'} (últimas {Math.min(30, sessions.filter((s) => s.dead).length)} sesiones con tildes).
                </p>
              )}
            </div>
          )}
        </Card>

        <Card title="Palabras que piden práctica" sub="Las que más veces salieron con error o lentas, sobre las que ya viste al menos dos veces.">
          {weakWords.length === 0 ? (
            <p className="text-ink-soft">Con unos Retos más aparecen acá.</p>
          ) : (
            <div data-testid="weak-words">
              <ul className="flex flex-wrap gap-2">
                {weakWords.map((w) => (
                  <li key={w} className="keycap keycap-sm">
                    {w} <span className="text-ink-mute">{Math.round(words[w].errorEma * 100)} %</span>
                  </li>
                ))}
              </ul>
              <Link to={`/practica/palabras?w=${encodeURIComponent(weakWords.join(','))}`} className="mt-3 inline-block text-sm font-bold text-mod-edge underline">
                Practicar estas →
              </Link>
            </div>
          )}
        </Card>

        <Card title="Récords" sub="Solo sobre medidas que un drill fácil no infla: el mejor Reto, la mejor mediana de 7 días, la mejor semana de precisión (500 caracteres o más) y la racha de rutinas completas.">
          {!best.bestReference && !best.bestWeeklyAcc && !best.bestRoutineRun ? (
            <p className="text-ink-soft">Todavía sin récords: el primer Reto pone el primero.</p>
          ) : (
            <ul className="grid gap-2" data-testid="records">
              {best.bestReference && (
                <li className="flex items-center justify-between rounded-xl bg-paper px-4 py-2.5">
                  <span className="font-bold">Mejor Reto</span>
                  <span className="text-sm text-ink-soft">
                    <span className="font-display text-lg font-extrabold text-ink">{best.bestReference.wpm}</span> PPM · {best.bestReference.day.slice(5).split('-').reverse().join('/')}
                  </span>
                </li>
              )}
              {best.bestMedian7 && (
                <li className="flex items-center justify-between rounded-xl bg-paper px-4 py-2.5">
                  <span className="font-bold">Mejor mediana de 7 días</span>
                  <span className="text-sm text-ink-soft">
                    <span className="font-display text-lg font-extrabold text-ink">{best.bestMedian7.wpm}</span> PPM · {best.bestMedian7.day.slice(5).split('-').reverse().join('/')}
                  </span>
                </li>
              )}
              {best.bestWeeklyAcc && (
                <li className="flex items-center justify-between rounded-xl bg-paper px-4 py-2.5">
                  <span className="font-bold">Mejor semana de precisión</span>
                  <span className="text-sm text-ink-soft">
                    <span className="font-display text-lg font-extrabold text-ink">{(best.bestWeeklyAcc.acc * 100).toFixed(1).replace('.', ',')} %</span> · semana del {best.bestWeeklyAcc.week.slice(5).split('-').reverse().join('/')}
                  </span>
                </li>
              )}
              {best.bestRoutineRun && (
                <li className="flex items-center justify-between rounded-xl bg-paper px-4 py-2.5">
                  <span className="font-bold">Rutina completa seguida</span>
                  <span className="text-sm text-ink-soft">
                    <span className="font-display text-lg font-extrabold text-ink">{best.bestRoutineRun.days}</span> {best.bestRoutineRun.days === 1 ? 'día' : 'días'}
                  </span>
                </li>
              )}
              {cleanBest > 0 && (
                <li className="flex items-center justify-between rounded-xl bg-paper px-4 py-2.5" data-testid="clean-run">
                  <span className="font-bold">Racha de precisión</span>
                  <span className="text-sm text-ink-soft">
                    hoy <span className="font-display text-lg font-extrabold text-ink">{cleanToday}</span> · histórica <span className="font-display text-lg font-extrabold text-ink">{cleanBest}</span> caracteres seguidos
                  </span>
                </li>
              )}
            </ul>
          )}
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
