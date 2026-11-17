import { defineStore } from 'pinia'
import { useWorkoutStore } from '@/entities/Workout'
import { WORKOUT_TEMPLATES, type WorkoutType } from '@/shared/config/workouts'
import { todayISO } from '@/shared/lib/date'
import { toNumber } from '@/shared/lib/number'
import { showSaveError, showToast } from '@/shared/lib/toast'
import { formatSet } from '../helpers/formatSet'

interface ExerciseForm {
  exercise: string
  assist: boolean
  weight: string
  sets: string
  reps: string
  nextWeight: string
  nextSets: string
  nextReps: string
}

interface State {
  date: string
  /** true, как только пользователь сам тронул дату — тогда автообновление на сегодня отключается. */
  dateTouched: boolean
  type: WorkoutType
  exercises: ExerciseForm[]
  /** Снимок предзаполненных значений: поля заполнены планом сами, «изменено» — это отличие от него. */
  baseline: string
  submitting: boolean
  /** Упражнения, где вручную раскрыт блок «Цель на следующий раз». */
  nextOpen: string[]
}

export const useLogWorkoutStore = defineStore('logWorkout', {
  state: (): State => ({
    date: todayISO(),
    dateTouched: false,
    type: 'A',
    exercises: [],
    baseline: '[]',
    submitting: false,
    nextOpen: [],
  }),

  getters: {
    /** Пользователь что-то поменял в предзаполненной форме — нельзя перезагружать ради обновления. */
    isDirty: (state): boolean => JSON.stringify(state.exercises) !== state.baseline,

    canSubmit: (state): boolean =>
      state.exercises.some((item) => item.weight.trim() !== '' || item.reps.trim() !== ''),
    /** Сколько упражнений будет сохранено — для подписи кнопки. */
    filledCount: (state): number =>
      state.exercises.filter((item) => toNumber(item.weight) !== null || toNumber(item.reps) !== null).length,

    /** «Прошлый раз: 105 × 3 × 8» по упражнению, до выбранной даты. */
    lastSummaryFor(): (exercise: string) => string {
      return (exercise: string) => {
        const last = useWorkoutStore().lastEntryFor(exercise, this.date)
        return last ? formatSet(last.weight, last.sets, last.reps) : 'первый раз'
      }
    },

    /** План, поставленный в прошлый раз; null — не ставил. */
    plannedFor(): (exercise: string) => string | null {
      return (exercise: string) => {
        const last = useWorkoutStore().lastEntryFor(exercise, this.date)
        if (!last || (last.nextWeight == null && last.nextReps == null)) return null
        return formatSet(last.nextWeight, last.nextSets, last.nextReps)
      }
    },

    /** Блок цели раскрыт: вручную или потому что в нём уже что-то введено. */
    isNextOpen(): (exercise: string) => boolean {
      return (exercise: string) => {
        if (this.nextOpen.includes(exercise)) return true
        const item = this.exercises.find((ex) => ex.exercise === exercise)
        return !!item && (item.nextWeight !== '' || item.nextSets !== '' || item.nextReps !== '')
      }
    },

    /** Форма ещё не тронута — можно безопасно перезаполнить, когда подъедут данные. */
    isPristine: (state): boolean =>
      state.exercises.every(
        (item) =>
          !item.weight &&
          !item.sets &&
          !item.reps &&
          !item.nextWeight &&
          !item.nextSets &&
          !item.nextReps,
      ),
  },

  actions: {
    /** Тип = следующий по чередованию, поля — из плана прошлой сессии (или из факта). */
    init() {
      const workouts = useWorkoutStore()
      this.setType(this.exercises.length ? this.type : workouts.suggestedType)
    },

    setDate(date: string) {
      this.date = date
      this.dateTouched = true
    },

    /** Подтягивает сегодняшнюю дату, пока пользователь не выбрал дату вручную. */
    refreshDateIfUntouched() {
      if (!this.dateTouched) this.date = todayISO()
    },

    setType(type: WorkoutType) {
      const workouts = useWorkoutStore()
      this.type = type
      this.exercises = WORKOUT_TEMPLATES[type].map((def) => {
        const last = workouts.lastEntryFor(def.name, this.date)
        // Предзаполняем план прошлого раза (если был), иначе факт прошлого раза.
        const weight = last?.nextWeight ?? last?.weight ?? null
        const sets = last?.nextSets ?? last?.sets ?? null
        const reps = last?.nextReps ?? last?.reps ?? null
        return {
          exercise: def.name,
          assist: def.assist ?? false,
          weight: weight != null ? String(weight) : '',
          sets: sets != null ? String(sets) : '',
          reps: reps != null ? String(reps) : '',
          nextWeight: '',
          nextSets: '',
          nextReps: '',
        }
      })
      this.baseline = JSON.stringify(this.exercises)
      this.nextOpen = []
    },

    toggleNext(exercise: string) {
      this.nextOpen = this.nextOpen.includes(exercise)
        ? this.nextOpen.filter((name) => name !== exercise)
        : [...this.nextOpen, exercise]
    },

    async submit(): Promise<boolean> {
      const workouts = useWorkoutStore()
      const entries = this.exercises
        .filter((item) => toNumber(item.weight) !== null || toNumber(item.reps) !== null)
        .map((item) => ({
          exercise: item.exercise,
          weight: toNumber(item.weight),
          sets: toNumber(item.sets),
          reps: toNumber(item.reps),
          nextWeight: toNumber(item.nextWeight),
          nextSets: toNumber(item.nextSets),
          nextReps: toNumber(item.nextReps),
        }))
      if (!entries.length) return false

      this.submitting = true
      const ok = await workouts.saveSession(this.date, this.type, entries)
      this.submitting = false
      if (!ok) showSaveError(workouts.error)
      else if (workouts.isPendingSession(this.date, this.type)) {
        showToast('Нет сети — сохранено на телефоне, отправится, когда появится интернет', { tone: 'info', durationMs: 5000 })
      } else showToast('Тренировка сохранена')
      if (ok) this.setType(this.type) // обновить «прошлый раз»/план и очистить цели
      return ok
    },
  },
})
