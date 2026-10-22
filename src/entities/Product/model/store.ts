import { defineStore } from 'pinia'
import { supabase } from '@/shared/supabase'
import { deleteWithUndo } from '@/shared/lib/toast'
import { mapProduct } from '../helpers/mapProduct'
import type { Product, ProductInput, ProductRow } from './types'

interface State {
  items: Product[]
  loading: boolean
  error: string | null
}

export const useProductStore = defineStore('product', {
  state: (): State => ({ items: [], loading: false, error: null }),

  getters: {
    byNameAsc: (state): Product[] => [...state.items].sort((a, b) => a.name.localeCompare(b.name, 'ru')),

    /** Поиск по подстроке в названии, без учёта регистра. */
    search(): (query: string) => Product[] {
      return (query: string) => {
        const q = query.trim().toLowerCase()
        if (!q) return this.byNameAsc
        return this.byNameAsc.filter((product) => product.name.toLowerCase().includes(q))
      }
    },

    byId(): (id: string) => Product | null {
      return (id: string) => this.items.find((product) => product.id === id) ?? null
    },
  },

  actions: {
    async load() {
      this.loading = true
      this.error = null
      const { data, error } = await supabase.from('products').select('*').order('name')
      if (error) this.error = error.message
      else this.items = (data as ProductRow[]).map(mapProduct)
      this.loading = false
    },

    async add(input: ProductInput): Promise<boolean> {
      this.error = null
      const { data, error } = await supabase.from('products').insert(input).select().single()
      if (error) {
        this.error = error.message
        return false
      }
      this.items.push(mapProduct(data as ProductRow))
      return true
    },

    async update(id: string, input: ProductInput): Promise<boolean> {
      this.error = null
      const { data, error } = await supabase
        .from('products')
        .update(input)
        .eq('id', id)
        .select()
        .single()
      if (error) {
        this.error = error.message
        return false
      }
      const saved = mapProduct(data as ProductRow)
      const index = this.items.findIndex((item) => item.id === id)
      if (index >= 0) this.items[index] = saved
      return true
    },

    /** Удалить с возможностью отмены: сразу пропадает, на сервере удаляется через 5 с. */
    remove(id: string) {
      const item = this.items.find((entry) => entry.id === id)
      if (!item) return
      deleteWithUndo({
        text: 'Продукт удалён',
        apply: () => {
          this.items = this.items.filter((entry) => entry.id !== id)
        },
        revert: () => {
          if (!this.items.some((entry) => entry.id === id)) this.items.push(item)
        },
        commit: async () => {
          const { error } = await supabase.from('products').delete().eq('id', id)
          if (error) this.error = error.message
          return !error
        },
      })
    },
  },
})
