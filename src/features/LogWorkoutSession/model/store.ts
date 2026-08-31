import { defineStore } from 'pinia'
import { useWorkoutStore } from '@/entities/Workout'
import { WORKOUT_TEMPLATES, type WorkoutType } from '@/shared/config/workouts'
import { todayISO } from '@/shared/lib/date'
import { toNumber } from '@/shared/lib/number'

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
  type: WorkoutType
  exercises: ExerciseForm[]
  submitting: boolean
}

export const useLogWorkoutStore = defineStore('logWorkout', {
  state: (): State => ({ date: todayISO(), type: 'A', exercises: [], submitting: false }),

  getters: {
    canSubmit: (state): boolean =>
      state.exercises.some((item) => item.weight.trim() !== '' || item.reps.trim() !== ''),
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
      if (ok) this.setType(this.type) // обновить «прошлый раз»/план и очистить цели
      return ok
    },
  },
})
