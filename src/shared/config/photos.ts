export const PHOTO_ANGLES = ['front', 'side', 'back'] as const
export type PhotoAngle = (typeof PHOTO_ANGLES)[number]

export const PHOTO_ANGLE_LABELS: Record<PhotoAngle, string> = {
  front: 'Спереди',
  side: 'Сбоку',
  back: 'Сзади',
}

/** Бакет в Supabase Storage, где лежат сами файлы фото. */
export const PROGRESS_PHOTOS_BUCKET = 'progress-photos'

/** Срок жизни подписанной ссылки на фото (сек) — бакет приватный. */
export const PHOTO_SIGNED_URL_TTL = 60 * 60 * 24
