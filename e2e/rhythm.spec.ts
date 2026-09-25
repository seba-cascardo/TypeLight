import { expect, test } from '@playwright/test'

test('rhythm game: hit the notes on the beat, finish, get stars and a game session', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => {
    const done = { stars: 3, bestWpm: 30, bestAcc: 1, attempts: 1, completedAt: '2026-01-01T00:00:00Z' }
    localStorage.setItem(
      'typelight.v1',
      JSON.stringify({
        state: {
          settings: { name: 'Seba', layoutId: 'latam', sound: false, showHands: true, onboarded: true, theme: 'auto' },
          lessons: { 'guia-unit-review': done },
          keys: {},
          sessions: [],
          days: {},
          streak: { count: 0, lastDay: null },
          routine: { day: '2000-01-01', warmup: false, lesson: false, review: false, challenge: false },
        },
        version: 2,
      }),
    )
  })
  await page.goto('/leccion/guia-juego-fila-guia?dur=6000')
  await expect(page.getByRole('heading', { name: 'Al compás', exact: true })).toBeVisible()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('heading', { name: 'Al compás', exact: true })).toBeHidden()

  // Play: press the current note's key when it is about to enter the zone.
  const deadline = Date.now() + 8000
  let shot = false
  while (Date.now() < deadline) {
    const cur = await page.evaluate(() => {
      const el = document.querySelector<HTMLElement>('[data-current="1"]')
      return el ? { ch: el.dataset.ch!, offset: Number(el.dataset.offset) } : null
    })
    if (cur && cur.offset <= 60) {
      await page.keyboard.type(cur.ch)
      if (!shot) {
        shot = true
        await page.screenshot({ path: 'e2e/screens/rhythm-play.png' })
      }
    }
    await page.waitForTimeout(40)
    if (await page.getByText('Juego terminado').isVisible()) break
  }
  await expect(page.getByText('Juego terminado')).toBeVisible()
  await expect(page.getByText('A tiempo', { exact: true })).toBeVisible()
  const state = await page.evaluate(() => JSON.parse(localStorage.getItem('typelight.v1')!).state)
  expect(state.lessons['guia-juego-fila-guia'].stars).toBeGreaterThanOrEqual(1)
  const last = state.sessions[state.sessions.length - 1]
  expect(last).toMatchObject({ kind: 'game', gameId: 'rhythm' })
  expect(typeof last.rhythm).toBe('number')
  await page.screenshot({ path: 'e2e/screens/rhythm-results.png' })
})

test('Al compás with words in Velocidad: the notes spell real words with a space between them', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => {
    const done = { stars: 3, bestWpm: 30, bestAcc: 1, attempts: 1, completedAt: '2026-01-01T00:00:00Z' }
    localStorage.setItem(
      'typelight.v1',
      JSON.stringify({
        state: {
          settings: { name: 'Seba', layoutId: 'latam', sound: false, showHands: true, onboarded: true, theme: 'auto' },
          lessons: { 'velocidad-trigramas': done },
          keys: {},
          sessions: [],
          days: {},
          streak: { count: 0, lastDay: null },
          routine: { day: '2000-01-01', warmup: false, lesson: false, review: false, challenge: false },
        },
        version: 2,
      }),
    )
  })
  await page.goto('/leccion/velocidad-juego-compas-palabras?dur=6000')
  await expect(page.getByText('Llegan palabras, letra por letra', { exact: false })).toBeVisible()
  await page.keyboard.press('Enter')
  // Walk the notes as they come: letters of a word, then the space.
  const played: string[] = []
  const deadline = Date.now() + 5000
  while (played.length < 16 && Date.now() < deadline) {
    const ch = await page.evaluate(() => document.querySelector<HTMLElement>('[data-current="1"]')?.dataset.ch ?? null)
    if (ch !== null) {
      played.push(ch)
      await page.keyboard.press(ch === ' ' ? 'Space' : ch)
    }
    await page.waitForTimeout(20)
  }
  const text = played.join('')
  expect(text).toContain(' ')
  for (const w of text.trim().split(' ').slice(0, -1)) expect(w.length).toBeGreaterThanOrEqual(3)
})
