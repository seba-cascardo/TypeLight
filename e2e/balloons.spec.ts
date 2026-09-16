import { expect, test } from '@playwright/test'

test('balloons game: type whole words, pop them, finish with stars and key samples', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => {
    const done = { stars: 3, bestWpm: 30, bestAcc: 1, attempts: 1, completedAt: '2026-01-01T00:00:00Z' }
    localStorage.setItem(
      'typelight.v1',
      JSON.stringify({
        state: {
          settings: { name: 'Seba', layoutId: 'latam', sound: false, showHands: true, onboarded: true, theme: 'auto' },
          lessons: { 'superior-unit-review': done },
          keys: {},
          sessions: [],
          days: {},
          streak: { count: 0, lastDay: null },
          routine: { day: '2000-01-01', warmup: false, lesson: false, review: false, challenge: false },
        },
        version: 2,
      }),
    )
  })
  await page.goto('/leccion/superior-juego-fila-superior?dur=6000')
  await expect(page.getByRole('heading', { name: 'Globos de palabras', exact: true })).toBeVisible()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('heading', { name: 'Globos de palabras', exact: true })).toBeHidden()

  // Play: type the next letter of the active balloon, or start the oldest one.
  const deadline = Date.now() + 8000
  let shot = false
  while (Date.now() < deadline) {
    const next = await page.evaluate(() => {
      const active = document.querySelector<HTMLElement>('[data-active="1"]')
      const target = active ?? document.querySelector<HTMLElement>('[data-balloon="1"]')
      if (!target) return null
      return target.dataset.word![Number(target.dataset.typed)] ?? null
    })
    if (next) {
      await page.keyboard.type(next)
      if (!shot) {
        shot = true
        await page.waitForTimeout(200)
        await page.screenshot({ path: 'e2e/screens/balloons-play.png' })
      }
    }
    await page.waitForTimeout(60)
    if (await page.getByText('Juego terminado').isVisible()) break
  }
  await expect(page.getByText('Juego terminado')).toBeVisible()
  await expect(page.getByText('Escapados')).toBeVisible()
  const state = await page.evaluate(() => JSON.parse(localStorage.getItem('typelight.v1')!).state)
  expect(state.lessons['superior-juego-fila-superior'].stars).toBeGreaterThanOrEqual(1)
  const last = state.sessions[state.sessions.length - 1]
  expect(last).toMatchObject({ kind: 'game', gameId: 'balloons' })
  expect(Object.keys(state.keys).length).toBeGreaterThan(0)
  await page.screenshot({ path: 'e2e/screens/balloons-results.png' })
})
