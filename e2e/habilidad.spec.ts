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

/** v6 state with the home row learned and rich model tables. */
function seed(page: Page, extra: Record<string, unknown> = {}) {
  const thisMonday = monday(localDay())
  return page.evaluate(
    ([extra, thisMonday]) => {
      const done = { stars: 3, bestWpm: 30, bestAcc: 1, attempts: 1, completedAt: '2026-09-15T00:00:00Z' }
      localStorage.setItem(
        'typelight.v1',
        JSON.stringify({
          state: {
            settings: { name: 'Seba', layoutId: 'latam', sound: false, showHands: true, onboarded: true, theme: 'auto', lastBackupAt: null, anchor: '', conversoSeen: true, weeklyGoal: 5, mascot: false },
            lessons: { 'guia-tip-intro': done, 'guia-66-6a-keys': done, 'guia-space': done, 'guia-64-6b-keys': done, 'guia-unit-review': done },
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
            ...extra,
          },
          version: 6,
        }),
      )
    },
    [extra, thisMonday] as const,
  )
}

const stat = (latencyEma: number, errorEma: number, samples: number, lastSeen?: string) => ({ latencyEma, errorEma, samples, halfLife: 3, daysSeen: 3, lastSeen })

test('Progreso shows transitions by class, weak words, weakness qualities and the forecast; the Repaso names what weighs today', async ({ page }) => {
  const today = localDay()
  const days: Record<string, unknown> = {}
  for (let i = 9; i >= 0; i--) days[shift(today, -i)] = { seconds: 120, blocks: 4, learned: 10, mastered: 3, reference: [20 + (9 - i)], sessions: 1 }
  await page.goto('/')
  await seed(page, {
    days,
    sessions: [{ at: new Date().toISOString(), kind: 'challenge', wpm: 29, acc: 0.97, chars: 150, errors: 4, seconds: 60, reference: true }],
    keys: {
      f: stat(300, 0, 20, today), j: stat(500, 0, 20, today), d: stat(300, 0, 20, today), k: stat(520, 0, 20, today),
      s: stat(320, 0, 20, today), l: stat(540, 0, 20, today), a: stat(310, 0, 20, today), ñ: stat(560, 0, 20, today),
      g: stat(300, 0, 20, today), h: stat(500, 0, 20, today), ' ': stat(300, 0, 20, today),
    },
    bigrams: {
      fj: { latencyEma: 200, errorEma: 0, samples: 20 },
      fd: { latencyEma: 320, errorEma: 0, samples: 20 },
      fg: { latencyEma: 600, errorEma: 0.1, samples: 20 },
      ff: { latencyEma: 240, errorEma: 0, samples: 20 },
    },
    words: {
      salsa: { latencyEma: 500, errorEma: 0.8, samples: 4, lastSeen: today },
      falda: { latencyEma: 300, errorEma: 0.2, samples: 3, lastSeen: today },
    },
  })
  await page.goto('/estadisticas')
  const transitions = page.getByTestId('transitions')
  await expect(transitions).toContainText('alternancia de manos')
  await expect(transitions).toContainText('mismo dedo')
  await expect(transitions).toContainText('fg')
  await expect(page.getByTestId('qualities')).toContainText('mano derecha')
  await expect(page.getByTestId('qualities')).toContainText('mismo dedo')
  const weakWords = page.getByTestId('weak-words')
  await expect(weakWords).toContainText('salsa')
  await expect(weakWords.getByRole('link', { name: /Practicar estas/ })).toHaveAttribute('href', /practica\/palabras\?w=salsa/)
  await expect(page.getByTestId('forecast')).toContainText('la meta de la unidad')
  await page.goto('/practica/repaso')
  await expect(page.getByTestId('qualities')).toContainText('Hoy pesa: mano derecha y mismo dedo.')
})

test('after a Reto with an error, the words that resisted can be practised on their own', async ({ page }) => {
  await page.goto('/')
  await seed(page)
  await page.goto('/practica/reto')
  await expect(page.locator('.type-char.is-current')).toBeVisible()
  const text = await page.evaluate(() =>
    [...document.querySelectorAll('.type-char')]
      .filter((s) => !s.classList.contains('is-done') && !s.classList.contains('type-extra'))
      .map((s) => (s.classList.contains('is-space') || s.textContent === ' ' || s.textContent === '' ? ' ' : s.textContent))
      .join(''),
  )
  // a wrong key inside the first word, repaired, then the rest as it comes
  const firstWord = text.split(' ')[0]
  expect(firstWord.length).toBeGreaterThanOrEqual(3)
  await page.keyboard.type(firstWord[0])
  await page.keyboard.type(firstWord[1] === 'f' ? 'j' : 'f')
  await page.keyboard.press('Backspace')
  await page.keyboard.type(text.slice(1))
  await expect(page.getByText('Reto de un minuto · listo')).toBeVisible()
  const resisted = page.getByTestId('resisted')
  await expect(resisted).toContainText(firstWord)
  await resisted.getByRole('link', { name: /Practicar estas/ }).click()
  await expect(page).toHaveURL(/practica\/palabras\?w=/)
  await expect(page.getByRole('heading', { name: 'Palabras que se resistieron' })).toBeVisible()
  await expect(page.locator('.type-char.is-current')).toBeVisible()
  const drill = await page.evaluate(() => [...document.querySelectorAll('.type-char')].map((s) => (s.classList.contains('is-space') ? ' ' : s.textContent)).join(''))
  expect(drill.split(' ').filter((w) => w === firstWord).length).toBe(3)
  await page.keyboard.type(drill)
  await expect(page.getByText('Palabras que se resistieron · listo')).toBeVisible()
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('typelight.v1')!))
  const last = stored.state.sessions[stored.state.sessions.length - 1]
  expect(last.kind).toBe('review')
  expect(last.reference).toBeUndefined()
  expect(stored.state.routine.review).toBe(false)
  expect(Object.keys(stored.state.words).length).toBeGreaterThan(0)
  expect(Object.keys(stored.state.bigrams).length).toBeGreaterThan(0)
  await page.goto('/')
  await expect(page.getByRole('link', { name: /Palabras que se resistieron/ })).toHaveCount(0)
})
