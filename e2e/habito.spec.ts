import { expect, test, type Page } from '@playwright/test'

function localDay(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function shift(day: string, n: number): string {
  const [y, m, d] = day.split('-').map(Number)
  return localDay(new Date(y, m - 1, d + n))
}

function monday(day: string): string {
  const [y, m, d] = day.split('-').map(Number)
  const t = new Date(y, m - 1, d)
  t.setDate(t.getDate() - ((t.getDay() + 6) % 7))
  return localDay(t)
}

const dayRow = (seconds: number, extra: Record<string, unknown> = {}) => ({ seconds, blocks: 4, learned: 8, mastered: 2, reference: [], sessions: 1, ...extra })

/** v5 state: f, j, d, k and the space learned. */
function seed(page: Page, extra: Record<string, unknown> = {}, settings: Record<string, unknown> = {}) {
  const thisMonday = monday(localDay())
  return page.evaluate(
    ([extra, settings, thisMonday]) => {
      const done = { stars: 3, bestWpm: 30, bestAcc: 1, attempts: 1, completedAt: '2026-09-15T00:00:00Z' }
      localStorage.setItem(
        'typelight.v1',
        JSON.stringify({
          state: {
            settings: { name: 'Seba', layoutId: 'latam', sound: false, showHands: true, onboarded: true, theme: 'auto', lastBackupAt: null, anchor: '', conversoSeen: true, weeklyGoal: 5, mascot: true, ...settings },
            lessons: { 'guia-tip-intro': done, 'guia-66-6a-keys': done, 'guia-space': done, 'guia-64-6b-keys': done },
            keys: {},
            sessions: [],
            streak: { count: 0, lastDay: null, best: 0, freezes: 0, activeDays: 0 },
            routine: { day: '2000-01-01', warmup: false, lesson: false, review: false, challenge: false },
            days: {},
            legacy: null,
            lastExamDay: thisMonday,
            blindSince: null,
            milestonesSeen: [],
            lastWeeklySummaryWeek: null,
            ...extra,
          },
          version: 5,
        }),
      )
    },
    [extra, settings, thisMonday] as const,
  )
}

test('the weekly summary shows once for last week, with a concrete win, and closes', async ({ page }) => {
  const today = localDay()
  const lastMonday = shift(monday(today), -7)
  const at = (day: string) => `${day}T12:00:00`
  const days: Record<string, unknown> = {}
  const sessions: unknown[] = []
  for (let i = 0; i < 4; i++) {
    const d = shift(lastMonday, i)
    days[d] = dayRow(600, { reference: [30 + i], mastered: 2 + i })
    sessions.push({ at: new Date(at(d)).toISOString(), kind: 'challenge', wpm: 30 + i, acc: 0.97, chars: 200, errors: 6, seconds: 60, reference: true })
  }
  const twoWeeksAgo = shift(lastMonday, -7)
  days[twoWeeksAgo] = dayRow(600, { reference: [26], mastered: 1 })
  await page.goto('/')
  await seed(page, { days, sessions, streak: { count: 4, lastDay: shift(lastMonday, 3), best: 4, freezes: 0, activeDays: 5 } })
  await page.goto('/')
  const card = page.getByTestId('weekly-summary')
  await expect(card).toBeVisible()
  await expect(card).toContainText('Tu semana')
  await expect(card).toContainText('PPM de velocidad de referencia')
  await expect(card).toContainText('4 de 5 días')
  await card.getByRole('button', { name: 'Cerrar' }).click()
  await expect(card).toHaveCount(0)
  await page.reload()
  await expect(page.getByTestId('weekly-summary')).toHaveCount(0)
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('typelight.v1')!))
  expect(stored.state.lastWeeklySummaryWeek).toBe(lastMonday)
})

