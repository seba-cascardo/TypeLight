import { FINGER_COLOR, fingerGroup } from '../lib/fingers'
import { NUMPAD, padCode } from '../lib/numpad'

interface Props {
  /** Next character to type: its pad key lights up. */
  nextChar?: string | null
  /** Characters to mark softly (intro cards). */
  highlight?: string[]
  /** Physical keys currently held down. */
  pressed?: ReadonlySet<string>
}

/** The number pad on screen, coloured by finger, with the bump on the 5 — same keycaps as the keyboard. */
export function Numpad({ nextChar, highlight, pressed }: Props) {
  const next = padCode(nextChar)
  const soft = new Set((highlight ?? []).map(padCode).filter(Boolean))
  return (
    <div
      className="mx-auto grid w-full max-w-[17rem] select-none gap-1"
      style={{ gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gridAutoRows: '3.25rem', ['--kb-h' as string]: '3.25rem' }}
      aria-hidden="true"
      data-testid="numpad"
    >
      {NUMPAD.map((k) => {
        const isNext = k.code === next
        const isSoft = soft.has(k.code)
        const finger = FINGER_COLOR[fingerGroup(k.finger)]
        return (
          <div
            key={k.code}
            data-code={k.code}
            className={`kb-key ${k.ch ? 'has-finger' : ''} ${isNext ? 'is-next' : ''} ${pressed?.has(k.code) ? 'is-pressed' : ''} ${k.home ? 'is-home' : ''}`}
            style={{
              gridColumn: `${k.col} / span ${k.w ?? 1}`,
              gridRow: `${k.row} / span ${k.h ?? 1}`,
              height: 'auto',
              ['--finger' as string]: k.ch ? finger : undefined,
              boxShadow: isSoft && !isNext ? '0 0 0 3px var(--color-sun)' : undefined,
            }}
          >
            <span className={k.label.length > 1 ? 'text-[0.72em] font-bold' : ''}>{k.label}</span>
          </div>
        )
      })}
    </div>
  )
}
