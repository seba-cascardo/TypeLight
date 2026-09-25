import { daysBetween } from './index'
import type { DayPoint } from './progress'

export type Forecast = { reached: true } | { reached: false; daysToGoal: number; slope: number; r2: number }

export const FORECAST_MIN_POINTS = 8
export const FORECAST_MIN_R2 = 0.5
export const FORECAST_MAX_DAYS = 365

/**
 * Linear fit of the last 30 reference points (calendar day → PPM), like keybr's estimate: only spoken
 * when the trend is clear (R² ≥ 0.5) and upward. Days are counted from `today`. With `since` (the day the
 * Reto went blind), only the points from that day on: the assisted ones before it are another scale.
 */
export function forecast(points: DayPoint[], goal: number, today: string, since?: string): Forecast | null {
  const recent = (since ? points.filter((p) => p.day >= since) : points).slice(-30)
  if (recent.length === 0) return null
  if (recent[recent.length - 1].wpm >= goal) return { reached: true }
  if (recent.length < FORECAST_MIN_POINTS) return null
  const xs = recent.map((p) => -daysBetween(p.day, today))
  const ys = recent.map((p) => p.wpm)
  const n = xs.length
  const mx = xs.reduce((a, b) => a + b, 0) / n
  const my = ys.reduce((a, b) => a + b, 0) / n
  let sxy = 0
  let sxx = 0
  let syy = 0
  for (let i = 0; i < n; i++) {
    sxy += (xs[i] - mx) * (ys[i] - my)
    sxx += (xs[i] - mx) ** 2
    syy += (ys[i] - my) ** 2
  }
  if (sxx === 0 || syy === 0) return null
  const slope = sxy / sxx
  const r2 = (sxy * sxy) / (sxx * syy)
  if (slope <= 0 || r2 < FORECAST_MIN_R2) return null
  const intercept = my - slope * mx
  const days = Math.ceil((goal - intercept) / slope)
  if (days > FORECAST_MAX_DAYS) return null
  return { reached: false, daysToGoal: Math.max(1, days), slope, r2 }
}
