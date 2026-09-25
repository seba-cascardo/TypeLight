import { useSyncExternalStore } from 'react'
import { dayKey } from '@/engine/stats'
import { PERSISTED_KEYS, persistedState, useStore, type PersistedState } from '../store'
import { isWriteBlocked } from '../store/storage'
import { serializeBackup } from './backup'
import { fsBackupDir, type BackupDir } from './backupDir'
import { autoBackupName, backupPrefix, filesToDelete, listBackups, type BackupFileInfo, type SnapshotReason } from './backupFiles'
import { idbDel, idbGet, idbSet } from './idb'

export type AutoBackupStatus =
  | { state: 'unsupported' }
  | { state: 'loading' }
  | { state: 'off' }
  | { state: 'on'; folder: string; lastAt: number | null }
  | { state: 'paused'; folder: string; why: PauseReason }

/** `permission`: Reconnect can ask again. `denied` and `missing`: only another folder helps. */
export type PauseReason = 'permission' | 'denied' | 'missing'

export interface AutoBackupDeps {
  supported: boolean
  /** Opens the folder picker and remembers the choice. Runs straight from a click. */
  pick(): Promise<BackupDir>
  loadSaved(): Promise<BackupDir | null>
  forget(): Promise<void>
  getState(): PersistedState
  /** Calls back when the persisted data changes. */
  subscribe(onChange: () => void): () => void
  /** The saved progress failed to load: nothing may be written anywhere. */
  isBlocked(): boolean
  now(): Date
  prefix: string
  delayMs: number
}

export interface AutoBackup {
  getStatus(): AutoBackupStatus
  subscribeStatus(listener: () => void): () => void
  init(): Promise<void>
  choose(): Promise<void>
  reconnect(): Promise<void>
  stop(): Promise<void>
  list(): Promise<BackupFileInfo[]>
  read(name: string): Promise<string>
  snapshot(reason: SnapshotReason): Promise<boolean>
  flush(): Promise<void>
}

const errorName = (e: unknown) => (typeof e === 'object' && e !== null && 'name' in e ? String(e.name) : '')

/** Only a folder that is gone or not ours to write pauses the copy; anything else (a full disk, a file locked by
 * OneDrive or an antivirus) is left for the next change to retry. */
function pauseReason(e: unknown): PauseReason | null {
  const name = errorName(e)
  if (name === 'NotFoundError') return 'missing'
  if (name === 'NotAllowedError' || name === 'SecurityError') return 'permission'
  return null
}

