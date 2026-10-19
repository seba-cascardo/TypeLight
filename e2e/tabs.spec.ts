import { expect, test, type Page } from '@playwright/test'

async function remaining(page: Page): Promise<string> {
  return page.evaluate(() =>
    [...document.querySelectorAll('.type-char')]
      .filter((s) => !s.classList.contains('is-done'))
      .map((s) => (s.classList.contains('is-space') || s.textContent === ' ' ? ' ' : s.textContent))
      .join(''),
  )
}

test('a tab left open does not overwrite what another tab saved since', async ({ context }) => {
  const a = await context.newPage()
  await a.goto('/bienvenida')
  await a.evaluate(() =>
    localStorage.setItem(
      'typelight.v1',
      JSON.stringify({
        state: {
          settings: { name: 'Ana', layoutId: 'latam', sound: false, showHands: true, onboarded: true, theme: 'auto', lastBackupAt: null, conversoSeen: false },
          lessons: {}, keys: {}, sessions: [], streak: { count: 0, lastDay: null },
          routine: { day: '2000-01-01', warmup: false, lesson: false, review: false, challenge: false }, days: {}, legacy: null,
        },
        version: 3,
      }),
    ),
  )
  await a.goto('/')
  await expect(a.getByTestId('converso-card')).toBeVisible()

  // Tab B does the warm-up while A sits open.
  const b = await context.newPage()
  await b.goto('/practica/calentamiento')
  await expect(b.locator('.type-char.is-current')).toBeVisible()
  await b.keyboard.type(await remaining(b))
  await expect(b.getByText('Calentamiento · listo')).toBeVisible()

  // Back in A, closing a card writes the whole state.
  await a.bringToFront()
  await a.getByTestId('converso-card').getByRole('button', { name: /Listo/ }).click()
  const saved = await a.evaluate(() => JSON.parse(localStorage.getItem('typelight.v1')!).state)
  expect(saved.sessions).toHaveLength(1)
  expect(saved.routine.warmup).toBe(true)
  expect(saved.settings.conversoSeen).toBe(true)
  // And A shows it: the warm-up card is done there too.
  await expect(a.getByTestId('routine-warmup')).toHaveAttribute('data-done', 'true')
})
