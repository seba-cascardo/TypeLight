import { renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useHiddenInput } from './useHiddenInput'

type Handler = (e: { key: string; repeat?: boolean; preventDefault: () => void }) => void

/** The hook's handlers are plain callbacks: call them with a bare event. */
function handlers(opts: Parameters<typeof useHiddenInput>[0]) {
  const { result } = renderHook(() => useHiddenInput({ autoFocus: false, ...opts }))
  return { down: result.current.inputProps.onKeyDown as unknown as Handler, up: result.current.inputProps.onKeyUp as unknown as Handler }
}

describe('useHiddenInput', () => {
  it('Backspace calls onBackspace and is swallowed', () => {
    const onBackspace = vi.fn()
    const { down } = handlers({ onText: () => {}, onBackspace })
    const e = { key: 'Backspace', preventDefault: vi.fn() }
    down(e)
    expect(onBackspace).toHaveBeenCalledTimes(1)
    expect(e.preventDefault).toHaveBeenCalled()
  })

  it('without onBackspace, Backspace is only swallowed', () => {
    const { down } = handlers({ onText: () => {} })
    const e = { key: 'Backspace', preventDefault: vi.fn() }
    down(e)
    expect(e.preventDefault).toHaveBeenCalled()
  })

  it('forwards printable key downs (not repeats) and ups to the optional trackers', () => {
    const onKeyDown = vi.fn()
    const onKeyUp = vi.fn()
    const { down, up } = handlers({ onText: () => {}, onKeyDown, onKeyUp })
    down({ key: 'a', preventDefault: vi.fn() })
    down({ key: 'a', repeat: true, preventDefault: vi.fn() })
    down({ key: 'Shift', preventDefault: vi.fn() })
    up({ key: 'a', preventDefault: vi.fn() })
    expect(onKeyDown).toHaveBeenCalledTimes(1)
    expect(onKeyDown).toHaveBeenCalledWith('a')
    expect(onKeyUp).toHaveBeenCalledWith('a')
  })
})
