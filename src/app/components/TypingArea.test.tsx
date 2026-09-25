import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { createSession, typeText } from '@/engine/typing'
import { TypingArea } from './TypingArea'

describe('TypingArea', () => {
  it('keeps each word on one line with its space: lines break only after a space', () => {
    const { container } = render(<TypingArea state={createSession('hola mundo lindo')} onInput={() => {}} autoFocus={false} />)
    const words = [...container.querySelectorAll('.type-word')].map((w) => w.textContent)
    expect(words).toEqual(['hola ', 'mundo ', 'lindo'])
    for (const space of container.querySelectorAll('.type-char.is-space')) expect(space.parentElement!.lastElementChild).toBe(space)
  })

  it('an extra letter hangs inside its word, before the space', () => {
    const s = typeText(createSession('sol luna', 'free'), 'sols', 1000)
    const { container } = render(<TypingArea state={s} onInput={() => {}} autoFocus={false} />)
    const first = container.querySelector('.type-word')!
    // the cursor sits on the space, drawn empty (the ␣ comes from CSS)
    expect(first.textContent).toBe('sols')
    expect(first.querySelector('.type-extra')?.textContent).toBe('s')
  })
})
