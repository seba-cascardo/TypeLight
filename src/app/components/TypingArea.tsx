import type { TypingState } from '@/engine/typing'
import { useHiddenInput } from '../hooks/useHiddenInput'

interface Props {
  state: TypingState
  onInput: (text: string) => void
  onRestart?: () => void
  /** Focus the hidden input as soon as the component mounts. */
  autoFocus?: boolean
  className?: string
}

/**
 * Renders the target text and captures keystrokes through a hidden input,
 * so dead keys (´ + a → á) and IMEs work exactly like in any text field.
 */
export function TypingArea({ state, onInput, onRestart, autoFocus = true, className = '' }: Props) {
  const { inputProps, focused, focus } = useHiddenInput({ onText: onInput, onEscape: onRestart, autoFocus, focusKey: state.target })

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
          const cls = [
            'type-char',
            done ? 'is-done' : '',
            done && state.erred[i] ? 'was-error' : '',
            current ? 'is-current' : '',
            current && state.lastWrong ? 'is-wrong' : '',
            ch === ' ' ? 'is-space' : '',
          ]
            .filter(Boolean)
            .join(' ')
          return (
            <span key={i} className={cls}>
              {ch === ' ' && current ? '' : ch}
            </span>
          )
        })}
      </p>
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
