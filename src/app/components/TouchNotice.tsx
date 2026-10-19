import { useState } from 'react'
import { Keycap } from './Keycap'

const KEY = 'typelight.touch-ok'

/** A phone or tablet with no mouse or trackpad: no physical keyboard to learn on, most likely. */
function touchOnly(): boolean {
  if (typeof window.matchMedia !== 'function') return false
  return window.matchMedia('(pointer: coarse)').matches && !window.matchMedia('(any-pointer: fine)').matches
}

function dismissed(): boolean {
  try {
    return localStorage.getItem(KEY) === '1'
  } catch {
    return false
  }
}

/**
 * The link reaches friends by WhatsApp, usually opened on the phone. TypeLight teaches a physical keyboard:
 * say so before a progress starts on the phone, with the link to open it on the computer, and let them go on.
 */
export function TouchNotice() {
  const [open, setOpen] = useState(() => touchOnly() && !dismissed())
  const [copied, setCopied] = useState(false)
  if (!open) return null
  const link = new URL(import.meta.env.BASE_URL, window.location.origin).href
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }
  const goOn = () => {
    try {
      localStorage.setItem(KEY, '1')
    } catch {
      // Storage blocked: it closes for this visit only.
    }
    setOpen(false)
  }
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-paper/80 p-4 backdrop-blur-sm" data-testid="touch-notice">
      <div role="dialog" aria-modal="true" aria-labelledby="touch-title" className="card animate-rise w-full max-w-md p-7 text-center">
        <div className="mb-3 text-5xl" aria-hidden>
          ⌨️
        </div>
        <h1 id="touch-title" className="text-2xl">TypeLight se practica con un teclado</h1>
        <p className="mt-3 text-ink-soft">
          Los ejercicios se tipean con un teclado físico, con los diez dedos. En el celular no vas a poder hacerlos: abrí este link en la compu.
        </p>
        <p className="mt-4 break-all rounded-xl bg-paper-deep px-3 py-2 text-sm font-bold">{link}</p>
        <div className="mt-6 grid gap-3">
          <Keycap variant="primary" className="w-full" onClick={copy}>
            {copied ? 'Link copiado' : 'Copiar el link'}
          </Keycap>
          <Keycap variant="ghost" className="w-full" onClick={goOn}>
            Seguir igual
          </Keycap>
        </div>
      </div>
    </div>
  )
}
