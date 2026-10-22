import { defineStore } from 'pinia'
import { useWeightLogStore } from '@/entities/WeightLog'
import { todayISO } from '@/shared/lib/date'
import { toNumber } from '@/shared/lib/number'
import { showSaveError, showToast } from '@/shared/lib/toast'

interface Form {
  date: string
  weight: string
}

interface State {
  form: Form
  /** true, как только пользователь сам тронул дату — тогда автообновление на сегодня отключается. */
  dateTouched: boolean
  submitting: boolean
}

function initialForm(): Form {
  return { date: todayISO(), weight: '' }
}

export const useAddWeightStore = defineStore('addWeight', {
  state: (): State => ({ form: initialForm(), dateTouched: false, submitting: false }),

  getters: {
    /** В форме есть несохранённый ввод — нельзя перезагружать страницу ради обновления. */
    isDirty: (state): boolean => state.form.weight.trim() !== '',
    canSubmit: (state): boolean => state.form.date !== '' && toNumber(state.form.weight) !== null,
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

    async submit(): Promise<boolean> {
      const weight = toNumber(this.form.weight)
      if (this.form.date === '' || weight === null) return false

      this.submitting = true
      const weightLog = useWeightLogStore()
      // Процент жира считается отдельно из замеров, здесь только вес.
      const ok = await weightLog.upsert({
        date: this.form.date,
        weight,
        bodyFat: null,
        note: null,
      })
      this.submitting = false
      if (!ok) showSaveError(weightLog.error)
      else if (weightLog.isPendingDate(this.form.date)) {
        showToast('Нет сети — вес сохранён на телефоне, отправится позже', { tone: 'info', durationMs: 5000 })
      } else showToast('Вес сохранён')
      if (ok) this.reset()
      return ok
    },

    reset() {
      this.form = initialForm()
      this.dateTouched = false
    },
  },
})
