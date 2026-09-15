import { expect, test } from '@playwright/test'

test.use({ viewport: { width: 400, height: 820 } })

test('phone width stays usable', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => {
    localStorage.setItem(
      'typelight.v1',
      JSON.stringify({ state: { settings: { name: 'Seba', layoutId: 'latam', sound: false, showHands: true, onboarded: true }, lessons: {}, keys: {}, sessions: [], streak: { count: 0, lastDay: null }, routine: { day: '2000-01-01', warmup: false, lesson: false, review: false, challenge: false } }, version: 1 }),
    )
  })
  await page.goto('/')
  await expect(page.getByRole('heading', { name: /Seba/ })).toBeVisible()
  await page.screenshot({ path: 'e2e/screens/mobile-home.png', fullPage: true })
  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
  expect(scrollWidth).toBeLessThanOrEqual(400)
  await page.goto('/leccion/guia-66-6a-keys')
  await page.getByRole('button', { name: /Siguiente/ }).click()
  await page.getByRole('button', { name: /Siguiente/ }).click()
  await page.getByRole('button', { name: /Empezar el ejercicio/ }).click()
  await expect(page.locator('.type-char.is-current')).toBeVisible()
  await page.screenshot({ path: 'e2e/screens/mobile-exercise.png', fullPage: true })
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(400)
})
