import { defineStore } from 'pinia'
import { useProgressPhotoStore } from '@/entities/ProgressPhoto'
import type { PhotoAngle } from '@/shared/config/photos'
import { todayISO } from '@/shared/lib/date'

interface Form {
  date: string
  angle: PhotoAngle
  file: File | null
  note: string
}

interface State {
  form: Form
  /** true, как только пользователь сам тронул дату — тогда автообновление на сегодня отключается. */
  dateTouched: boolean
  submitting: boolean
}

function emptyForm(): Form {
  return { date: todayISO(), angle: 'front', file: null, note: '' }
}

export const useAddProgressPhotoStore = defineStore('addProgressPhoto', {
  state: (): State => ({ form: emptyForm(), dateTouched: false, submitting: false }),

  getters: {
    canSubmit(): boolean {
      return this.form.date !== '' && this.form.file != null
    },
  },

  actions: {
    setDate(date: string) {
      this.form.date = date
      this.dateTouched = true
    },

    /** Подтягивает сегодняшнюю дату, пока пользователь не выбрал дату вручную. */
    refreshDateIfUntouched() {
      if (!this.dateTouched) this.form.date = todayISO()
    },

    setAngle(angle: PhotoAngle) {
      this.form.angle = angle
    },

    setFile(file: File | null) {
      this.form.file = file
    },

    setNote(note: string) {
      this.form.note = note
    },

    async submit(): Promise<boolean> {
      if (!this.canSubmit || !this.form.file) return false

      this.submitting = true
      const photos = useProgressPhotoStore()
      const ok = await photos.upsert({
        date: this.form.date,
        angle: this.form.angle,
        file: this.form.file,
        note: this.form.note.trim() || null,
      })
      this.submitting = false
      if (ok) {
        this.form = emptyForm()
        this.dateTouched = false
      }
      return ok
    },
  },
})
