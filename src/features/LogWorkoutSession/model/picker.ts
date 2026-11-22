import { defineStore } from 'pinia'
import { useExerciseStore, type Exercise } from '@/entities/Exercise'
import { useWorkoutStore } from '@/entities/Workout'
import { EXERCISE_CATEGORIES, type ExerciseCategory } from '@/shared/config/exercises'
import { daysBetween, todayISO } from '@/shared/lib/date'
import { pluralRu } from '@/shared/lib/plural'
import { showSaveError, showToast } from '@/shared/lib/toast'
import { formatSet } from '../helpers/formatSet'
import { sortByRecent } from '../helpers/sortByRecent'
import { useLogWorkoutStore } from './store'
import type { NewExerciseForm, PickerGroup, PickerOption, PickerTab } from './types'

interface State {
  open: boolean
  tab: PickerTab
  query: string
  /** Открыта форма нового упражнения вместо списка. */
  creating: boolean
  newExercise: NewExerciseForm
  saving: boolean
}

function emptyNewExercise(): NewExerciseForm {
  return { name: '', category: 'other', isCore: false }
}

function agoText(date: string): string {
  const days = daysBetween(date, todayISO())
  if (days <= 0) return 'сегодня'
  if (days === 1) return 'вчера'
  return `${days} ${pluralRu(days, ['день', 'дня', 'дней'])} назад`
}

/** Шторка «Добавить упражнение»: вкладки по группам мышц, поиск, своё упражнение. */
export const useExercisePickerStore = defineStore('exercisePicker', {
  state: (): State => ({
    open: false,
    tab: 'core',
    query: '',
    creating: false,
    newExercise: emptyNewExercise(),
    saving: false,
  }),

  getters: {
    /** «Основа», затем непустые группы мышц, в конце «Все». */
    tabs(): { value: PickerTab; label: string }[] {
      const exercises = useExerciseStore()
      const groups = EXERCISE_CATEGORIES.filter((category) => exercises.inCategory(category.value).length)
      return [{ value: 'core', label: 'Основа' }, ...groups, { value: 'all', label: 'Все' }]
    },

    groups(): PickerGroup[] {
      const exercises = useExerciseStore()
      const workouts = useWorkoutStore()
      const session = useLogWorkoutStore()
      const lastDates = workouts.lastDateByExercise

      const toOptions = (list: Exercise[]): PickerOption[] =>
        sortByRecent(list, lastDates).map((exercise) => {
          const last = workouts.lastEntryFor(exercise.name)
          return {
            exercise,
            inSession: session.hasExercise(exercise.name),
            lastSummary: last ? `${formatSet(last.weight, last.sets, last.reps)} · ${agoText(last.date)}` : null,
          }
        })

      const query = this.query.trim().toLowerCase()
      if (query) {
        const found = exercises.items.filter((exercise) => exercise.name.toLowerCase().includes(query))
        return [{ key: 'search', title: null, options: toOptions(found) }]
      }
      if (this.tab === 'core') return [{ key: 'core', title: null, options: toOptions(exercises.core) }]
      if (this.tab === 'all') {
        return EXERCISE_CATEGORIES.map((category) => ({
          key: category.value,
          title: category.label,
          options: toOptions(exercises.inCategory(category.value)),
        })).filter((group) => group.options.length)
      }
      return [{ key: this.tab, title: null, options: toOptions(exercises.inCategory(this.tab)) }]
    },

    isEmpty(): boolean {
      return this.groups.every((group) => !group.options.length)
    },

    canCreate: (state): boolean => state.newExercise.name.trim() !== '' && !state.saving,
  },

  actions: {
    openPicker() {
      this.open = true
      this.tab = 'core'
      this.query = ''
      this.creating = false
    },

    close() {
      this.open = false
      this.creating = false
      this.query = ''
    },

    setTab(tab: PickerTab) {
      this.tab = tab
    },

    setQuery(query: string) {
      this.query = query
    },

    /** Тап по упражнению — добавить в тренировку; шторка остаётся открытой, чтобы набрать сразу несколько. */
    pick(exercise: Exercise) {
      useLogWorkoutStore().addExercise(exercise.name)
    },

    /** Форма нового упражнения: название — из поиска, группа — из открытой вкладки. */
    startCreate() {
      const category: ExerciseCategory = this.tab === 'core' || this.tab === 'all' ? 'other' : this.tab
      this.newExercise = { name: this.query.trim(), category, isCore: this.tab === 'core' }
      this.creating = true
    },

    cancelCreate() {
      this.creating = false
    },

    /** Записать новое упражнение в справочник и сразу добавить в тренировку. */
    async create(): Promise<boolean> {
      if (!this.canCreate) return false
      const exercises = useExerciseStore()
      this.saving = true
      const saved = await exercises.add(this.newExercise)
      this.saving = false
      if (!saved) {
        showSaveError(exercises.error)
        return false
      }
      useLogWorkoutStore().addExercise(saved.name)
      showToast(`«${saved.name}» добавлено в тренировку`)
      this.creating = false
      this.query = ''
      this.newExercise = emptyNewExercise()
      return true
    },
  },
})
