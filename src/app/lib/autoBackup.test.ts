import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { PersistedState } from '../store'
import type { BackupDir } from './backupDir'
import { createAutoBackup, type AutoBackupDeps } from './autoBackup'
import { autoBackupName } from './backupFiles'

const NOW = new Date('2026-09-25T15:00:00')
const P = 'typelight-progreso-'
const TODAY = autoBackupName(P, '2026-09-25')

const fail = (name: string) => Object.assign(new Error(name), { name })

function memoryDir(permission: PermissionState = 'granted') {
  const files = new Map<string, { text: string; at: number }>()
  let perm = permission
  let gone = false
  let delayMs = 0
  let failing: string | null = null
  let active = 0
  let maxActive = 0
  const dir: BackupDir = {
    name: 'Copias',
    async permission(request) {
      if (request && perm === 'prompt') perm = 'granted'
      return perm
    },
    async list() {
      return [...files.keys()]
    },
    async modified(n) {
      return files.get(n)!.at
    },
    async read(n) {
      return files.get(n)!.text
    },
    async write(n, text) {
      active++
      maxActive = Math.max(maxActive, active)
      try {
        if (delayMs) await new Promise((r) => setTimeout(r, delayMs))
        if (failing) {
          const e = fail(failing)
          failing = null
          throw e
        }
        if (gone) throw fail('NotFoundError')
        if (perm !== 'granted') throw fail('NotAllowedError')
        files.set(n, { text, at: NOW.getTime() })
      } finally {
        active--
      }
    },
    async remove(n) {
      files.delete(n)
    },
  }
  return {
    dir,
    files,
    vanish: () => (gone = true),
    /** Every write takes this long (fake time). */
    slow: (ms: number) => (delayMs = ms),
    /** The next write throws an error with this name. */
    failNext: (name: string) => (failing = name),
    /** The most writes that were running at the same time. */
    maxActive: () => maxActive,
  }
}

function setup(opts: { supported?: boolean; saved?: BackupDir | null; pick?: BackupDir } = {}) {
  let onChange = () => {}
  let blocked = false
  let state = { lessons: { a: 1 } } as unknown as PersistedState
  const deps: AutoBackupDeps = {
    supported: opts.supported ?? true,
    pick: vi.fn(async () => {
      if (!opts.pick) throw fail('AbortError')
      return opts.pick
    }),
    loadSaved: async () => opts.saved ?? null,
    forget: vi.fn(async () => {}),
    getState: () => state,
    subscribe: vi.fn((cb: () => void) => {
      onChange = cb
      return () => {}
    }),
    isBlocked: () => blocked,
    now: () => NOW,
    prefix: P,
    delayMs: 3000,
  }
  const ab = createAutoBackup(deps)
  return {
    ab,
    deps,
    change: (lessons: Record<string, number>) => {
      state = { lessons } as unknown as PersistedState
      onChange()
    },
    block: () => (blocked = true),
  }
}

const saved = (text: string) => JSON.parse(text).state

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

