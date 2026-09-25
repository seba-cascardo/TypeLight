import type { RepairMetrics } from '@/engine/typing'
import type { SessionRecord } from '../store'

/** The repair metrics of a free or word mode session, as the fields its record carries (none in stop mode). */
export function repairFields(repair: RepairMetrics | null, mode: 'free' | 'word'): Partial<SessionRecord> {
  if (!repair) return {}
  return { mode, firstTryErrors: repair.firstTryErrors, kspc: repair.kspc, repaired: repair.repaired, repairMs: repair.repairMs }
}
