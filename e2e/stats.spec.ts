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

  // v1 → v4: Retos became reference sessions and the store gained `days`, with per-day reference speeds backfilled
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('typelight.v1')!))
  expect(stored.version).toBe(7)
  expect(stored.state.sessions.filter((x: { reference?: true }) => x.reference).length).toBe(3)
  expect(stored.state.days).toBeDefined()
  expect(stored.state.days[localDay(today)].reference).toEqual([30])
  await page.screenshot({ path: 'e2e/screens/stats-reference.png', fullPage: true })
})

test('progreso: the chart marks the day the Reto went blind and draws the weekly exam as a diamond', async ({ page }) => {
  const today = at(0)
  const yesterday = at(-1)
  await page.goto('/')
  await page.evaluate(
    ([yesterday, today, yDay, tDay]) => {
      const s = (kind: string, wpm: number, at: string, extra: Record<string, unknown> = {}) => ({ at, kind, wpm, acc: 0.98, chars: 200, errors: 4, seconds: 60, reference: true, ...extra })
      localStorage.setItem(
        'typelight.v1',
        JSON.stringify({
          state: {
            settings: { name: 'Seba', layoutId: 'latam', sound: false, showHands: true, onboarded: true, theme: 'auto', lastBackupAt: null, anchor: '', conversoSeen: true },
            lessons: {},
            keys: {},
            sessions: [s('challenge', 30, yesterday), s('exam', 28, today, { blind: true })],
            streak: { count: 1, lastDay: tDay },
            routine: { day: '2000-01-01', warmup: false, lesson: false, review: false, challenge: false },
            days: {
              [yDay]: { seconds: 60, blocks: 1, learned: 8, mastered: 2, reference: [30], sessions: 1 },
              [tDay]: { seconds: 180, blocks: 1, learned: 8, mastered: 2, reference: [28], sessions: 1, exam: 28 },
            },
            legacy: null,
            lastExamDay: tDay,
            blindSince: tDay,
          },
          version: 4,
        }),
      )
    },
    [yesterday, today, localDay(yesterday), localDay(today)],
  )
  await page.goto('/estadisticas')
  await expect(page.getByTestId('blind-mark')).toBeVisible()
  await expect(page.locator('svg text', { hasText: 'sin ayuda' })).toBeVisible()
  await expect(page.getByTestId('exam-point')).toHaveCount(1)
  await expect(page.getByText('desde acá, sin ayuda')).toBeVisible()
  // one point on each side of the mark: the trend does not bridge assisted and blind days
  await expect(page.getByTestId('trend')).toHaveCount(0)
})

test('progreso: finger dominance map and fluidity', async ({ page }) => {
  const today = at(0)
  await page.goto('/')
  await page.evaluate(
    ([today, tDay]) => {
      const done = { stars: 3, bestWpm: 30, bestAcc: 1, attempts: 1, completedAt: '2026-09-15T00:00:00Z' }
      const stat = (latencyEma: number, errorEma: number, samples: number) => ({ latencyEma, errorEma, samples })
      localStorage.setItem(
        'typelight.v1',
        JSON.stringify({
          state: {
            settings: { name: 'Seba', layoutId: 'latam', sound: false, showHands: true, onboarded: true, theme: 'auto', lastBackupAt: null, anchor: '', conversoSeen: true },
            lessons: { 'guia-tip-intro': done, 'guia-66-6a-keys': done, 'guia-space': done, 'guia-64-6b-keys': done },
            keys: { f: stat(300, 0, 20), j: stat(300, 0, 20), d: stat(900, 0.1, 6), k: stat(2000, 0.3, 3), ' ': stat(300, 0, 20) },
            sessions: [{ at: today, kind: 'lesson', wpm: 30, acc: 0.98, chars: 200, errors: 4, seconds: 60, rollover: 0.25 }],
            streak: { count: 1, lastDay: tDay },
            routine: { day: '2000-01-01', warmup: false, lesson: false, review: false, challenge: false },
            days: { [tDay]: { seconds: 60, blocks: 1, learned: 5, mastered: 2, reference: [], sessions: 1 } },
            legacy: null,
            lastExamDay: null,
            blindSince: null,
          },
          version: 4,
        }),
      )
    },
    [today, localDay(today)],
  )
  await page.goto('/estadisticas')
  await expect(page.getByRole('heading', { name: 'Dominio por dedo' })).toBeVisible()
  const map = page.getByTestId('finger-map')
  await expect(map).toBeVisible()
  await expect(map.getByTestId('finger-LI')).toContainText('%')
  await expect(map.getByTestId('finger-LM')).toContainText('%')
  await expect(map.getByTestId('finger-LP')).toHaveCount(0)
  await expect(page.getByTestId('fluidity')).toContainText('25 %')
  await expect(page.getByText('Ritmo parejo')).toHaveCount(0)
  await page.screenshot({ path: 'e2e/screens/stats-fingers.png', fullPage: true })
})
