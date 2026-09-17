import { expect, test, type Page } from '@playwright/test'

/** Read the remaining target text from the typing area. */
async function remaining(page: Page): Promise<string> {
  return page.evaluate(() =>
    [...document.querySelectorAll('.type-char')]
      .filter((s) => !s.classList.contains('is-done'))
      .map((s) => (s.classList.contains('is-space') || s.textContent === '\u00a0' || s.textContent === '' ? ' ' : s.textContent))
      .join(''),
  )
}

async function typeRemaining(page: Page) {
  const text = await remaining(page)
  await page.keyboard.type(text, { delay: 15 })
}

test('onboarding → first lessons → routine → stats', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveURL(/bienvenida/)
  await page.getByPlaceholder('Tu nombre').fill('Seba')
  await page.getByRole('button', { name: /Seguir/ }).click()

  // Layout detection: ñ, then { → Latinoamérica
  await expect(page.getByText('a la derecha de la L')).toBeVisible()
  await page.evaluate(() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ñ', code: 'Semicolon' })))
  await expect(page.getByText('a la derecha de la Ñ')).toBeVisible()
  await page.evaluate(() => window.dispatchEvent(new KeyboardEvent('keydown', { key: '{', code: 'Quote' })))
  await expect(page.getByText(/Parece un teclado español \(latinoamérica\)/)).toBeVisible()
  await page.getByRole('button', { name: /Empezar a practicar/ }).click()

  // Home
  await expect(page).toHaveURL('http://localhost:5174/')
  await expect(page.getByRole('heading', { name: /Seba/ })).toBeVisible()
  await page.screenshot({ path: 'e2e/screens/home.png' })

  // Tip lesson → auto-advance to "Teclas f y j"
  await page.getByRole('link', { name: /Ir a la lección/ }).click()
  await expect(page.getByRole('heading', { name: 'Antes de empezar' })).toBeVisible()
  await page.screenshot({ path: 'e2e/screens/tip.png' })
  await page.getByRole('button', { name: /Siguiente/ }).click()
  await page.getByRole('button', { name: /Siguiente/ }).click()
  await page.getByRole('button', { name: /Entendido/ }).click()
  await expect(page.getByRole('heading', { name: 'Teclas f y j' })).toBeVisible()
  await page.screenshot({ path: 'e2e/screens/intro-fj.png' })
  await page.getByRole('button', { name: /Siguiente/ }).click()
  await page.getByRole('button', { name: /Siguiente/ }).click()
  await page.getByRole('button', { name: /Empezar el ejercicio/ }).click()

  // Exercise 1 with one deliberate error
  await expect(page.locator('.type-char.is-current')).toBeVisible()
  await page.keyboard.type('x')
  await expect(page.locator('.type-char.is-current.is-wrong')).toBeVisible()
  await typeRemaining(page)
  await expect(page.getByText(/Siguiente ejercicio/)).toBeVisible()
  await page.screenshot({ path: 'e2e/screens/exercise-done.png' })
  await page.keyboard.press('Enter')
  await expect(page.getByText(/Siguiente ejercicio/)).toBeHidden()
  await typeRemaining(page)

  // Results
  await expect(page.getByText('Lección terminada')).toBeVisible()
  await expect(page.getByText(/de precisión|Precisión/i).first()).toBeVisible()
  await page.screenshot({ path: 'e2e/screens/results.png' })
  await page.getByRole('link', { name: /Siguiente: La barra espaciadora/ }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'La barra espaciadora' })).toBeVisible()

  // Path shows progress
  await page.goto('/ruta')
  await expect(page.getByText('estás acá')).toBeVisible()
  await page.screenshot({ path: 'e2e/screens/path.png', fullPage: true })

  // Routine: warm-up
  await page.goto('/practica/calentamiento')
  await expect(page.locator('.type-char.is-current')).toBeVisible()
  await typeRemaining(page)
  await expect(page.getByText(/Volver a la rutina/)).toBeVisible()
  await page.goto('/')
  await expect(page.getByText('2 de 4. Seguimos.')).toBeVisible()

  // Stats: no Reto yet → no reference point; the lesson's second exercise (9 keys) carries a rhythm
  await page.goto('/estadisticas')
  await expect(page.getByRole('heading', { name: 'Cómo vas avanzando.' })).toBeVisible()
  await expect(page.getByTestId('tile-reference')).toContainText('—')
  await expect(page.getByTestId('tile-mastery')).toBeVisible()
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('typelight.v1')!))
  expect(stored.version).toBe(7)
  expect(typeof stored.state.sessions[1].rhythm).toBe('number')
  const todayRow = stored.state.days[Object.keys(stored.state.days)[0]]
  expect(todayRow.blocks).toBe(2)
  expect(todayRow.learned).toBeGreaterThan(0)
  await page.screenshot({ path: 'e2e/screens/stats.png', fullPage: true })

  // Settings
  await page.goto('/ajustes')
  await expect(page.getByRole('heading', { name: /A tu medida/ })).toBeVisible()
  await page.screenshot({ path: 'e2e/screens/settings.png' })
})

