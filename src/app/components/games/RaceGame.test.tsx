import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { LATAM } from '@/engine/layouts'
import { fakeFrames, setHidden } from '@/test/frames'
import { RaceGame } from './RaceGame'

vi.mock('../../lib/sound', () => ({ chime: vi.fn(), click: vi.fn(), metronome: vi.fn(), thud: vi.fn() }))

const POOL = [...'abcdefghijklmnñopqrstuvwxyz', ' ']

const timer = (container: HTMLElement) => container.querySelector('.keycap-sm.font-display')!.textContent
/** How far along the track the ghost car is, 0..1, from its inline style. */
const ghostAt = () => {
  const car = screen.getByText(/⌨ 30 PPM/)
  return Number(/calc\(12px \+ ([\d.e-]+) \*/.exec(car.style.left)![1])
}

describe('RaceGame', () => {
  afterEach(() => {
    setHidden(false)
    cleanup()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('the ghost and the clock run on the session clock: time with the tab hidden does not count', () => {
    const clock = fakeFrames()
    const { container } = render(<RaceGame layout={LATAM} pool={POOL} goalWpm={20} ghostWpm={30} onFinish={() => {}} />)
    const input = screen.getByLabelText('Escribí el texto')

    // A minute away before the first key.
    setHidden(true)
    clock.skip(60_000)
    setHidden(false)
    fireEvent(input, new InputEvent('input', { bubbles: true, inputType: 'insertText', data: 'x' }))
    clock.frame(16)
    clock.frame(16)
    expect(timer(container)).toBe('0:00')
    expect(ghostAt()).toBeLessThan(0.01)

    // Ten seconds of race, then ten away: the ghost is where ten seconds put it.
    for (let t = 0; t < 10_000; t += 20) clock.frame(20)
    const at = ghostAt()
    setHidden(true)
    clock.skip(10_000)
    setHidden(false)
    clock.frame(16)
    expect(timer(container)).toBe('0:10')
    expect(ghostAt()).toBeCloseTo(at, 2)
  })
})
