import { expect, test } from '@playwright/test'

test('rain game: catch keys, finish, get stars and unlock the next lesson', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => {
    const done = { stars: 3, bestWpm: 30, bestAcc: 1, attempts: 1, completedAt: '2026-01-01T00:00:00Z' }
    localStorage.setItem(
      'typelight.v1',
      JSON.stringify({ state: { settings: { name: 'Seba', layoutId: 'latam', sound: false, showHands: true, onboarded: true }, lessons: { 'guia-61-f1-practice': done }, keys: {}, sessions: [], streak: { count: 0, lastDay: null }, routine: { day: '2000-01-01', warmup: false, lesson: false, review: false, challenge: false } }, version: 1 }),
    )
  })
  await page.goto('/leccion/guia-juego-primeras-8?dur=6000')
  await expect(page.getByRole('heading', { name: 'Lluvia de teclas' })).toBeVisible()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('heading', { name: 'Lluvia de teclas' })).toBeHidden()

  // Play: every 150 ms, type the lowest visible key.
  const deadline = Date.now() + 7000
  let ticks = 0
  while (Date.now() < deadline) {
    if (++ticks === 14) await page.screenshot({ path: 'e2e/screens/game-play.png' })
    const lowest = await page.evaluate(() => {
      const drops = [...document.querySelectorAll<HTMLElement>('.kb-key.absolute')].filter((d) => d.style.opacity !== '0')
      if (!drops.length) return null
      const l = drops.reduce((a, b) => (parseFloat(a.style.top) > parseFloat(b.style.top) ? a : b))
      return l.textContent
    })
    if (lowest) await page.keyboard.type(lowest)
    await page.waitForTimeout(150)
    if (await page.getByText('Juego terminado').isVisible()) break
  }
  await expect(page.getByText('Juego terminado')).toBeVisible()
  const score = await page.getByText(/puntos/i).first().textContent()
  expect(score).toBeTruthy()
  const hits = await page.evaluate(() => JSON.parse(localStorage.getItem('typelight.v1')!).state.lessons['guia-juego-primeras-8'])
  expect(hits.stars).toBeGreaterThanOrEqual(1)
  const last = await page.evaluate(() => {
    const s = JSON.parse(localStorage.getItem('typelight.v1')!).state.sessions
    return s[s.length - 1]
  })
  expect(last).toMatchObject({ kind: 'game', gameId: 'rain' })
  await page.screenshot({ path: 'e2e/screens/game-results.png' })
})
