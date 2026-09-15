import { useState } from 'react'
import { LAYOUT_LIST, LAYOUTS } from '@/engine/layouts'
import { FingerLegend, Keyboard } from '../components/Keyboard'
import { Keycap } from '../components/Keycap'
import { PageTitle } from '../components/ui'
import { useStore } from '../store'

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
          <Toggle checked={settings.sound} onChange={(v) => setSettings({ sound: v })} label="Sonido" hint="Un clic suave por tecla y un golpe seco por error." />
          <Toggle checked={settings.showHands} onChange={(v) => setSettings({ showHands: v })} label="Manos guía" hint="Las manos al lado del teclado, con el dedo que toca." />
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