test('dead keys compose accented letters through the hidden input', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => {
    localStorage.setItem(
      'typelight.v1',
      JSON.stringify({ state: { settings: { name: 'Seba', layoutId: 'latam', sound: false, showHands: true, onboarded: true }, lessons: { 'acentos-tip-acentos': { stars: 3, bestWpm: 0, bestAcc: 1, attempts: 1, completedAt: '2026-01-01T00:00:00Z' } }, keys: {}, sessions: [], streak: { count: 0, lastDay: null }, routine: { day: '2000-01-01', warmup: false, lesson: false, review: false, challenge: false } }, version: 1 }),
    )
  })
  await page.goto('/leccion/acentos-e1-e9-keys')
  await expect(page.getByRole('heading', { name: 'Teclas á y é' })).toBeVisible()
  await expect(page.getByText(/dos pasos/)).toBeVisible()
  await page.getByRole('button', { name: /Siguiente/ }).click()
  await page.getByRole('button', { name: /Siguiente/ }).click()
  await page.getByRole('button', { name: /Empezar el ejercicio/ }).click()
  await expect(page.locator('.type-char.is-current')).toBeVisible()
  // Simulate what the OS does after ´ + a: a single insertText of "á".
  await page.locator('input[aria-label="Escribí el texto"]').evaluate((el: HTMLInputElement) => {
    el.value = 'á'
    el.dispatchEvent(new InputEvent('input', { inputType: 'insertText', data: 'á', bubbles: true }))
  })
  await expect(page.locator('.type-char.is-done')).toHaveCount(1)
})

test('practice lesson (no intro) completes after both exercises with Enter and click', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => {
    const done = { stars: 3, bestWpm: 30, bestAcc: 1, attempts: 1, completedAt: '2026-01-01T00:00:00Z' }
    localStorage.setItem(
      'typelight.v1',
      JSON.stringify({ state: { settings: { name: 'Seba', layoutId: 'latam', sound: true, showHands: true, onboarded: true }, lessons: { 'guia-tip-intro': done, 'guia-66-6a-keys': done, 'guia-66-6a-review': done }, keys: {}, sessions: [], streak: { count: 0, lastDay: null }, routine: { day: '2000-01-01', warmup: false, lesson: false, review: false, challenge: false } }, version: 1 }),
    )
  })
  await page.goto('/leccion/guia-66-6a-practice')
  await expect(page.getByRole('heading', { name: 'Práctica: f y j' })).toBeVisible()
  await expect(page.locator('.type-char.is-current')).toBeVisible()
  const first = await remaining(page)
  await page.keyboard.type(first, { delay: 40 })
  await expect(page.getByRole('button', { name: /Siguiente ejercicio/ })).toBeVisible()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('button', { name: /Siguiente ejercicio/ })).toBeHidden()
  const second = await remaining(page)
  expect(second).not.toBe(first)
  await page.keyboard.type(second, { delay: 40 })
  await expect(page.getByText('Lección terminada')).toBeVisible()
  const lessons = await page.evaluate(() => Object.keys(JSON.parse(localStorage.getItem('typelight.v1')!).state.lessons))
  expect(lessons).toContain('guia-66-6a-practice')

  // Repetir: fresh texts, and the click path for the middle button.
  await page.getByRole('button', { name: 'Repetir' }).click()
  await expect(page.locator('.type-char.is-current')).toBeVisible()
  await page.keyboard.type(await remaining(page), { delay: 20 })
  await page.getByRole('button', { name: /Siguiente ejercicio/ }).click()
  await expect(page.getByRole('button', { name: /Siguiente ejercicio/ })).toBeHidden()
  await page.keyboard.type(await remaining(page), { delay: 20 })
  await expect(page.getByText('Lección terminada')).toBeVisible()
})
