import { act, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { CapsLockNotice } from '../components/CapsLockNotice'

function key(type: 'keydown' | 'keyup', capsLock: boolean) {
  act(() => {
    window.dispatchEvent(new KeyboardEvent(type, { key: capsLock ? 'A' : 'a', modifierCapsLock: capsLock } as KeyboardEventInit))
  })
}

describe('Caps Lock notice', () => {
  it('shows while Caps Lock is on and goes away when it is turned off', () => {
    render(<CapsLockNotice />)
    expect(screen.queryByTestId('caps-lock')).toBeNull()
    key('keydown', true)
    expect(screen.getByTestId('caps-lock')).toHaveTextContent('Bloq Mayús')
    key('keyup', false)
    expect(screen.queryByTestId('caps-lock')).toBeNull()
  })
})
