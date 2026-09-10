import { defineStore } from 'pinia'
import { useProductStore, type Product } from '@/entities/Product'
import { useDiaryEntryStore } from '@/entities/DiaryEntry'
import { todayISO } from '@/shared/lib/date'
import { toNumber } from '@/shared/lib/number'

interface State {
  date: string
  query: string
  selectedId: string | null
  amount: string
  submitting: boolean
}

export const useAddDiaryEntryStore = defineStore('addDiaryEntry', {
  state: (): State => ({
    date: todayISO(),
    query: '',
    selectedId: null,
    amount: '',
    submitting: false,
  }),

  getters: {
    /** Продукты, подходящие под поисковый запрос (пусто, если продукт уже выбран). */
    matches(): Product[] {
      if (this.selectedId) return []
      const products = useProductStore()
      return products.search(this.query).slice(0, 20)
    },

    selected(): Product | null {
      if (!this.selectedId) return null
      const products = useProductStore()
      return products.byId(this.selectedId)
    },

    amountLabel(): string {
      return this.selected?.unit === 'piece' ? 'Штук' : 'Граммы'
    },

    amountValue(): number | null {
      return toNumber(this.amount)
    },

    /** Множитель к БЖУ продукта: /100 для граммов, как есть для штук. */
    factor(): number | null {
      const product = this.selected
      const amount = this.amountValue
      if (!product || amount == null) return null
      return product.unit === 'g' ? amount / 100 : amount
    },

    preview(): { kcal: number; protein: number; fat: number; carbs: number } | null {
      const product = this.selected
      const factor = this.factor
      if (!product || factor == null) return null
      return {
        kcal: Math.round(product.kcal * factor),
        protein: Math.round(product.protein * factor * 10) / 10,
        fat: Math.round(product.fat * factor * 10) / 10,
        carbs: Math.round(product.carbs * factor * 10) / 10,
      }
    },

    canSubmit(): boolean {
      return this.date !== '' && this.selected != null && this.preview != null
    },
  },

  actions: {
    selectProduct(product: Product) {
      this.selectedId = product.id
      this.query = product.name
    },

    clearSelection() {
      this.selectedId = null
      this.query = ''
      this.amount = ''
    },

    async submit(): Promise<boolean> {
      const product = this.selected
      const preview = this.preview
      if (!this.canSubmit || !product || !preview) return false

      this.submitting = true
      const diary = useDiaryEntryStore()
      const ok = await diary.add({
        date: this.date,
        productId: product.id,
        productName: product.name,
        amount: this.amountValue!,
        kcal: preview.kcal,
        protein: preview.protein,
        fat: preview.fat,
        carbs: preview.carbs,
      })
      this.submitting = false
      if (ok) {
        this.query = ''
        this.selectedId = null
        this.amount = ''
      }
      return ok
    },
  },
})
