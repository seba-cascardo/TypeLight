/** The Reto of the day, in one line to paste to someone: the same text for everyone that day, so it compares. */
export function shareText({ day, wpm, accuracy, goalWpm }: { day: string; wpm: number; accuracy: number; goalWpm: number }): string {
  const [, m, d] = day.split('-').map(Number)
  // five boxes fill only at the unit goal; anything typed lights at least one
  const boxes = wpm <= 0 ? 0 : Math.max(1, Math.min(5, Math.floor((wpm / Math.max(1, goalWpm)) * 5)))
  const bar = '🟩'.repeat(boxes) + '⬜'.repeat(5 - boxes)
  return `TypeLight · Reto ${d}/${m} · ${wpm} PPM · ${Math.round(accuracy * 100)} % al primer intento · ⌨️ ${bar}`
}
