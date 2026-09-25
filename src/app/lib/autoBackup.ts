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
  | { state: 'paused'; folder: string; why: 'permission' | 'missing' }

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

export function createAutoBackup(deps: AutoBackupDeps): AutoBackup {
  let status: AutoBackupStatus = deps.supported ? { state: 'loading' } : { state: 'unsupported' }
  let dir: BackupDir | null = null
  let dirty = false
  let timer: ReturnType<typeof setTimeout> | undefined
  const listeners = new Set<() => void>()

  const setStatus = (s: AutoBackupStatus) => {
    status = s
    listeners.forEach((l) => l())
  }

  const pause = (d: BackupDir, e: unknown) => setStatus({ state: 'paused', folder: d.name, why: errorName(e) === 'NotFoundError' ? 'missing' : 'permission' })

  async function newest(d: BackupDir): Promise<number | null> {
    const [first] = listBackups(deps.prefix, await d.list())
    return first ? d.modified(first.name) : null
  }

  // `permission(request)` stays the first await: requestPermission needs the click that called it.
  async function connect(request: boolean): Promise<void> {
    const d = dir
    if (!d) return setStatus({ state: 'off' })
    try {
      if ((await d.permission(request)) !== 'granted') return setStatus({ state: 'paused', folder: d.name, why: 'permission' })
      setStatus({ state: 'on', folder: d.name, lastAt: await newest(d) })
    } catch (e) {
      return pause(d, e)
    }
    if (dirty) await flush()
  }

  async function write(reason?: SnapshotReason): Promise<boolean> {
    const d = dir
    if (!d || status.state !== 'on' || deps.isBlocked()) return false
    const now = deps.now()
    try {
      await d.write(autoBackupName(deps.prefix, dayKey(now), reason), serializeBackup(deps.getState(), now))
      for (const name of filesToDelete(deps.prefix, await d.list())) await d.remove(name)
    } catch (e) {
      pause(d, e)
      return false
    }
    if (dir === d && status.state === 'on') setStatus({ ...status, lastAt: now.getTime() })
    return true
  }

  async function flush(): Promise<void> {
    clearTimeout(timer)
    if (!dirty || status.state !== 'on') return
    dirty = false
    if (!(await write())) dirty = true
  }

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
    snapshot: (reason) => write(reason),
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