test('milestone at 7 active days shows once; the streak forgives one day and the return line says so', async ({ page }) => {
  const today = localDay()
  await page.goto('/')
  await seed(page, { streak: { count: 7, lastDay: shift(today, -2), best: 7, freezes: 1, activeDays: 7 } }, { mascot: false })
  await page.goto('/')
  const card = page.getByTestId('milestone')
  await expect(card).toHaveAttribute('data-milestone', '7')
  await expect(card).toContainText('Una semana de teclado')
  await expect(page.getByTestId('return-line')).toHaveText('Ayer no practicaste. No pasa nada: hoy cuenta igual.')
  await expect(page.getByTestId('flame')).toContainText('7 días')
  await expect(page.getByTestId('flame')).toHaveAttribute('data-freezes', '1')
  await card.getByRole('button', { name: 'Cerrar' }).click()
  await expect(card).toHaveCount(0)
  await page.reload()
  await expect(page.getByTestId('milestone')).toHaveCount(0)
  // the mascot is off: the plain text stays
  await expect(page.getByTestId('mascot-line')).toHaveCount(0)
  await expect(page.getByText('Cuatro teclas para hoy. Diez minutos, no más.')).toBeVisible()
})

test('the mascot says one line; the weekly goal shows under the greeting and is set in Ajustes', async ({ page }) => {
  const today = localDay()
  const days: Record<string, unknown> = { [today]: dayRow(300), [shift(today, -1)]: dayRow(300) }
  await page.goto('/')
  await seed(page, { days, streak: { count: 3, lastDay: today, best: 3, freezes: 0, activeDays: 3 } })
  await page.goto('/')
  await expect(page.getByTestId('mascot-line')).toContainText('3 días seguidos')
  const goal = page.getByTestId('week-goal')
  await expect(goal).toContainText('de 5 días')
  await page.goto('/ajustes')
  await page.getByTestId('weekly-goal').getByRole('button', { name: '3', exact: true }).click()
  await page.getByText('Mascota en Inicio').click()
  await page.goto('/')
  await expect(page.getByTestId('week-goal')).toContainText('de 3 días')
  await expect(page.getByTestId('mascot-line')).toHaveCount(0)
})

test('Progreso shows the records card and the week bar; the Repaso explains why each key', async ({ page }) => {
  const today = localDay()
  const days: Record<string, unknown> = {}
  const sessions: unknown[] = []
  for (let i = 0; i < 5; i++) {
    const d = shift(today, -i)
    days[d] = dayRow(600, { reference: [28 + i] })
    sessions.push({ at: new Date(`${d}T12:00:00`).toISOString(), kind: 'challenge', wpm: 28 + i, acc: 0.97, chars: 200, errors: 6, seconds: 60, reference: true })
  }
  const stat = (latencyEma: number, errorEma: number, samples: number, lastSeen?: string) => ({ latencyEma, errorEma, samples, lastSeen })
  await page.goto('/')
  await seed(page, {
    days,
    sessions,
    keys: { f: stat(300, 0, 20, today), j: stat(300, 0, 20, today), d: stat(900, 0.12, 12, shift(today, -5)), k: stat(1500, 0.3, 6, today), ' ': stat(300, 0, 20, today) },
    streak: { count: 5, lastDay: today, best: 5, freezes: 1, activeDays: 5 },
  })
  await page.goto('/estadisticas')
  const records = page.getByTestId('records')
  await expect(records).toContainText('Mejor Reto')
  await expect(records).toContainText('32')
  await expect(records).toContainText('Rutina completa seguida')
  await expect(page.getByTestId('week-progress')).toContainText('meta de 5 días')
  await expect(page.getByTestId('tile-constancy')).toContainText('5 días activos')
  await page.goto('/practica/repaso')
  const why = page.getByTestId('why-today')
  await expect(why).toContainText('Hoy insistimos con')
  await expect(why).toContainText('% de error')
  await expect(why).toContainText('hace 5 días que no la ves')
})

test('a Reto faster than every previous one shows the personal-record chip', async ({ page }) => {
  const today = localDay()
  await page.goto('/')
  await seed(page, { days: { [shift(today, -1)]: dayRow(60, { reference: [1] }) } })
  await page.goto('/practica/reto')
  await expect(page.locator('.type-char.is-current')).toBeVisible()
  const text = await page.evaluate(() =>
    [...document.querySelectorAll('.type-char')]
      .filter((s) => !s.classList.contains('is-done') && !s.classList.contains('type-extra'))
      .map((s) => (s.classList.contains('is-space') || s.textContent === ' ' || s.textContent === '' ? ' ' : s.textContent))
      .join(''),
  )
  await page.keyboard.type(text)
  await expect(page.getByTestId('record-chip')).toBeVisible()
  await page.keyboard.press('Escape')
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL('http://localhost:5174/')
  await expect(page.getByTestId('mascot-line')).toContainText('Récord personal hoy')
})
