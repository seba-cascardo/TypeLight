import { expect, test } from '@playwright/test'

/** ISO at local noon `offset` days from today, so the local day is unambiguous. */
function at(offset: number): string {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  d.setHours(12, 0, 0, 0)
  return d.toISOString()
}

/** Local calendar day of an ISO timestamp, as yyyy-mm-dd (mirrors `dayKey` on the engine side). */
const localDay = (iso: string) => {
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

test('progreso: reference speed comes from Retos only; v1 state migrates', async ({ page }) => {
  const today = at(0)
  await page.goto('/')
  await page.evaluate(
    ([eightDaysAgo, yesterday, today]) => {
      const s = (kind: string, wpm: number, at: string) => ({ at, kind, wpm, acc: 0.98, chars: 200, errors: 4, seconds: 60 })
      localStorage.setItem(
        'typelight.v1',
        JSON.stringify({
          state: {
            settings: { name: 'Seba', layoutId: 'latam', sound: false, showHands: true, onboarded: true, theme: 'auto' },
            lessons: {},
            keys: {},
            sessions: [s('challenge', 20, eightDaysAgo), s('lesson', 80, yesterday), s('challenge', 24, yesterday), s('challenge', 30, today), s('lesson', 90, today)],
            streak: { count: 1, lastDay: today.slice(0, 10) },
            routine: { day: '2000-01-01', warmup: false, lesson: false, review: false, challenge: false },
          },
          version: 1,
        }),
      )
    },
    [at(-8), at(-1), today],
  )
  await page.goto('/estadisticas')
  await expect(page.getByRole('heading', { name: 'Cómo vas avanzando.' })).toBeVisible()

  const speed = page.getByTestId('tile-reference')
  await expect(speed).toContainText('30') // today's Reto, not the 90 PPM lesson
  await expect(speed).not.toContainText('90')
  await expect(speed).toContainText('↑ 10') // vs. the Reto eight days ago
  await expect(page.getByTestId('tile-accuracy')).toContainText('98')
  await expect(page.getByRole('img', { name: 'Velocidad de referencia por día' })).toBeVisible()

  // Home shows the same number
  await page.goto('/')
  await expect(page.getByText('Velocidad de referencia')).toBeVisible()
  await expect(page.getByText('30', { exact: false }).first()).toBeVisible()

  // v1 → v3: Retos became reference sessions and the store gained `days`, with per-day reference speeds backfilled
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('typelight.v1')!))
  expect(stored.version).toBe(3)
  expect(stored.state.sessions.filter((x: { reference?: true }) => x.reference).length).toBe(3)
  expect(stored.state.days).toBeDefined()
  expect(stored.state.days[localDay(today)].reference).toEqual([30])
  await page.screenshot({ path: 'e2e/screens/stats-reference.png', fullPage: true })
})
