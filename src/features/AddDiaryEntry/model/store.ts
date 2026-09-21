import { defineStore } from 'pinia'
import { useProductStore, type Product, type ProductUnit } from '@/entities/Product'
import { useDiaryEntryStore, type DiaryEntryInput } from '@/entities/DiaryEntry'
import { MEAL_TYPES, type MealType } from '@/shared/config/nutrition'
import { todayISO } from '@/shared/lib/date'
import { toNumber } from '@/shared/lib/number'

/** Разовый продукт, не сохраняется в базу — только для этой записи в дневник. */
interface CustomDraft {
  name: string
  unit: ProductUnit
  kcal: string
  protein: string
  fat: string
  carbs: string
  /** Необязательное — пусто = 0. */
  fiber: string
}

interface DishRow {
  key: string
  query: string
  selectedId: string | null
  amount: string
  custom: CustomDraft | null
}

interface Totals {
  kcal: number
  protein: number
  fat: number
  carbs: number
  fiber: number
}

/** Общий вид продукта (из базы или разового), достаточный для расчёта БЖУ. */
interface Resolved {
  productId: string | null
  name: string
  unit: ProductUnit
  kcal: number
  protein: number
  fat: number
  carbs: number
  fiber: number
}

interface State {
  date: string
  /** true, как только пользователь сам тронул дату — тогда автообновление на сегодня отключается. */
  dateTouched: boolean
  mealType: MealType
  rows: DishRow[]
  submitting: boolean
}

function emptyRow(): DishRow {
  return { key: crypto.randomUUID(), query: '', selectedId: null, amount: '', custom: null }
}

function emptyCustomDraft(): CustomDraft {
  return { name: '', unit: 'g', kcal: '', protein: '', fat: '', carbs: '', fiber: '' }
}

export const useAddDiaryEntryStore = defineStore('addDiaryEntry', {
  state: (): State => ({
    date: todayISO(),
    dateTouched: false,
    mealType: 'breakfast',
    rows: [emptyRow()],
    submitting: false,
  }),

  getters: {
    mealTypes: () => MEAL_TYPES,

    matchesFor(): (key: string) => Product[] {
      return (key: string) => {
        const row = this.rows.find((r) => r.key === key)
        if (!row || row.selectedId || row.custom) return []
        const products = useProductStore()
        return products.search(row.query).slice(0, 20)
      }
    },

    selectedFor(): (key: string) => Product | null {
      return (key: string) => {
        const row = this.rows.find((r) => r.key === key)
        if (!row?.selectedId) return null
        const products = useProductStore()
        return products.byId(row.selectedId)
      }
    },

    /** Приводит выбор строки (из базы или разовый) к общему виду для расчётов. */
    resolvedFor(): (key: string) => Resolved | null {
      return (key: string) => {
        const row = this.rows.find((r) => r.key === key)
        if (!row) return null

        if (row.custom) {
          const kcal = toNumber(row.custom.kcal)
          const protein = toNumber(row.custom.protein)
          const fat = toNumber(row.custom.fat)
          const carbs = toNumber(row.custom.carbs)
          const fiber = toNumber(row.custom.fiber) ?? 0
          const name = row.custom.name.trim()
          if (!name || kcal == null || protein == null || fat == null || carbs == null) return null
          return { productId: null, name, unit: row.custom.unit, kcal, protein, fat, carbs, fiber }
        }

        const product = this.selectedFor(key)
        if (!product) return null
        return { productId: product.id, ...product }
      }
    },

    amountLabelFor(): (key: string) => string {
      return (key: string) => (this.resolvedFor(key)?.unit === 'piece' ? 'Штук' : 'Граммы')
    },

    previewFor(): (key: string) => Totals | null {
      return (key: string) => {
        const row = this.rows.find((r) => r.key === key)
        const resolved = this.resolvedFor(key)
        const amount = row ? toNumber(row.amount) : null
        if (!resolved || amount == null) return null
        const factor = resolved.unit === 'g' ? amount / 100 : amount
        return {
          kcal: Math.round(resolved.kcal * factor),
          protein: Math.round(resolved.protein * factor * 10) / 10,
          fat: Math.round(resolved.fat * factor * 10) / 10,
          carbs: Math.round(resolved.carbs * factor * 10) / 10,
          fiber: Math.round(resolved.fiber * factor * 10) / 10,
        }
      }
    },

    /** Итог по всем валидным строкам — превью «сколько получится» перед сохранением. */
    totalPreview(): Totals {
      const sum = this.rows.reduce(
        (acc: Totals, row) => {
          const preview = this.previewFor(row.key)
          if (!preview) return acc
          acc.kcal += preview.kcal
          acc.protein += preview.protein
          acc.fat += preview.fat
          acc.carbs += preview.carbs
          acc.fiber += preview.fiber
          return acc
        },
        { kcal: 0, protein: 0, fat: 0, carbs: 0, fiber: 0 },
      )
      return {
        kcal: Math.round(sum.kcal),
        protein: Math.round(sum.protein * 10) / 10,
        fat: Math.round(sum.fat * 10) / 10,
        carbs: Math.round(sum.carbs * 10) / 10,
        fiber: Math.round(sum.fiber * 10) / 10,
      }
    },

    validRowsCount(): number {
      return this.rows.filter((row) => this.previewFor(row.key) != null).length
    },

    canSubmit(): boolean {
      return this.date !== '' && this.validRowsCount > 0
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

    addRow() {
      this.rows.push(emptyRow())
    },

    removeRow(key: string) {
      this.rows = this.rows.filter((row) => row.key !== key)
      if (this.rows.length === 0) this.rows.push(emptyRow())
    },

    setQuery(key: string, query: string) {
      const row = this.rows.find((r) => r.key === key)
      if (row) row.query = query
    },

    setAmount(key: string, amount: string) {
      const row = this.rows.find((r) => r.key === key)
      if (row) row.amount = amount
    },

    selectProduct(key: string, product: Product) {
      const row = this.rows.find((r) => r.key === key)
      if (!row) return
      row.selectedId = product.id
      row.query = product.name
    },

    /** Переключить строку в режим разового продукта (без сохранения в базу). */
    startCustom(key: string) {
      const row = this.rows.find((r) => r.key === key)
      if (!row) return
      row.selectedId = null
      row.query = ''
      row.custom = emptyCustomDraft()
    },

    setCustomField(key: string, field: keyof CustomDraft, value: string) {
      const row = this.rows.find((r) => r.key === key)
      if (row?.custom) row.custom[field] = value as never
    },

    clearRow(key: string) {
      const row = this.rows.find((r) => r.key === key)
      if (!row) return
      row.selectedId = null
      row.query = ''
      row.amount = ''
      row.custom = null
    },

    async submit(): Promise<boolean> {
      if (!this.canSubmit) return false

      const inputs: DiaryEntryInput[] = []
      for (const row of this.rows) {
        const resolved = this.resolvedFor(row.key)
        const preview = this.previewFor(row.key)
        const amount = toNumber(row.amount)
        if (!resolved || !preview || amount == null) continue
        inputs.push({
          date: this.date,
          mealType: this.mealType,
          productId: resolved.productId,
          productName: resolved.name,
          amount,
          ...preview,
        })
      }
      if (!inputs.length) return false

      this.submitting = true
      const diary = useDiaryEntryStore()
      const ok = await diary.addMany(inputs)
      this.submitting = false
      if (ok) this.rows = [emptyRow()]
      return ok
    },
  },
})
