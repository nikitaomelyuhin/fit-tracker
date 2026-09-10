import { defineStore } from 'pinia'
import { useProductStore, type Product, type ProductCategory, type ProductUnit } from '@/entities/Product'
import { toNumber } from '@/shared/lib/number'

interface Form {
  name: string
  category: ProductCategory
  unit: ProductUnit
  kcal: string
  protein: string
  fat: string
  carbs: string
}

interface State {
  form: Form
  editingId: string | null
  submitting: boolean
}

function emptyForm(): Form {
  return { name: '', category: 'base', unit: 'g', kcal: '', protein: '', fat: '', carbs: '' }
}

export const useManageProductsStore = defineStore('manageProducts', {
  state: (): State => ({ form: emptyForm(), editingId: null, submitting: false }),

  getters: {
    canSubmit(): boolean {
      const f = this.form
      return (
        f.name.trim() !== '' &&
        toNumber(f.kcal) != null &&
        toNumber(f.protein) != null &&
        toNumber(f.fat) != null &&
        toNumber(f.carbs) != null
      )
    },
  },

  actions: {
    startEdit(product: Product) {
      this.editingId = product.id
      this.form = {
        name: product.name,
        category: product.category,
        unit: product.unit,
        kcal: String(product.kcal),
        protein: String(product.protein),
        fat: String(product.fat),
        carbs: String(product.carbs),
      }
    },

    cancelEdit() {
      this.editingId = null
      this.form = emptyForm()
    },

    async submit(): Promise<boolean> {
      if (!this.canSubmit) return false
      this.submitting = true
      const products = useProductStore()
      const input = {
        name: this.form.name.trim(),
        category: this.form.category,
        unit: this.form.unit,
        kcal: toNumber(this.form.kcal)!,
        protein: toNumber(this.form.protein)!,
        fat: toNumber(this.form.fat)!,
        carbs: toNumber(this.form.carbs)!,
      }
      const ok = this.editingId
        ? await products.update(this.editingId, input)
        : await products.add(input)
      this.submitting = false
      if (ok) this.cancelEdit()
      return ok
    },
  },
})
