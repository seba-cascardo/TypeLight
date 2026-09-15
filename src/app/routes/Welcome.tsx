import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { LAYOUT_LIST, LAYOUTS, type LayoutId } from '@/engine/layouts'
import { Keyboard } from '../components/Keyboard'
import { Keycap } from '../components/Keycap'
import { useStore } from '../store'

type Step = 'name' | 'detect-l' | 'detect-enie' | 'confirm'

export function Welcome() {
  const navigate = useNavigate()
  const setSettings = useStore((s) => s.setSettings)
  const saved = useStore((s) => s.settings)
  const [name, setName] = useState(saved.name)
  const [step, setStep] = useState<Step>('name')
  const [layoutId, setLayoutId] = useState<LayoutId | null>(null)
  const [lastKey, setLastKey] = useState<string>('')

  useEffect(() => {
    if (step !== 'detect-l' && step !== 'detect-enie') return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Shift' || e.key === 'Control' || e.key === 'Alt') return
      e.preventDefault()
      setLastKey(e.key === 'Dead' ? '´' : e.key)
      if (step === 'detect-l') {
        if (e.key === 'ñ' || e.key === 'Ñ' || e.code === 'Semicolon' && e.key !== ';') setStep('detect-enie')
        else if (e.key === ';') {
          setLayoutId('us')
          setStep('confirm')
        } else {
          setLayoutId(null)
          setStep('confirm')
        }
      } else {
        if (e.key === '{' || e.key === '[') setLayoutId('latam')
        else if (e.key === 'Dead' || e.key === '´' || e.key === '¨') setLayoutId('es')
        else setLayoutId(null)
        setStep('confirm')
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [step])

  const finish = () => {
    if (!layoutId) return
    setSettings({ name: name.trim(), layoutId, onboarded: true })
    navigate('/')
  }

  return (
    <div className="min-h-dvh px-4 py-10 md:px-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-10 flex items-center gap-2.5">
          <span className="keycap keycap-primary keycap-sm px-2.5 font-display text-lg leading-none">T</span>
          <span className="font-display text-xl font-extrabold tracking-tight">TypeLight</span>
        </div>

        {step === 'name' && (
          <section className="animate-rise">
            <h1 className="mb-3 text-5xl md:text-6xl">Diez dedos,<br />cero miradas al teclado.</h1>
            <p className="mb-8 max-w-xl text-lg text-ink-soft">
              Vas a aprender tecla por tecla, con explicaciones visuales y una rutina corta por día. Empecemos por lo fácil.
            </p>
            <form
              className="flex flex-wrap items-end gap-3"
              onSubmit={(e) => {
                e.preventDefault()
                setStep('detect-l')
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
          </section>
        )}

        {(step === 'detect-l' || step === 'detect-enie') && (
          <section className="animate-rise" key={step}>
            <div className="eyebrow mb-2">Tu teclado</div>
            <h1 className="mb-3 text-4xl md:text-5xl">
              {step === 'detect-l' ? 'Apretá la tecla que está justo a la derecha de la L.' : 'Ahora la que está a la derecha de la Ñ.'}
            </h1>
            <p className="mb-8 max-w-xl text-lg text-ink-soft">
              Así sé qué distribución tenés y te enseño exactamente tus teclas, incluidas la ñ y las tildes.
            </p>
            <div className="card inline-flex min-w-40 items-center justify-center px-8 py-6 font-mono text-4xl">
              {lastKey || <span className="text-ink-mute">…</span>}
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
            <div className="flex gap-3">
              <Keycap variant="ghost" onClick={() => setStep('detect-l')}>
                Detectar de nuevo
              </Keycap>
              <Keycap variant="primary" size="lg" disabled={!layoutId} onClick={finish}>
                Empezar a practicar →
              </Keycap>
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
