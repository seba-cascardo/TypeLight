import { useEffect, useState, useSyncExternalStore } from 'react'
import { useNavigate } from 'react-router'
import { LAYOUT_LIST, LAYOUTS, type LayoutId } from '@/engine/layouts'
import { Keyboard } from '../components/Keyboard'
import { Keycap } from '../components/Keycap'
import { ImportFileButton, RestorePrompt, useRestore } from '../components/BackupRestore'
import { useStore } from '../store'
import { isWriteBlocked, subscribeWriteBlocked, unblockWrites } from '../store/storage'

type Step = 'name' | 'detect-l' | 'detect-enie' | 'confirm'

interface Pressed {
  key: string
  code: string
}

const MODIFIERS = new Set(['Shift', 'Control', 'Alt', 'AltGraph', 'Meta', 'CapsLock', 'Tab', 'Escape', 'Enter'])
const DEAD = new Set(['Dead', 'Process', 'Unidentified', '´', '¨', '`', '^'])

function pressedLabel(p: Pressed | null): string {
  if (!p) return ''
  if (DEAD.has(p.key)) return 'tecla muerta (´)'
  if (p.key === ' ') return 'espacio'
  return p.key
}

/** Best guess after the key right of L. */
function afterL(p: Pressed): { step: Step; layout: LayoutId | null } {
  if (p.key === 'ñ' || p.key === 'Ñ') return { step: 'detect-enie', layout: 'latam' }
  if (p.key === ';' || p.key === ':') return { step: 'confirm', layout: 'us' }
  // The physical key right of L produced something unexpected: still a Spanish keyboard, most likely.
  if (p.code === 'Semicolon') return { step: 'detect-enie', layout: 'latam' }
  return { step: 'confirm', layout: null }
}

/** Best guess after the key right of Ñ: { on Latin America, a dead ´ on Spain. */
function afterEnie(p: Pressed): LayoutId {
  if (p.key === '{' || p.key === '[' || p.key === '^') return 'latam'
  if (DEAD.has(p.key)) return 'es'
  return 'latam'
}

