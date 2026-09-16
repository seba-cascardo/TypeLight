import type { CalendarCell } from '@/engine/stats'

const HEAD = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

/** Monday = 0. */
function weekdayIndex(day: string): number {
  const [y, m, d] = day.split('-').map(Number)
  return (new Date(y, m - 1, d).getDay() + 6) % 7
}

/** Four weeks of routine days: full (4 cards), part, or none. Today is outlined. */
export function Calendar({ cells }: { cells: CalendarCell[] }) {
  const lead = cells.length ? weekdayIndex(cells[0].day) : 0
  const last = cells.length - 1
  return (
    <div className="grid grid-cols-7 gap-1.5" style={{ maxWidth: 7 * 36 }} aria-label="Rutina de las últimas cuatro semanas">
      {HEAD.map((h, i) => (
        <span key={i} className="text-center text-[11px] font-bold text-ink-mute">
          {h}
        </span>
      ))}
      {Array.from({ length: lead }, (_, i) => (
        <span key={`lead-${i}`} />
      ))}
      {cells.map((c, i) => (
        <span
          key={c.day}
          title={`${c.day} · ${Math.round(c.seconds / 60)} min`}
          className={`block h-7 w-7 rounded-lg ${c.state === 'full' ? 'bg-enter' : c.state === 'part' ? 'border-2 border-sun bg-sun-soft' : 'bg-paper-deep'} ${i === last ? 'outline-2 outline-offset-2 outline-mod' : ''}`}
        />
      ))}
    </div>
  )
}
