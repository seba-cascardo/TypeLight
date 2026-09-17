import { describe, expect, it } from 'vitest'
import { updateKeyStats } from './index'
import { keyReason } from './reasons'

describe('key reasons ("por qué hoy")', () => {
  it('names the error rate, the slowness and the days since the key was last seen', () => {
    expect(keyReason(undefined, '2026-09-18')).toBe('todavía con pocos datos')
    expect(keyReason({ latencyEma: 300, errorEma: 0.12, samples: 20 }, '2026-09-18')).toBe('12 % de error')
    expect(keyReason({ latencyEma: 1200, errorEma: 0, samples: 20 }, '2026-09-18')).toBe('lenta: 50 teclas/min')
    expect(keyReason({ latencyEma: 1200, errorEma: 0.2, samples: 20, lastSeen: '2026-09-12' }, '2026-09-18')).toBe('20 % de error · lenta: 50 teclas/min · hace 6 días que no la ves')
    expect(keyReason({ latencyEma: 300, errorEma: 0, samples: 20, lastSeen: '2026-09-17' }, '2026-09-18')).toBe('todavía con pocos datos')
    expect(keyReason({ latencyEma: 300, errorEma: 0, samples: 2 }, '2026-09-18')).toBe('todavía con pocos datos')
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
