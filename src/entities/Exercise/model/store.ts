import { defineStore } from 'pinia'
import { supabase } from '@/shared/supabase'
import { readCache, writeCache } from '@/shared/lib/offlineCache'
import { isOfflineError } from '@/shared/lib/network'
import { deleteWithUndo } from '@/shared/lib/toast'
import type { ExerciseCategory } from '@/shared/config/exercises'
import { mapExercise } from '../helpers/mapExercise'
import type { Exercise, ExerciseInput, ExerciseRow } from './types'

/** Упражнение, созданное без интернета и ещё не записанное в базу. */
interface QueuedExercise {
  id: string
  input: ExerciseInput
}

const QUEUE_KEY = 'exercise-queue'
/** Префикс id у локальных (ещё не отправленных) упражнений. */
const LOCAL_ID_PREFIX = 'local-'

interface State {
  items: Exercise[]
  /** Очередь на отправку — живёт и в localStorage: в зале интернет бывает не всегда. */
  queue: QueuedExercise[]
  loading: boolean
  error: string | null
}

function normalizeName(name: string): string {
  return name.trim().replace(/\s+/g, ' ')
}

function toRow(input: ExerciseInput) {
  return { name: input.name, category: input.category, is_core: input.isCore }
}

export const useExerciseStore = defineStore('exercise', {
  state: (): State => ({
    items: [],
    queue: readCache<QueuedExercise[]>(QUEUE_KEY) ?? [],
    loading: false,
    error: null,
  }),

  getters: {
    /** Поиск по точному названию, без учёта регистра и лишних пробелов. */
    byName(): (name: string) => Exercise | null {
      return (name: string) => {
        const key = normalizeName(name).toLowerCase()
        return this.items.find((item) => item.name.toLowerCase() === key) ?? null
      }
    },

    core: (state): Exercise[] => state.items.filter((item) => item.isCore),

    inCategory(): (category: ExerciseCategory) => Exercise[] {
      return (category: ExerciseCategory) => this.items.filter((item) => item.category === category)
    },
  },

  actions: {
    async load() {
      this.loading = true
      this.error = null
      const { data, error } = await supabase.from('exercises').select('*').order('name')
      if (error) this.error = error.message
      else {
        this.items = (data as ExerciseRow[]).map(mapExercise)
        // Неотправленные — поверх серверных, иначе после загрузки они бы пропали из выбора.
        for (const queued of this.queue) this.applyLocally(queued)
      }
      this.loading = false
    },

    persistQueue() {
      writeCache(QUEUE_KEY, this.queue)
    },

    applyLocally(queued: QueuedExercise): Exercise {
      const existing = this.byName(queued.input.name)
      if (existing) return existing
      const local: Exercise = { id: `${LOCAL_ID_PREFIX}${queued.id}`, ...queued.input }
      this.items.push(local)
      return local
    },

    /**
     * Добавить упражнение в справочник. Такое название уже есть — вернёт его.
     * Без интернета упражнение сразу доступно в выборе, а в базу уйдёт позже.
     */
    async add(input: ExerciseInput): Promise<Exercise | null> {
      this.error = null
      const name = normalizeName(input.name)
      if (!name) return null
      const existing = this.byName(name)
      if (existing) return existing

      const clean: ExerciseInput = { ...input, name }
      const queueLocally = () => {
        const queued: QueuedExercise = { id: crypto.randomUUID(), input: clean }
        this.queue.push(queued)
        this.persistQueue()
        return this.applyLocally(queued)
      }

      if (typeof navigator !== 'undefined' && navigator.onLine === false) return queueLocally()

      const { data, error } = await supabase.from('exercises').insert(toRow(clean)).select().single()
      if (error) {
        if (isOfflineError(error.message)) return queueLocally()
        this.error = error.message
        return null
      }
      const saved = mapExercise(data as ExerciseRow)
      this.items.push(saved)
      return saved
    },

    /**
     * Изменить упражнение в справочнике: название, группу, «Основу».
     * Только с интернетом — переименование потом переносится и на записи тренировок.
     */
    async update(id: string, input: ExerciseInput): Promise<Exercise | null> {
      this.error = null
      const name = normalizeName(input.name)
      if (!name) return null
      const clash = this.byName(name)
      if (clash && clash.id !== id) {
        this.error = 'Такое упражнение уже есть'
        return null
      }
      if (id.startsWith(LOCAL_ID_PREFIX)) {
        this.error = 'Упражнение ещё не отправлено — изменить можно, когда появится интернет'
        return null
      }

      const { data, error } = await supabase
        .from('exercises')
        .update(toRow({ ...input, name }))
        .eq('id', id)
        .select()
        .single()
      if (error) {
        this.error = error.message
        return null
      }
      const saved = mapExercise(data as ExerciseRow)
      const index = this.items.findIndex((item) => item.id === id)
      if (index >= 0) this.items[index] = saved
      return saved
    },

    /** Убрать упражнение из справочника — с отменой. Записи тренировок по нему остаются в истории. */
    remove(id: string) {
      const index = this.items.findIndex((item) => item.id === id)
      if (index < 0) return
      const exercise = this.items[index]
      const queued = this.queue.find((entry) => `${LOCAL_ID_PREFIX}${entry.id}` === id) ?? null

      deleteWithUndo({
        text: `«${exercise.name}» удалено из списка`,
        apply: () => {
          this.items = this.items.filter((item) => item.id !== id)
          if (queued) {
            this.queue = this.queue.filter((entry) => entry.id !== queued.id)
            this.persistQueue()
          }
        },
        revert: () => {
          if (!this.items.some((item) => item.id === id)) {
            const next = [...this.items]
            next.splice(Math.min(index, next.length), 0, exercise)
            this.items = next
          }
          if (queued && !this.queue.some((entry) => entry.id === queued.id)) {
            this.queue.push(queued)
            this.persistQueue()
          }
        },
        commit: async () => {
          // Ещё не отправленное в базу — удалять на сервере нечего.
          if (queued) return true
          const { error } = await supabase.from('exercises').delete().eq('id', id)
          if (error) this.error = error.message
          return !error
        },
      })
    },

    /** Отправить упражнения, созданные без интернета. Останавливается на первой сетевой ошибке. */
    async flushQueue(): Promise<void> {
      while (this.queue.length) {
        const queued = this.queue[0]
        const { data, error } = await supabase
          .from('exercises')
          .upsert(toRow(queued.input), { onConflict: 'user_id,name' })
          .select()
          .single()
        if (error) {
          if (!isOfflineError(error.message)) this.error = error.message
          return
        }
        this.queue.shift()
        this.persistQueue()
        const saved = mapExercise(data as ExerciseRow)
        const index = this.items.findIndex((item) => item.id === `${LOCAL_ID_PREFIX}${queued.id}`)
        if (index >= 0) this.items[index] = saved
        else if (!this.byName(saved.name)) this.items.push(saved)
      }
    },
  },
})
