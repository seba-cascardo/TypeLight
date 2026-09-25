import { useState } from 'react'
import { dayKey } from '@/engine/stats'
import { LAYOUT_LIST, LAYOUTS } from '@/engine/layouts'
import { backupFilename, downloadText, serializeBackup } from '../lib/backup'
import { FingerLegend, Keyboard } from '../components/Keyboard'
import { Keycap } from '../components/Keycap'
import { PageTitle } from '../components/ui'
import { persistedState, useStore } from '../store'
import { fechaCopia, ImportFileButton, RestorePrompt, useRestore } from '../components/BackupRestore'
import { autoBackup, useAutoBackup, type AutoBackupStatus } from '../lib/autoBackup'
import { dayLabel, reasonLabel, sinceLabel, type BackupFileInfo } from '../lib/backupFiles'

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

/** What the card says about the automatic copy, by state. */
function autoLine(auto: AutoBackupStatus, now: number): string {
  switch (auto.state) {
    case 'unsupported':
      return 'Vive solo en este navegador. Una copia en un archivo lo protege de cualquier limpieza. Este navegador no puede guardar solo en una carpeta: usá Chrome o Edge, o bajá la copia a mano.'
    case 'loading':
      return 'Vive solo en este navegador. Una copia en un archivo lo protege de cualquier limpieza.'
    case 'off':
      return 'Vive solo en este navegador. Guardá copias solas en una carpeta de tu compu: si elegís una de OneDrive, Google Drive o Dropbox, la copia también sale de tu compu.'
    case 'on':
      return `Se guarda sola en «${auto.folder}»${auto.lastAt ? ` · última: ${sinceLabel(auto.lastAt, now)}` : ''}.`
    case 'paused':
      return auto.why === 'missing'
        ? `La copia automática está en pausa: no encuentro la carpeta «${auto.folder}».`
        : `La copia automática en «${auto.folder}» está en pausa: el navegador pide permiso de nuevo. Elegí «Permitir en cada visita» para que no vuelva a preguntar.`
  }
}

