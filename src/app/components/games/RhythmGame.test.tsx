import { cleanup, fireEvent, render } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { LATAM } from '@/engine/layouts'
import { fakeFrames } from '@/test/frames'
import { metronome } from '../../lib/sound'
import { RhythmGame } from './RhythmGame'

vi.mock('../../lib/sound', () => ({ chime: vi.fn(), click: vi.fn(), metronome: vi.fn(), thud: vi.fn() }))

const POOL = ['f', 'j', 'd', 'k', 's', 'l']

describe('RhythmGame', () => {
  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('the metronome ticks when each note reaches the zone, also after the beat speeds up', () => {
    const clock = fakeFrames({ width: 800, height: 420 })
    const ticks: number[] = []
    vi.mocked(metronome).mockImplementation(() => {
      ticks.push(clock.now())
    })
    const { container } = render(<RhythmGame layout={LATAM} pool={POOL} goalWpm={12} durationMs={40_000} onFinish={() => {}} />)
    fireEvent.keyDown(window, { key: 'Enter' })
    const start = clock.now()

    // A perfect player: presses each note on the first frame it reaches the zone.
    const arrivals: number[] = []
    while (clock.now() - start < 39_000) {
      clock.frame(20)
      const note = container.querySelector<HTMLElement>('[data-current]')
      const offset = Number(note?.dataset.offset)
      if (note && offset <= 0) {
        arrivals.push(clock.now() + offset)
        fireEvent.keyDown(window, { key: note.dataset.ch })
      }
    }

    // The beat did speed up (12 PPM = 1000 ms between notes at the start).
    const gaps = arrivals.slice(1).map((t, i) => t - arrivals[i])
    expect(Math.min(...gaps)).toBeLessThan(950)
    // Every tick lands on a note (one frame of slack), before and after the ramp.
    const late = ticks.filter((t) => t - start > 2500)
    expect(late.length).toBeGreaterThan(20)
    const off = late.map((t) => Math.min(...arrivals.map((a) => Math.abs(a - t))))
    expect(Math.max(...off)).toBeLessThanOrEqual(20)
  })
})
