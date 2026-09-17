import { daysBetween, keySpeed, type KeyStat } from './index'

/** Slower than this gap between keys reads as "slow" (about 17 PPM). */
export const SLOW_MS = 700
export const ERROR_FLOOR = 0.05
export const UNSEEN_DAYS = 3

/** Why the Repaso picked a key today, in a few words. */
export function keyReason(stat: KeyStat | undefined, today: string): string {
  if (!stat) return 'todavía con pocos datos'
  const parts: string[] = []
  if (stat.errorEma >= ERROR_FLOOR) parts.push(`${Math.round(stat.errorEma * 100)} % de error`)
  const speed = keySpeed(stat)
  if (speed !== null && stat.latencyEma > SLOW_MS) parts.push(`lenta: ${speed} teclas/min`)
  if (stat.lastSeen) {
    const gap = daysBetween(stat.lastSeen, today)
    if (gap >= UNSEEN_DAYS) parts.push(`hace ${gap} días que no la ves`)
  }
  return parts.length ? parts.join(' · ') : 'todavía con pocos datos'
}
