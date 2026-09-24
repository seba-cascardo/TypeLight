import { daysBetween, keySpeed, type KeyStat } from './index'

/** Slower than this many times the per-key target of the unit goal reads as "slow". */
export const SLOW_FACTOR = 1.5
export const ERROR_FLOOR = 0.05
export const UNSEEN_DAYS = 3

/** Why the Repaso picked a key today, in a few words. */
export function keyReason(stat: KeyStat | undefined, today: string, goalWpm: number): string {
  if (!stat) return 'todavía con pocos datos'
  const parts: string[] = []
  if (stat.errorEma >= ERROR_FLOOR) parts.push(`${Math.round(stat.errorEma * 100)} % de error`)
  const speed = keySpeed(stat)
  const targetMs = 60000 / (goalWpm * 5)
  if (speed !== null && stat.latencyEma > SLOW_FACTOR * targetMs) parts.push(`lenta: ${speed} teclas/min`)
  if (stat.lastSeen) {
    const gap = daysBetween(stat.lastSeen, today)
    if (gap >= UNSEEN_DAYS) parts.push(`hace ${gap} días que no la ves`)
  }
  return parts.length ? parts.join(' · ') : 'todavía con pocos datos'
}
