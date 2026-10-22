import { defineStore } from 'pinia'
import { useCheatDayStore } from '@/entities/CheatDay'
import { todayISO } from '@/shared/lib/date'
import { showSaveError, showToast } from '@/shared/lib/toast'

interface State {
  date: string
  /** true, как только пользователь сам тронул дату — тогда автообновление на сегодня отключается. */
  dateTouched: boolean
  submitting: boolean
}

export const useMarkCheatDayStore = defineStore('markCheatDay', {
  state: (): State => ({ date: todayISO(), dateTouched: false, submitting: false }),

  getters: {
    canSubmit(): boolean {
      return this.date !== ''
    },
  },

  actions: {
    setDate(date: string) {
      this.date = date
      this.dateTouched = true
    },

    /** Подтягивает сегодняшнюю дату, пока пользователь не выбрал дату вручную. */
    refreshDateIfUntouched() {
      if (!this.dateTouched) this.date = todayISO()
    },

    async submit(): Promise<boolean> {
      if (!this.canSubmit) return false
      this.submitting = true
      const ok = await useCheatDayStore().add(this.date)
      this.submitting = false
      if (ok) showToast('День отмечен читмилом')
      else showSaveError(useCheatDayStore().error)
      if (ok) this.dateTouched = false
      return ok
    },
  },
})
