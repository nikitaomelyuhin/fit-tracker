import type { Measurement, MeasurementRow } from '../model/types'

function num(value: number | string | null): number | null {
  return value != null ? Number(value) : null
}

/** Преобразует строку Supabase в доменную модель замеров. */
export function mapMeasurement(row: MeasurementRow): Measurement {
  return {
    id: row.id,
    date: row.date,
    waist: num(row.waist),
    chest: num(row.chest),
    shoulders: num(row.shoulders),
    arm: num(row.arm),
    forearm: num(row.forearm),
    neck: num(row.neck),
    note: row.note ?? null,
  }
}
