import { expect, test } from '@playwright/test'

test.describe('on a phone', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true })

  test('a touch-only device is told TypeLight needs a keyboard, with the link, and can go on', async ({ page }) => {
    await page.goto('/')
    const notice = page.getByTestId('touch-notice')
    await expect(notice).toBeVisible()
    await expect(notice).toContainText('teclado')
    await expect(notice).toContainText('http://localhost:5174/')
    await notice.getByRole('button', { name: 'Seguir igual' }).click()
    await expect(notice).toHaveCount(0)
    await expect(page).toHaveURL(/bienvenida/)
    // Once dismissed, it stays away.
    await page.reload()
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible()
    await expect(notice).toHaveCount(0)
  })
})

test('a computer never sees the phone notice', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveURL(/bienvenida/)
  await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible()
  await expect(page.getByTestId('touch-notice')).toHaveCount(0)
})
