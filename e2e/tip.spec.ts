import { expect, test } from '@playwright/test'

test('a tip completes but does not fill the routine Lección card', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() =>
    localStorage.setItem(
      'typelight.v1',
      JSON.stringify({
        state: {
          settings: { name: 'Seba', layoutId: 'latam', sound: false, showHands: true, onboarded: true, theme: 'auto', lastBackupAt: null },
          lessons: {}, keys: {}, sessions: [], streak: { count: 0, lastDay: null },
          routine: { day: '2000-01-01', warmup: false, lesson: false, review: false, challenge: false }, days: {}, legacy: null,
        },
        version: 3,
      }),
    ),
  )
  await page.goto('/leccion/guia-tip-intro')
  await page.getByRole('button', { name: /Siguiente/ }).click()
  await page.getByRole('button', { name: /Siguiente/ }).click()
  await page.getByRole('button', { name: /Entendido/ }).click()
  await expect(page).toHaveURL(/leccion\/guia-66-6a-keys/)
  await page.goto('/')
  await expect(page.getByTestId('routine-lesson')).toHaveAttribute('data-done', 'false')
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('typelight.v1')!))
  expect(stored.state.lessons['guia-tip-intro'].stars).toBe(3)
})
