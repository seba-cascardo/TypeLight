import { expect, test, type Page } from '@playwright/test'

/** Local calendar day, like the app's `dayKey`. */
function localDay(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Monday of the ISO week of `day`. */
function monday(day: string): string {
  const [y, m, d] = day.split('-').map(Number)
  const t = new Date(y, m - 1, d)
  t.setDate(t.getDate() - ((t.getDay() + 6) % 7))
  return localDay(t)
}

/** An onboarded state with f, j and the space bar learned. */
function seed(page: Page, extra: Record<string, unknown> = {}) {
  return page.evaluate((extra) => {
    const done = { stars: 3, bestWpm: 30, bestAcc: 1, attempts: 1, completedAt: '2026-09-15T00:00:00Z' }
    localStorage.setItem(
      'typelight.v1',
      JSON.stringify({
        state: {
          settings: { name: 'Seba', layoutId: 'latam', sound: false, showHands: true, onboarded: true, theme: 'auto', lastBackupAt: null, anchor: '', conversoSeen: true },
          lessons: { 'guia-tip-intro': done, 'guia-66-6a-keys': done, 'guia-space': done },
          keys: {},
          sessions: [],
          streak: { count: 0, lastDay: null },
          routine: { day: '2000-01-01', warmup: false, lesson: false, review: false, challenge: false },
          days: {},
          legacy: null,
          lastExamDay: null,
          blindSince: null,
          ...extra,
        },
        version: 4,
      }),
    )
  }, extra)
}

async function remaining(page: Page): Promise<string> {
  return page.evaluate(() =>
    [...document.querySelectorAll('.type-char')]
      .filter((s) => !s.classList.contains('is-done') && !s.classList.contains('type-extra'))
      .map((s) => (s.classList.contains('is-space') || s.textContent === '\u00a0' || s.textContent === '' ? ' ' : s.textContent))
      .join(''),
  )
}

test('the Reto has no keyboard, lets an error pass and repairs it with Backspace; the form check is stored', async ({ page }) => {
  await page.goto('/')
  await seed(page)
  await page.goto('/practica/reto')
  await expect(page.getByRole('heading', { name: 'Reto de un minuto' })).toBeVisible()
  await expect(page.locator('.kb-key')).toHaveCount(0)
  await expect(page.getByText('Sin teclado ni manos', { exact: true })).toBeVisible()
  await expect(page.locator('.type-char.is-current')).toBeVisible()
  const text = await remaining(page)
  const wrong = text[0] === 'f' ? 'j' : 'f'
  await page.keyboard.type(wrong)
  await expect(page.locator('.type-char.is-mistyped')).toHaveText(wrong)
  await expect(page.locator('.type-char.is-done')).toHaveCount(1)
  await page.keyboard.press('Backspace')
  await expect(page.locator('.type-char.is-mistyped')).toHaveCount(0)
  await expect(page.locator('.type-char.is-done')).toHaveCount(0)
  // No live WPM line while typing.
  await expect(page.getByText(/PPM ·/)).toHaveCount(0)
  await page.keyboard.type(text)
  await expect(page.getByText('Reto de un minuto · listo')).toBeVisible()
  await expect(page.getByText('Al primer intento')).toBeVisible()
  await expect(page.getByText('Reparados')).toBeVisible()
  await expect(page.getByText('Teclas por letra')).toBeVisible()
  const check = page.getByTestId('form-check')
  await expect(check).toHaveAttribute('data-answer', 'pending')
  // Enter does nothing until the form check is answered.
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/practica\/reto/)
  await page.keyboard.press('1')
  await expect(check).toHaveAttribute('data-answer', 'si')
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL('http://localhost:5174/')
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('typelight.v1')!))
  expect(stored.version).toBe(8)
  const s = stored.state.sessions[0]
  expect(s.kind).toBe('challenge')
  expect(s.mode).toBe('free')
  expect(s.blind).toBe(true)
  expect(s.reference).toBe(true)
  expect(s.form).toBe('si')
  expect(s.firstTryErrors).toBe(1)
  expect(s.repaired).toBe(1)
  expect(s.kspc).toBeGreaterThan(1)
  expect(stored.state.blindSince).toBe(localDay())
  await expect(page.getByTestId('routine-challenge')).toHaveAttribute('data-done', 'true')
})

test('the coral card is the weekly exam until it is taken this week', async ({ page }) => {
  await page.goto('/')
  await seed(page)
  await page.goto('/')
  const card = page.getByTestId('routine-challenge')
  await expect(card).toContainText('Examen semanal')
  await card.click()
  await expect(page).toHaveURL(/practica\/examen/)
  await expect(page.getByRole('heading', { name: 'Examen semanal' })).toBeVisible()
  await expect(page.locator('.kb-key')).toHaveCount(0)
  await expect(page.locator('.type-char.is-current')).toBeVisible()
  // Stop-on-error: a wrong key does not move the cursor.
  const text = await remaining(page)
  await page.keyboard.type(text[0] === 'f' ? 'j' : 'f')
  await expect(page.locator('.type-char.is-current.is-wrong')).toBeVisible()
  await expect(page.locator('.type-char.is-done')).toHaveCount(0)

  // Taken this week → back to the Reto.
  await page.goto('/')
  await seed(page, { lastExamDay: monday(localDay()) })
  await page.goto('/')
  await expect(card).toContainText('Reto')
  await expect(card).not.toContainText('Examen')

  // Taken last week → due again.
  await page.goto('/')
  const [y, m, d] = monday(localDay()).split('-').map(Number)
  const lastWeek = localDay(new Date(y, m - 1, d - 3))
  await seed(page, { lastExamDay: lastWeek })
  await page.goto('/')
  await expect(card).toContainText('Examen semanal')
})

