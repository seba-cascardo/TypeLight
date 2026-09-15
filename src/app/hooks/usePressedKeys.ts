import { useEffect, useState } from 'react'

/** Physical keys currently held down (by KeyboardEvent.code). */
export function usePressedKeys(): ReadonlySet<string> {
  const [pressed, setPressed] = useState<ReadonlySet<string>>(() => new Set())
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      setPressed((p) => (p.has(e.code) ? p : new Set(p).add(e.code)))
    }
    const up = (e: KeyboardEvent) => {
      setPressed((p) => {
        if (!p.has(e.code)) return p
        const n = new Set(p)
        n.delete(e.code)
        return n
      })
    }
    const clear = () => setPressed(new Set())
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    window.addEventListener('blur', clear)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      window.removeEventListener('blur', clear)
    }
  }, [])
  return pressed
}
