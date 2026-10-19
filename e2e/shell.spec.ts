import { expect, test, type Page } from '@playwright/test'

function seed(page: Page, layoutId = 'latam') {
  return page.evaluate((layoutId) => {
    localStorage.setItem(
      'typelight.v1',
      JSON.stringify({
        state: {
          settings: { name: 'Ana', layoutId, sound: false, showHands: true, onboarded: true, theme: 'auto', lastBackupAt: null, conversoSeen: true },
          lessons: {}, keys: {}, sessions: [], streak: { count: 0, lastDay: null },
          routine: { day: '2000-01-01', warmup: false, lesson: false, review: false, challenge: false }, days: {}, legacy: null,
        },
        version: 3,
      }),
    )
  }, layoutId)
}

test('opening a lazy screen directly logs no router warning', async ({ page }) => {
  const messages: string[] = []
  page.on('console', (m) => messages.push(m.text()))
  await page.goto('/bienvenida')
  await page.evaluate(() => {
    localStorage.setItem(
      'typelight.v1',
      JSON.stringify({
        state: {
          settings: { name: 'Seba', layoutId: 'latam', sound: false, showHands: true, onboarded: true, theme: 'auto', lastBackupAt: null, anchor: '', conversoSeen: true, weeklyGoal: 5, mascot: true, commitment: '', metronome: false },
          lessons: {},
          keys: {},
          sessions: [],
          streak: { count: 0, lastDay: null, best: 0, freezes: 0, activeDays: 0 },
          routine: { day: '2000-01-01', warmup: false, lesson: false, review: false, challenge: false },
          days: {},
          legacy: null,
          lastExamDay: null,
          blindSince: null,
          milestonesSeen: [],
          lastWeeklySummaryWeek: null,
          bigrams: {},
          words: {},
          commitments: {},
        },
        version: 7,
      }),
    )
  })
  for (const path of ['/estadisticas', '/ajustes', '/ruta']) {
    await page.goto(path)
    await expect(page.locator('h1').first()).toBeVisible()
  }
  expect(messages.filter((m) => m.includes('HydrateFallback'))).toEqual([])
})

test('a screen of a previous deploy reloads once, then says the app was updated instead of the developer page', async ({ page }) => {
  await page.goto('/bienvenida')
  await seed(page)
  await page.goto('/')
  // The chunk is gone, as after a deploy: the import fails every time.
  await page.route('**/src/app/routes/Path.tsx*', (route) => route.abort())
  let loads = 0
  page.on('load', () => loads++)
  await page.getByRole('link', { name: 'Ruta', exact: true }).click()
  const card = page.getByTestId('route-error')
  await expect(card).toBeVisible()
  await expect(card).toContainText('TypeLight se actualizó')
  expect(loads).toBe(1)
  await expect(page.getByText('Hey developer')).toHaveCount(0)
  // The shell stays: the nav still works.
  await page.getByRole('link', { name: 'Hoy', exact: true }).click()
  await expect(page.getByTestId('routine-challenge')).toBeVisible()
})

test('a screen that throws while rendering shows a Spanish error card, not the router developer page', async ({ page }) => {
  await page.goto('/bienvenida')
  await seed(page, 'toString')
  await page.goto('/')
  const card = page.getByTestId('route-error')
  await expect(card).toContainText('Esta pantalla no se pudo abrir')
  await expect(page.getByText('Unexpected Application Error')).toHaveCount(0)
})
