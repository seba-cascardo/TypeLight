import { expect, test, type Page } from '@playwright/test'

function localDay(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
function shift(day: string, n: number): string {
  const [y, m, d] = day.split('-').map(Number)
  return localDay(new Date(y, m - 1, d + n))
}
function monday(day: string): string {
  const [y, m, d] = day.split('-').map(Number)
  const t = new Date(y, m - 1, d)
  t.setDate(t.getDate() - ((t.getDay() + 6) % 7))
  return localDay(t)
}

function seed(page: Page, extra: Record<string, unknown> = {}, settings: Record<string, unknown> = {}) {
  const thisMonday = monday(localDay())
  return page.evaluate(
    ([extra, settings, thisMonday]) => {
      const done = { stars: 3, bestWpm: 30, bestAcc: 1, attempts: 1, completedAt: '2026-09-15T00:00:00Z' }
      const ids = ['guia-tip-intro', 'guia-66-6a-keys', 'guia-space', 'guia-64-6b-keys', 'guia-unit-review', 'guia-73-6c-keys', 'guia-67-68-keys', 'guia-61-3b-keys', 'guia-61-f1-practice']
      localStorage.setItem(
        'typelight.v1',
        JSON.stringify({
          state: {
            settings: { name: 'Seba', layoutId: 'latam', sound: false, showHands: true, onboarded: true, theme: 'auto', lastBackupAt: null, anchor: '', conversoSeen: true, weeklyGoal: 5, mascot: false, commitment: '', metronome: false, ...settings },
            lessons: Object.fromEntries(ids.map((id) => [id, done])),
            keys: {},
            sessions: [],
            streak: { count: 0, lastDay: null, best: 0, freezes: 0, activeDays: 0 },
            routine: { day: '2000-01-01', warmup: false, lesson: false, review: false, challenge: false },
            days: {},
            legacy: null,
            lastExamDay: thisMonday,
            blindSince: null,
            milestonesSeen: [],
            lastWeeklySummaryWeek: null,
            bigrams: {},
            words: {},
            commitments: {},
            ...extra,
          },
          version: 7,
        }),
      )
    },
    [extra, settings, thisMonday] as const,
  )
}

async function remaining(page: Page): Promise<string> {
  return page.evaluate(() =>
    [...document.querySelectorAll('.type-char')]
      .filter((s) => !s.classList.contains('is-done') && !s.classList.contains('type-extra'))
      .map((s) => (s.classList.contains('is-space') || s.textContent === ' ' || s.textContent === '' ? ' ' : s.textContent))
      .join(''),
  )
}

test('own text: paste, type in text mode, recorded without reference', async ({ page }) => {
  await page.goto('/')
  await seed(page)
  await page.goto('/')
  await page.getByTestId('own-text-link').click()
  await expect(page).toHaveURL(/\/texto/)
  await page.getByTestId('own-text-input').fill('Hola  “mundo”,\n\nesto es una prueba ☺ de texto propio.')
  await expect(page.getByText(/caracteres tipeables/)).toContainText('49 caracteres')
  await page.getByTestId('own-text-go').click()
  await expect(page.locator('.type-char.is-current')).toBeVisible()
  await expect(page.locator('.kb-key')).toHaveCount(0)
  const text = await remaining(page)
  expect(text).toBe('Hola "mundo", esto es una prueba de texto propio.')
  await page.keyboard.type(text)
  await expect(page.getByText('Texto propio · listo')).toBeVisible()
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('typelight.v1')!))
  const s = stored.state.sessions[0]
  expect(s.kind).toBe('review')
  expect(s.reference).toBeUndefined()
  expect(s.mode).toBe('free')
  expect(s.cleanRun).toBe(text.length)
  await page.getByRole('button', { name: 'Otro texto' }).click()
  await expect(page.getByTestId('own-text-input')).toBeVisible()
})

