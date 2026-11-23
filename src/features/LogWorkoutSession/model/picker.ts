import { defineStore } from 'pinia'
import { useExerciseStore, type Exercise } from '@/entities/Exercise'
import { useWorkoutStore } from '@/entities/Workout'
import { EXERCISE_CATEGORIES, exerciseCategoryLabel, type ExerciseCategory } from '@/shared/config/exercises'
import { daysBetween, todayISO } from '@/shared/lib/date'
import { pluralRu } from '@/shared/lib/plural'
import { showSaveError, showToast } from '@/shared/lib/toast'
import { formatSet } from '../helpers/formatSet'
import { sortByRecent } from '../helpers/sortByRecent'
import { useLogWorkoutStore } from './store'
import type { ExerciseDetails, ExerciseDetailsMode, PickerGroup, PickerOption, PickerTab } from './types'

interface State {
  open: boolean
  tab: PickerTab
  query: string
  /** Режим правки списка: тап по упражнению открывает его правку, а не добавляет в тренировку. */
  managing: boolean
  /** Вместо списка открыта форма: новое упражнение или правка существующего. */
  detailsMode: ExerciseDetailsMode | null
  /** Какое упражнение правится (в режиме 'edit'). */
  editingId: string | null
  details: ExerciseDetails
  saving: boolean
}

function emptyDetails(): ExerciseDetails {
  return { name: '', category: 'other', isCore: false }
}

function agoText(date: string): string {
  const days = daysBetween(date, todayISO())
  if (days <= 0) return 'сегодня'
  if (days === 1) return 'вчера'
  return `${days} ${pluralRu(days, ['день', 'дня', 'дней'])} назад`
}

/** Шторка «Добавить упражнение»: вкладки по группам мышц, поиск, своё упражнение, правка списка. */
export const useExercisePickerStore = defineStore('exercisePicker', {
  state: (): State => ({
    open: false,
    tab: 'core',
    query: '',
    managing: false,
    detailsMode: null,
    editingId: null,
    details: emptyDetails(),
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
            catalogSummary: [exerciseCategoryLabel(exercise.category), exercise.isCore ? 'Основа' : null]
              .filter(Boolean)
              .join(' · '),
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

    canSubmitDetails: (state): boolean => state.details.name.trim() !== '' && !state.saving,

    sheetTitle: (state): string => {
      if (state.detailsMode === 'create') return 'Новое упражнение'
      if (state.detailsMode === 'edit') return 'Изменить упражнение'
      return 'Добавить упражнение'
    },
  },

  actions: {
    openPicker() {
      this.open = true
      this.tab = 'core'
      this.query = ''
      this.managing = false
      this.detailsMode = null
    },

    close() {
      this.open = false
      this.managing = false
      this.detailsMode = null
      this.query = ''
    },

    toggleManaging() {
      this.managing = !this.managing
    },

    setTab(tab: PickerTab) {
      this.tab = tab
    },

    setQuery(query: string) {
      this.query = query
    },

    /**
     * Тап по упражнению — добавить в тренировку (шторка остаётся открытой, чтобы набрать
     * сразу несколько). В режиме правки списка — открыть правку упражнения.
     */
    pick(exercise: Exercise) {
      if (this.managing) {
        this.startEdit(exercise)
        return
      }
      useLogWorkoutStore().addExercise(exercise.name)
    },

    /** Форма нового упражнения: название — из поиска, группа — из открытой вкладки. */
    startCreate() {
      const category: ExerciseCategory = this.tab === 'core' || this.tab === 'all' ? 'other' : this.tab
      this.details = { name: this.query.trim(), category, isCore: this.tab === 'core' }
      this.editingId = null
      this.detailsMode = 'create'
    },

    startEdit(exercise: Exercise) {
      this.details = { name: exercise.name, category: exercise.category, isCore: exercise.isCore }
      this.editingId = exercise.id
      this.detailsMode = 'edit'
    },

    /** «Назад» из формы — к списку. */
    cancelDetails() {
      this.detailsMode = null
      this.editingId = null
    },

    submitDetails(): Promise<boolean> {
      return this.detailsMode === 'edit' ? this.saveEdit() : this.create()
    },

    /** Записать новое упражнение в справочник и сразу добавить в тренировку. */
    async create(): Promise<boolean> {
      if (!this.canSubmitDetails) return false
      const exercises = useExerciseStore()
      this.saving = true
      const saved = await exercises.add(this.details)
      this.saving = false
      if (!saved) {
        showSaveError(exercises.error)
        return false
      }
      useLogWorkoutStore().addExercise(saved.name)
      showToast(`«${saved.name}» добавлено в тренировку`)
      this.detailsMode = null
      this.query = ''
      this.details = emptyDetails()
      return true
    },

    /**
     * Сохранить правку упражнения. Новое название переносится на всю историю тренировок
     * и в открытую форму; если историю переименовать не вышло — справочник откатывается.
     */
    async saveEdit(): Promise<boolean> {
      if (!this.canSubmitDetails || !this.editingId) return false
      const exercises = useExerciseStore()
      const before = exercises.items.find((item) => item.id === this.editingId)
      if (!before) return false

      this.saving = true
      const saved = await exercises.update(this.editingId, this.details)
      if (!saved) {
        this.saving = false
        showSaveError(exercises.error)
        return false
      }

      if (saved.name !== before.name) {
        const workouts = useWorkoutStore()
        const renamed = await workouts.renameExercise(before.name, saved.name)
        if (!renamed) {
          await exercises.update(before.id, { name: before.name, category: before.category, isCore: before.isCore })
          this.saving = false
          showSaveError(workouts.error)
          return false
        }
        useLogWorkoutStore().renameExercise(before.name, saved.name)
      }

      this.saving = false
      showToast('Упражнение сохранено')
      this.cancelDetails()
      return true
    },

    /** Удалить упражнение из списка (с отменой); история тренировок по нему не трогается. */
    removeEditing() {
      if (!this.editingId) return
      useExerciseStore().remove(this.editingId)
      this.cancelDetails()
    },
  },
})
