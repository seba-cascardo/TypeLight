import { expect, test, type Page } from '@playwright/test'

async function remaining(page: Page): Promise<string> {
  return page.evaluate(() =>
    [...document.querySelectorAll('.type-char')]
      .filter((s) => !s.classList.contains('is-done'))
      .map((s) => (s.classList.contains('is-space') || s.textContent === ' ' || s.textContent === '' ? ' ' : s.textContent))
      .join(''),
  )
}

test('race game: beat the ghost, record a reference session', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => {
    const done = { stars: 3, bestWpm: 30, bestAcc: 1, attempts: 1, completedAt: '2026-01-01T00:00:00Z' }
    localStorage.setItem(
      'typelight.v1',
      JSON.stringify({
        state: {
          settings: { name: 'Seba', layoutId: 'latam', sound: false, showHands: true, onboarded: true, theme: 'auto' },
          lessons: { 'mayusculas-unit-review': done },
          keys: {},
          sessions: [{ at: new Date().toISOString(), kind: 'challenge', wpm: 25, acc: 0.98, chars: 120, errors: 2, seconds: 60, reference: true }],
          days: {},
          streak: { count: 0, lastDay: null },
          routine: { day: '2000-01-01', warmup: false, lesson: false, review: false, challenge: false },
        },
        version: 2,
      }),
    )
  })
  await page.goto('/leccion/mayusculas-juego-mayusculas')
  await expect(page.getByText(/Fantasma a 25 PPM/)).toBeVisible()
  await expect(page.locator('.type-char.is-current')).toBeVisible()
  await page.keyboard.type(await remaining(page), { delay: 10 })
  await expect(page.getByText('Juego terminado')).toBeVisible()
  await expect(page.getByText(/Le ganaste por/)).toBeVisible()
  const state = await page.evaluate(() => JSON.parse(localStorage.getItem('typelight.v1')!).state)
  expect(state.lessons['mayusculas-juego-mayusculas'].stars).toBe(3)
  const last = state.sessions[state.sessions.length - 1]
  expect(last).toMatchObject({ kind: 'game', gameId: 'race', reference: true })
  expect(last.wpm).toBeGreaterThan(25)
  // the race feeds the skill model like a Reto: bigrams and words
  expect(Object.keys(state.bigrams ?? {}).length).toBeGreaterThan(0)
  expect(Object.keys(state.words ?? {}).length).toBeGreaterThan(0)
  await page.screenshot({ path: 'e2e/screens/race-results.png' })
  // Enter waits for the form self-check, as after the Reto and the exam
  await page.keyboard.press('Enter')
  await expect(page.getByText('Juego terminado')).toBeVisible()
  await expect(page.getByTestId('form-check')).toHaveAttribute('data-answer', 'pending')
  await page.keyboard.press('1')
  await expect(page.getByTestId('form-check')).toHaveAttribute('data-answer', 'si')
  await page.keyboard.press('Enter')
  await expect(page.getByText('Juego terminado')).toHaveCount(0)
})

test('«carrera a 34 PPM» runs the ghost at 34, even with a faster week', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => {
    const done = { stars: 3, bestWpm: 30, bestAcc: 1, attempts: 1, completedAt: '2026-01-01T00:00:00Z' }
    const day = (d: number) => new Date(Date.now() - d * 86_400_000)
    const key = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    localStorage.setItem(
      'typelight.v1',
      JSON.stringify({
        state: {
          settings: { name: 'Seba', layoutId: 'latam', sound: false, showHands: true, onboarded: true, theme: 'auto' },
          lessons: { 'velocidad-texto-4': done },
          keys: {},
          sessions: [{ at: new Date().toISOString(), kind: 'challenge', wpm: 48, acc: 0.98, chars: 240, errors: 2, seconds: 60, reference: true }],
          // a month-old reference too: the 30-days-ago ghost isn't offered in a race that names its speed
          days: { [key(day(31))]: { seconds: 60, blocks: 4, learned: 8, mastered: 2, reference: [22], sessions: 1 } },
          streak: { count: 0, lastDay: null },
          routine: { day: '2000-01-01', warmup: false, lesson: false, review: false, challenge: false },
        },
        version: 2,
      }),
    )
  })
  await page.goto('/leccion/velocidad-juego-carrera-1')
  await expect(page.getByText(/Fantasma a 34 PPM/)).toBeVisible()
  await expect(page.getByText('la meta de esta lección')).toBeVisible()
  await expect(page.getByTestId('ghost-pick')).toHaveCount(0)
})