export function Welcome() {
  const navigate = useNavigate()
  const setSettings = useStore((s) => s.setSettings)
  const saved = useStore((s) => s.settings)
  const [name, setName] = useState(saved.name)
  const [step, setStep] = useState<Step>('name')
  const [layoutId, setLayoutId] = useState<LayoutId | null>(null)
  const [pressed, setPressed] = useState<Pressed | null>(null)
  const blocked = useSyncExternalStore(subscribeWriteBlocked, isWriteBlocked)
  const restore = useRestore((state) => {
    if (state.settings.onboarded) navigate('/')
  })

  const detecting = step === 'detect-l' || step === 'detect-enie'

  useEffect(() => {
    if (!detecting) return
    const onKey = (e: KeyboardEvent) => {
      if (MODIFIERS.has(e.key)) return
      e.preventDefault()
      setPressed({ key: e.key, code: e.code })
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [detecting])

  const goDetect = (s: 'detect-l' | 'detect-enie') => {
    setPressed(null)
    setStep(s)
  }

  const advance = () => {
    if (step === 'detect-l') {
      if (!pressed) return
      const r = afterL(pressed)
      setLayoutId(r.layout)
      if (r.step === 'detect-enie') goDetect('detect-enie')
      else setStep('confirm')
    } else if (step === 'detect-enie') {
      setLayoutId(pressed ? afterEnie(pressed) : 'latam')
      setStep('confirm')
    }
  }

  // Auto-advance shortly after a key is recognized; the button is the fallback.
  useEffect(() => {
    if (!pressed || !detecting) return
    const id = window.setTimeout(advance, 600)
    return () => window.clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pressed, step])

  const finish = () => {
    if (!layoutId) return
    setSettings({ name: name.trim(), layoutId, onboarded: true })
    navigate('/')
  }

  return (
    <div className="min-h-dvh px-4 py-10 md:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-10 flex items-center gap-2.5">
          <span className="keycap keycap-primary keycap-sm px-2.5 font-display text-lg leading-none">T</span>
          <span className="font-display text-xl font-extrabold tracking-tight">TypeLight</span>
        </div>

        {blocked && (
          <section className="card mb-8 p-4" data-testid="load-failed">
            <p className="font-bold">No pudimos leer tu progreso guardado. No lo borramos.</p>
            <p className="text-sm text-ink-soft">Restaurá una copia, o empezá de cero: lo que no se pudo leer queda aparte en este navegador.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <ImportFileButton restore={restore} label="Restaurar desde una copia…" testId="rescue-file" />
              <Keycap variant="ghost" size="sm" onClick={unblockWrites}>
                Empezar de cero
              </Keycap>
            </div>
            <RestorePrompt restore={restore} />
          </section>
        )}

        {step === 'name' && (
          <section className="animate-rise">
            <h1 className="mb-3 text-5xl md:text-6xl">
              Diez dedos,
              <br />
              cero miradas al teclado.
            </h1>
            <p className="mb-8 max-w-xl text-lg text-ink-soft">
              Vas a aprender tecla por tecla, con explicaciones visuales y una rutina corta por día. Empecemos por lo fácil.
            </p>
            <form
              className="flex flex-wrap items-end gap-3"
              onSubmit={(e) => {
                e.preventDefault()
                goDetect('detect-l')
              }}
            >
              <label className="flex flex-col gap-1.5">
                <span className="eyebrow">¿Cómo te llamás?</span>
                <input
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Tu nombre"
                  className="card w-64 px-4 py-3 text-lg font-bold outline-none focus:border-mod"
                />
              </label>
              <Keycap variant="primary" size="lg" type="submit">
                Seguir →
              </Keycap>
            </form>
            {!blocked && (
              <div className="mt-8 flex flex-wrap items-center gap-2 text-sm text-ink-soft">
                ¿Ya tenías progreso?
                <ImportFileButton restore={restore} label="Restaurar desde una copia…" testId="welcome-backup-file" />
              </div>
            )}
            {!blocked && <RestorePrompt restore={restore} />}
          </section>
        )}

        {detecting && (
          <section className="animate-rise" key={step}>
            <div className="eyebrow mb-2">Tu teclado · paso {step === 'detect-l' ? 1 : 2} de 2</div>
            <h1 className="mb-3 text-4xl md:text-5xl">
              {step === 'detect-l' ? 'Apretá la tecla que está justo a la derecha de la L.' : 'Ahora la que está justo a la derecha de la Ñ.'}
            </h1>
            <p className="mb-8 max-w-xl text-lg text-ink-soft">
              {step === 'detect-l'
                ? 'Así sé qué distribución tenés y te enseño exactamente tus teclas, incluidas la ñ y las tildes.'
                : 'Con esta distingo el teclado de España del latinoamericano.'}
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <div
                className={`card inline-flex min-w-44 items-center justify-center px-8 py-6 font-display text-4xl ${pressed ? 'border-enter-edge bg-enter-soft' : ''}`}
              >
                {pressed ? pressedLabel(pressed) : <span className="text-ink-mute">…</span>}
              </div>
              {pressed && (
                <Keycap variant="primary" size="lg" onClick={advance}>
                  Seguir →
                </Keycap>
              )}
            </div>
            <div className="mt-6">
              <button type="button" className="text-sm font-bold text-ink-soft underline" onClick={() => setStep('confirm')}>
                Prefiero elegirlo a mano
              </button>
            </div>
          </section>
        )}

        {step === 'confirm' && (
          <section className="animate-rise">
            <div className="eyebrow mb-2">Tu teclado</div>
            <h1 className="mb-3 text-4xl md:text-5xl">
              {layoutId ? `Parece un teclado ${LAYOUTS[layoutId].name.toLowerCase()}.` : 'No lo pude detectar. Elegilo vos:'}
            </h1>
            <p className="mb-6 text-lg text-ink-soft">Si no es el tuyo, elegí otro. Lo podés cambiar después en Ajustes.</p>
            <div className="mb-6 flex flex-wrap gap-2">
              {LAYOUT_LIST.map((l) => (
                <Keycap key={l.id} variant={layoutId === l.id ? 'secondary' : 'ghost'} onClick={() => setLayoutId(l.id)}>
                  {l.name}
                </Keycap>
              ))}
            </div>
            {layoutId && (
              <div className="card mb-8 p-4">
                <Keyboard layout={LAYOUTS[layoutId]} size="sm" />
                <p className="mt-3 text-sm text-ink-soft">{LAYOUTS[layoutId].hint}.</p>
              </div>
            )}
            <div className="flex flex-wrap gap-3">
              <Keycap variant="ghost" onClick={() => goDetect('detect-l')}>
                Detectar de nuevo
              </Keycap>
              <Keycap variant="primary" size="lg" disabled={!layoutId} onClick={finish} autoFocus>
                Empezar a practicar →
              </Keycap>
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
