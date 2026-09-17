import { useEffect, useState } from 'react'
import type { FormAnswer } from '../store'
import { Keycap } from './Keycap'

interface Props {
  /** Called once, with the answer or null when skipped with Esc. */
  onAnswer: (form: FormAnswer | null) => void
}

const OPTIONS: { form: FormAnswer; key: string; label: string; variant: 'primary' | 'sun' | 'coral' }[] = [
  { form: 'si', key: '1', label: 'Sí', variant: 'primary' },
  { form: 'medio', key: '2', label: 'Más o menos', variant: 'sun' },
  { form: 'no', key: '3', label: 'No', variant: 'coral' },
]

/**
 * The form self-check after a Reto, exam or race. The app cannot see the fingers; the typist can.
 * Informative, never punitive: it only feeds the "Forma" tile in Progreso.
 */
export function FormCheck({ onAnswer }: Props) {
  const [done, setDone] = useState<FormAnswer | null | 'pending'>('pending')

  const answer = (form: FormAnswer | null) => {
    if (done !== 'pending') return
    setDone(form)
    onAnswer(form)
  }

  useEffect(() => {
    if (done !== 'pending') return
    const onKey = (e: KeyboardEvent) => {
      const opt = OPTIONS.find((o) => o.key === e.key)
      if (opt) {
        e.preventDefault()
        answer(opt.form)
      } else if (e.key === 'Escape') {
        e.preventDefault()
        answer(null)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  if (done !== 'pending') {
    return (
      <p className="mt-6 text-sm font-bold text-ink-soft" data-testid="form-check" data-answer={done ?? 'skip'}>
        {done ? 'Anotado. Enter vuelve.' : 'Sin respuesta. Enter vuelve.'}
      </p>
    )
  }

  return (
    <div className="mx-auto mt-6 max-w-md rounded-xl bg-paper px-4 py-4" data-testid="form-check" data-answer="pending">
      <p className="font-display text-lg font-extrabold">¿Fila guía y dedos correctos?</p>
      <div className="mt-3 flex flex-wrap justify-center gap-2">
        {OPTIONS.map((o) => (
          <Keycap key={o.form} variant={o.variant} size="sm" onClick={() => answer(o.form)}>
            <span className="rounded-md bg-white/25 px-1.5 text-xs">{o.key}</span> {o.label}
          </Keycap>
        ))}
      </div>
      <p className="mt-2 text-xs text-ink-mute">Después, Enter vuelve · Esc salta</p>
    </div>
  )
}
