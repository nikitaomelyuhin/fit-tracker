/**
 * Оценка процента жира (мужчины) по обхвату талии и росту, все размеры в см.
 *
 * За основу взята формула RFM (Relative Fat Mass): 64 − 20 × (рост / талия),
 * привязанная к личной точке отсчёта: талия 108 см = 28.5% жира.
 * Шея и вес намеренно НЕ используются: шея ломает оценку у тех, кто её качает,
 * а вес не отличает потерю жира от потери мышц. Талия — единственный обхват,
 * который честно отражает жир и не обманывается мышцами/водой.
 *
 * Возвращает null, если талия не задана или некорректна.
 */

/** Точка отсчёта: при этой талии показываем базовый процент. */
const ANCHOR_WAIST_CM = 108
const ANCHOR_BODY_FAT = 28.5

function rfm(waistCm: number, heightCm: number): number {
  return 64 - 20 * (heightCm / waistCm)
}

export function estimateBodyFatMale(waistCm: number, heightCm: number): number | null {
  if (waistCm <= 0 || heightCm <= 0) return null
  const offset = ANCHOR_BODY_FAT - rfm(ANCHOR_WAIST_CM, heightCm)
  const value = rfm(waistCm, heightCm) + offset
  return Math.round(value * 10) / 10
}
