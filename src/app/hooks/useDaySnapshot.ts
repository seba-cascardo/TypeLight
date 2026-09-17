import { useEffect } from 'react'
import { dayKey, masteryCounts, masteryMap } from '@/engine/stats'
import { useStore } from '../store'
import { useProgress } from './useCurriculum'

/**
 * Keeps today's row of `days` up to date with how many keys are learned and mastered,
 * so Progreso can draw "hace 7 días" deltas and the days new keys arrived.
 */
export function useDaySnapshot(): void {
  const keys = useStore((s) => s.keys)
  const snapshotDay = useStore((s) => s.snapshotDay)
  const { learned, goalWpm } = useProgress()
  useEffect(() => {
    const counts = masteryCounts(masteryMap(keys, learned, goalWpm, dayKey()))
    snapshotDay(counts.learned, counts.mastered)
  }, [keys, learned, goalWpm, snapshotDay])
}
