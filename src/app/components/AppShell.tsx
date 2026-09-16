import { NavLink, Outlet } from 'react-router'
import { useStore } from '../store'
import { dayKey, streakAlive } from '@/engine/stats'
import { Flame } from './ui'

const links = [
  { to: '/', label: 'Hoy' },
  { to: '/ruta', label: 'Ruta' },
  { to: '/estadisticas', label: 'Progreso' },
  { to: '/ajustes', label: 'Ajustes' },
]

export function AppShell() {
  const streak = useStore((s) => s.streak)
  const alive = streakAlive(streak, dayKey())
  return (
    <div className="min-h-dvh px-4 pb-16 md:px-8">
      <nav className="mx-auto flex max-w-[86rem] flex-wrap items-center justify-between gap-3 py-4 md:py-5">
        <NavLink to="/" className="flex items-center gap-2.5" aria-label="TypeLight, inicio">
          <span className="keycap keycap-primary keycap-sm px-2.5 font-display text-lg leading-none">T</span>
          <span className="font-display text-xl font-extrabold tracking-tight">TypeLight</span>
        </NavLink>
        <div className="order-last flex w-full items-center justify-center gap-1 rounded-full border-2 border-line bg-keycap p-1 md:order-none md:w-auto">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === '/'}
              className={({ isActive }) =>
                `rounded-full px-3.5 py-1.5 text-sm font-extrabold transition ${
                  isActive ? 'bg-ink text-keycap' : 'text-ink-soft hover:bg-paper'
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </div>
        <Flame count={alive ? streak.count : 0} alive={alive} />
      </nav>
      <main className="mx-auto max-w-[86rem]">
        <Outlet />
      </main>
    </div>
  )
}
