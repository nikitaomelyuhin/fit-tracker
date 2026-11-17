/** «105 × 3 × 8»; пропущенное значение — прочерк. */
export function formatSet(weight: number | null, sets: number | null, reps: number | null): string {
  const part = (value: number | null) => (value != null ? String(value) : '—')
  return `${part(weight)} × ${part(sets)} × ${part(reps)}`
}
