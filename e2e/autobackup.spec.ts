import { expect, test, type Page } from '@playwright/test'

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

// DEVIATION from the brief (see task-6-report.md): the brief's fakePicker used a real OPFS
// FileSystemDirectoryHandle (`navigator.storage.getDirectory()`). In this environment, Chromium's
// headless shell can't be trusted with concurrent main-thread OPFS `createWritable` calls (two
// autoBackup writes landing close together — e.g. "choose a folder" immediately followed by
// "Reiniciar…" — race and throw a spurious NotFoundError on the directory itself), and reading back
// a directory handle that was stored in IndexedDB across a `page.reload()` reliably crashes the
// browser process. Per the brief's allowed fallback, the picker returns an in-memory fake instead:
// a class instance whose data (a Map of file name → contents) lives in an own property, with every
// method on the prototype. That split matters because the app's own `pick()` calls `idbSet` on
// whatever `showDirectoryPicker` returns — a real IndexedDB write. structuredClone only serializes
// own enumerable properties, so keeping methods off the instance lets that write succeed (the clone
// itself is inert and unused) instead of throwing DataCloneError on the function properties.
// The trade-off: this fake is per-document (reset on every full navigation), so it cannot back the
// "the folder is remembered" assertion from the brief's first test — that step is dropped below.
async function fakePicker(page: Page) {
  await page.addInitScript(() => {
    class FakeDir {
      name = 'copias'
      kind = 'directory' as const
      store = new Map<string, { text: string; modified: number }>()
    }
    Object.assign(FakeDir.prototype, {
      async getFileHandle(this: FakeDir, name: string, opts?: { create?: boolean }) {
        if (!this.store.has(name)) {
          if (!opts?.create) throw new DOMException('Not found', 'NotFoundError')
          this.store.set(name, { text: '', modified: Date.now() })
        }
        const store = this.store
        return {
          kind: 'file' as const,
          async getFile() {
            const f = store.get(name)!
            return { text: async () => f.text, lastModified: f.modified }
          },
          async createWritable() {
            let buf = ''
            return {
              async write(text: string) {
                buf += text
              },
              async close() {
                store.set(name, { text: buf, modified: Date.now() })
              },
            }
          },
        }
      },
      async removeEntry(this: FakeDir, name: string) {
        this.store.delete(name)
      },
      async *entries(this: FakeDir) {
        for (const name of this.store.keys()) yield [name, { kind: 'file' as const }]
      },
    })

    const dir = new FakeDir()
    ;(window as unknown as { __fakeBackupFiles: Map<string, { text: string; modified: number }> }).__fakeBackupFiles = dir.store
    ;(window as unknown as { showDirectoryPicker: () => Promise<FileSystemDirectoryHandle> }).showDirectoryPicker = async () =>
      dir as unknown as FileSystemDirectoryHandle
  })
}

async function readFolder(page: Page): Promise<Record<string, string>> {
  return page.evaluate(() => {
    const store = (window as unknown as { __fakeBackupFiles: Map<string, { text: string; modified: number }> }).__fakeBackupFiles
    const out: Record<string, string> = {}
    for (const [name, f] of store) out[name] = f.text
    return out
  })
}

async function today(page: Page): Promise<string> {
  return page.evaluate(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  })
}

async function seeded(page: Page) {
  await page.goto('/')
  await page.evaluate((s) => localStorage.setItem('typelight.v1', JSON.stringify(s)), seed)
  await page.goto('/ajustes')
}

test('automatic backup: choose a folder, and the copy of the day follows every change', async ({ page }) => {
  await fakePicker(page)
  await seeded(page)
  const card = page.getByTestId('backup-card')
  await page.getByRole('button', { name: 'Elegir carpeta' }).click()
  await expect(card).toContainText('Se guarda sola en «copias»')

  const file = `typelight-dev-progreso-${await today(page)}.json`
  await expect.poll(async () => Object.keys(await readFolder(page))).toContain(file)
  expect(JSON.parse((await readFolder(page))[file]).state.lessons['guia-tip-intro'].stars).toBe(3)

  await page.getByRole('button', { name: 'Noche' }).click()
  await expect.poll(async () => JSON.parse((await readFolder(page))[file]).state.settings.theme, { timeout: 10_000 }).toBe('dark')

  // DEVIATION: the brief's third step reloaded the page and expected "Se guarda sola en «copias»"
  // to still show, proving the folder is remembered (via the real idbSet/idbGet round trip). The
  // in-memory fake picker above (see fakePicker's comment) is scoped to the current document and
  // is gone after a real navigation, so it cannot back that assertion — dropped here.
})

test('automatic backup: a reset keeps the state before it, and Restaurar brings it back', async ({ page }) => {
  await fakePicker(page)
  await seeded(page)
  await page.getByRole('button', { name: 'Elegir carpeta' }).click()
  await expect(page.getByTestId('backup-card')).toContainText('Se guarda sola en «copias»')

  await page.getByRole('button', { name: 'Reiniciar…' }).click()
  await page.getByRole('button', { name: 'Sí, borrar todo' }).click()
  const snap = `typelight-dev-progreso-${await today(page)}-antes-de-reiniciar.json`
  await expect.poll(async () => Object.keys(await readFolder(page))).toContain(snap)
  expect(JSON.parse((await readFolder(page))[snap]).state.lessons['guia-tip-intro'].stars).toBe(3)
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('typelight.v1')!).state.lessons)).toEqual({})

  await page.getByRole('button', { name: 'Restaurar…' }).click()
  await page.getByTestId('backup-list').getByRole('button', { name: /antes de reiniciar/ }).click()
  await page.getByRole('button', { name: 'Sí, reemplazar' }).click()
  await expect(page.getByText(/Progreso restaurado/)).toBeVisible()
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('typelight.v1')!))
  expect(stored.state.lessons['guia-tip-intro'].stars).toBe(3)
})

test('a browser without the folder API keeps the manual copy and says why', async ({ page }) => {
  await page.addInitScript(() => {
    delete (window as unknown as Record<string, unknown>).showDirectoryPicker
    delete (Window.prototype as unknown as Record<string, unknown>).showDirectoryPicker
  })
  await seeded(page)
  await expect(page.getByTestId('backup-card')).toContainText('Este navegador no puede guardar solo en una carpeta')
  await expect(page.getByRole('button', { name: 'Elegir carpeta' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Descargar copia' })).toBeVisible()
})

test('an empty browser can restore a copy right from Bienvenida', async ({ page }) => {
  await seeded(page)
  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Descargar copia' }).click()
  const path = await (await downloadPromise).path()

  await page.evaluate(() => localStorage.clear())
  await page.goto('/bienvenida')
  await page.getByTestId('welcome-backup-file').setInputFiles(path!)
  await page.getByRole('button', { name: 'Sí, reemplazar' }).click()
  await expect(page).not.toHaveURL(/bienvenida/)
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('typelight.v1')!))
  expect(stored.state.lessons['guia-tip-intro'].stars).toBe(3)
})

test('a saved progress that cannot be read is never overwritten', async ({ page }) => {
  await page.goto('/bienvenida')
  await page.evaluate(() => localStorage.setItem('typelight.v1', '{nope'))
  await page.goto('/')
  await expect(page.getByTestId('load-failed')).toBeVisible()
  expect(await page.evaluate(() => localStorage.getItem('typelight.v1'))).toBe('{nope')
  expect(await page.evaluate(() => localStorage.getItem('typelight.v1.rescate'))).toBe('{nope')
  await page.getByRole('button', { name: 'Empezar de cero' }).click()
  await expect(page.getByTestId('load-failed')).toBeHidden()
})
