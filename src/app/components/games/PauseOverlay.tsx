import { useEffect } from 'react'
import { Keycap } from '../Keycap'

/** Covers a paused game; Enter or the button picks it up again. */
export function PauseOverlay({ onResume }: { onResume: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        onResume()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onResume])

  return (
    <div className="absolute inset-0 grid place-items-center bg-paper/70 backdrop-blur-[2px]">
      <div className="max-w-md text-center">
        <h2 className="text-3xl">Pausa</h2>
        <p className="mt-2 text-ink-soft">El reloj se quedó quieto mientras no estabas. Volvé a poner las manos en la fila guía.</p>
        <Keycap variant="primary" size="lg" className="mt-5" onClick={onResume}>
          Seguir (Enter) →
        </Keycap>
      </div>
    </div>
  )
}
