import { defineStore } from 'pinia'
import { useMeasurementStore } from '@/entities/Measurement'
import { todayISO } from '@/shared/lib/date'
import { toNumber } from '@/shared/lib/number'

interface Form {
  date: string
  waist: string
  chest: string
  shoulders: string
  arm: string
  forearm: string
  neck: string
  note: string
}

interface State {
  form: Form
  submitting: boolean
}

function initialForm(): Form {
  return { date: todayISO(), waist: '', chest: '', shoulders: '', arm: '', forearm: '', neck: '', note: '' }
}

export const useAddMeasurementStore = defineStore('addMeasurement', {
  state: (): State => ({ form: initialForm(), submitting: false }),

  getters: {
    hasAnyValue: (state): boolean =>
      [state.form.waist, state.form.chest, state.form.shoulders, state.form.arm, state.form.forearm, state.form.neck]
        .some((value) => value.trim() !== ''),
    canSubmit(): boolean {
      return this.form.date !== '' && this.hasAnyValue
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
        chest: toNumber(this.form.chest),
        shoulders: toNumber(this.form.shoulders),
        arm: toNumber(this.form.arm),
        forearm: toNumber(this.form.forearm),
        neck: toNumber(this.form.neck),
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
