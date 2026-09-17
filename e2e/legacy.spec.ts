import { expect, test } from '@playwright/test'

test('legacy speed: the route exists and the line shows on the chart', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => {
    const d = new Date()
    d.setHours(12, 0, 0, 0)
    const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    localStorage.setItem(
      'typelight.v1',
      JSON.stringify({
        state: {
          settings: { name: 'Seba', layoutId: 'latam', sound: false, showHands: true, onboarded: true, theme: 'auto', lastBackupAt: null },
          lessons: {},
          keys: {},
          sessions: [{ at: d.toISOString(), kind: 'challenge', wpm: 30, acc: 0.95, chars: 150, errors: 3, seconds: 60, reference: true }],
          streak: { count: 1, lastDay: today },
          routine: { day: '2000-01-01', warmup: false, lesson: false, review: false, challenge: false },
          days: { [today]: { seconds: 60, blocks: 1, learned: 8, mastered: 2, reference: [30], sessions: 1 } },
          legacy: { wpm: 45, acc: 0.9, at: d.toISOString() },
        },
        version: 3,
      }),
    )
  })
  await page.goto('/estadisticas')
  await expect(page.locator('svg text', { hasText: 'antes · 45' })).toBeVisible()
  await page.goto('/ajustes')
  await expect(page.getByTestId('legacy-card')).toContainText('45 PPM')
  await page.getByRole('link', { name: 'Medir de nuevo' }).click()
  await expect(page).toHaveURL(/practica\/antes/)
  await expect(page.getByRole('heading', { name: 'Como antes' })).toBeVisible()
  await expect(page.locator('.type-char.is-current')).toBeVisible()
})