test('the Reto of the day keeps its text on retry; only the first round counts and is shareable', async ({ page }) => {
  await page.goto('/')
  await seed(page)
  await page.goto('/practica/reto')
  await expect(page.locator('.type-char.is-current')).toBeVisible()
  const first = await remaining(page)
  await page.keyboard.type(first)
  await expect(page.getByText('Reto de un minuto · listo')).toBeVisible()
  await page.keyboard.press('Escape')
  const share = page.getByTestId('share')
  await expect(share).toBeVisible()
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write'])
  await share.getByRole('button', { name: 'Copiar resultado' }).click()
  await expect(share).toContainText(/Copiado|No se pudo copiar/)
  await page.getByRole('button', { name: 'Otra vez' }).click()
  await expect(page.locator('.type-char.is-current')).toBeVisible()
  const again = await remaining(page)
  expect(again).toBe(first)
  // The second round types a text already seen today: practice, not reference, and nothing to share.
  await page.keyboard.type(again)
  await expect(page.getByText('Reto de un minuto · listo')).toBeVisible()
  await expect(page.getByTestId('practice-note')).toBeVisible()
  await expect(page.getByTestId('share')).toHaveCount(0)
  const stored = await page.evaluate(() => {
    const s = JSON.parse(localStorage.getItem('typelight.v1')!).state
    return { refs: s.sessions.filter((x: { kind: string }) => x.kind === 'challenge').map((x: { reference?: boolean }) => x.reference === true), days: Object.values(s.days).map((d) => (d as { reference: number[] }).reference.length) }
  })
  expect(stored.refs).toEqual([true, false])
  expect(stored.days).toEqual([1])
})

test('sudden death ends on the first error and keeps the best score', async ({ page }) => {
  await page.goto('/')
  await seed(page, { routine: { day: localDay(), warmup: true, lesson: true, review: true, challenge: true } })
  await page.goto('/')
  await expect(page.getByTestId('play-row')).toContainText('Muerte súbita')
  await page.goto('/jugar/sudden')
  await expect(page.locator('.type-char.is-current')).toBeVisible()
  const text = await remaining(page)
  await page.keyboard.type(text.slice(0, 5))
  await expect(page.getByTestId('sudden-count')).toHaveText('5')
  await page.keyboard.type(text[5] === 'f' ? 'j' : 'f')
  await expect(page.getByText('Juego terminado')).toBeVisible()
  await expect(page.getByText('Caracteres', { exact: true })).toBeVisible()
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('typelight.v1')!))
  const s = stored.state.sessions[0]
  expect(s.gameId).toBe('sudden')
  expect(s.chars).toBe(5)
  expect(s.reference).toBeUndefined()
})

test('settings: metronome shows its beat in practice lessons; commitment is asked with the weekly summary and counted', async ({ page }) => {
  const today = localDay()
  const lastMonday = shift(monday(today), -7)
  const days: Record<string, unknown> = {}
  for (let i = 0; i < 3; i++) days[shift(lastMonday, i)] = { seconds: 600, blocks: 4, learned: 8, mastered: 2, reference: [30], sessions: 1 }
  await page.goto('/')
  await seed(page, { days, sessions: [{ at: new Date(`${lastMonday}T12:00:00`).toISOString(), kind: 'challenge', wpm: 30, acc: 0.97, chars: 200, errors: 6, seconds: 60, reference: true }] }, { metronome: true, commitment: 'escribo los mails sin mirar' })
  await page.goto('/leccion/guia-61-f1-practice')
  await expect(page.getByTestId('metronome')).toContainText('metrónomo a')
  await page.goto('/')
  const ask = page.getByTestId('commitment-ask')
  await expect(ask).toContainText('escribo los mails sin mirar')
  await ask.getByRole('button', { name: 'Sí' }).click()
  await expect(page.getByTestId('weekly-summary')).toHaveCount(0)
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('typelight.v1')!))
  expect(stored.state.commitments[lastMonday]).toBe('si')
  await page.goto('/estadisticas')
  await expect(page.getByTestId('commitment-count')).toContainText('1 de 1 semana')
})

test('the race can run against the ghost of 30 days ago', async ({ page }) => {
  const today = localDay()
  const days: Record<string, unknown> = { [shift(today, -31)]: { seconds: 60, blocks: 4, learned: 8, mastered: 2, reference: [22], sessions: 1 }, [shift(today, -1)]: { seconds: 60, blocks: 4, learned: 8, mastered: 2, reference: [35], sessions: 1 } }
  await page.goto('/')
  await seed(page, {
    days,
    sessions: [{ at: new Date(`${shift(today, -1)}T12:00:00`).toISOString(), kind: 'challenge', wpm: 35, acc: 0.97, chars: 200, errors: 6, seconds: 60, reference: true }],
    routine: { day: today, warmup: true, lesson: true, review: true, challenge: true },
  })
  await page.goto('/jugar/race')
  const pick = page.getByTestId('ghost-pick')
  await expect(pick).toContainText('Hace 30 días · 22')
  await pick.getByRole('button', { name: /Hace 30 días/ }).click()
  await expect(page.getByText('vos hace 30 días')).toBeVisible()
  await expect(page.getByText('Fantasma a 22')).toBeVisible()
})
