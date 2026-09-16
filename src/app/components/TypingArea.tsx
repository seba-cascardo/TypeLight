import { useCallback, useEffect, useRef, useState, type CompositionEvent, type FormEvent, type KeyboardEvent } from 'react'
import type { TypingState } from '@/engine/typing'

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
  const inputRef = useRef<HTMLInputElement>(null)
  const [focused, setFocused] = useState(false)
  const composing = useRef(false)
  // Some browsers fire compositionend and then an input event for the same text.
  const lastComposed = useRef<{ data: string; at: number } | null>(null)

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus()
  }, [autoFocus, state.target])

  const handleInput = useCallback(
    (e: FormEvent<HTMLInputElement>) => {
      const native = e.nativeEvent as InputEvent
      const el = e.currentTarget
      if (composing.current || native.inputType === 'insertCompositionText') return
      if (native.inputType === 'insertText' || native.inputType === 'insertFromPaste' || native.inputType === undefined) {
        const data = native.data ?? el.value
        const dup = lastComposed.current && lastComposed.current.data === data && performance.now() - lastComposed.current.at < 60
        if (native.inputType !== 'insertFromPaste' && !dup) onInput(data)
      }
      el.value = ''
    },
    [onInput],
  )

  const handleCompositionEnd = useCallback(
    (e: CompositionEvent<HTMLInputElement>) => {
      composing.current = false
      if (e.data) {
        lastComposed.current = { data: e.data, at: performance.now() }
        onInput(e.data)
      }
      e.currentTarget.value = ''
    },
    [onInput],
  )

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onRestart?.()
      }
      if (e.key === 'Enter' || e.key === 'Backspace') e.preventDefault()
    },
    [onRestart],
  )

  const focus = () => inputRef.current?.focus()

  return (
    <div
      className={`relative ${className}`}
      onMouseDown={(e) => {
        e.preventDefault()
        focus()
      }}
    >
      <input
        ref={inputRef}
        className="absolute h-px w-px opacity-0"
        style={{ left: 0, top: 0 }}
        autoCapitalize="off"
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        aria-label="Escribí el texto"
        onInput={handleInput}
        onCompositionStart={() => (composing.current = true)}
        onCompositionEnd={handleCompositionEnd}
        onKeyDown={handleKeyDown}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
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