test('finishing the exam marks the week, the day and the routine', async ({ page }) => {
  // Types the whole 1500+ character exam text: ~50 s on a loaded machine, too close to the 60 s default.
  test.slow()
  await page.goto('/')
  await seed(page)
  await page.goto('/practica/examen')
  await expect(page.locator('.type-char.is-current')).toBeVisible()
  const text = await remaining(page)
  expect(text.length).toBeGreaterThanOrEqual(1500)
  await page.keyboard.type(text)
  await expect(page.getByText('Examen semanal · listo')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByTestId('form-check')).toHaveAttribute('data-answer', 'skip')
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('typelight.v1')!))
  expect(stored.state.lastExamDay).toBe(localDay())
  const s = stored.state.sessions[0]
  expect(s.kind).toBe('exam')
  expect(s.reference).toBe(true)
  expect(s.form).toBeUndefined()
  expect(stored.state.days[localDay()].exam).toBe(s.wpm)
  expect(stored.state.routine.challenge).toBe(true)
})

test('the converso card shows once; the anchor lives under the greeting and in Ajustes', async ({ page }) => {
  await page.goto('/')
  await seed(page, { settings: { name: 'Seba', layoutId: 'latam', sound: false, showHands: true, onboarded: true, theme: 'auto', lastBackupAt: null, anchor: '', conversoSeen: false } })
  await page.goto('/')
  const card = page.getByTestId('converso-card')
  await expect(card).toBeVisible()
  await expect(card).toContainText('Diez minutos, cinco días')
  await expect(page.getByTestId('anchor')).toHaveCount(0)
  await card.getByLabel('Tu ancla').fill('El mate de la mañana')
  await card.getByRole('button', { name: /Listo/ }).click()
  await expect(card).toHaveCount(0)
  await expect(page.getByTestId('anchor')).toHaveText('Después del mate de la mañana, practico.')
  await page.reload()
  await expect(page.getByTestId('converso-card')).toHaveCount(0)
  await expect(page.getByTestId('anchor')).toBeVisible()
  await page.goto('/ajustes')
  const field = page.getByLabel('Tu ancla')
  await expect(field).toHaveValue('El mate de la mañana')
  await field.fill('')
  await page.goto('/')
  await expect(page.getByTestId('anchor')).toHaveCount(0)
  await expect(page.getByTestId('converso-card')).toHaveCount(0)
})

test('one day in three the warm-up card is a game and playing it fills the warm-up', async ({ page }) => {
  // 2026-01-09 is day 9 of the year: 9 % 3 === 0 and floor(9 / 3) is odd → Al compás.
  await page.clock.setFixedTime(new Date(2026, 0, 9, 12, 0, 0))
  await page.goto('/')
  await seed(page, {
    // The row's Al compás lesson is done too: the warm-up never repeats the game the next lesson is.
    lessons: Object.fromEntries(['guia-tip-intro', 'guia-66-6a-keys', 'guia-space', 'guia-64-6b-keys', 'guia-unit-review', 'guia-juego-fila-guia'].map((id) => [id, { stars: 3, bestWpm: 30, bestAcc: 1, attempts: 1, completedAt: '2026-01-01T00:00:00Z' }])),
  })
  await page.goto('/')
  const card = page.getByTestId('routine-warmup')
  await expect(card).toContainText('Al compás')
  await expect(card).toContainText('juego')
  await card.click()
  await expect(page).toHaveURL(/practica\/calentamiento/)
  await page.goto('/practica/calentamiento?dur=3000')
  await expect(page.getByRole('heading', { level: 1, name: 'Al compás' })).toBeVisible()
  await expect(page.getByText('Hoy el Calentamiento es un juego', { exact: false })).toBeVisible()
  await page.keyboard.press('Enter')
  await expect(page.getByText('Juego terminado')).toBeVisible({ timeout: 15_000 })
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL('http://localhost:5174/')
  await expect(card).toHaveAttribute('data-done', 'true')
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('typelight.v1')!))
  expect(stored.state.sessions[0].kind).toBe('game')
  expect(stored.state.sessions[0].gameId).toBe('rhythm')

  // The day after it is the plain warm-up again.
  await page.clock.setFixedTime(new Date(2026, 0, 10, 12, 0, 0))
  await page.goto('/')
  await expect(card).toContainText('Calentamiento')
  await expect(card).not.toContainText('juego')
})
