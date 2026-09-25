import { useCallback, useState, type ReactNode, type RefObject } from 'react'
import { repairs, type TypingState } from '@/engine/typing'
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
/**
 * Groups the characters into words that never break across lines (each character is an inline-block, so
 * without this a line could end in the middle of a word). Each word keeps its trailing space, so a line breaks
 * after a space and the next one never starts with one. Extra letters hang at a space index, before it.
 */
/** Longer than any word the app shows (with its space): past this, a run is a drill, not a word. */
const MAX_WORD = 16

function wordsOf(chars: { space: boolean; nodes: ReactNode[] }[]): ReactNode[] {
  const out: ReactNode[] = []
  let word: ReactNode[] = []
  const flush = () => {
    // A run longer than a word (the first drills have no spaces) stays loose, so a narrow screen can wrap it.
    if (word.length > MAX_WORD) out.push(...word)
    else if (word.length) out.push(<span key={`w${out.length}`} className="type-word">{word}</span>)
    word = []
  }
  for (const c of chars) {
    word.push(...c.nodes)
    if (c.space) flush()
  }
  flush()
  return out
}

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
    onBackspace: repairs(state.mode) ? onBackspace : undefined,
    onKeyDown: rollover ? (key) => trackKeyDown(rollover.current, key) : undefined,
    onKeyUp: rollover ? (key) => trackKeyUp(rollover.current, key) : undefined,
    guard: numpad ? guard : undefined,
    autoFocus,
    focusKey: state.target,
  })
  const free = repairs(state.mode)

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
        {wordsOf(
          [...state.target].map((ch, i) => {
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
            return {
              space: ch === ' ',
              nodes: [
                ...[...(extras ?? '')].map((x, j) => (
                  <span key={`x${i}-${j}`} className="type-char type-extra">
                    {x}
                  </span>
                )),
                <span key={i} className={cls}>
                  {shown}
                </span>,
              ],
            }
          }),
        )}
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
