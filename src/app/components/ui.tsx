import type { ReactNode } from 'react'
import type { Stars as StarCount } from '@/engine/stats'

export function Stars({ count, size = 'md', className = '' }: { count: StarCount | number; size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const px = size === 'sm' ? 12 : size === 'lg' ? 34 : 18
  return (
    <span className={`inline-flex items-center gap-0.5 ${className}`} aria-label={`${count} de 3 estrellas`}>
      {[0, 1, 2].map((i) => (
        <svg key={i} width={px} height={px} viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M12 2.5l2.9 6.1 6.7.8-4.9 4.6 1.3 6.6L12 17.4 6 20.6l1.3-6.6L2.4 9.4l6.7-.8z"
            fill={i < count ? 'var(--color-sun)' : 'var(--color-paper-deep)'}
            stroke={i < count ? 'var(--color-sun-edge)' : 'var(--color-line)'}
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
      ))}
    </span>
  )
}

export function Stat({ label, value, unit, tone = 'ink' }: { label: string; value: ReactNode; unit?: string; tone?: 'ink' | 'enter' | 'esc' | 'mod' }) {
  const color = { ink: 'text-ink', enter: 'text-enter-edge', esc: 'text-esc-edge', mod: 'text-mod-edge' }[tone]
  return (
    <div className="flex flex-col">
      <span className="eyebrow">{label}</span>
      <span className={`font-display text-3xl font-extrabold leading-none ${color}`}>
        {value}
        {unit && <span className="ml-1 text-base font-bold text-ink-mute">{unit}</span>}
      </span>
    </div>
  )
}

export function PageTitle({ eyebrow, title, children }: { eyebrow?: string; title: string; children?: ReactNode }) {
  return (
    <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && <div className="eyebrow mb-2">{eyebrow}</div>}
        <h1 className="text-4xl md:text-5xl">{title}</h1>
      </div>
      {children}
    </header>
  )
}

export function Flame({ count, alive }: { count: number; alive: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border-2 px-3 py-1 text-sm font-extrabold ${
        alive ? 'border-esc-edge bg-esc-soft text-esc-edge' : 'border-line bg-keycap text-ink-mute'
      }`}
      title="Días seguidos practicando"
    >
      <svg width="16" height="18" viewBox="0 0 16 18" aria-hidden="true">
        <path
          d="M8 1c1 3 4 4 4 8a4 4 0 0 1-8 0c0-1.5.5-2.5 1.5-3.5C5.8 7 6.5 8 7 8.5 7 6 6.5 4 8 1z"
          fill={alive ? 'var(--color-esc)' : 'var(--color-line)'}
          stroke={alive ? 'var(--color-esc-edge)' : 'var(--color-ink-mute)'}
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
      </svg>
      {count} {count === 1 ? 'día' : 'días'}
    </span>
  )
}

export function Check({ done }: { done: boolean }) {
  return (
    <span
      className={`grid h-6 w-6 place-items-center rounded-full border-2 ${
        done ? 'border-enter-edge bg-enter text-white' : 'border-line bg-keycap text-transparent'
      }`}
      aria-hidden="true"
    >
      <svg width="12" height="12" viewBox="0 0 12 12">
        <path d="M2 6.5l2.5 2.5L10 3" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  )
}
