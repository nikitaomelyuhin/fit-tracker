import { defineStore } from 'pinia'
import { supabase } from '@/shared/supabase'
import { readCache, writeCache } from '@/shared/lib/offlineCache'
import { isOfflineError } from '@/shared/lib/network'
import { deleteWithUndo } from '@/shared/lib/toast'
import { mapWorkout } from '../helpers/mapWorkout'
import { sortSessionEntries } from '../helpers/sortSessionEntries'
import type { Workout, WorkoutEntryInput, WorkoutRow, WorkoutSession } from './types'

/** Тренировка, сохранённая без интернета и ещё не отправленная в базу. */
interface QueuedSession {
  id: string
  date: string
  entries: WorkoutEntryInput[]
  /** Упражнения, убранные из уже сохранённой тренировки этого дня. */
  removed?: string[]
}

const QUEUE_KEY = 'workout-queue'
/** Префикс id у локальных (ещё не отправленных) записей. */
const LOCAL_ID_PREFIX = 'local-'
/** Ключ сохранения: одна строка на упражнение в день (см. supabase/exercises.sql). */
const UPSERT_CONFLICT = 'user_id,date,exercise'

interface State {
  items: Workout[]
  /** Очередь на отправку — живёт и в localStorage, чтобы пережить закрытие приложения. */
  queue: QueuedSession[]
  loading: boolean
  error: string | null
}

function sameSlot(a: { date: string; exercise: string }, b: typeof a): boolean {
  return a.date === b.date && a.exercise === b.exercise
}

/** Запись без веса и повторов (например, «0 × 0 × 0» вместо пропуска) — не результат. */
function isEmptyEntry(item: Workout): boolean {
  return !(item.weight != null && item.weight > 0) && !(item.reps != null && item.reps > 0)
}

// Тип A/B не передаётся: у старых строк он сохраняется при пересохранении, у новых — пустой.
function toRows(date: string, entries: WorkoutEntryInput[]) {
  return entries.map((entry) => ({
    date,
    exercise: entry.exercise,
    weight: entry.weight,
    sets: entry.sets,
    reps: entry.reps,
    next_weight: entry.nextWeight,
    next_sets: entry.nextSets,
    next_reps: entry.nextReps,
    position: entry.position,
  }))
}

