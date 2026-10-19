import { expect, test, type Page } from '@playwright/test'

/** Playwright's CapsLock does not set the modifier state in Chromium: send the key event the browser would. */
function capsLock(page: Page, on: boolean) {
  return page.evaluate((on) => {
    const target = document.activeElement ?? window
    target.dispatchEvent(new KeyboardEvent('keydown', { key: 'CapsLock', code: 'CapsLock', modifierCapsLock: on, bubbles: true } as KeyboardEventInit))
  }, on)
}

test('Caps Lock on shows a notice over the exercise and in a game; off, it goes away', async ({ page }) => {
  await page.goto('/bienvenida')
  await page.evaluate(() =>
    localStorage.setItem(
      'typelight.v1',
      JSON.stringify({
        state: {
          settings: { name: 'Ana', layoutId: 'latam', sound: false, showHands: true, onboarded: true, theme: 'auto', lastBackupAt: null, conversoSeen: true },
          lessons: {}, keys: {}, sessions: [], streak: { count: 0, lastDay: null },
          routine: { day: '2000-01-01', warmup: false, lesson: false, review: false, challenge: false }, days: {}, legacy: null,
        },
        version: 3,
      }),
    ),
  )
  await page.goto('/practica/calentamiento')
  await expect(page.locator('.type-char.is-current')).toBeVisible()
  const notice = page.getByTestId('caps-lock')
  await expect(notice).toHaveCount(0)
  await capsLock(page, true)
  await expect(notice).toBeVisible()
  await expect(notice).toContainText('Bloq Mayús')
  await capsLock(page, false)
  await expect(notice).toHaveCount(0)

  await page.goto('/jugar/rain')
  await expect(page.getByText('puntos')).toBeVisible()
  await capsLock(page, true)
  await expect(notice).toBeVisible()
  await capsLock(page, false)
  await expect(notice).toHaveCount(0)
})
