import { useRef, useState, type ChangeEvent } from 'react'
import { dayKey } from '@/engine/stats'
import { LAYOUT_LIST, LAYOUTS } from '@/engine/layouts'
import { backupFilename, downloadText, parseBackup, serializeBackup } from '../lib/backup'
import { FingerLegend, Keyboard } from '../components/Keyboard'
import { Keycap } from '../components/Keycap'
import { PageTitle } from '../components/ui'
import { importState, persistedState, useStore, type PersistedState } from '../store'

function Toggle({ checked, onChange, label, hint }: { checked: boolean; onChange: (v: boolean) => void; label: string; hint: string }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl bg-paper px-4 py-3">
      <span>
        <span className="block font-bold">{label}</span>
        <span className="block text-sm text-ink-soft">{hint}</span>
      </span>
      <span className="relative inline-flex h-7 w-12 shrink-0 items-center">
        <input type="checkbox" className="peer sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <span className="absolute inset-0 rounded-full border-2 border-line bg-keycap transition peer-checked:border-enter-edge peer-checked:bg-enter peer-focus-visible:ring-4 peer-focus-visible:ring-mod/40" />
        <span className="absolute left-1 h-4 w-4 rounded-full bg-ink-mute transition peer-checked:translate-x-5 peer-checked:bg-white" />
      </span>
    </label>
  )
}

/** Download a backup and stamp `lastBackupAt`; shared by the backup card and the pre-reset nudge. */
function downloadBackup(setSettings: (patch: { lastBackupAt: string }) => void) {
  const now = new Date()
  downloadText(backupFilename(now), serializeBackup(persistedState(useStore.getState()), now))
  setSettings({ lastBackupAt: now.toISOString() })
}

/** Format an ISO date for display, falling back to a plain label when it can't be parsed. */
function fechaCopia(iso: string): string {
  const d = new Date(iso)
  return iso && !Number.isNaN(d.getTime()) ? d.toLocaleDateString('es-AR') : 'sin fecha'
}

function BackupCard() {
  const lastBackupAt = useStore((s) => s.settings.lastBackupAt)
  const setSettings = useStore((s) => s.setSettings)
  const [message, setMessage] = useState<string | null>(null)
  const [pending, setPending] = useState<{ state: PersistedState; when: string } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const download = () => {
    downloadBackup(setSettings)
    setMessage('Copia descargada.')
  }

  const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    let text: string
    try {
      text = await file.text()
    } catch {
      setPending(null)
      setMessage('No se pudo leer el archivo.')
      return
    }
    const parsed = parseBackup(text)
    if (!parsed.ok) {
      setPending(null)
      setMessage(parsed.error)
      return
    }
    setPending({ state: parsed.state, when: fechaCopia(parsed.exportedAt) })
    setMessage(null)
  }

  const confirmImport = () => {
    if (!pending) return
    importState(pending.state)
    setMessage(`Progreso restaurado desde la copia del ${pending.when}.`)
    setPending(null)
  }

  const last = lastBackupAt ? `Última copia: ${fechaCopia(lastBackupAt)}.` : 'Todavía no guardaste ninguna copia.'

  return (
    <div className="rounded-xl bg-paper px-4 py-3" data-testid="backup-card">
      <span className="block font-bold">Tu progreso</span>
      <span className="block text-sm text-ink-soft">Vive solo en este navegador. Una copia en un archivo lo protege de cualquier limpieza. {last}</span>
      <div className="mt-3 flex flex-wrap gap-2">
        <Keycap variant="secondary" size="sm" onClick={download}>
          Descargar copia
        </Keycap>
        <Keycap variant="ghost" size="sm" onClick={() => fileRef.current?.click()}>
          Importar copia…
        </Keycap>
        <input ref={fileRef} type="file" accept=".json,application/json" className="hidden" onChange={onFile} data-testid="backup-file" />
      </div>
      {pending && (
        <div className="mt-3 rounded-lg border-2 border-sun bg-sun-soft/60 px-3 py-2 text-sm">
          Reemplaza el progreso actual por el de la copia del {pending.when}. ¿Seguir?
          <div className="mt-2 flex gap-2">
            <Keycap variant="primary" size="sm" onClick={confirmImport}>
              Sí, reemplazar
            </Keycap>
            <Keycap variant="ghost" size="sm" onClick={() => setPending(null)}>
              Cancelar
            </Keycap>
          </div>
        </div>
      )}
      {message && <p className="mt-2 text-sm font-bold text-ink-soft">{message}</p>}
    </div>
  )
}

function LegacyCard() {
  const legacy = useStore((s) => s.legacy)
  return (
    <div className="rounded-xl bg-paper px-4 py-3" data-testid="legacy-card">
      <span className="block font-bold">Tu velocidad de antes</span>
      <span className="block text-sm text-ink-soft">
        {legacy
          ? `Medida el ${new Date(legacy.at).toLocaleDateString('es-AR')}: ${legacy.wpm} PPM con ${Math.round(legacy.acc * 100)} % de precisión. Es la línea gris de Progreso.`
          : 'Un minuto tipeando como tipeabas antes de TypeLight. Cuanto antes la midas, más fiel es: los dedos viejos se van olvidando.'}
      </span>
      <div className="mt-3">
        <Keycap to="/practica/antes" variant={legacy ? 'ghost' : 'secondary'} size="sm">
          {legacy ? 'Medir de nuevo' : 'Medir ahora'}
        </Keycap>
      </div>
    </div>
  )
}

