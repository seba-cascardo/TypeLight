import type { WeekSummary } from '@/engine/stats'
import { shiftDay } from '@/engine/stats'
import { Keycap } from '../Keycap'

const signedPpm = (n: number | null) => (n === null ? '' : n > 0 ? ` (+${n})` : n < 0 ? ` (${n})` : ' (igual)')
const signedPts = (d: number | null) => {
  if (d === null) return ''
  const pts = Math.round(d * 100)
  return pts > 0 ? ` (+${pts})` : pts < 0 ? ` (${pts})` : ' (igual)'
}

function dayLabel(day: string): string {
  const [y, m, d] = day.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('es-AR', { day: 'numeric', month: 'long' })
}

interface Props {
  summary: WeekSummary
  goal: number
  /** The weekly process commitment, when set: the card asks whether it was kept. */
  commitment?: string
  onClose: (kept?: 'si' | 'no') => void
}

/** The week that just ended, once, with one concrete win up front. */
export function WeeklySummaryCard({ summary, goal, commitment, onClose }: Props) {
  const parts = [
    `${summary.minutes} min`,
    `${summary.activeDays} de ${goal} días`,
    summary.refMedian !== null ? `referencia ${summary.refMedian} PPM${signedPpm(summary.refDelta)}` : null,
    summary.acc !== null ? `precisión ${Math.round(summary.acc * 100)} %${signedPts(summary.accDelta)}` : null,
    summary.masteredNew > 0 ? `${summary.masteredNew} ${summary.masteredNew === 1 ? 'tecla dominada nueva' : 'teclas dominadas nuevas'}` : null,
  ].filter(Boolean)
  return (
    <section className="card mb-8 flex flex-wrap items-start justify-between gap-4 border-2 border-mod p-5 md:p-6" data-testid="weekly-summary">
      <div>
        <div className="eyebrow mb-1">
          Tu semana · del {dayLabel(summary.week)} al {dayLabel(shiftDay(summary.week, 6))}
        </div>
        <p className="font-display text-2xl font-extrabold">{summary.win}.</p>
        <p className="mt-1 text-ink-soft">{parts.join(' · ')}.</p>
        {commitment && (
          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm font-bold" data-testid="commitment-ask">
            <span>¿Cumpliste «{commitment}»?</span>
            <Keycap variant="primary" size="sm" onClick={() => onClose('si')}>
              Sí
            </Keycap>
            <Keycap variant="coral" size="sm" onClick={() => onClose('no')}>
              No
            </Keycap>
          </div>
        )}
      </div>
      <Keycap variant="ghost" size="sm" onClick={() => onClose()}>
        Cerrar
      </Keycap>
    </section>
  )
}
