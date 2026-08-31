/**
 * Процент жира по формуле ВМФ США (мужчины), все размеры в см.
 * Возвращает null, если талия не больше шеи (формула неприменима).
 */
export function navyBodyFatMale(
  waistCm: number,
  neckCm: number,
  heightCm: number,
): number | null {
  if (waistCm <= neckCm) return null
  const value =
    495 /
      (1.0324 - 0.19077 * Math.log10(waistCm - neckCm) + 0.15456 * Math.log10(heightCm)) -
    450
  return Math.round(value * 10) / 10
}
