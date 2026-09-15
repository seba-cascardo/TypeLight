import type { UnitAccent } from '@/engine/curriculum'

export function unitAccentClass(accent: UnitAccent): string {
  return {
    green: 'bg-enter',
    blue: 'bg-mod',
    coral: 'bg-esc',
    sun: 'bg-sun text-ink!',
    lavender: 'bg-lav',
    mint: 'bg-mint',
  }[accent]
}

export const accentVars: Record<UnitAccent, { fill: string; edge: string; soft: string }> = {
  green: { fill: 'var(--color-enter)', edge: 'var(--color-enter-edge)', soft: 'var(--color-enter-soft)' },
  blue: { fill: 'var(--color-mod)', edge: 'var(--color-mod-edge)', soft: 'var(--color-mod-soft)' },
  coral: { fill: 'var(--color-esc)', edge: 'var(--color-esc-edge)', soft: 'var(--color-esc-soft)' },
  sun: { fill: 'var(--color-sun)', edge: 'var(--color-sun-edge)', soft: 'var(--color-sun-soft)' },
  lavender: { fill: 'var(--color-lav)', edge: 'var(--color-lav-edge)', soft: 'var(--color-lav-soft)' },
  mint: { fill: 'var(--color-mint)', edge: 'var(--color-mint-edge)', soft: 'var(--color-mint-soft)' },
}
