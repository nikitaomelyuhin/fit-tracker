import { defineStore } from 'pinia'
import { useMeasurementStore } from '@/entities/Measurement'
import { todayISO } from '@/shared/lib/date'
import { toNumber } from '@/shared/lib/number'

interface Form {
  date: string
  waist: string
  note: string
}

interface State {
  form: Form
  submitting: boolean
}

function initialForm(): Form {
  return { date: todayISO(), waist: '', note: '' }
}

export const useAddMeasurementStore = defineStore('addMeasurement', {
  state: (): State => ({ form: initialForm(), submitting: false }),

  getters: {
    canSubmit(): boolean {
      return this.form.date !== '' && this.form.waist.trim() !== ''
    },
  },

  actions: {
    async submit(): Promise<boolean> {
      if (!this.canSubmit) return false

      this.submitting = true
      const measurements = useMeasurementStore()
      const ok = await measurements.upsert({
        date: this.form.date,
        waist: toNumber(this.form.waist),
        note: this.form.note.trim() || null,
      })
      this.submitting = false
      if (ok) this.reset()
      return ok
    },

    reset() {
      this.form = initialForm()
    },
  },
})
