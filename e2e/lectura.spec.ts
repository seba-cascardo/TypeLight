import { expect, test, type Page } from '@playwright/test'

function seed(page: Page, reading: Record<string, unknown> = {}) {
  return page.evaluate((reading) => {
    const done = { stars: 3, bestWpm: 30, bestAcc: 1, attempts: 1, completedAt: '2026-09-15T00:00:00Z' }
    localStorage.setItem(
      'typelight.v1',
      JSON.stringify({
        state: {
          settings: { name: 'Seba', layoutId: 'latam', sound: false, showHands: true, onboarded: true, theme: 'auto', lastBackupAt: null, anchor: '', conversoSeen: true, weeklyGoal: 5, mascot: false, commitment: '', metronome: false },
          lessons: { 'guia-tip-intro': done, 'guia-66-6a-keys': done },
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
          reading,
        },
        version: 8,
      }),
    )
  }, reading)
}

async function remaining(page: Page): Promise<string> {
  return page.evaluate(() =>
    [...document.querySelectorAll('.type-char')]
      .filter((s) => !s.classList.contains('is-done') && !s.classList.contains('type-extra'))
      .map((s) => (s.classList.contains('is-space') || s.textContent === '' ? ' ' : s.textContent))
      .join(''),
  )
}

const done = (page: Page) => page.locator('.type-char.is-done')

test('Inicio leads to the library; a page is typed stop-on-word and the place is kept', async ({ page }) => {
  await page.goto('/bienvenida')
  await seed(page)
  await page.goto('/')
  await page.getByTestId('reading-link').click()
  await expect(page).toHaveURL(/\/lectura$/)
  await expect(page.getByTestId('book-quiroga-selva')).toContainText('Cuentos de la selva')
  await expect(page.getByTestId('book-arlt-aguafuertes')).toContainText('Aguafuertes porteñas')
  await page.getByTestId('book-quiroga-selva').getByRole('link', { name: 'Empezar →' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Las medias de los flamencos' })).toBeVisible()
  await expect(page.getByTestId('page-of')).toContainText('página 1 de')

  await expect(page.locator('.type-char.is-current')).toBeVisible()
  const text = await remaining(page)
  const first = text.slice(0, text.indexOf(' '))
  // an error passes inside the word...
  await page.keyboard.type(first.slice(0, -1) + 'q')
  await expect(done(page)).toHaveCount(first.length)
  // ...but the space waits until the word is right
  await page.keyboard.press('Space')
  await expect(page.locator('.type-char.is-current.is-wrong')).toHaveCount(1)
  await expect(done(page)).toHaveCount(first.length)
  await page.keyboard.press('Backspace')
  await page.keyboard.type(first.slice(-1) + ' ')
  await expect(done(page)).toHaveCount(first.length + 1)
  await page.keyboard.type(text.slice(first.length + 1))
  await expect(page.getByTestId('page-done')).toContainText('PPM')

  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('typelight.v1')!).state)
  expect(stored.reading['quiroga-selva']).toMatchObject({ chapter: 0, page: 1 })
  const last = stored.sessions[stored.sessions.length - 1]
  expect(last).toMatchObject({ kind: 'reading', mode: 'word', repaired: 1 })
  expect(last.reference).toBeUndefined()
  expect(stored.routine.lesson).toBe(false)

  await page.keyboard.press('Enter')
  await expect(page.getByTestId('page-of')).toContainText('página 2 de')
  // back in the library, the book is under way
  await page.getByRole('link', { name: '← Biblioteca' }).click()
  await expect(page.getByTestId('book-quiroga-selva')).toContainText('vas por «Las medias de los flamencos»')
  await expect(page.getByTestId('book-quiroga-selva').getByRole('link', { name: 'Seguir leyendo →' })).toBeVisible()
})

test('the chapter picker jumps and keeps the new place', async ({ page }) => {
  await page.goto('/bienvenida')
  await seed(page, { 'arlt-aguafuertes': { chapter: 0, page: 2, at: '2026-09-24T10:00:00Z' } })
  await page.goto('/lectura/arlt-aguafuertes')
  await expect(page.getByTestId('page-of')).toContainText('página 3 de')
  await page.getByTestId('chapter-select').selectOption({ label: 'Silla en la vereda' })
  await expect(page.getByRole('heading', { level: 1, name: 'Silla en la vereda' })).toBeVisible()
  await expect(page.getByTestId('page-of')).toContainText('página 1 de')
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('typelight.v1')!).state)
  expect(stored.reading['arlt-aguafuertes'].page).toBe(0)
  expect(stored.reading['arlt-aguafuertes'].chapter).toBeGreaterThan(0)
})
