import { defineStore } from 'pinia'
import { useProductStore, type Product } from '@/entities/Product'
import { useDiaryEntryStore, type DiaryEntryInput } from '@/entities/DiaryEntry'
import { MEAL_TYPES, type MealType } from '@/shared/config/nutrition'
import { todayISO } from '@/shared/lib/date'
import { toNumber } from '@/shared/lib/number'

interface DishRow {
  key: string
  query: string
  selectedId: string | null
  amount: string
}

interface Totals {
  kcal: number
  protein: number
  fat: number
  carbs: number
}

interface State {
  date: string
  mealType: MealType
  rows: DishRow[]
  submitting: boolean
}

function emptyRow(): DishRow {
  return { key: crypto.randomUUID(), query: '', selectedId: null, amount: '' }
}

export const useAddDiaryEntryStore = defineStore('addDiaryEntry', {
  state: (): State => ({
    date: todayISO(),
    mealType: 'breakfast',
    rows: [emptyRow()],
    submitting: false,
  }),

  getters: {
    mealTypes: () => MEAL_TYPES,

    matchesFor(): (key: string) => Product[] {
      return (key: string) => {
        const row = this.rows.find((r) => r.key === key)
        if (!row || row.selectedId) return []
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

    amountLabelFor(): (key: string) => string {
      return (key: string) => (this.selectedFor(key)?.unit === 'piece' ? 'Штук' : 'Граммы')
    },

    previewFor(): (key: string) => Totals | null {
      return (key: string) => {
        const row = this.rows.find((r) => r.key === key)
        const product = this.selectedFor(key)
        const amount = row ? toNumber(row.amount) : null
        if (!product || amount == null) return null
        const factor = product.unit === 'g' ? amount / 100 : amount
        return {
          kcal: Math.round(product.kcal * factor),
          protein: Math.round(product.protein * factor * 10) / 10,
          fat: Math.round(product.fat * factor * 10) / 10,
          carbs: Math.round(product.carbs * factor * 10) / 10,
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
          return acc
        },
        { kcal: 0, protein: 0, fat: 0, carbs: 0 },
      )
      return {
        kcal: Math.round(sum.kcal),
        protein: Math.round(sum.protein * 10) / 10,
        fat: Math.round(sum.fat * 10) / 10,
        carbs: Math.round(sum.carbs * 10) / 10,
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

    clearRow(key: string) {
      const row = this.rows.find((r) => r.key === key)
      if (!row) return
      row.selectedId = null
      row.query = ''
      row.amount = ''
    },

    async submit(): Promise<boolean> {
      if (!this.canSubmit) return false

      const inputs: DiaryEntryInput[] = []
      for (const row of this.rows) {
        const product = this.selectedFor(row.key)
        const preview = this.previewFor(row.key)
        const amount = toNumber(row.amount)
        if (!product || !preview || amount == null) continue
        inputs.push({
          date: this.date,
          mealType: this.mealType,
          productId: product.id,
          productName: product.name,
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
