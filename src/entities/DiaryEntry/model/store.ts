import { defineStore } from 'pinia'
import { supabase } from '@/shared/supabase'
import { deleteWithUndo } from '@/shared/lib/toast'
import { readCache, writeCache } from '@/shared/lib/offlineCache'
import { isOfflineError } from '@/shared/lib/network'
import { useCheatDayStore } from '@/entities/CheatDay'
import { CHEAT_DAY_KCAL, MEAL_TYPES, type MealType } from '@/shared/config/nutrition'
import { addDays, todayISO } from '@/shared/lib/date'
import { mapDiaryEntry } from '../helpers/mapDiaryEntry'
import type {
  DailyTotals,
  DiaryDayGroup,
  DiaryEntry,
  DiaryEntryInput,
  DiaryEntryRow,
  MealGroup,
} from './types'

const QUEUE_KEY = 'diary-queue'

/** Запись, сохранённая без сети. id выдан на клиенте — повторная отправка не создаст дубль. */
type QueuedEntry = DiaryEntryInput & { id: string }

interface State {
  items: DiaryEntry[]
  /** Записи, сохранённые без сети и ещё не отправленные — живут и в localStorage. */
  queue: QueuedEntry[]
  loading: boolean
  error: string | null
}

function toLocalEntry(entry: QueuedEntry): DiaryEntry {
  const { id, date, mealType, productId, productName, amount, kcal, protein, fat, carbs, fiber } = entry
  return { id, date, mealType, productId, productName, amount, kcal, protein, fat, carbs, fiber }
}

function emptyTotals(): DailyTotals {
  return { kcal: 0, protein: 0, fat: 0, carbs: 0, fiber: 0 }
}

function round1(value: number): number {
  return Math.round(value * 10) / 10
}

function sumTotals(entries: DiaryEntry[]): DailyTotals {
  const totals = entries.reduce((acc, entry) => {
    acc.kcal += entry.kcal
    acc.protein += entry.protein
    acc.fat += entry.fat
    acc.carbs += entry.carbs
    acc.fiber += entry.fiber
    return acc
  }, emptyTotals())
  return {
    kcal: Math.round(totals.kcal),
    protein: round1(totals.protein),
    fat: round1(totals.fat),
    carbs: round1(totals.carbs),
    fiber: round1(totals.fiber),
  }
}

function toRow(input: DiaryEntryInput) {
  return {
    date: input.date,
    meal_type: input.mealType,
    product_id: input.productId,
    product_name: input.productName,
    amount: input.amount,
    kcal: input.kcal,
    protein: input.protein,
    fat: input.fat,
    carbs: input.carbs,
    fiber: input.fiber,
  }
}

