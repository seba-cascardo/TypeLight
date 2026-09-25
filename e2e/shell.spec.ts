import { expect, test } from '@playwright/test'

test('opening a lazy screen directly logs no router warning', async ({ page }) => {
  const messages: string[] = []
  page.on('console', (m) => messages.push(m.text()))
  await page.goto('/bienvenida')
  await page.evaluate(() => {
    localStorage.setItem(
      'typelight.v1',
      JSON.stringify({
        state: {
          settings: { name: 'Seba', layoutId: 'latam', sound: false, showHands: true, onboarded: true, theme: 'auto', lastBackupAt: null, anchor: '', conversoSeen: true, weeklyGoal: 5, mascot: true, commitment: '', metronome: false },
          lessons: {},
          keys: {},
          sessions: [],
          streak: { count: 0, lastDay: null, best: 0, freezes: 0, activeDays: 0 },
          routine: { day: '2000-01-01', warmup: false, lesson: false, review: false, challenge: false },
          days: {},
          legacy: null,
          lastExamDay: null,
          blindSince: null,
          milestonesSeen: [],
          lastWeeklySummaryWeek: null,
          bigrams: {},
          words: {},
          commitments: {},
        },
        version: 7,
      }),
    )
  })
  for (const path of ['/estadisticas', '/ajustes', '/ruta']) {
    await page.goto(path)
    await expect(page.locator('h1').first()).toBeVisible()
  }
  expect(messages.filter((m) => m.includes('HydrateFallback'))).toEqual([])
})
