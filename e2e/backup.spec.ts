import { expect, test } from '@playwright/test'
import { readFileSync } from 'node:fs'

const seed = {
  state: {
    settings: { name: 'Seba', layoutId: 'latam', sound: false, showHands: true, onboarded: true, theme: 'auto', lastBackupAt: null },
    lessons: { 'guia-tip-intro': { stars: 3, bestWpm: 0, bestAcc: 1, attempts: 1, completedAt: '2026-09-15T12:00:00.000Z' } },
    keys: {},
    sessions: [],
    streak: { count: 0, lastDay: null },
    routine: { day: '2000-01-01', warmup: false, lesson: false, review: false, challenge: false },
    days: {},
    legacy: null,
  },
  version: 3,
}

test('backup: download → reset → import restores the progress', async ({ page }) => {
  await page.goto('/')
  await page.evaluate((s) => localStorage.setItem('typelight.v1', JSON.stringify(s)), seed)
  await page.goto('/ajustes')

  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Descargar copia' }).click()
  const download = await downloadPromise
  const path = await download.path()
  expect(path).toBeTruthy()
  const backup = JSON.parse(readFileSync(path!, 'utf8'))
  expect(backup.app).toBe('typelight')
  expect(backup.state.lessons['guia-tip-intro'].stars).toBe(3)
  await expect(page.getByText('Copia descargada.')).toBeVisible()

  await page.getByRole('button', { name: 'Reiniciar…' }).click()
  await page.getByRole('button', { name: 'Sí, borrar todo' }).click()
  let stored = await page.evaluate(() => JSON.parse(localStorage.getItem('typelight.v1')!))
  expect(stored.state.lessons).toEqual({})

  await page.getByTestId('backup-file').setInputFiles(path!)
  await page.getByRole('button', { name: 'Sí, reemplazar' }).click()
  await expect(page.getByText(/Progreso restaurado/)).toBeVisible()
  stored = await page.evaluate(() => JSON.parse(localStorage.getItem('typelight.v1')!))
  expect(stored.state.lessons['guia-tip-intro'].stars).toBe(3)
})
