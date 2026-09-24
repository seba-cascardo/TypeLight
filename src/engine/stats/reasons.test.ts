import { describe, expect, it } from 'vitest'
import { updateKeyStats } from './index'
import { keyReason } from './reasons'

describe('key reasons ("por qué hoy")', () => {
  it('names the error rate, the slowness and the days since the key was last seen', () => {
    expect(keyReason(undefined, '2026-09-18', 40)).toBe('todavía con pocos datos')
    expect(keyReason({ latencyEma: 300, errorEma: 0.12, samples: 20 }, '2026-09-18', 40)).toBe('12 % de error')
    expect(keyReason({ latencyEma: 1200, errorEma: 0, samples: 20 }, '2026-09-18', 40)).toBe('lenta: 50 teclas/min')
    expect(keyReason({ latencyEma: 1200, errorEma: 0.2, samples: 20, lastSeen: '2026-09-12' }, '2026-09-18', 40)).toBe('20 % de error · lenta: 50 teclas/min · hace 6 días que no la ves')
    expect(keyReason({ latencyEma: 300, errorEma: 0, samples: 20, lastSeen: '2026-09-17' }, '2026-09-18', 40)).toBe('todavía con pocos datos')
    expect(keyReason({ latencyEma: 300, errorEma: 0, samples: 2 }, '2026-09-18', 40)).toBe('todavía con pocos datos')
  })

  it('reads slow against the unit goal, not a fixed threshold', () => {
    // goal 40 PPM = 300 ms per key; slow past 450 ms
    expect(keyReason({ latencyEma: 500, errorEma: 0, samples: 20 }, '2026-09-18', 40)).toBe('lenta: 120 teclas/min')
    expect(keyReason({ latencyEma: 440, errorEma: 0, samples: 20 }, '2026-09-18', 40)).toBe('todavía con pocos datos')
    // goal 20 PPM = 600 ms per key; slow past 900 ms
    expect(keyReason({ latencyEma: 500, errorEma: 0, samples: 20 }, '2026-09-18', 20)).toBe('todavía con pocos datos')
    expect(keyReason({ latencyEma: 1000, errorEma: 0, samples: 20 }, '2026-09-18', 20)).toBe('lenta: 60 teclas/min')
  })

  it('updateKeyStats stamps the day a key was seen', () => {
    let stats = updateKeyStats({}, [{ char: 'f', latencies: [400], errors: 0, occurrences: 1 }], '2026-09-18')
    expect(stats.f.lastSeen).toBe('2026-09-18')
    stats = updateKeyStats(stats, [{ char: 'f', latencies: [], errors: 1, occurrences: 0 }], '2026-09-19')
    expect(stats.f.lastSeen).toBe('2026-09-19')
    stats = updateKeyStats(stats, [{ char: 'f', latencies: [], errors: 0, occurrences: 0 }], '2026-09-20')
    expect(stats.f.lastSeen).toBe('2026-09-19')
    expect(updateKeyStats({}, [{ char: 'j', latencies: [400], errors: 0, occurrences: 1 }]).j.lastSeen).toBeUndefined()
  })
})
