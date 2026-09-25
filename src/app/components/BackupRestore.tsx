import { useRef, useState, type ChangeEvent } from 'react'
import { parseBackup } from '../lib/backup'
import { autoBackup } from '../lib/autoBackup'
import { importState, type PersistedState } from '../store'
import { unblockWrites } from '../store/storage'
import { Keycap } from './Keycap'

/** Format an ISO date for display, falling back to a plain label when it can't be parsed. */
// eslint-disable-next-line react/only-export-components -- shared module: hook, types and components on purpose (Task 4 interface)
export function fechaCopia(iso: string): string {
  const d = new Date(iso)
  return iso && !Number.isNaN(d.getTime()) ? d.toLocaleDateString('es-AR') : 'sin fecha'
}

export interface Restore {
  pending: { state: PersistedState; when: string } | null
  message: string | null
  /** A backup's text: parsed and, if valid, waiting for "Sí, reemplazar". */
  offer(text: string): void
  confirm(): Promise<void>
  cancel(): void
  say(message: string | null): void
}

/** Importing a file, a copy from the folder, or rescuing a failed load: one confirmation, and a snapshot first. */
// eslint-disable-next-line react/only-export-components -- shared module: hook, types and components on purpose (Task 4 interface)
export function useRestore(onRestored?: (state: PersistedState) => void): Restore {
  const [pending, setPending] = useState<Restore['pending']>(null)
  const [message, setMessage] = useState<string | null>(null)
  return {
    pending,
    message,
    offer(text) {
      const parsed = parseBackup(text)
      if (!parsed.ok) {
        setPending(null)
        setMessage(parsed.error)
        return
      }
      setPending({ state: parsed.state, when: fechaCopia(parsed.exportedAt) })
      setMessage(null)
    },
    async confirm() {
      if (!pending) return
      // The copy of the day would be overwritten by the imported state: keep the current one apart first.
      await autoBackup.snapshot('antes-de-importar')
      unblockWrites()
      importState(pending.state)
      setMessage(`Progreso restaurado desde la copia del ${pending.when}.`)
      setPending(null)
      onRestored?.(pending.state)
    },
    cancel: () => setPending(null),
    say: setMessage,
  }
}

export function ImportFileButton({ restore, label = 'Importar copia…', testId = 'backup-file' }: { restore: Restore; label?: string; testId?: string }) {
  const fileRef = useRef<HTMLInputElement>(null)
  const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    let text: string
    try {
      text = await file.text()
    } catch {
      restore.cancel()
      restore.say('No se pudo leer el archivo.')
      return
    }
    restore.offer(text)
  }
  return (
    <>
      <Keycap variant="ghost" size="sm" onClick={() => fileRef.current?.click()}>
        {label}
      </Keycap>
      <input ref={fileRef} type="file" accept=".json,application/json" className="hidden" onChange={onFile} data-testid={testId} />
    </>
  )
}

export function RestorePrompt({ restore }: { restore: Restore }) {
  return (
    <>
      {restore.pending && (
        <div className="mt-3 rounded-lg border-2 border-sun bg-sun-soft/60 px-3 py-2 text-sm">
          Reemplaza el progreso actual por el de la copia del {restore.pending.when}. ¿Seguir?
          <div className="mt-2 flex gap-2">
            <Keycap variant="primary" size="sm" onClick={() => void restore.confirm()}>
              Sí, reemplazar
            </Keycap>
            <Keycap variant="ghost" size="sm" onClick={restore.cancel}>
              Cancelar
            </Keycap>
          </div>
        </div>
      )}
      {restore.message && <p className="mt-2 text-sm font-bold text-ink-soft">{restore.message}</p>}
    </>
  )
}
