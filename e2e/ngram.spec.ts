import { expect, test, type Page } from '@playwright/test'

async function typeRemaining(page: Page) {
  const text = await page.evaluate(() =>
    [...document.querySelectorAll('.type-char')]
      .filter((s) => !s.classList.contains('is-done'))
      .map((s) => (s.classList.contains('is-space') || s.textContent === ' ' || s.textContent === '' ? ' ' : s.textContent))
      .join(''),
  )
  await page.keyboard.type(text, { delay: 10 })
}

test('the bigram drill in Velocidad is playable end to end', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => {
    const done = { stars: 3, bestWpm: 30, bestAcc: 1, attempts: 1, completedAt: '2026-09-15T12:00:00.000Z' }
    localStorage.setItem(
      'typelight.v1',
      JSON.stringify({
        state: {
          settings: { name: 'Seba', layoutId: 'latam', sound: false, showHands: true, onboarded: true, theme: 'auto', lastBackupAt: null },
          lessons: { 'velocidad-tip-velocidad': done }, keys: {}, sessions: [], streak: { count: 0, lastDay: null },
          routine: { day: '2000-01-01', warmup: false, lesson: false, review: false, challenge: false }, days: {}, legacy: null,
        },
        version: 3,
      }),
    )
  })
  await page.goto('/leccion/velocidad-bigramas')
  await expect(page.getByRole('heading', { name: 'Bigramas del español' })).toBeVisible()
  for (let i = 0; i < 3; i++) {
    await expect(page.locator('.type-char.is-current')).toBeVisible()
    await typeRemaining(page)
    if (i < 2) await page.keyboard.press('Enter')
  }
  await expect(page.getByText('Lección terminada')).toBeVisible()
})
