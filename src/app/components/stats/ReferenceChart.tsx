import { useState } from 'react'
import { movingAverage, shiftDay, type DayPoint, type UnitMark } from '@/engine/stats'

interface Props {
  points: DayPoint[]
  goal: number
  marks: UnitMark[]
  today: string
  /** The one-minute speed typed "the old way", if measured. */
  legacy?: number
  /** Days shown, ending today. */
  span?: number
}

const W = 720
const H = 230
const PAD = { l: 48, r: 16, t: 26, b: 34 }

function dayLabel(day: string): string {
  const [y, m, d] = day.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })
}

/** One dot per day with reference sessions, a faint trend, the unit goal and the days new keys arrived. */
export function ReferenceChart({ points, goal, marks, today, legacy, span = 14 }: Props) {
  const [hover, setHover] = useState<number | null>(null)
  const days = Array.from({ length: span }, (_, i) => shiftDay(today, i - (span - 1)))
  const shown = points.filter((p) => days.includes(p.day))
  const top = Math.max(goal, 10, legacy ?? 0, ...shown.map((p) => p.wpm)) * 1.15
  const x = (day: string) => PAD.l + (days.indexOf(day) / (span - 1)) * (W - PAD.l - PAD.r)
  const y = (wpm: number) => PAD.t + (1 - wpm / top) * (H - PAD.t - PAD.b)
  const trend = movingAverage(shown.map((p) => p.wpm))
  const step = top > 60 ? 20 : 10
  const grid: number[] = []
  for (let v = 0; v <= top; v += step) grid.push(v)
  const last = shown[shown.length - 1]

  if (shown.length === 0) {
    return <p className="text-ink-soft">Ningún Reto en los últimos {span} días. El próximo pone el primer punto.</p>
  }

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full" role="img" aria-label="Velocidad de referencia por día">
        {grid.map((v) => (
          <g key={v}>
            <line x1={PAD.l} x2={W - PAD.r} y1={y(v)} y2={y(v)} stroke={v === 0 ? 'var(--color-line)' : 'var(--color-line-soft)'} />
            <text x={PAD.l - 8} y={y(v) + 4} textAnchor="end" fontSize="11" fill="var(--color-ink-mute)">
              {v}
            </text>
          </g>
        ))}
        <line x1={PAD.l} x2={W - PAD.r} y1={y(goal)} y2={y(goal)} stroke="var(--color-sun-edge)" strokeWidth="2" strokeDasharray="6 5" />
        <text x={W - PAD.r} y={y(goal) - 6} textAnchor="end" fontSize="11" fontWeight="600" fill="var(--color-sun-edge)">
          meta · {goal}
        </text>
        {legacy !== undefined && (
          <>
            <line x1={PAD.l} x2={W - PAD.r} y1={y(legacy)} y2={y(legacy)} stroke="var(--color-ink-mute)" strokeWidth="1.5" strokeDasharray="2 5" />
            <text x={PAD.l + 4} y={y(legacy) - 5} fontSize="11" fontWeight="600" fill="var(--color-ink-mute)">
              antes · {legacy}
            </text>
          </>
        )}
        {marks
          .filter((m) => days.includes(m.day))
          .map((m) => (
            <g key={m.day}>
              <line x1={x(m.day)} x2={x(m.day)} y1={PAD.t - 8} y2={H - PAD.b} stroke="var(--color-ink-mute)" strokeWidth="1.5" strokeDasharray="3 4" />
              <text x={x(m.day) + 5} y={PAD.t + 2} fontSize="11" fontWeight="600" fill="var(--color-ink-soft)">
                +{m.added} teclas
              </text>
            </g>
          ))}
        {shown.length > 1 && (
          <polyline
            points={shown.map((p, i) => `${x(p.day)},${y(trend[i])}`).join(' ')}
            fill="none"
            stroke="var(--color-mod)"
            strokeWidth="2"
            strokeOpacity="0.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
        {shown.map((p, i) => (
          <circle
            key={p.day}
            cx={x(p.day)}
            cy={y(p.wpm)}
            r={hover === i ? 7 : 5}
            fill="var(--color-mod)"
            stroke="var(--color-keycap)"
            strokeWidth="2"
            tabIndex={0}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
            onFocus={() => setHover(i)}
            onBlur={() => setHover(null)}
          />
        ))}
        <text x={x(last.day)} y={y(last.wpm) - 12} textAnchor="middle" fontSize="14" fontWeight="800" fontFamily="var(--font-display)" fill="var(--color-ink)">
          {last.wpm}
        </text>
        {[0, Math.floor(span / 2), span - 1].map((i) => (
          <text key={i} x={x(days[i])} y={H - 10} textAnchor={i === 0 ? 'start' : i === span - 1 ? 'end' : 'middle'} fontSize="11" fill="var(--color-ink-mute)">
            {i === span - 1 ? 'hoy' : dayLabel(days[i])}
          </text>
        ))}
      </svg>
      {hover !== null && shown[hover] && (
        <div
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-full rounded-lg bg-ink px-2.5 py-1.5 text-xs font-bold whitespace-nowrap text-paper"
          style={{ left: `${(x(shown[hover].day) / W) * 100}%`, top: `${(y(shown[hover].wpm) / H) * 100}%`, marginTop: -10 }}
        >
          {dayLabel(shown[hover].day)} · {shown[hover].wpm} PPM · {shown[hover].n === 1 ? '1 sesión' : `${shown[hover].n} sesiones`}
        </div>
      )}
    </div>
  )
}
