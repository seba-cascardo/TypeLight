/** The weekly exam: three minutes, no help, no Backspace, once per ISO week on the first day the routine reaches it. */

/** Monday of the ISO week containing `day`, as yyyy-mm-dd. */
export function weekKey(day: string): string {
  const [y, m, d] = day.split('-').map(Number)
  const t = new Date(Date.UTC(y, m - 1, d))
  const dow = (t.getUTCDay() + 6) % 7 // Monday = 0
  t.setUTCDate(t.getUTCDate() - dow)
  return `${t.getUTCFullYear()}-${String(t.getUTCMonth() + 1).padStart(2, '0')}-${String(t.getUTCDate()).padStart(2, '0')}`
}

/** yyyy-mm: the exam text is fixed for the month. */
export function monthKey(day: string): string {
  return day.slice(0, 7)
}

/** Due when never taken, or taken in an earlier week than `today`. */
export function examDue(lastExamDay: string | null, today: string): boolean {
  if (!lastExamDay) return true
  return weekKey(lastExamDay) !== weekKey(today)
}
