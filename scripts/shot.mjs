import { chromium } from '@playwright/test'
const [url, out, w = '1280', h = '900', scheme = 'light', full = '0', selector = ''] = process.argv.slice(2)
const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: +w, height: +h }, colorScheme: scheme, reducedMotion: 'reduce' })
const page = await ctx.newPage()
await page.goto('http://localhost:5173/')
await page.evaluate(() => {
  const done = { stars: 3, bestWpm: 30, bestAcc: 1, attempts: 1, completedAt: '2026-09-15T00:00:00Z' }
  localStorage.setItem('typelight.v1', JSON.stringify({ state: { settings: { name: 'Seba', layoutId: 'latam', sound: false, showHands: true, onboarded: true, theme: 'auto' }, lessons: { 'guia-tip-intro': done, 'guia-66-6a-keys': done, 'guia-space': done, 'guia-66-6a-review': done, 'guia-66-6a-practice': done }, keys: {}, sessions: [{ at: new Date().toISOString(), kind: 'lesson', wpm: 32, acc: 0.98, chars: 60, errors: 1, seconds: 20 }], streak: { count: 2, lastDay: new Date().toISOString().slice(0, 10) }, routine: { day: '2000-01-01', warmup: false, lesson: false, review: false, challenge: false } }, version: 1 }))
})
await page.goto(url)
await page.waitForTimeout(1200)
if (selector) await page.locator(selector).first().screenshot({ path: out, scale: 'device' })
else await page.screenshot({ path: out, fullPage: full === '1' })
await browser.close()
