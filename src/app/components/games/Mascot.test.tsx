import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Mascot } from './Mascot'
import type { Mood } from './moods'

const MOODS: Mood[] = ['idle', 'happy', 'thrilled', 'sad', 'worried', 'panic']

describe('Mascot', () => {
  it('draws a different face for every mood', () => {
    const faces = MOODS.map((mood) => {
      const { container, unmount } = render(<Mascot mood={mood} combo={0} />)
      const svg = container.querySelector('svg')
      expect(svg).not.toBeNull()
      const html = svg!.outerHTML
      unmount()
      return html
    })
    expect(new Set(faces).size).toBe(MOODS.length)
  })

  it('keeps the colour code: green while calm, yellow when nervous, coral in panic', () => {
    const tint = (mood: Mood) => render(<Mascot mood={mood} combo={0} />).container.querySelector('[data-mood]')!.firstElementChild!.className
    expect(tint('idle')).toContain('bg-mascot-calm')
    expect(tint('sad')).toContain('bg-mascot-calm')
    expect(tint('worried')).toContain('bg-mascot-nervous')
    expect(tint('panic')).toContain('bg-mascot-panic')
  })

  it('takes the requested size and shows the combo only from 5', () => {
    const { container, rerender } = render(<Mascot mood="happy" combo={4} size={40} />)
    const box = container.querySelector<HTMLElement>('[data-mood]')!
    expect(box.style.width).toBe('40px')
    expect(box.style.height).toBe('40px')
    expect(container.textContent).not.toContain('×')
    rerender(<Mascot mood="thrilled" combo={12} size={40} />)
    expect(container.textContent).toContain('×12')
  })
})
