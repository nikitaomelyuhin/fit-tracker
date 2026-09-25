import { PHOTO_ANGLES, type PhotoAngle } from '@/shared/config/photos'
import type { ProgressPhoto, ProgressPhotoRow } from '../model/types'

function angle(value: string): PhotoAngle {
  return (PHOTO_ANGLES as readonly string[]).includes(value) ? (value as PhotoAngle) : 'front'
}

/** Преобразует строку Supabase в доменную модель — url подставляется отдельно (подписанная ссылка). */
export function mapProgressPhoto(row: ProgressPhotoRow): ProgressPhoto {
  return {
    id: row.id,
    date: row.date,
    angle: angle(row.angle),
    storagePath: row.storage_path,
    note: row.note,
    url: null,
  }
}
