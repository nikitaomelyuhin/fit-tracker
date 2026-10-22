import { defineStore } from 'pinia'
import { supabase } from '@/shared/supabase'
import { useSessionStore } from '@/entities/Session'
import { PHOTO_SIGNED_URL_TTL, PROGRESS_PHOTOS_BUCKET } from '@/shared/config/photos'
import { mapProgressPhoto } from '../helpers/mapProgressPhoto'
import type { ProgressPhoto, ProgressPhotoDayGroup, ProgressPhotoInput, ProgressPhotoRow } from './types'

interface State {
  items: ProgressPhoto[]
  /** Подписанная ссылка на картинку-ориентир (лежит в том же закрытом бакете). */
  referenceUrl: string | null
  uploadingReference: boolean
  loading: boolean
  error: string | null
}

/** Путь к картинке-ориентиру внутри папки пользователя в бакете. */
const REFERENCE_FILE = 'reference'

function extensionOf(file: File): string {
  const dot = file.name.lastIndexOf('.')
  return dot >= 0 ? file.name.slice(dot + 1).toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg' : 'jpg'
}

export const useProgressPhotoStore = defineStore('progressPhoto', {
  state: (): State => ({ items: [], referenceUrl: null, uploadingReference: false, loading: false, error: null }),

  getters: {
    byDateDesc: (state): ProgressPhoto[] =>
      [...state.items].sort((a, b) => (a.date < b.date ? 1 : -1)),

    groupedByDateDesc(): ProgressPhotoDayGroup[] {
      const byDate = new Map<string, ProgressPhoto[]>()
      for (const photo of this.items) {
        const arr = byDate.get(photo.date) ?? []
        arr.push(photo)
        byDate.set(photo.date, arr)
      }
      return [...byDate.entries()]
        .sort((a, b) => (a[0] < b[0] ? 1 : -1))
        .map(([date, photos]) => ({ date, photos }))
    },
  },

  actions: {
    async load() {
      this.loading = true
      this.error = null
      const { data, error } = await supabase
        .from('progress_photos')
        .select('*')
        .order('date', { ascending: false })
      if (error) {
        this.error = error.message
        this.loading = false
        return
      }

      const rows = data as ProgressPhotoRow[]
      const paths = rows.map((row) => row.storage_path)
      const urlByPath = new Map<string, string>()
      if (paths.length) {
        const { data: signed } = await supabase.storage
          .from(PROGRESS_PHOTOS_BUCKET)
          .createSignedUrls(paths, PHOTO_SIGNED_URL_TTL)
        for (const item of signed ?? []) {
          if (item.signedUrl) urlByPath.set(item.path ?? '', item.signedUrl)
        }
      }

      this.items = rows.map((row) => ({
        ...mapProgressPhoto(row),
        url: urlByPath.get(row.storage_path) ?? null,
      }))
      await this.loadReference()
      this.loading = false
    },

    /** Картинка-ориентир: файла может не быть — тогда просто null, без ошибки. */
    async loadReference() {
      const userId = useSessionStore().user?.id
      if (!userId) return
      const { data } = await supabase.storage
        .from(PROGRESS_PHOTOS_BUCKET)
        .createSignedUrl(`${userId}/${REFERENCE_FILE}`, PHOTO_SIGNED_URL_TTL)
      this.referenceUrl = data?.signedUrl ?? null
    },

    /** Загрузить/заменить картинку-ориентир. Хранится приватно, как и фото прогресса. */
    async uploadReference(file: File): Promise<boolean> {
      this.error = null
      const userId = useSessionStore().user?.id
      if (!userId) {
        this.error = 'Нет сессии'
        return false
      }
      this.uploadingReference = true
      const { error } = await supabase.storage
        .from(PROGRESS_PHOTOS_BUCKET)
        .upload(`${userId}/${REFERENCE_FILE}`, file, { upsert: true, contentType: file.type })
      if (error) {
        this.error = error.message
        this.uploadingReference = false
        return false
      }
      await this.loadReference()
      this.uploadingReference = false
      return true
    },

    /** Загружает файл в Storage и сохраняет/обновляет запись (одна на дату+ракурс). */
    async upsert(input: ProgressPhotoInput): Promise<boolean> {
      this.error = null
      const session = useSessionStore()
      const userId = session.user?.id
      if (!userId) {
        this.error = 'Нет сессии'
        return false
      }

      const path = `${userId}/${input.date}-${input.angle}.${extensionOf(input.file)}`
      const uploaded = await supabase.storage
        .from(PROGRESS_PHOTOS_BUCKET)
        .upload(path, input.file, { upsert: true, contentType: input.file.type })
      if (uploaded.error) {
        this.error = uploaded.error.message
        return false
      }

      const { data, error } = await supabase
        .from('progress_photos')
        .upsert(
          { date: input.date, angle: input.angle, storage_path: path, note: input.note },
          { onConflict: 'user_id,date,angle' },
        )
        .select()
        .single()
      if (error) {
        this.error = error.message
        return false
      }

      const { data: signed } = await supabase.storage
        .from(PROGRESS_PHOTOS_BUCKET)
        .createSignedUrl(path, PHOTO_SIGNED_URL_TTL)

      const saved: ProgressPhoto = { ...mapProgressPhoto(data as ProgressPhotoRow), url: signed?.signedUrl ?? null }
      const index = this.items.findIndex((item) => item.id === saved.id)
      if (index >= 0) this.items[index] = saved
      else this.items.push(saved)
      return true
    },

    async remove(id: string) {
      this.error = null
      const photo = this.items.find((item) => item.id === id)
      if (!photo) return

      await supabase.storage.from(PROGRESS_PHOTOS_BUCKET).remove([photo.storagePath])
      const { error } = await supabase.from('progress_photos').delete().eq('id', id)
      if (error) {
        this.error = error.message
        return
      }
      this.items = this.items.filter((item) => item.id !== id)
    },
  },
})
