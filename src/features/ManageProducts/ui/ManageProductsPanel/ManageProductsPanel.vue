<template>
  <div :class="$style.panel">
    <form :class="$style.form" @submit.prevent="onSubmit">
      <BaseTextField v-model="store.form.name" label="Название" placeholder="Гречка варёная" />
      <div :class="$style.row">
        <BaseSelect v-model="store.form.category" label="Тип" :options="categoryOptions" />
        <BaseSelect v-model="store.form.unit" label="Единица" :options="unitOptions" />
      </div>
      <p :class="$style.hint">
        БЖУ — {{ store.form.unit === 'piece' ? 'на 1 штуку' : 'на 100 г' }}
      </p>
      <div :class="$style.grid">
        <BaseTextField v-model="store.form.kcal" label="Ккал" inputmode="decimal" />
        <BaseTextField v-model="store.form.protein" label="Белки" inputmode="decimal" />
        <BaseTextField v-model="store.form.fat" label="Жиры" inputmode="decimal" />
        <BaseTextField v-model="store.form.carbs" label="Углеводы" inputmode="decimal" />
      </div>
      <div :class="$style.actions">
        <BaseButton type="submit" :disabled="!store.canSubmit || store.submitting">
          {{ store.editingId ? 'Сохранить' : 'Добавить продукт' }}
        </BaseButton>
        <BaseButton v-if="store.editingId" type="button" variant="ghost" @click="store.cancelEdit">
          Отмена
        </BaseButton>
      </div>
    </form>

    <ul v-if="products.byNameAsc.length" :class="$style.list">
      <li v-for="product in products.byNameAsc" :key="product.id" :class="$style.item">
        <div :class="$style.itemMain">
          <span :class="$style.name">{{ product.name }}</span>
          <span :class="$style.meta">
            {{ product.kcal }} ккал · Б{{ product.protein }} Ж{{ product.fat }} У{{ product.carbs }}
            / {{ product.unit === 'piece' ? 'шт.' : '100г' }}
          </span>
        </div>
        <div :class="$style.itemActions">
          <BaseButton type="button" variant="ghost" @click="store.startEdit(product)">✎</BaseButton>
          <BaseButton type="button" variant="danger" @click="onDelete(product.id)">
            {{ pendingId === product.id ? 'Удалить?' : '✕' }}
          </BaseButton>
        </div>
      </li>
    </ul>
    <p v-else :class="$style.empty">Продуктов пока нет — добавь первый выше.</p>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useProductStore } from '@/entities/Product'
import { BaseButton, BaseSelect, BaseTextField } from '@/shared/ui'
import { useManageProductsStore } from '../../model/store'

const store = useManageProductsStore()
const products = useProductStore()

const pendingId = ref<string | null>(null)

const categoryOptions = [
  { value: 'base', label: 'Базовый продукт' },
  { value: 'dish', label: 'Готовое блюдо' },
]
const unitOptions = [
  { value: 'g', label: 'Граммы (на 100г)' },
  { value: 'piece', label: 'Штуки (на 1 шт.)' },
]

async function onSubmit() {
  await store.submit()
}

function onDelete(id: string) {
  if (pendingId.value === id) {
    products.remove(id)
    pendingId.value = null
  } else {
    pendingId.value = id
  }
}
</script>

<style module>
.panel {
  display: flex;
  flex-direction: column;
  gap: var(--space-l);
}

.form {
  display: flex;
  flex-direction: column;
  gap: var(--space-m);
}

.row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-m);
}

.grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-m);
}

@media (max-width: 520px) {
  .grid {
    grid-template-columns: 1fr 1fr;
  }
}

.hint {
  font-size: var(--font-size-s);
  color: var(--text-muted);
}

.actions {
  display: flex;
  gap: var(--space-s);
}

.list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-m);
  padding: var(--space-s) var(--space-m);
  background: var(--bg-elevated);
  border-radius: var(--radius-m);
}

.itemMain {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.name {
  color: var(--text-primary);
  font-size: var(--font-size-m);
  font-weight: 600;
}

.meta {
  font-size: var(--font-size-s);
  color: var(--text-muted);
}

.itemActions {
  display: flex;
  gap: var(--space-xs);
  flex-shrink: 0;
}

.empty {
  color: var(--text-muted);
  font-size: var(--font-size-m);
  text-align: center;
  padding: var(--space-l);
}
</style>
