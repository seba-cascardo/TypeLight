import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ReferenceChart } from './ReferenceChart'

describe('ReferenceChart', () => {
  it('a mark on the last days labels to the left, so its text is not cut by the edge', () => {
    const points = [{ day: '2026-09-20', wpm: 30, n: 1 }, { day: '2026-09-25', wpm: 32, n: 1 }]
    const { container } = render(<ReferenceChart points={points} goal={20} today="2026-09-25" marks={[{ day: '2026-09-25', added: 1 }, { day: '2026-09-14', added: 2 }]} blindSince="2026-09-25" />)
    const label = (text: string) => [...container.querySelectorAll('text')].find((t) => t.textContent === text)!
    expect(label('+1 teclas').getAttribute('text-anchor')).toBe('end')
    expect(label('+2 teclas').getAttribute('text-anchor')).toBe('start')
    expect(label('sin ayuda').getAttribute('text-anchor')).toBe('end')
  })
})