export const useDiaryEntryStore = defineStore('diaryEntry', {
  state: (): State => ({
    items: [],
    queue: readCache<QueuedEntry[]>(QUEUE_KEY) ?? [],
    loading: false,
    error: null,
  }),

  getters: {
    /** Запись сохранена без сети и ещё не отправлена. */
    isPendingEntry(): (id: string) => boolean {
      return (id) => this.queue.some((entry) => entry.id === id)
    },

    byDateDesc: (state): DiaryEntry[] =>
      [...state.items].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : b.id.localeCompare(a.id))),

    /** Дни (свежие сверху) → приёмы пищи по времени суток → записи, с итогами на каждом уровне. */
    groupedByDateDesc(): DiaryDayGroup[] {
      const byDate = new Map<string, DiaryEntry[]>()
      for (const entry of this.items) {
        const arr = byDate.get(entry.date) ?? []
        arr.push(entry)
        byDate.set(entry.date, arr)
      }

      return [...byDate.entries()]
        .sort((a, b) => (a[0] < b[0] ? 1 : -1))
        .map(([date, dayEntries]) => {
          const byMeal = new Map<string, DiaryEntry[]>()
          for (const entry of dayEntries) {
            const arr = byMeal.get(entry.mealType) ?? []
            arr.push(entry)
            byMeal.set(entry.mealType, arr)
          }

          const meals: MealGroup[] = MEAL_TYPES.filter((type) => byMeal.has(type)).map((type) => {
            const entries = byMeal.get(type)!
            return { mealType: type, entries, totals: sumTotals(entries) }
          })

          return { date, meals, totals: sumTotals(dayEntries) }
        })
    },

    /** Итоги БЖУ за конкретную дату (для формы — «уже съедено сегодня»). */
    totalsForDate(): (date: string) => DailyTotals {
      return (date: string) => {
        const group = this.groupedByDateDesc.find((g) => g.date === date)
        return group?.totals ?? emptyTotals()
      }
    },

    /**
     * Ккал по дням, по возрастанию даты — только дни, где реально есть запись.
     * Пропуски (не вёл дневник) просто не создают точку, а не считаются нулём.
     */
    dailyKcalAsc(): { date: string; kcal: number }[] {
      return [...this.groupedByDateDesc]
        .map((day) => ({ date: day.date, kcal: day.totals.kcal }))
        .sort((a, b) => (a.date < b.date ? -1 : 1))
    },

    /**
     * Дни с записями, БЕЗ сегодняшнего — день ещё не закончен (не все приёмы пищи
     * записаны), поэтому его итог всегда занижен и портит любое среднее.
     */
    completedDailyKcalAsc(): { date: string; kcal: number }[] {
      const today = todayISO()
      const cheat = useCheatDayStore()
      return this.dailyKcalAsc.filter((d) => d.date < today && !cheat.isCheat(d.date))
    },

    /**
     * Ккал по дням для графика и оценки жира: читмилы (в т.ч. без единой записи)
     * идут с условными CHEAT_DAY_KCAL и флагом cheat, а записи таких дней игнорируются —
     * их вносили «от балды». В средние это не попадает (см. completedDailyKcalAsc).
     */
    dailyKcalWithCheatAsc(): { date: string; kcal: number; cheat: boolean }[] {
      const cheat = useCheatDayStore()
      const rows = new Map<string, { date: string; kcal: number; cheat: boolean }>()
      for (const day of this.dailyKcalAsc) rows.set(day.date, { date: day.date, kcal: day.kcal, cheat: false })
      for (const item of cheat.items) rows.set(item.date, { date: item.date, kcal: CHEAT_DAY_KCAL, cheat: true })
      return [...rows.values()].sort((a, b) => (a.date < b.date ? -1 : 1))
    },

    /** Среднее ккал за последние N календарных дней, только по завершённым дням с записями (без читмилов). */
    recentAverageKcal(): (days: number) => number | null {
      return (days: number) => {
        const since = addDays(todayISO(), -(days - 1))
        const recent = this.completedDailyKcalAsc.filter((d) => d.date >= since)
        if (!recent.length) return null
        return Math.round(recent.reduce((sum, d) => sum + d.kcal, 0) / recent.length)
      }
    },

    /** Среднее ккал по завершённым дням с записями в диапазоне [from, to]. null — нет данных. */
    averageKcalInRange(): (from: string, to: string) => number | null {
      return (from: string, to: string) => {
        const days = this.completedDailyKcalAsc.filter((d) => d.date >= from && d.date <= to)
        if (!days.length) return null
        return Math.round(days.reduce((sum, d) => sum + d.kcal, 0) / days.length)
      }
    },

    /** Среднее по последним N ЗАПИСАННЫМ завершённым дням (не календарным) — устойчивее к пропускам. */
    averageOfLastLoggedDays(): (count: number) => number | null {
      return (count: number) => {
        const days = this.completedDailyKcalAsc.slice(-count)
        if (!days.length) return null
        return Math.round(days.reduce((sum, d) => sum + d.kcal, 0) / days.length)
      }
    },

    /**
     * Реальное среднее ккал/день, если записей достаточно (по умолчанию 7+),
     * иначе — переданное значение по умолчанию (обычно статичная цель из конфига).
     */
    effectiveDailyKcal(): (fallback: number, minDays?: number) => number {
      return (fallback: number, minDays = 7) => {
        if (this.completedDailyKcalAsc.length < minDays) return fallback
        return this.averageOfLastLoggedDays(21) ?? fallback
      }
    },

    /**
     * Средние ккал по времени суток — только по дням, где этот приём реально был
     * записан (пропуски не тянут среднее к нулю). Только типы, где есть хоть 1 день.
     */
    avgKcalByMealType(): { mealType: MealType; avgKcal: number; days: number }[] {
      const sums = new Map<MealType, { total: number; days: number }>()
      for (const day of this.groupedByDateDesc) {
        for (const meal of day.meals) {
          const bucket = sums.get(meal.mealType) ?? { total: 0, days: 0 }
          bucket.total += meal.totals.kcal
          bucket.days += 1
          sums.set(meal.mealType, bucket)
        }
      }
      return MEAL_TYPES.filter((type) => sums.has(type)).map((type) => {
        const bucket = sums.get(type)!
        return { mealType: type, avgKcal: Math.round(bucket.total / bucket.days), days: bucket.days }
      })
    },
  },

  actions: {
    async load() {
      this.loading = true
      this.error = null
      const { data, error } = await supabase
        .from('diary_entries')
        .select('*')
        .order('date', { ascending: false })
      if (error) this.error = error.message
      else {
        this.items = (data as DiaryEntryRow[]).map(mapDiaryEntry)
        // Неотправленное поверх серверного — иначе после загрузки пропало бы из рациона.
        for (const entry of this.queue) {
          if (!this.items.some((item) => item.id === entry.id)) this.items.push(toLocalEntry(entry))
        }
      }
      this.loading = false
    },

    persistQueue() {
      writeCache(QUEUE_KEY, this.queue)
    },

    /** Отправить записи, сохранённые без сети (одним запросом). На сетевой ошибке ждёт следующей попытки. */
    async flushQueue(): Promise<void> {
      if (!this.queue.length) return
      const rows = this.queue.map((entry) => ({ id: entry.id, ...toRow(entry) }))
      const { data, error } = await supabase.from('diary_entries').upsert(rows, { onConflict: 'id' }).select()
      if (error) {
        if (!isOfflineError(error.message)) this.error = error.message
        return
      }
      this.queue = []
      this.persistQueue()
      for (const saved of (data as DiaryEntryRow[]).map(mapDiaryEntry)) {
        const index = this.items.findIndex((item) => item.id === saved.id)
        if (index >= 0) this.items[index] = saved
        else this.items.push(saved)
      }
    },

    async add(input: DiaryEntryInput): Promise<boolean> {
      return this.addMany([input])
    },

    /** Сохранить несколько блюд одного приёма пищи одним запросом. */
    /**
     * Сохранить несколько блюд одного приёма пищи одним запросом. Без сети — в очередь
     * на телефоне. id задаём на клиенте и пишем upsert'ом по нему: если запрос дошёл,
     * а ответ потерялся, повторная отправка не создаст дубль.
     */
    async addMany(inputs: DiaryEntryInput[]): Promise<boolean> {
      if (!inputs.length) return false
      this.error = null
      const entries: QueuedEntry[] = inputs.map((input) => ({ ...input, id: crypto.randomUUID() }))

      const queueLocally = () => {
        this.queue.push(...entries)
        this.persistQueue()
        this.items.push(...entries.map(toLocalEntry))
        return true
      }
      if (typeof navigator !== 'undefined' && !navigator.onLine) return queueLocally()

      const { data, error } = await supabase
        .from('diary_entries')
        .upsert(
          entries.map((entry) => ({ id: entry.id, ...toRow(entry) })),
          { onConflict: 'id' },
        )
        .select()

      if (error) {
        if (isOfflineError(error.message)) return queueLocally()
        this.error = error.message
        return false
      }
      this.items.push(...(data as DiaryEntryRow[]).map(mapDiaryEntry))
      return true
    },

    /** Пересчитать запись под новое количество (граммы/штуки), сохраняя пропорцию БЖУ. */
    async updateAmount(id: string, amount: number): Promise<boolean> {
      this.error = null
      const entry = this.items.find((item) => item.id === id)
      if (!entry || entry.amount <= 0) return false

      const factor = amount / entry.amount
      const patch = {
        amount,
        kcal: Math.round(entry.kcal * factor),
        protein: round1(entry.protein * factor),
        fat: round1(entry.fat * factor),
        carbs: round1(entry.carbs * factor),
        fiber: round1(entry.fiber * factor),
      }

      // Ещё не отправленная запись — правим её прямо в очереди, на сервере её пока нет.
      const queuedIndex = this.queue.findIndex((item) => item.id === id)
      if (queuedIndex >= 0) {
        this.queue[queuedIndex] = { ...this.queue[queuedIndex], ...patch }
        this.persistQueue()
        Object.assign(entry, patch)
        return true
      }

      const { data, error } = await supabase
        .from('diary_entries')
        .update(patch)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        this.error = error.message
        return false
      }
      const saved = mapDiaryEntry(data as DiaryEntryRow)
      const index = this.items.findIndex((item) => item.id === id)
      if (index >= 0) this.items[index] = saved
      return true
    },

    /** Удалить с возможностью отмены: сразу пропадает, на сервере удаляется через 5 с. */
    remove(id: string) {
      const item = this.items.find((entry) => entry.id === id)
      if (!item) return
      const queued = this.queue.find((entry) => entry.id === id)
      deleteWithUndo({
        text: 'Удалено из рациона',
        apply: () => {
          this.items = this.items.filter((entry) => entry.id !== id)
          this.queue = this.queue.filter((entry) => entry.id !== id)
          this.persistQueue()
        },
        revert: () => {
          if (!this.items.some((entry) => entry.id === id)) this.items.push(item)
          if (queued && !this.queue.some((entry) => entry.id === id)) this.queue.push(queued)
          this.persistQueue()
        },
        commit: async () => {
          // Не отправленная запись есть только на телефоне — на сервере удалять нечего.
          if (queued) return true
          const { error } = await supabase.from('diary_entries').delete().eq('id', id)
          if (error) this.error = error.message
          return !error
        },
      })
    },
  },
})
