import { expect, test, type Page } from '@playwright/test'

function seed(page: Page, lessons: string[]) {
  return page.evaluate((ids) => {
    const done = { stars: 3, bestWpm: 30, bestAcc: 1, attempts: 1, completedAt: '2026-09-15T00:00:00Z' }
    localStorage.setItem(
      'typelight.v1',
      JSON.stringify({
        state: {
          settings: { name: 'Seba', layoutId: 'latam', sound: false, showHands: true, onboarded: true, theme: 'auto', lastBackupAt: null, anchor: '', conversoSeen: true, weeklyGoal: 5, mascot: false, commitment: '', metronome: false },
          lessons: Object.fromEntries(ids.map((id) => [id, done])),
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
  }, lessons)
}

async function remaining(page: Page): Promise<string> {
  return page.evaluate(() =>
    [...document.querySelectorAll('.type-char')]
      .filter((s) => !s.classList.contains('is-done'))
      .map((s) => (s.classList.contains('is-space') || s.textContent === '' ? ' ' : s.textContent))
      .join(''),
  )
}

const MAIN = ['guia-tip-intro', 'guia-66-6a-keys', 'guia-space', 'guia-66-6a-review']

test('the optional units sit apart in the Ruta, open anytime, and never move the main progress', async ({ page }) => {
  await page.goto('/bienvenida')
  await seed(page, [...MAIN, 'codigo-tip-codigo'])
  await page.goto('/ruta')
  await expect(page.getByTestId('optional-units')).toContainText('Opcionales')
  await expect(page.getByRole('heading', { name: 'Símbolos de código' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Teclado numérico' })).toBeVisible()
  // the first lesson of each optional unit is open; inside a unit, each one opens the next
  await expect(page.locator('a[href="/leccion/numpad-tip-numpad"]')).toBeVisible()
  await expect(page.locator('a[href="/leccion/codigo-5b-5d-keys"]')).toBeVisible()
  await expect(page.locator('a[href="/leccion/codigo-5b-5d-practice"]')).toHaveCount(0)
  await page.goto('/')
  await expect(page.getByText(/^4 de \d+ lecciones$/)).toBeVisible()
  await expect(page.getByRole('link', { name: 'Ir a la lección →' })).toHaveAttribute('href', '/leccion/guia-66-6a-practice')
})

test('a code lesson teaches [ and ] and is completed like any lesson', async ({ page }) => {
  await page.goto('/bienvenida')
  // the unit's tip opens it, like any unit
  await seed(page, [...MAIN, 'codigo-tip-codigo'])
  await page.goto('/leccion/codigo-5b-5d-keys')
  for (let i = 0; i < 2; i++) await page.getByRole('button', { name: 'Siguiente →' }).click()
  await page.getByRole('button', { name: 'Empezar el ejercicio →' }).click()
  await expect(page.locator('.type-char.is-current')).toBeVisible()
  await page.keyboard.type(await remaining(page))
  await page.keyboard.press('Enter')
  await expect(page.locator('.type-char.is-current')).toBeVisible()
  const second = await remaining(page)
  expect(second).toMatch(/[[\]]/)
  await page.keyboard.type(second)
  await expect(page.getByText('Lección terminada')).toBeVisible()
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('typelight.v1')!).state)
  expect(stored.lessons['codigo-5b-5d-keys'].stars).toBeGreaterThan(0)
})
