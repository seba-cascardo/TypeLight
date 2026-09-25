import { useCallback, useState, type RefObject } from 'react'
import type { TypingState } from '@/engine/typing'
import { trackKeyDown, trackKeyUp, type RolloverCounter } from '@/engine/stats'
import { useHiddenInput } from '../hooks/useHiddenInput'
import { numpadVerdict, type PadVerdict } from '../lib/numpad'

interface Props {
  state: TypingState
  onInput: (text: string) => void
  onRestart?: () => void
  /** Free mode: repair one character. */
  onBackspace?: () => void
  /** Counts key overlaps (rollover) while typing; the parent reads it when the session ends. */
  rollover?: RefObject<RolloverCounter>
  /** Number pad lessons: digits and operators from the main keyboard do not type; a hint says why. */
  numpad?: boolean
  /** Focus the hidden input as soon as the component mounts. */
  autoFocus?: boolean
  className?: string
}

/**
 * Renders the target text and captures keystrokes through a hidden input,
 * so dead keys (´ + a → á) and IMEs work exactly like in any text field.
 * In free mode the letter you typed shows where you typed it, skipped letters are struck through
 * and extra letters hang after the word, all in coral, until a Backspace repairs them.
 */
const PAD_HINT: Record<Exclude<PadVerdict, 'ok'>, string> = {
  'use-pad': 'Con el teclado numérico: los números de arriba no cuentan en esta lección.',
  numlock: 'Activá Bloq Num: el teclado numérico está moviendo el cursor.',
}

export function TypingArea({ state, onInput, onRestart, onBackspace, rollover, numpad = false, autoFocus = true, className = '' }: Props) {
  const [padHint, setPadHint] = useState<Exclude<PadVerdict, 'ok'> | null>(null)
  const guard = useCallback((e: { key: string; code: string }) => {
    const v = numpadVerdict(e)
    setPadHint(v === 'ok' ? null : v)
    return v === 'ok'
  }, [])
  const { inputProps, focused, focus } = useHiddenInput({
    onText: onInput,
    onEscape: onRestart,
    onBackspace: state.mode === 'free' ? onBackspace : undefined,
    onKeyDown: rollover ? (key) => trackKeyDown(rollover.current, key) : undefined,
    onKeyUp: rollover ? (key) => trackKeyUp(rollover.current, key) : undefined,
    guard: numpad ? guard : undefined,
    autoFocus,
    focusKey: state.target,
  })
  const free = state.mode === 'free'

  return (
    <div
      className={`relative ${className}`}
      onMouseDown={(e) => {
        e.preventDefault()
        focus()
      }}
    >
      <input {...inputProps} />
      <p
        className="font-body text-[1.5rem] font-semibold leading-[2] tracking-[0.01em] whitespace-pre-wrap wrap-break-word md:text-[1.75rem]"
        aria-live="off"
      >
        {[...state.target].map((ch, i) => {
          const done = i < state.pos
          const current = i === state.pos
          const typed = free && done ? state.typed[i] : undefined
          const skipped = free && done && typed === null
          const mistyped = free && done && typed !== null && typed !== undefined && typed !== ch
          const cls = [
            'type-char',
            done ? 'is-done' : '',
            done && state.erred[i] && !mistyped && !skipped ? 'was-error' : '',
            mistyped ? 'is-mistyped' : '',
            skipped ? 'is-skipped' : '',
            current ? 'is-current' : '',
            current && state.lastWrong ? 'is-wrong' : '',
            ch === ' ' ? 'is-space' : '',
          ]
            .filter(Boolean)
            .join(' ')
          const extras = free ? state.extras[i] : undefined
          const shown = mistyped ? typed : ch === ' ' && current ? '' : ch
          return (
            <span key={i} className="contents">
              {extras && [...extras].map((x, j) => (
                <span key={`x${j}`} className="type-char type-extra">
                  {x}
                </span>
              ))}
              <span className={cls}>{shown}</span>
            </span>
          )
        })}
      </p>
      {numpad && padHint && (
        <p className="mt-2 text-sm font-bold text-esc-edge" data-testid="pad-hint" data-hint={padHint}>
          {PAD_HINT[padHint]}
        </p>
      )}
      {!focused && !state.finishedAt && (
        <button
          type="button"
          onClick={focus}
          className="absolute inset-0 grid place-items-center rounded-2xl bg-paper/70 backdrop-blur-[2px] font-bold text-ink-soft"
        >
          Hacé clic acá y empezá a escribir
        </button>
      )}
    </div>
  )
}
