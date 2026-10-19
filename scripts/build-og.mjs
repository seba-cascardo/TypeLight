// Renders the link preview image (public/og-image.png, 1200x630) and the iOS home-screen icon
// (public/apple-touch-icon.png, 180x180) with the app's fonts and colours. Needs network for Google Fonts.
//   node scripts/build-og.mjs
import { chromium } from '@playwright/test'

const FONTS = 'https://fonts.googleapis.com/css2?family=Gabarito:wght@800&family=Lexend:wght@500;700&display=block'
const KEYS = [
  ['A', '#f6a5b0'], ['S', '#f8d66b'], ['D', '#9eddb1'], ['F', '#9ccbf5'],
  ['J', '#9ccbf5'], ['K', '#9eddb1'], ['L', '#f8d66b'], ['Ñ', '#f6a5b0'],
]

const og = `<!doctype html><html><head><link rel="stylesheet" href="${FONTS}"><style>
  body { margin: 0; width: 1200px; height: 630px; background: #f1ecdf; font-family: Lexend; color: #1e2124;
    display: flex; flex-direction: column; justify-content: center; padding: 0 96px; box-sizing: border-box; }
  .brand { display: flex; align-items: center; gap: 22px; }
  .logo { width: 96px; height: 96px; border-radius: 22px; background: #3fae5a; box-shadow: inset 0 -10px 0 #2e8a45;
    display: grid; place-items: center; color: #fffdf7; font: 800 60px Gabarito; padding-bottom: 8px; box-sizing: border-box; }
  h1 { font: 800 92px Gabarito; margin: 0; letter-spacing: -0.02em; }
  p { font-size: 38px; font-weight: 500; margin: 26px 0 46px; color: #4a4f55; max-width: 980px; line-height: 1.3; }
  .row { display: flex; gap: 14px; }
  .key { width: 104px; height: 100px; border-radius: 16px; display: grid; place-items: center; font: 700 40px Lexend;
    box-shadow: inset 0 -8px 0 rgba(0,0,0,.12); }
  .gap { width: 44px; }
</style></head><body>
  <div class="brand"><div class="logo">T</div><h1>TypeLight</h1></div>
  <p>Mecanografía con diez dedos, en español. Diez minutos por día, gratis y sin cuenta.</p>
  <div class="row">${KEYS.map(([k, c], i) => `${i === 4 ? '<div class="gap"></div>' : ''}<div class="key" style="background:${c}">${k}</div>`).join('')}</div>
</body></html>`

const icon = `<!doctype html><html><head><link rel="stylesheet" href="${FONTS}"><style>
  body { margin: 0; width: 180px; height: 180px; background: #3fae5a; display: grid; place-items: center;
    color: #fffdf7; font: 800 112px Gabarito; box-shadow: inset 0 -16px 0 #2e8a45; padding-bottom: 14px; box-sizing: border-box; }
</style></head><body>T</body></html>`

const browser = await chromium.launch()
for (const [html, w, h, out] of [[og, 1200, 630, 'public/og-image.png'], [icon, 180, 180, 'public/apple-touch-icon.png']]) {
  const page = await browser.newPage({ viewport: { width: w, height: h } })
  await page.setContent(html, { waitUntil: 'networkidle' })
  await page.evaluate(() => document.fonts.ready)
  await page.screenshot({ path: out })
  await page.close()
}
await browser.close()
console.log('wrote public/og-image.png and public/apple-touch-icon.png')
