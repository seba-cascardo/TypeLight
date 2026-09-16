import { expect, test } from '@playwright/test'

/** Local calendar day, like the app's dayKey(). */
function localDay(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
const today = localDay()

function seed(routineDone: boolean) {
  return {
    state: {
      settings: { name: 'Seba', layoutId: 'latam', sound: false, showHands: true, onboarded: true, theme: 'auto' },
      lessons: { 'guia-66-6a-practice': { stars: 3, bestWpm: 30, bestAcc: 1, attempts: 1, completedAt: '2026-01-01T00:00:00Z' } },
      keys: {},
      sessions: [],
      days: {},
      streak: { count: 0, lastDay: null },
      routine: { day: today, warmup: routineDone, lesson: routineDone, review: routineDone, challenge: routineDone },
    },
    version: 2,
  }
}

test('free play appears only with the routine complete and records a game session without touching it', async ({ page }) => {
  await page.goto('/')
  await page.evaluate((s) => localStorage.setItem('typelight.v1', JSON.stringify(s)), seed(false))
  await page.goto('/')
  await expect(page.getByTestId('play-row')).toHaveCount(0)

  await page.evaluate((s) => localStorage.setItem('typelight.v1', JSON.stringify(s)), seed(true))
  await page.goto('/')
  await expect(page.getByTestId('play-row')).toBeVisible()
  // Only f, j and space are learned: word games stay hidden.
  await expect(page.getByTestId('play-row').getByRole('link')).toHaveCount(2)
  await page.screenshot({ path: 'e2e/screens/home-play.png' })

  await page.getByRole('link', { name: /Al compás/ }).click()
  await expect(page).toHaveURL(/\/jugar\/rhythm/)
  await page.goto('/jugar/rhythm?dur=3000')
  await expect(page.getByRole('heading', { level: 2, name: 'Al compás' })).toBeVisible()
  await page.keyboard.press('Enter')
  await expect(page.getByText('Juego terminado')).toBeVisible({ timeout: 10_000 })
  await expect(page.getByRole('link', { name: 'Volver al inicio' })).toBeVisible()
  const state = await page.evaluate(() => JSON.parse(localStorage.getItem('typelight.v1')!).state)
  expect(state.sessions[state.sessions.length - 1]).toMatchObject({ kind: 'game', gameId: 'rhythm' })
  expect(state.routine).toMatchObject({ warmup: true, lesson: true, review: true, challenge: true })
  expect(Object.keys(state.lessons)).toEqual(['guia-66-6a-practice'])
})
