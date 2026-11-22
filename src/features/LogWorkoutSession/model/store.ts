import { defineStore } from 'pinia'
import { useWorkoutStore, type Workout } from '@/entities/Workout'
import { todayISO } from '@/shared/lib/date'
import { readCache, writeCache } from '@/shared/lib/offlineCache'
import { deleteWithUndo, showSaveError, showToast } from '@/shared/lib/toast'
import { formatSet } from '../helpers/formatSet'
import { buildSessionEntries, isFilled } from '../helpers/buildSessionEntries'
import type { ExerciseForm, WorkoutDraft } from './types'

const DRAFT_KEY = 'workout-draft'

interface State {
  date: string
  /** true, как только пользователь сам тронул дату — тогда автообновление на сегодня отключается. */
  dateTouched: boolean
  exercises: ExerciseForm[]
  /** Снимок формы после загрузки/сохранения: «изменено» — это отличие от него. */
  baseline: string
  /** Какие упражнения были в сохранённой тренировке, когда её открыли: убранные из них удалятся при сохранении. */
  loaded: { date: string; names: string[] }
  submitting: boolean
  /** Упражнения, где вручную раскрыт блок «Цель на следующий раз». */
  nextOpen: string[]
}

/** Подписка на сохранение черновика ставится один раз за жизнь приложения. */
let draftBound = false

function text(value: number | null): string {
  return value != null ? String(value) : ''
}

/** Сохранённая запись → поля формы (факт и цель как были записаны). */
function toForm(entry: Workout): ExerciseForm {
  return {
    exercise: entry.exercise,
    weight: text(entry.weight),
    sets: text(entry.sets),
    reps: text(entry.reps),
    nextWeight: text(entry.nextWeight),
    nextSets: text(entry.nextSets),
    nextReps: text(entry.nextReps),
  }
}

export const useLogWorkoutStore = defineStore('logWorkout', {
  state: (): State => ({
    date: todayISO(),
    dateTouched: false,
    exercises: [],
    baseline: '[]',
    loaded: { date: '', names: [] },
    submitting: false,
    nextOpen: [],
  }),

  getters: {
    /** Пользователь что-то поменял — нельзя перезагружать форму ради обновления. */
    isDirty: (state): boolean => JSON.stringify(state.exercises) !== state.baseline,

    /** Сколько упражнений будет сохранено — для подписи кнопки. */
    filledCount: (state): number => state.exercises.filter(isFilled).length,

    canSubmit(): boolean {
      return this.filledCount > 0
    },

    hasExercise(): (exercise: string) => boolean {
      return (exercise: string) => this.exercises.some((item) => item.exercise === exercise)
    },

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
  },

  actions: {
    /**
     * Первый вход — поднять недописанный черновик (если приложение закрылось
     * посреди тренировки), иначе показать тренировку выбранного дня.
     */
    init() {
      if (!draftBound) {
        draftBound = true
        const draft = readCache<WorkoutDraft>(DRAFT_KEY)
        if (draft?.exercises?.length) {
          this.loadForDate(draft.date)
          this.date = draft.date
          // Черновик не за сегодня — дата остаётся его, а не перескакивает на сегодня.
          this.dateTouched = draft.date !== todayISO()
          this.exercises = draft.exercises
        } else {
          this.loadForDate(this.date)
        }
        this.$subscribe(() => this.persistDraft())
        return
      }
      if (!this.isDirty) this.loadForDate(this.date)
    },

    persistDraft() {
      writeCache<WorkoutDraft | null>(DRAFT_KEY, this.isDirty ? { date: this.date, exercises: this.exercises } : null)
    },

    /** Показать сохранённую тренировку дня (или пустую форму, если её не было). */
    loadForDate(date: string) {
      const session = useWorkoutStore().sessionFor(date)
      this.exercises = session ? session.entries.map(toForm) : []
      this.baseline = JSON.stringify(this.exercises)
      this.loaded = { date, names: this.exercises.map((item) => item.exercise) }
      this.nextOpen = []
    },

    /** Подъехали данные с сервера — обновить форму, если в ней ничего не меняли. */
    syncWithSaved() {
      if (!this.isDirty) this.loadForDate(this.date)
    },

    /**
     * Сменить дату. Если в форме ничего не меняли — открыть тренировку того дня;
     * если уже что-то ввёл — введённое остаётся и сохранится на новую дату.
     */
    setDate(date: string) {
      this.date = date
      this.dateTouched = true
      if (!this.isDirty) this.loadForDate(date)
    },

    /** Подтягивает сегодняшнюю дату, пока пользователь не выбрал дату вручную. */
    refreshDateIfUntouched() {
      const today = todayISO()
      if (this.dateTouched || this.date === today) return
      this.date = today
      if (!this.isDirty) this.loadForDate(today)
    },

    /** Добавить упражнение; поля — из плана прошлого раза (если был), иначе из факта прошлого раза. */
    addExercise(exercise: string) {
      if (this.hasExercise(exercise)) return
      const last = useWorkoutStore().lastEntryFor(exercise, this.date)
      this.exercises.push({
        exercise,
        weight: text(last?.nextWeight ?? last?.weight ?? null),
        sets: text(last?.nextSets ?? last?.sets ?? null),
        reps: text(last?.nextReps ?? last?.reps ?? null),
        nextWeight: '',
        nextSets: '',
        nextReps: '',
      })
    },

    /** Убрать упражнение из тренировки — с отменой, чтобы случайный тап не стёр введённое. */
    removeExercise(exercise: string) {
      const index = this.exercises.findIndex((item) => item.exercise === exercise)
      if (index < 0) return
      const item = this.exercises[index]
      deleteWithUndo({
        text: `«${exercise}» убрано`,
        apply: () => {
          this.exercises = this.exercises.filter((entry) => entry.exercise !== exercise)
        },
        revert: () => {
          if (this.hasExercise(exercise)) return
          const next = [...this.exercises]
          next.splice(Math.min(index, next.length), 0, item)
          this.exercises = next
        },
        commit: async () => true,
      })
    },

    toggleNext(exercise: string) {
      this.nextOpen = this.nextOpen.includes(exercise)
        ? this.nextOpen.filter((name) => name !== exercise)
        : [...this.nextOpen, exercise]
    },

    async submit(): Promise<boolean> {
      const workouts = useWorkoutStore()
      const entries = buildSessionEntries(this.exercises)
      if (!entries.length) return false

      // Удаляются только упражнения, которые были в сохранённой тренировке этого дня и которые убрал сам.
      const kept = new Set(entries.map((entry) => entry.exercise))
      const removed = this.loaded.date === this.date ? this.loaded.names.filter((name) => !kept.has(name)) : []

      this.submitting = true
      const ok = await workouts.saveSession(this.date, entries, removed)
      this.submitting = false
      if (!ok) {
        showSaveError(workouts.error)
        return false
      }

      if (workouts.isPendingSession(this.date)) {
        showToast('Нет сети — сохранено на телефоне, отправится, когда появится интернет', { tone: 'info', durationMs: 5000 })
      } else showToast('Тренировка сохранена')

      // Форма остаётся как есть — можно дописать следующие упражнения и сохранить ещё раз.
      this.baseline = JSON.stringify(this.exercises)
      this.loaded = { date: this.date, names: [...kept] }
      return true
    },
  },
})
