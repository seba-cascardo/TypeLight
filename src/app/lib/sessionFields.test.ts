import { describe, expect, it } from 'vitest'
import { repairFields } from './sessionFields'

describe('repairFields', () => {
  it('turns the repair metrics into session fields, or nothing in stop mode', () => {
    const repair = { firstTryErrors: 2, kspc: 1.08, erred: 1, repaired: 1, repairMs: 300 }
    expect(repairFields(repair, 'word')).toEqual({ mode: 'word', firstTryErrors: 2, kspc: 1.08, repaired: 1, repairMs: 300 })
    expect(repairFields(null, 'free')).toEqual({})
  })
})
