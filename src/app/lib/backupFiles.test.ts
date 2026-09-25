import { describe, expect, it } from 'vitest'
import { autoBackupName, backupPrefix, dayLabel, filesToDelete, listBackups, parseBackupName, reasonLabel, sinceLabel } from './backupFiles'

const P = backupPrefix(false)
const day = (i: number) => new Date(Date.UTC(2026, 0, 1 + i * 3)).toISOString().slice(0, 10)

describe('backup file names', () => {
  it('the build and the dev server write different names', () => {
    expect(autoBackupName(P, '2026-09-25')).toBe('typelight-progreso-2026-09-25.json')
    expect(autoBackupName(P, '2026-09-25', 'antes-de-reiniciar')).toBe('typelight-progreso-2026-09-25-antes-de-reiniciar.json')
    expect(autoBackupName(backupPrefix(true), '2026-09-25')).toBe('typelight-dev-progreso-2026-09-25.json')
  })

  it('only recognizes the names it writes', () => {
    expect(parseBackupName(P, 'typelight-progreso-2026-09-25.json')).toEqual({ name: 'typelight-progreso-2026-09-25.json', day: '2026-09-25', reason: null })
    expect(parseBackupName(P, 'typelight-progreso-2026-09-25-antes-de-importar.json')?.reason).toBe('antes-de-importar')
    expect(parseBackupName(P, 'typelight-progreso-2026-09-25 (1).json')).toBeNull()
    expect(parseBackupName(P, 'notas.txt')).toBeNull()
    expect(parseBackupName(P, 'typelight-dev-progreso-2026-09-25.json')).toBeNull()
    expect(parseBackupName(backupPrefix(true), 'typelight-progreso-2026-09-25.json')).toBeNull()
  })

  it('lists newest day first, the running copy before the snapshots of its day', () => {
    const names = ['typelight-progreso-2026-09-24.json', 'typelight-progreso-2026-09-25-antes-de-reiniciar.json', 'typelight-progreso-2026-09-25.json', 'otro.json']
    expect(listBackups(P, names).map((f) => f.name)).toEqual([
      'typelight-progreso-2026-09-25.json',
      'typelight-progreso-2026-09-25-antes-de-reiniciar.json',
      'typelight-progreso-2026-09-24.json',
    ])
  })
})

describe('rotation', () => {
  it('keeps the 30 most recent days that have a copy, even with gaps between them', () => {
    const names = Array.from({ length: 35 }, (_, i) => autoBackupName(P, day(i)))
    expect(filesToDelete(P, names).sort()).toEqual(names.slice(0, 5).sort())
  })

  it('a snapshot goes with its day, and files that are not ours are never touched', () => {
    const names = [
      ...Array.from({ length: 31 }, (_, i) => autoBackupName(P, day(i))),
      autoBackupName(P, day(0), 'antes-de-importar'),
      autoBackupName(P, day(30), 'antes-de-reiniciar'),
      'notas.txt',
      'typelight-dev-progreso-2020-01-01.json',
    ]
    expect(filesToDelete(P, names).sort()).toEqual([autoBackupName(P, day(0)), autoBackupName(P, day(0), 'antes-de-importar')].sort())
  })

  it('under 30 days nothing goes', () => {
    expect(filesToDelete(P, [autoBackupName(P, day(0)), autoBackupName(P, day(1))])).toEqual([])
  })
})

describe('labels', () => {
  const now = new Date('2026-09-25T15:00:00').getTime()
  it('how long ago the last copy was written', () => {
    expect(sinceLabel(now - 20_000, now)).toBe('recién')
    expect(sinceLabel(now - 12 * 60_000, now)).toBe('hace 12 min')
    expect(sinceLabel(now - 3 * 3_600_000, now)).toBe('hace 3 h')
    expect(sinceLabel(new Date('2026-09-20T10:00:00').getTime(), now)).toBe('el 20/9/2026')
  })

  it('days and reasons read in Spanish', () => {
    expect(dayLabel('2026-09-05')).toBe('05/09/2026')
    expect(reasonLabel('antes-de-reiniciar')).toBe('antes de reiniciar')
    expect(reasonLabel('antes-de-importar')).toBe('antes de importar')
    expect(reasonLabel(null)).toBe('')
  })
})
