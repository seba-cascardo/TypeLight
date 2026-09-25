import { useCallback, useEffect, useRef, useState, type CompositionEvent, type FormEvent, type InputHTMLAttributes, type KeyboardEvent, type RefObject } from 'react'

interface Options {
  onText: (text: string) => void
  onEscape?: () => void
  /** Free mode: Backspace repairs instead of being swallowed. */
  onBackspace?: () => void
  /** Printable key down (no auto-repeat) / up, for the rollover count. */
  onKeyDown?: (key: string) => void
  onKeyUp?: (key: string) => void
  /** Refuses a key before it types anything (number pad lessons): return false to swallow it. */
  guard?: (e: { key: string; code: string }) => boolean
  /** Focus the input when mounted and whenever `focusKey` changes. */
  autoFocus?: boolean
  focusKey?: unknown
}

export interface HiddenInput {
  inputProps: InputHTMLAttributes<HTMLInputElement> & { ref: RefObject<HTMLInputElement | null> }
  focused: boolean
  focus: () => void
}

/**
 * Keystroke capture through a hidden <input>, so dead keys (´ + a → á) and IMEs compose like in any
 * text field. Listens to input/compositionend, not keydown; keydown only handles Escape, Backspace (repair or
 * swallow) and the printable key down/up trackers, and blocks Enter.
 */
export function useHiddenInput({ onText, onEscape, onBackspace, onKeyDown: trackDown, onKeyUp: trackUp, guard, autoFocus = true, focusKey }: Options): HiddenInput {
  const inputRef = useRef<HTMLInputElement>(null)
  const [focused, setFocused] = useState(false)
  const composing = useRef(false)
  // Some browsers fire compositionend and then an input event for the same text.
  const lastComposed = useRef<{ data: string; at: number } | null>(null)

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus()
  }, [autoFocus, focusKey])

  const onInput = useCallback(
    (e: FormEvent<HTMLInputElement>) => {
      const native = e.nativeEvent as InputEvent
      const el = e.currentTarget
      if (composing.current || native.inputType === 'insertCompositionText') return
      if (native.inputType === 'insertText' || native.inputType === 'insertFromPaste' || native.inputType === undefined) {
        const data = native.data ?? el.value
        const dup = lastComposed.current && lastComposed.current.data === data && performance.now() - lastComposed.current.at < 60
        if (native.inputType !== 'insertFromPaste' && !dup) onText(data)
      }
      el.value = ''
    },
    [onText],
  )

  const onCompositionEnd = useCallback(
    (e: CompositionEvent<HTMLInputElement>) => {
      composing.current = false
      if (e.data) {
        lastComposed.current = { data: e.data, at: performance.now() }
        onText(e.data)
      }
      e.currentTarget.value = ''
    },
    [onText],
  )

  const onKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (guard && !guard({ key: e.key, code: e.code })) {
        e.preventDefault()
        return
      }
      if (e.key === 'Escape') {
        e.preventDefault()
        onEscape?.()
      }
      if (e.key === 'Backspace') {
        e.preventDefault()
        onBackspace?.()
      }
      if (e.key === 'Enter') e.preventDefault()
      if (e.key.length === 1 && !e.repeat) trackDown?.(e.key)
    },
    [onEscape, onBackspace, trackDown, guard],
  )

  const onKeyUp = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key.length === 1) trackUp?.(e.key)
    },
    [trackUp],
  )

  const focus = useCallback(() => inputRef.current?.focus(), [])

  return {
    inputProps: {
      ref: inputRef,
      className: 'absolute h-px w-px opacity-0',
      style: { left: 0, top: 0 },
      autoCapitalize: 'off',
      autoComplete: 'off',
      autoCorrect: 'off',
      spellCheck: false,
      'aria-label': 'Escribí el texto',
      onInput,
      onCompositionStart: () => {
        composing.current = true
      },
      onCompositionEnd,
      onKeyDown,
      onKeyUp,
      onFocus: () => setFocused(true),
      onBlur: () => setFocused(false),
    },
    focused,
    focus,
  }
}
