import { beforeEach, describe, expect, it } from 'vitest'
import { PERSISTED_KEYS, useStore } from './index'

const initialState = useStore.getState()

beforeEach(() => {
  useStore.setState(initialState, true)
})

describe('store', () => {
  it('persists exactly the data fields, no more and no less: a future field cannot be left out of the backup', () => {
    const dataKeys = Object.entries(useStore.getState())
      .filter(([, v]) => typeof v !== 'function')
      .map(([k]) => k)
      .sort()
    expect(dataKeys).toEqual([...PERSISTED_KEYS].sort())
  })

  it('resetProgress keeps the legacy measurement but clears its milestone flags', () => {
    useStore.setState({
      legacy: { wpm: 45, acc: 0.9, at: '2026-09-01T00:00:00.000Z', beatenAt: '2026-09-10', beatenSeen: true },
      lessons: { 'guia-tip-intro': { stars: 3, bestWpm: 10, bestAcc: 1, attempts: 1, completedAt: '2026-09-01T00:00:00.000Z' } },
    })

    useStore.getState().resetProgress()

    const { legacy, lessons } = useStore.getState()
    expect(legacy).toEqual({ wpm: 45, acc: 0.9, at: '2026-09-01T00:00:00.000Z' })
    expect(lessons).toEqual({})
  })

  it('resetProgress keeps legacy null when there was no legacy measurement', () => {
    useStore.setState({ legacy: null })
    useStore.getState().resetProgress()
    expect(useStore.getState().legacy).toBeNull()
  })

  it('the first blind reference session fixes blindSince, once', () => {
    const rec = { kind: 'challenge' as const, wpm: 30, acc: 0.95, chars: 150, errors: 5, seconds: 60 }
    useStore.getState().recordSession({ ...rec, reference: true })
    expect(useStore.getState().blindSince).toBeNull()
    useStore.getState().recordSession({ ...rec, reference: true, blind: true, mode: 'free' })
    const since = useStore.getState().blindSince
    expect(since).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    useStore.setState({ blindSince: '2026-01-01' })
    useStore.getState().recordSession({ ...rec, reference: true, blind: true })
    expect(useStore.getState().blindSince).toBe('2026-01-01')
  })

  it('recordSession returns the timestamp and setSessionForm patches that session', () => {
    const rec = { kind: 'challenge' as const, wpm: 30, acc: 0.95, chars: 150, errors: 5, seconds: 60 }
    useStore.getState().recordSession({ ...rec, wpm: 10 })
    const at = useStore.getState().recordSession(rec)
    useStore.getState().setSessionForm(at, 'si')
    const { sessions } = useStore.getState()
    expect(sessions[1].form).toBe('si')
    expect(sessions[0].form).toBeUndefined()
  })

  it('an exam session writes the exam speed of its day', () => {
    useStore.getState().recordSession({ kind: 'exam', wpm: 28, acc: 0.97, chars: 400, errors: 5, seconds: 180, reference: true, blind: true })
    const day = Object.values(useStore.getState().days)[0]
    expect(day.exam).toBe(28)
    expect(day.reference).toEqual([28])
  })

  it('a tip does not move the streak; a session does', () => {
    useStore.getState().completeLesson('guia-tip-intro', 3, 0, 1)
    expect(useStore.getState().streak.count).toBe(0)
    useStore.getState().recordSession({ kind: 'warmup', wpm: 20, acc: 1, chars: 40, errors: 0, seconds: 20 })
    expect(useStore.getState().streak.count).toBe(1)
    expect(useStore.getState().streak.activeDays).toBe(1)
  })

  it('recordSession stamps lastSeen on the keys it saw', () => {
    useStore.getState().recordSession({ kind: 'warmup', wpm: 20, acc: 1, chars: 40, errors: 0, seconds: 20 }, [{ char: 'f', latencies: [300], errors: 0, occurrences: 1 }])
    expect(useStore.getState().keys.f.lastSeen).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('markMilestoneSeen closes that milestone and every smaller one', () => {
    useStore.getState().markMilestoneSeen(30)
    expect(useStore.getState().milestonesSeen).toEqual([7, 14, 30])
    useStore.getState().markMilestoneSeen(7)
    expect(useStore.getState().milestonesSeen).toEqual([7, 14, 30])
  })

  it('resetProgress clears the streak, the milestones and the weekly summary mark', () => {
    useStore.setState({ streak: { count: 3, lastDay: '2026-09-18', best: 5, freezes: 1, activeDays: 9 }, milestonesSeen: [7], lastWeeklySummaryWeek: '2026-09-14' })
    useStore.getState().resetProgress()
    expect(useStore.getState().streak).toEqual({ count: 0, lastDay: null, best: 0, freezes: 0, activeDays: 0 })
    expect(useStore.getState().milestonesSeen).toEqual([])
    expect(useStore.getState().lastWeeklySummaryWeek).toBeNull()
  })

  it('recordSession folds bigram, word and dead-key samples, and the dead-key stats travel with the session', () => {
    useStore.getState().recordSession(
      { kind: 'challenge', wpm: 30, acc: 0.95, chars: 150, errors: 5, seconds: 60, dead: { n: 2, latency: 400, missed: 1, loose: 0 } },
      [{ char: 'f', latencies: [300], errors: 0, occurrences: 1 }],
      { bigrams: [{ bigram: 'ca', latencies: [300], errors: 0 }], words: [{ word: 'casa', latency: 300, errors: 0 }] },
    )
    const s = useStore.getState()
    expect(s.bigrams.ca.samples).toBe(1)
    expect(s.words.casa.samples).toBe(1)
    expect(s.sessions[0].dead).toEqual({ n: 2, latency: 400, missed: 1, loose: 0 })
  })

  it('resetProgress clears the bigram and word tables', () => {
    useStore.setState({ bigrams: { ca: { latencyEma: 300, errorEma: 0, samples: 5 } }, words: { casa: { latencyEma: 300, errorEma: 0, samples: 2, lastSeen: 'x' } } })
    useStore.getState().resetProgress()
    expect(useStore.getState().bigrams).toEqual({})
    expect(useStore.getState().words).toEqual({})
  })

  it('resetProgress clears the exam day and the blind mark', () => {
    useStore.setState({ lastExamDay: '2026-09-14', blindSince: '2026-09-10' })
    useStore.getState().resetProgress()
    expect(useStore.getState().lastExamDay).toBeNull()
    expect(useStore.getState().blindSince).toBeNull()
  })
})