export const useWorkoutStore = defineStore('workout', {
  state: (): State => ({
    items: [],
    queue: readCache<QueuedSession[]>(QUEUE_KEY) ?? [],
    loading: false,
    error: null,
  }),

  getters: {
    /** Сколько тренировок ждут отправки в базу. */
    pendingCount: (state): number => state.queue.length,

    /** Тренировка этого дня ещё не отправлена (сохранена офлайн). */
    isPendingSession(): (date: string) => boolean {
      return (date) => this.queue.some((session) => session.date === date)
    },

    byDateDesc: (state): Workout[] => [...state.items].sort((a, b) => (a.date < b.date ? 1 : -1)),

    /** Тренировки по дням, свежие сверху; упражнения — в порядке выполнения. */
    sessions(): WorkoutSession[] {
      const map = new Map<string, Workout[]>()
      for (const item of this.items) {
        const bucket = map.get(item.date) ?? []
        bucket.push(item)
        map.set(item.date, bucket)
      }

      const result: WorkoutSession[] = [...map.entries()].map(([date, entries]) => ({
        date,
        type: entries.find((entry) => entry.type != null)?.type ?? null,
        entries: sortSessionEntries(entries),
      }))

      result.sort((a, b) => (a.date < b.date ? 1 : -1))
      return result
    },

    sessionFor(): (date: string) => WorkoutSession | null {
      return (date) => this.sessions.find((session) => session.date === date) ?? null
    },

    /** Последняя настоящая запись по упражнению до указанной даты (пустые «0 × 0» пропускаются). */
    lastEntryFor(): (exercise: string, beforeDate?: string) => Workout | null {
      return (exercise, beforeDate) => {
        const matches = this.items
          .filter(
            (item) => item.exercise === exercise && (!beforeDate || item.date < beforeDate) && !isEmptyEntry(item),
          )
          .sort((a, b) => (a.date < b.date ? 1 : -1))
        return matches[0] ?? null
      }
    },

    /** Когда упражнение делалось в последний раз: название → дата. */
    lastDateByExercise(): Map<string, string> {
      const map = new Map<string, string>()
      for (const item of this.items) {
        if (isEmptyEntry(item)) continue
        const known = map.get(item.exercise)
        if (!known || item.date > known) map.set(item.exercise, item.date)
      }
      return map
    },
  },

  actions: {
    async load() {
      this.loading = true
      this.error = null
      const { data, error } = await supabase
        .from('workouts')
        .select('*')
        .order('date', { ascending: false })
      if (error) this.error = error.message
      else {
        this.items = (data as WorkoutRow[]).map(mapWorkout)
        // Неотправленные тренировки поверх серверных — иначе после загрузки они бы пропали из истории.
        for (const session of this.queue) this.applyLocally(session)
      }
      this.loading = false
    },

    /** Положить тренировку в items как локальные записи (до подтверждения сервером). */
    applyLocally(session: QueuedSession) {
      const removed = session.removed ?? []
      this.items = this.items.filter((item) => !(item.date === session.date && removed.includes(item.exercise)))
      for (const entry of session.entries) {
        const local: Workout = {
          id: `${LOCAL_ID_PREFIX}${session.id}-${entry.exercise}`,
          date: session.date,
          type: this.items.find((item) => sameSlot(item, { date: session.date, exercise: entry.exercise }))?.type ?? null,
          exercise: entry.exercise,
          weight: entry.weight,
          sets: entry.sets,
          reps: entry.reps,
          nextWeight: entry.nextWeight,
          nextSets: entry.nextSets,
          nextReps: entry.nextReps,
          note: null,
          position: entry.position,
        }
        const index = this.items.findIndex((item) => sameSlot(item, local))
        if (index >= 0) this.items[index] = local
        else this.items.push(local)
      }
    },

    persistQueue() {
      writeCache(QUEUE_KEY, this.queue)
    },

    /**
     * Переименовать упражнение во всей истории (упражнение в справочнике переименовали).
     * Неотправленные тренировки тоже получают новое название, чтобы не вернуть старое.
     */
    async renameExercise(from: string, to: string): Promise<boolean> {
      this.error = null
      if (from === to) return true
      const { error } = await supabase.from('workouts').update({ exercise: to }).eq('exercise', from)
      if (error) {
        this.error = error.message
        return false
      }
      const swap = (name: string) => (name === from ? to : name)
      this.items = this.items.map((item) => (item.exercise === from ? { ...item, exercise: to } : item))
      if (this.queue.some((session) => session.entries.some((entry) => entry.exercise === from) || session.removed?.includes(from))) {
        this.queue = this.queue.map((session) => ({
          ...session,
          entries: session.entries.map((entry) => ({ ...entry, exercise: swap(entry.exercise) })),
          removed: session.removed?.map(swap),
        }))
        this.persistQueue()
      }
      return true
    },

    /** Записать тренировку в базу: обновить/добавить упражнения и удалить убранные. */
    async send(date: string, entries: WorkoutEntryInput[], removed: string[]): Promise<string | null> {
      if (entries.length) {
        const { data, error } = await supabase
          .from('workouts')
          .upsert(toRows(date, entries), { onConflict: UPSERT_CONFLICT })
          .select()
        if (error) return error.message
        this.replaceWithSaved((data as WorkoutRow[]).map(mapWorkout))
      }
      if (removed.length) {
        const { error } = await supabase.from('workouts').delete().eq('date', date).in('exercise', removed)
        if (error) return error.message
        this.items = this.items.filter((item) => !(item.date === date && removed.includes(item.exercise)))
      }
      return null
    },

    /**
     * Отправить накопленные офлайн тренировки. Останавливается на первой сетевой
     * ошибке (сети всё ещё нет) — остальное уйдёт при следующей попытке.
     */
    async flushQueue(): Promise<void> {
      while (this.queue.length) {
        const session = this.queue[0]
        const error = await this.send(session.date, session.entries, session.removed ?? [])
        if (error) {
          if (!isOfflineError(error)) this.error = error
          return
        }
        this.queue.shift()
        this.persistQueue()
      }
    },

    replaceWithSaved(saved: Workout[]) {
      for (const row of saved) {
        const index = this.items.findIndex((item) => sameSlot(item, row))
        if (index >= 0) this.items[index] = row
        else this.items.push(row)
      }
    },

    /**
     * Сохранить тренировку дня: упражнения upsert'ом по дата+упражнение,
     * убранные из уже сохранённой тренировки — удалить.
     */
    async saveSession(date: string, entries: WorkoutEntryInput[], removed: string[] = []): Promise<boolean> {
      this.error = null

      const queueLocally = () => {
        // Тот же день уже ждёт отправки — заменяем, а не дублируем.
        const earlier = this.queue.filter((session) => session.date === date)
        const earlierRemoved = earlier.flatMap((session) => session.removed ?? [])
        const names = new Set(entries.map((entry) => entry.exercise))
        this.queue = this.queue.filter((session) => session.date !== date)
        const session: QueuedSession = {
          id: crypto.randomUUID(),
          date,
          entries,
          removed: [...new Set([...earlierRemoved, ...removed])].filter((name) => !names.has(name)),
        }
        this.queue.push(session)
        this.persistQueue()
        this.applyLocally(session)
        return true
      }

      // Сети точно нет — не ждём таймаута, сразу кладём в очередь.
      if (typeof navigator !== 'undefined' && navigator.onLine === false) return queueLocally()

      const error = await this.send(date, entries, removed)
      if (error) {
        if (isOfflineError(error)) return queueLocally()
        this.error = error
        return false
      }
      return true
    },

    /** Удалить тренировку дня с возможностью отмены (5 с). Неотправленная — удаляется только из очереди. */
    removeSession(date: string) {
      const removedItems = this.items.filter((item) => item.date === date)
      const removedQueue = this.queue.filter((session) => session.date === date)
      const onlyLocal = removedItems.every((item) => item.id.startsWith(LOCAL_ID_PREFIX))

      deleteWithUndo({
        text: 'Тренировка удалена',
        apply: () => {
          this.items = this.items.filter((item) => item.date !== date)
          this.queue = this.queue.filter((session) => session.date !== date)
          this.persistQueue()
        },
        revert: () => {
          for (const item of removedItems) if (!this.items.some((entry) => entry.id === item.id)) this.items.push(item)
          for (const session of removedQueue) if (!this.queue.some((entry) => entry.id === session.id)) this.queue.push(session)
          this.persistQueue()
        },
        commit: async () => {
          if (onlyLocal) return true
          const { error } = await supabase.from('workouts').delete().eq('date', date)
          if (error) this.error = error.message
          return !error
        },
      })
    },
  },
})