export function Settings() {
  const settings = useStore((s) => s.settings)
  const setSettings = useStore((s) => s.setSettings)
  const resetProgress = useStore((s) => s.resetProgress)
  const [confirm, setConfirm] = useState(false)
  const layout = LAYOUTS[settings.layoutId]

  return (
    <div className="animate-rise">
      <PageTitle eyebrow="Ajustes" title="A tu medida." />
      <div className="grid gap-4 md:grid-cols-[1fr_1.2fr]">
        <section className="card space-y-3 p-6">
          <label className="block">
            <span className="eyebrow">Nombre</span>
            <input
              value={settings.name}
              onChange={(e) => setSettings({ name: e.target.value })}
              className="card mt-1 w-full px-4 py-2.5 font-bold outline-none focus:border-mod"
            />
          </label>
          <label className="block">
            <span className="eyebrow">Tu ancla</span>
            <span className="mt-1 flex flex-wrap items-center gap-2 font-bold">
              Después de
              <input
                value={settings.anchor}
                onChange={(e) => setSettings({ anchor: e.target.value })}
                placeholder="el mate de la mañana"
                aria-label="Tu ancla"
                className="card w-56 px-3 py-2 font-semibold outline-none focus:border-mod"
              />
              , practico.
            </span>
            <span className="mt-1 block text-sm text-ink-soft">Se muestra en Inicio, debajo del saludo. Vacío = sin ancla.</span>
          </label>
          <Toggle checked={settings.sound} onChange={(v) => setSettings({ sound: v })} label="Sonido" hint="Un clic suave por tecla y un golpe seco por error." />
          <Toggle checked={settings.showHands} onChange={(v) => setSettings({ showHands: v })} label="Manos guía" hint="Las manos debajo del teclado, con el dedo que toca." />
          <div className="rounded-xl bg-paper px-4 py-3">
            <span className="block font-bold">Tema</span>
            <span className="block text-sm text-ink-soft">"Automático" sigue al sistema: papel de día, noche de teclado cuando oscurece.</span>
            <div className="mt-3 flex flex-wrap gap-2">
              {(
                [
                  ['auto', 'Automático'],
                  ['light', 'Papel'],
                  ['dark', 'Noche'],
                ] as const
              ).map(([id, label]) => (
                <Keycap key={id} size="sm" variant={(settings.theme ?? 'auto') === id ? 'secondary' : 'ghost'} onClick={() => setSettings({ theme: id })}>
                  {label}
                </Keycap>
              ))}
            </div>
          </div>
          <BackupCard />
          <LegacyCard />
          <div className="rounded-xl border-2 border-esc-soft bg-esc-soft/40 px-4 py-3">
            <span className="block font-bold">Reiniciar progreso</span>
            <span className="block text-sm text-ink-soft">Borra lecciones, estadísticas y racha. No se puede deshacer.</span>
            <div className="mt-3 flex gap-2">
              {!confirm ? (
                <Keycap variant="ghost" size="sm" onClick={() => setConfirm(true)}>
                  Reiniciar…
                </Keycap>
              ) : (
                <>
                  {(!settings.lastBackupAt || dayKey(new Date(settings.lastBackupAt)) !== dayKey()) && (
                    <Keycap variant="secondary" size="sm" onClick={() => downloadBackup(setSettings)}>
                      Antes, descargar copia
                    </Keycap>
                  )}
                  <Keycap
                    variant="coral"
                    size="sm"
                    onClick={() => {
                      resetProgress()
                      setConfirm(false)
                    }}
                  >
                    Sí, borrar todo
                  </Keycap>
                  <Keycap variant="ghost" size="sm" onClick={() => setConfirm(false)}>
                    Cancelar
                  </Keycap>
                </>
              )}
            </div>
          </div>
        </section>

        <section className="card p-6">
          <div className="eyebrow mb-2">Teclado</div>
          <div className="mb-4 flex flex-wrap gap-2">
            {LAYOUT_LIST.map((l) => (
              <Keycap key={l.id} variant={settings.layoutId === l.id ? 'secondary' : 'ghost'} size="sm" onClick={() => setSettings({ layoutId: l.id })}>
                {l.name}
              </Keycap>
            ))}
          </div>
          <Keyboard layout={layout} size="sm" />
          <p className="mt-3 text-sm text-ink-soft">{layout.hint}.</p>
          <div className="mt-3">
            <FingerLegend />
          </div>
          <p className="mt-4 text-xs text-ink-mute">
            Cambiar de teclado cambia la ruta: la ñ, las tildes y los símbolos se enseñan según su posición real. El progreso por lección se conserva
            cuando los identificadores coinciden.
          </p>
        </section>
      </div>
    </div>
  )
}