export function createAutoBackup(deps: AutoBackupDeps): AutoBackup {
  let status: AutoBackupStatus = deps.supported ? { state: 'loading' } : { state: 'unsupported' }
  let dir: BackupDir | null = null
  let dirty = false
  let timer: ReturnType<typeof setTimeout> | undefined
  // Every write (and its rotation) runs here, one at a time: two at once could leave the older state in the day file.
  let queue: Promise<unknown> = Promise.resolve()
  const listeners = new Set<() => void>()

  const setStatus = (s: AutoBackupStatus) => {
    status = s
    listeners.forEach((l) => l())
  }

  const enqueue = <T>(job: () => Promise<T>): Promise<T> => {
    const run = queue.then(job, job)
    queue = run.catch(() => {})
    return run
  }

  async function newest(d: BackupDir): Promise<number | null> {
    const [first] = listBackups(deps.prefix, await d.list())
    if (!first) return null
    try {
      return await d.modified(first.name)
    } catch {
      return null // another tab rotated it away meanwhile
    }
  }

  // `permission(request)` stays the first await: requestPermission needs the click that called it.
  // After each await, `dir !== d` means a stop() or another choose() came meanwhile: the old folder says nothing.
  async function connect(request: boolean): Promise<void> {
    const d = dir
    if (!d) return setStatus({ state: 'off' })
    let lastAt: number | null = null
    try {
      const perm = await d.permission(request)
      if (dir !== d) return
      if (perm !== 'granted') return setStatus({ state: 'paused', folder: d.name, why: perm === 'denied' ? 'denied' : 'permission' })
      lastAt = await newest(d)
    } catch (e) {
      const why = pauseReason(e)
      if (why) {
        if (dir === d) setStatus({ state: 'paused', folder: d.name, why })
        return
      }
      // Anything else: stay on, the next write tells what the folder really does.
    }
    if (dir !== d) return
    setStatus({ state: 'on', folder: d.name, lastAt })
    if (dirty) await flush()
  }

  // Runs only inside the queue.
  async function write(reason?: SnapshotReason): Promise<boolean> {
    const d = dir
    if (!d || status.state !== 'on' || deps.isBlocked()) return false
    const now = deps.now()
    try {
      await d.write(autoBackupName(deps.prefix, dayKey(now), reason), serializeBackup(deps.getState(), now))
    } catch (e) {
      const why = pauseReason(e)
      if (why && dir === d) setStatus({ state: 'paused', folder: d.name, why })
      return false
    }
    // A rotation failure (a file locked by OneDrive/antivirus, one already gone) must not undo a copy that
    // already landed on disk: swallow it, the old files just linger until the next write.
    try {
      for (const name of filesToDelete(deps.prefix, await d.list())) await d.remove(name)
    } catch {
      // ignore
    }
    if (dir === d && status.state === 'on') setStatus({ ...status, lastAt: now.getTime() })
    return true
  }

  function flush(): Promise<void> {
    clearTimeout(timer)
    return enqueue(async () => {
      if (!dirty || status.state !== 'on') return
      dirty = false
      if (!(await write())) dirty = true
    })
  }

  if (deps.supported)
    deps.subscribe(() => {
      dirty = true
      clearTimeout(timer)
      timer = setTimeout(() => void flush(), deps.delayMs)
    })

  return {
    getStatus: () => status,
    subscribeStatus: (listener) => {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    async init() {
      if (!deps.supported) return
      try {
        dir = await deps.loadSaved()
      } catch {
        dir = null
      }
      await connect(false)
    },
    async choose() {
      let picked: BackupDir
      try {
        picked = await deps.pick()
      } catch {
        return // cancelled, or a folder the browser refuses: keep what there was
      }
      dir = picked
      dirty = true
      await connect(false)
    },
    reconnect: () => connect(true),
    async stop() {
      clearTimeout(timer)
      dir = null
      await deps.forget()
      setStatus({ state: 'off' })
    },
    list: async () => (dir ? listBackups(deps.prefix, await dir.list()) : []),
    read: async (name) => {
      if (!dir) throw new Error('No folder')
      return dir.read(name)
    },
    snapshot: (reason) => enqueue(() => write(reason)),
    flush,
  }
}

const DIR_KEY = 'backupDir'

function browserDeps(): AutoBackupDeps {
  return {
    supported: typeof window !== 'undefined' && 'showDirectoryPicker' in window,
    async pick() {
      const handle = await window.showDirectoryPicker!({ id: 'typelight-copias', mode: 'readwrite', startIn: 'documents' })
      await idbSet(DIR_KEY, handle)
      return fsBackupDir(handle)
    },
    async loadSaved() {
      const handle = await idbGet<FileSystemDirectoryHandle>(DIR_KEY)
      return handle ? fsBackupDir(handle) : null
    },
    forget: () => idbDel(DIR_KEY),
    getState: () => persistedState(useStore.getState()),
    subscribe: (onChange) =>
      useStore.subscribe((s, prev) => {
        if (PERSISTED_KEYS.some((k) => s[k] !== prev[k])) onChange()
      }),
    isBlocked: isWriteBlocked,
    now: () => new Date(),
    prefix: backupPrefix(import.meta.env.DEV),
    delayMs: 3000,
  }
}

export const autoBackup = createAutoBackup(browserDeps())

/** Loads the saved folder and writes what is pending when the tab is hidden. Once, at startup. */
export function startAutoBackup(): void {
  void autoBackup.init()
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') void autoBackup.flush()
  })
}

export function useAutoBackup(): AutoBackupStatus {
  return useSyncExternalStore(autoBackup.subscribeStatus, autoBackup.getStatus)
}
