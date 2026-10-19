import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { LATAM } from '@/engine/layouts'
import { fakeFrames, setHidden } from '@/test/frames'
import { thud } from '../../lib/sound'
import { BalloonsGame } from './BalloonsGame'
import { RainGame } from './RainGame'
import { RhythmGame } from './RhythmGame'

vi.mock('../../lib/sound', () => ({ chime: vi.fn(), click: vi.fn(), metronome: vi.fn(), thud: vi.fn() }))

const LETTERS = ['f', 'j', 'd', 'k', 's', 'l', 'a', 'ñ']
const WORDS = [...'asdfghjklñqwertyuiopzxcvbnm', ' ']

const timer = (container: HTMLElement) => container.querySelector('.keycap-sm')!.textContent

/** Frames for `ms` of play, 20 ms each. */
function play(clock: ReturnType<typeof fakeFrames>, ms: number) {
  for (let t = 0; t < ms; t += 20) clock.frame(20)
}

describe('the rAF games pause while you are away', () => {
  afterEach(() => {
    setHidden(false)
    cleanup()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('Lluvia: a hidden tab costs no lives, and Enter picks the round up where it was', () => {
    const clock = fakeFrames()
    const onFinish = vi.fn()
    const { container } = render(<RainGame layout={LATAM} pool={LETTERS} goalWpm={20} onFinish={onFinish} />)
    fireEvent.keyDown(window, { key: 'Enter' })
    play(clock, 4000)
    expect(screen.getByLabelText('3 vidas')).toBeInTheDocument()
    const before = timer(container)

    setHidden(true)
    clock.skip(12_000)
    setHidden(false)
    play(clock, 2000)
    expect(onFinish).not.toHaveBeenCalled()
    expect(screen.getByLabelText('3 vidas')).toBeInTheDocument()
    expect(timer(container)).toBe(before)
    expect(screen.getByRole('heading', { name: 'Pausa' })).toBeInTheDocument()

    fireEvent.keyDown(window, { key: 'Enter' })
    expect(screen.queryByRole('heading', { name: 'Pausa' })).toBeNull()
    clock.frame(20)
    expect(screen.getByLabelText('3 vidas')).toBeInTheDocument()
  })

  it('Lluvia: leaving the window pauses it too, frames or not', () => {
    const clock = fakeFrames()
    const onFinish = vi.fn()
    const { container } = render(<RainGame layout={LATAM} pool={LETTERS} goalWpm={20} onFinish={onFinish} />)
    fireEvent.keyDown(window, { key: 'Enter' })
    play(clock, 4000)
    const before = timer(container)
    fireEvent.blur(window)
    play(clock, 12_000)
    expect(onFinish).not.toHaveBeenCalled()
    expect(screen.getByLabelText('3 vidas')).toBeInTheDocument()
    expect(timer(container)).toBe(before)
  })

  it('Al compás: the notes due while the tab was hidden do not all expire at once', () => {
    const clock = fakeFrames()
    const { container } = render(<RhythmGame layout={LATAM} pool={LETTERS} goalWpm={20} onFinish={() => {}} />)
    fireEvent.keyDown(window, { key: 'Enter' })
    play(clock, 1000)
    const thuds = vi.mocked(thud).mock.calls.length
    const before = timer(container)

    setHidden(true)
    clock.skip(20_000)
    setHidden(false)
    clock.frame(20)
    expect(vi.mocked(thud).mock.calls.length).toBe(thuds)
    expect(timer(container)).toBe(before)
  })

  it('Globos: a hidden tab does not let every balloon escape', () => {
    const clock = fakeFrames()
    const onFinish = vi.fn()
    render(<BalloonsGame layout={LATAM} pool={WORDS} goalWpm={20} onFinish={onFinish} />)
    fireEvent.keyDown(window, { key: 'Enter' })
    play(clock, 6000)
    expect(document.querySelectorAll('[data-balloon]').length).toBeGreaterThan(0)

    setHidden(true)
    clock.skip(60_000)
    setHidden(false)
    clock.frame(20)
    expect(onFinish).not.toHaveBeenCalled()
    expect(screen.getByLabelText('3 vidas')).toBeInTheDocument()
  })

  it('Globos: when the typing field loses the focus, the balloons stop until you come back', () => {
    const clock = fakeFrames()
    const onFinish = vi.fn()
    render(<BalloonsGame layout={LATAM} pool={WORDS} goalWpm={20} onFinish={onFinish} />)
    fireEvent.keyDown(window, { key: 'Enter' })
    play(clock, 6000)
    const input = screen.getByLabelText('Escribí el texto')
    expect(document.activeElement).toBe(input)

    fireEvent.blur(input)
    play(clock, 40_000)
    expect(onFinish).not.toHaveBeenCalled()
    expect(screen.getByLabelText('3 vidas')).toBeInTheDocument()

    fireEvent.keyDown(window, { key: 'Enter' })
    expect(document.activeElement).toBe(input)
  })
})
