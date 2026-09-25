/** A folder the automatic backup writes to: the real one, or one in memory in the tests. */
export interface BackupDir {
  readonly name: string
  /** `request` asks the person (it needs the click); otherwise it only checks. */
  permission(request: boolean): Promise<PermissionState>
  list(): Promise<string[]>
  modified(name: string): Promise<number>
  read(name: string): Promise<string>
  write(name: string, text: string): Promise<void>
  remove(name: string): Promise<void>
}

export function fsBackupDir(handle: FileSystemDirectoryHandle): BackupDir {
  const file = async (name: string) => (await handle.getFileHandle(name)).getFile()
  return {
    name: handle.name,
    // No `await` before requestPermission: it needs the click that called it. Handles without these methods (OPFS) are always granted.
    async permission(request) {
      if (request && handle.requestPermission) return handle.requestPermission({ mode: 'readwrite' })
      if (handle.queryPermission) return handle.queryPermission({ mode: 'readwrite' })
      return 'granted'
    },
    async list() {
      const names: string[] = []
      for await (const [name, entry] of handle.entries()) if (entry.kind === 'file') names.push(name)
      return names
    },
    async modified(name) {
      return (await file(name)).lastModified
    },
    async read(name) {
      return (await file(name)).text()
    },
    // createWritable writes aside and swaps on close: a file is never left half written.
    async write(name, text) {
      const w = await (await handle.getFileHandle(name, { create: true })).createWritable()
      await w.write(text)
      await w.close()
    },
    async remove(name) {
      await handle.removeEntry(name)
    },
  }
}