describe('automatic backup', () => {
  it('a browser without the API stays unsupported', async () => {
    const { ab, deps } = setup({ supported: false })
    await ab.init()
    expect(ab.getStatus()).toEqual({ state: 'unsupported' })
    expect(deps.subscribe).not.toHaveBeenCalled()
  })

  it('without a saved folder it is off; choosing one writes the copy of the day at once', async () => {
    const m = memoryDir()
    const { ab } = setup({ pick: m.dir })
    await ab.init()
    expect(ab.getStatus()).toEqual({ state: 'off' })
    await ab.choose()
    expect(ab.getStatus()).toEqual({ state: 'on', folder: 'Copias', lastAt: NOW.getTime() })
    expect(saved(m.files.get(TODAY)!.text)).toEqual({ lessons: { a: 1 } })
  })

  it('a cancelled picker leaves everything as it was', async () => {
    const { ab } = setup()
    await ab.init()
    await ab.choose()
    expect(ab.getStatus()).toEqual({ state: 'off' })
  })

  it('changes are written 3 s after the last one, once', async () => {
    const m = memoryDir()
    const { ab, change } = setup({ saved: m.dir })
    await ab.init()
    change({ b: 1 })
    await vi.advanceTimersByTimeAsync(2000)
    change({ c: 1 })
    await vi.advanceTimersByTimeAsync(2999)
    expect(m.files.has(TODAY)).toBe(false)
    await vi.advanceTimersByTimeAsync(1)
    expect(saved(m.files.get(TODAY)!.text)).toEqual({ lessons: { c: 1 } })
  })

  it('a saved folder without permission is paused and writes nothing; reconnecting writes what was pending', async () => {
    const m = memoryDir('prompt')
    const { ab, change } = setup({ saved: m.dir })
    await ab.init()
    expect(ab.getStatus()).toEqual({ state: 'paused', folder: 'Copias', why: 'permission' })
    change({ d: 1 })
    await vi.advanceTimersByTimeAsync(3000)
    expect(m.files.size).toBe(0)
    await ab.reconnect()
    expect(ab.getStatus().state).toBe('on')
    expect(saved(m.files.get(TODAY)!.text)).toEqual({ lessons: { d: 1 } })
  })

  it('while the saved progress failed to load, nothing reaches the folder', async () => {
    const m = memoryDir()
    const { ab, change, block } = setup({ saved: m.dir })
    await ab.init()
    block()
    change({ e: 1 })
    await vi.advanceTimersByTimeAsync(3000)
    expect(await ab.snapshot('antes-de-importar')).toBe(false)
    expect(m.files.size).toBe(0)
  })

  it('a snapshot before a reset gets its own file and leaves the copy of the day alone', async () => {
    const m = memoryDir()
    const { ab } = setup({ saved: m.dir })
    await ab.init()
    m.files.set(TODAY, { text: '{"state":"del día"}', at: 0 })
    expect(await ab.snapshot('antes-de-reiniciar')).toBe(true)
    expect(m.files.has(autoBackupName(P, '2026-09-25', 'antes-de-reiniciar'))).toBe(true)
    expect(m.files.get(TODAY)!.text).toBe('{"state":"del día"}')
  })

  it('each write rotates: 30 days with a copy stay, and other files are never touched', async () => {
    const m = memoryDir()
    for (let i = 1; i <= 30; i++) m.files.set(autoBackupName(P, `2026-08-${String(i).padStart(2, '0')}`), { text: '{}', at: 0 })
    m.files.set('notas.txt', { text: 'mías', at: 0 })
    const { ab, change } = setup({ saved: m.dir })
    await ab.init()
    change({ f: 1 })
    await vi.advanceTimersByTimeAsync(3000)
    expect(m.files.has(autoBackupName(P, '2026-08-01'))).toBe(false)
    expect(m.files.has(autoBackupName(P, '2026-08-02'))).toBe(true)
    expect(m.files.has('notas.txt')).toBe(true)
    expect(m.files.has(TODAY)).toBe(true)
  })

  it('a rotation that fails to remove an old file does not pause the copy', async () => {
    const m = memoryDir()
    for (let i = 1; i <= 30; i++) m.files.set(autoBackupName(P, `2026-08-${String(i).padStart(2, '0')}`), { text: '{}', at: 0 })
    m.dir.remove = async () => {
      throw fail('NoModificationAllowedError')
    }
    const { ab, change } = setup({ saved: m.dir })
    await ab.init()
    change({ h: 1 })
    await vi.advanceTimersByTimeAsync(3000)
    expect(ab.getStatus()).toEqual({ state: 'on', folder: 'Copias', lastAt: NOW.getTime() })
    expect(m.files.has(TODAY)).toBe(true)
    expect(m.files.has(autoBackupName(P, '2026-08-01'))).toBe(true)
    await expect(ab.snapshot('antes-de-reiniciar')).resolves.toBe(true)
  })

  it('a folder that vanished pauses as missing', async () => {
    const m = memoryDir()
    const { ab, change } = setup({ saved: m.dir })
    await ab.init()
    m.vanish()
    change({ g: 1 })
    await vi.advanceTimersByTimeAsync(3000)
    expect(ab.getStatus()).toEqual({ state: 'paused', folder: 'Copias', why: 'missing' })
  })

  it('writes never overlap: a snapshot waits for the write in flight, and both land', async () => {
    const m = memoryDir()
    m.slow(100)
    const { ab, change } = setup({ saved: m.dir })
    await ab.init()
    change({ i: 1 })
    await vi.advanceTimersByTimeAsync(3000) // the debounced write starts and is still running
    const snap = ab.snapshot('antes-de-reiniciar')
    const flush = ab.flush()
    await vi.advanceTimersByTimeAsync(1000)
    await expect(snap).resolves.toBe(true)
    await flush
    expect(m.maxActive()).toBe(1)
    expect(saved(m.files.get(TODAY)!.text)).toEqual({ lessons: { i: 1 } })
    expect(saved(m.files.get(autoBackupName(P, '2026-09-25', 'antes-de-reiniciar'))!.text)).toEqual({ lessons: { i: 1 } })
  })

  it('a queued write reads the state when it runs, not when it was asked for', async () => {
    const m = memoryDir()
    m.slow(100)
    const { ab, change } = setup({ saved: m.dir })
    await ab.init()
    change({ j: 1 })
    await vi.advanceTimersByTimeAsync(3000)
    const snap = ab.snapshot('antes-de-importar')
    change({ k: 1 })
    await vi.advanceTimersByTimeAsync(1000)
    await snap
    expect(saved(m.files.get(autoBackupName(P, '2026-09-25', 'antes-de-importar'))!.text)).toEqual({ lessons: { k: 1 } })
  })

  it('a write that fails for any other reason (a full disk, a locked file) stays on and retries on the next change', async () => {
    const m = memoryDir()
    const { ab, change } = setup({ saved: m.dir })
    await ab.init()
    m.failNext('QuotaExceededError')
    change({ l: 1 })
    await vi.advanceTimersByTimeAsync(3000)
    expect(ab.getStatus()).toEqual({ state: 'on', folder: 'Copias', lastAt: null })
    expect(m.files.has(TODAY)).toBe(false)
    change({ m: 1 })
    await vi.advanceTimersByTimeAsync(3000)
    expect(ab.getStatus()).toEqual({ state: 'on', folder: 'Copias', lastAt: NOW.getTime() })
    expect(saved(m.files.get(TODAY)!.text)).toEqual({ lessons: { m: 1 } })
  })

  it.each(['NotAllowedError', 'SecurityError'])('a write refused with %s pauses asking for permission', async (name) => {
    const m = memoryDir()
    const { ab, change } = setup({ saved: m.dir })
    await ab.init()
    m.failNext(name)
    change({ n: 1 })
    await vi.advanceTimersByTimeAsync(3000)
    expect(ab.getStatus()).toEqual({ state: 'paused', folder: 'Copias', why: 'permission' })
  })

  it('a saved folder the browser denies is paused as denied, and reconnecting does not turn it on', async () => {
    const m = memoryDir('denied')
    const { ab } = setup({ saved: m.dir })
    await ab.init()
    expect(ab.getStatus()).toEqual({ state: 'paused', folder: 'Copias', why: 'denied' })
    await ab.reconnect()
    expect(ab.getStatus()).toEqual({ state: 'paused', folder: 'Copias', why: 'denied' })
    expect(m.files.size).toBe(0)
  })

  it('a newest copy that vanishes while connecting just leaves the last time unknown', async () => {
    const m = memoryDir()
    m.files.set(TODAY, { text: '{}', at: 0 })
    m.dir.modified = async () => {
      throw fail('NotFoundError')
    }
    const { ab } = setup({ saved: m.dir })
    await ab.init()
    expect(ab.getStatus()).toEqual({ state: 'on', folder: 'Copias', lastAt: null })
  })

  it('stop during a write in flight ends off, not paused for the forgotten folder', async () => {
    const m = memoryDir()
    m.slow(100)
    const { ab, change } = setup({ saved: m.dir })
    await ab.init()
    change({ o: 1 })
    await vi.advanceTimersByTimeAsync(3000)
    m.vanish()
    await ab.stop()
    await vi.advanceTimersByTimeAsync(1000)
    expect(ab.getStatus()).toEqual({ state: 'off' })
  })

  it('a change after stop writes nothing', async () => {
    const m = memoryDir()
    const { ab, change } = setup({ saved: m.dir })
    await ab.init()
    await ab.stop()
    change({ p: 1 })
    await vi.advanceTimersByTimeAsync(3000)
    await ab.flush()
    expect(m.files.size).toBe(0)
    expect(ab.getStatus()).toEqual({ state: 'off' })
  })

  it('stop forgets the folder', async () => {
    const m = memoryDir()
    const { ab, deps } = setup({ saved: m.dir })
    await ab.init()
    await ab.stop()
    expect(ab.getStatus()).toEqual({ state: 'off' })
    expect(deps.forget).toHaveBeenCalled()
  })

  it('lists and reads the copies of the folder, newest first', async () => {
    const m = memoryDir()
    m.files.set(autoBackupName(P, '2026-09-20'), { text: 'viejo', at: 0 })
    m.files.set(TODAY, { text: 'nuevo', at: 0 })
    const { ab } = setup({ saved: m.dir })
    await ab.init()
    expect((await ab.list()).map((f) => f.day)).toEqual(['2026-09-25', '2026-09-20'])
    expect(await ab.read(TODAY)).toBe('nuevo')
  })
})
