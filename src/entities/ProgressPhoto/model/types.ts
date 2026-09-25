import type { PhotoAngle } from '@/shared/config/photos'

export interface ProgressPhoto {
  id: string
  date: string
  angle: PhotoAngle
  storagePath: string
  note: string | null
  /** Подписанная ссылка на файл — подтягивается отдельно после загрузки строк, бакет приватный. */
  url: string | null
}

export interface ProgressPhotoInput {
  date: string
  angle: PhotoAngle
  file: File
  note: string | null
}

/** Строка из таблицы Supabase progress_photos. */
export interface ProgressPhotoRow {
  id: string
  date: string
  angle: string
  storage_path: string
  note: string | null
}

/** Фото одной даты, по ракурсам (для сетки в истории). */
export interface ProgressPhotoDayGroup {
  date: string
  photos: ProgressPhoto[]
}