function BackupCard() {
  const lastBackupAt = useStore((s) => s.settings.lastBackupAt)
  const setSettings = useStore((s) => s.setSettings)
  const auto = useAutoBackup()
  const restore = useRestore()
  const [files, setFiles] = useState<BackupFileInfo[] | null>(null)

  const download = () => {
    downloadBackup(setSettings)
    restore.say('Copia descargada.')
  }

  const openList = async () => {
    restore.say(null)
    try {
      setFiles(await autoBackup.list())
    } catch {
      restore.say('No se pudo leer la carpeta.')
    }
  }

  const pickFile = async (f: BackupFileInfo) => {
    setFiles(null)
    try {
      restore.offer(await autoBackup.read(f.name))
    } catch {
      restore.say('No se pudo leer el archivo.')
    }
  }

  const last = lastBackupAt ? `Última copia: ${fechaCopia(lastBackupAt)}.` : 'Todavía no guardaste ninguna copia.'

  return (
    <div className="rounded-xl bg-paper px-4 py-3" data-testid="backup-card">
      <span className="block font-bold">Tu progreso</span>
      <span className="block text-sm text-ink-soft">
        {/* eslint-disable-next-line react/purity -- "since" label at the moment it renders, not a reactive clock */}
        {autoLine(auto, Date.now())} {last}
      </span>
      <div className="mt-3 flex flex-wrap gap-2">
        {auto.state === 'off' && (
          <Keycap variant="secondary" size="sm" onClick={() => void autoBackup.choose()}>
            Elegir carpeta
          </Keycap>
        )}
        {auto.state === 'paused' && auto.why === 'permission' && (
          <Keycap variant="secondary" size="sm" onClick={() => void autoBackup.reconnect()}>
            Reconectar carpeta
          </Keycap>
        )}
        {auto.state === 'paused' && (
          <Keycap variant="ghost" size="sm" onClick={() => void autoBackup.choose()}>
            Elegir otra carpeta
          </Keycap>
        )}
        {auto.state === 'on' && (
          <>
            <Keycap variant="ghost" size="sm" onClick={() => void autoBackup.choose()}>
              Cambiar carpeta
            </Keycap>
            <Keycap variant="ghost" size="sm" onClick={() => void openList()}>
              Restaurar…
            </Keycap>
            <Keycap variant="ghost" size="sm" onClick={() => void autoBackup.stop()}>
              Dejar de usar la carpeta
            </Keycap>
          </>
        )}
        <Keycap variant="secondary" size="sm" onClick={download}>
          Descargar copia
        </Keycap>
        <ImportFileButton restore={restore} />
      </div>
      {files && (
        <div className="mt-3 rounded-lg bg-keycap px-3 py-2 text-sm" data-testid="backup-list">
          {files.length === 0 ? (
            'La carpeta todavía no tiene copias.'
          ) : (
            <ul className="flex flex-col gap-1">
              {files.map((f) => (
                <li key={f.name}>
                  <button type="button" className="font-bold underline" onClick={() => void pickFile(f)}>
                    {dayLabel(f.day)}
                    {f.reason ? ` · ${reasonLabel(f.reason)}` : ''}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      <RestorePrompt restore={restore} />
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
          <Toggle checked={settings.mascot} onChange={(v) => setSettings({ mascot: v })} label="Mascota en Inicio" hint="Una línea al lado del saludo: qué toca hoy, nunca un reproche." />
          <Toggle
            checked={settings.metronome}
            onChange={(v) => setSettings({ metronome: v })}
            label="Metrónomo en las prácticas"
            hint="Un pulso al 90 % de la meta de la unidad en las lecciones de práctica. Es folklore, pero frena al que atropella."
          />
          <label className="block rounded-xl bg-paper px-4 py-3">
            <span className="block font-bold">Compromiso semanal</span>
            <span className="mt-1 flex flex-wrap items-center gap-2 font-bold">
              Esta semana, fuera de la app:
              <input
                value={settings.commitment}
                onChange={(e) => setSettings({ commitment: e.target.value })}
                placeholder="escribo los mails sin mirar el teclado"
                aria-label="Compromiso semanal"
                className="card w-full px-3 py-2 font-semibold outline-none focus:border-mod"
              />
            </span>
            <span className="mt-1 block text-sm text-ink-soft">Cada lunes, en el resumen de la semana, te pregunto si lo cumpliste. Sí o no, nada más: lo que predice el nivel es la meta explícita en el uso diario.</span>
          </label>
          <div className="rounded-xl bg-paper px-4 py-3" data-testid="weekly-goal">
            <span className="block font-bold">Meta semanal</span>
            <span className="block text-sm text-ink-soft">Días con práctica por semana. Va aparte de la racha: la racha perdona un día, la meta es tu número.</span>
            <div className="mt-3 flex flex-wrap gap-2">
              {[3, 4, 5, 6, 7].map((n) => (
                <Keycap key={n} size="sm" variant={settings.weeklyGoal === n ? 'secondary' : 'ghost'} onClick={() => setSettings({ weeklyGoal: n })}>
                  {n}
                </Keycap>
              ))}
            </div>
          </div>
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
                    onClick={async () => {
                      // The copy of the day would be overwritten by the empty state: keep the current one apart first.
                      await autoBackup.snapshot('antes-de-reiniciar')
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

      <p className="mt-6 text-xs text-ink-mute" data-testid="credits">
        Mascota: «Toon Head» de{' '}
        <a className="underline" href="https://www.johanmelin.com" target="_blank" rel="noreferrer">
          Johan Melin
        </a>{' '}
        (
        <a className="underline" href="https://creativecommons.org/licenses/by/4.0/deed.es" target="_blank" rel="noreferrer">
          CC BY 4.0
        </a>
        ), adaptada (un personaje fijo, recortado a la cabeza). Manos: «Hand external anatomy, dorsum», Wikimedia Commons, dominio público.
      </p>
    </div>
  )
}
