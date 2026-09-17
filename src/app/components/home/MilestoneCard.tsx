import { milestoneCopy, type MonthSummary } from '@/engine/stats'
import { Keycap } from '../Keycap'

const delta = (now: number | null, then: number | null, unit: string) =>
  now === null ? '—' : then === null ? `${now} ${unit}` : `${now} ${unit} (${now - then >= 0 ? '+' : ''}${now - then} vs. hace un mes)`

/** A milestone in active days, closed once. The 30-day one carries the month in numbers. */
export function MilestoneCard({ milestone, month, onClose }: { milestone: number; month: MonthSummary | null; onClose: () => void }) {
  return (
    <section className="card mb-8 flex flex-wrap items-start justify-between gap-4 border-2 border-sun p-5 md:p-6" data-testid="milestone" data-milestone={milestone}>
      <div>
        <div className="eyebrow mb-1">Hito · {milestone} días activos</div>
        <p className="font-display text-2xl font-extrabold">{milestoneCopy(milestone)}</p>
        {month && (
          <ul className="mt-2 grid gap-0.5 text-ink-soft">
            <li>{month.minutes} minutos en {month.activeDays} días.</li>
            <li>Velocidad de referencia: {delta(month.refNow, month.refThen, 'PPM')}.</li>
            <li>Teclas dominadas: {delta(month.masteredNow, month.masteredThen, '')}.</li>
          </ul>
        )}
      </div>
      <Keycap variant="ghost" size="sm" onClick={onClose}>
        Cerrar
      </Keycap>
    </section>
  )
}
