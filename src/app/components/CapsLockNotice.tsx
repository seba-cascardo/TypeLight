import { useCapsLock } from '../hooks/useCapsLock'

/** A pill on the top edge of the exercise while Caps Lock is on; its parent must be positioned. */
export function CapsLockNotice() {
  const on = useCapsLock()
  if (!on) return null
  return (
    <div
      role="status"
      data-testid="caps-lock"
      className="animate-pop pointer-events-none absolute -top-4 left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded-full bg-esc px-4 py-1 text-sm font-extrabold text-white"
    >
      Bloq Mayús está activado: apagalo para seguir
    </div>
  )
}
