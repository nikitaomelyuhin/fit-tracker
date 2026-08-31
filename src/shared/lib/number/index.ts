/** Парсит строку из инпута в число (поддерживает запятую) или null для пустого. */
export function toNumber(value: string): number | null {
  const normalized = value.replace(',', '.').trim()
  if (normalized === '') return null
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : null
}
