export interface Measurement {
  id: string
  date: string // YYYY-MM-DD
  waist: number | null
  chest: number | null
  shoulders: number | null
  arm: number | null
  forearm: number | null
  neck: number | null
  note: string | null
}

/**
 * Ввод нового замера. Только талия — она кормит % жира (RFM) и это
 * единственная метрика, которую сейчас отслеживаем; остальные обхваты
 * (грудь/плечи/рука/предплечье) остаются в Measurement и MeasurementRow
 * только чтобы корректно читать старые записи, но больше не собираются.
 */
export interface MeasurementInput {
  date: string
  waist: number | null
  note: string | null
}

/** Строка из таблицы Supabase measurements. */
export interface MeasurementRow {
  id: string
  date: string
  waist: number | string | null
  chest: number | string | null
  shoulders: number | string | null
  arm: number | string | null
  forearm: number | string | null
  neck: number | string | null
  note: string | null
}
