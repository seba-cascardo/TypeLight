import { useEffect, useState } from 'react'

/**
 * Whether Caps Lock is on, read from every key event (the browser only tells it with a key). With it on, every
 * letter comes out in capitals and counts as an error; the key sits right next to the A, where a beginner's
 * left pinky lands.
 */
export function useCapsLock(): boolean {
  const [on, setOn] = useState(false)
  useEffect(() => {
    const read = (e: KeyboardEvent) => setOn(e.getModifierState?.('CapsLock') ?? false)
    window.addEventListener('keydown', read, true)
    window.addEventListener('keyup', read, true)
    return () => {
      window.removeEventListener('keydown', read, true)
      window.removeEventListener('keyup', read, true)
    }
  }, [])
  return on
}
