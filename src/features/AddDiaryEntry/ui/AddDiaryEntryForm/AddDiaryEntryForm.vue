<template>
  <form :class="$style.form" @submit.prevent="onSubmit">
    <BaseTextField v-model="store.date" label="Дата" type="date" />

    <div :class="$style.search">
      <BaseTextField
        v-if="!store.selected"
        v-model="store.query"
        label="Продукт"
        placeholder="Начни вводить название…"
      />
      <span v-if="store.selected" :class="$style.chosen">
        выбрано: <b>{{ store.selected.name }}</b>
        <button type="button" :class="$style.clear" @click="store.clearSelection">✕</button>
      </span>
      <ul v-else-if="store.matches.length" :class="$style.matches">
        <li v-for="product in store.matches" :key="product.id">
          <button type="button" :class="$style.match" @click="store.selectProduct(product)">
            <span>{{ product.name }}</span>
            <span :class="$style.matchMeta">{{ product.kcal }} ккал / {{ unitLabel(product) }}</span>
          </button>
        </li>
      </ul>
      <p v-else-if="store.query.trim()" :class="$style.empty">Ничего не нашлось</p>
    </div>

    <BaseTextField
      v-if="store.selected"
      v-model="store.amount"
      :label="store.amountLabel"
      inputmode="decimal"
      :placeholder="store.selected.unit === 'piece' ? '1' : '150'"
    />

    <div v-if="store.preview" :class="$style.preview">
      <span>{{ store.preview.kcal }} ккал</span>
      <span>Б {{ store.preview.protein }}</span>
      <span>Ж {{ store.preview.fat }}</span>
      <span>У {{ store.preview.carbs }}</span>
    </div>

    <BaseButton type="submit" :disabled="!store.canSubmit || store.submitting">
      {{ store.submitting ? 'Сохраняю…' : 'Добавить в дневник' }}
    </BaseButton>
  </form>
</template>

<script setup lang="ts">
import type { Product } from '@/entities/Product'
import { BaseButton, BaseTextField } from '@/shared/ui'
import { useAddDiaryEntryStore } from '../../model/store'

const store = useAddDiaryEntryStore()

function unitLabel(product: Product): string {
  return product.unit === 'piece' ? 'шт.' : '100г'
}

async function onSubmit() {
  await store.submit()
}
</script>

<style module>
.form {
  display: flex;
  flex-direction: column;
  gap: var(--space-m);
}

.search {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.chosen {
  font-size: var(--font-size-s);
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  gap: var(--space-s);
}

.clear {
  background: transparent;
  border: none;
  color: var(--text-muted);
  font-size: var(--font-size-s);
  cursor: pointer;
}

.matches {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 2px;
  max-height: 220px;
  overflow-y: auto;
  border: 1px solid var(--border);
  border-radius: var(--radius-m);
  padding: var(--space-xs);
}

.match {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-s);
  padding: var(--space-s);
  background: var(--bg-elevated);
  border: none;
  border-radius: var(--radius-s);
  color: var(--text-primary);
  font-size: var(--font-size-m);
  text-align: left;
  cursor: pointer;
}

.matchMeta {
  font-size: var(--font-size-s);
  color: var(--text-muted);
  white-space: nowrap;
}

.empty {
  font-size: var(--font-size-s);
  color: var(--text-muted);
}

.preview {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-m);
  padding: var(--space-s) var(--space-m);
  background: var(--bg-elevated);
  border-radius: var(--radius-m);
  font-size: var(--font-size-m);
  color: var(--text-primary);
  font-weight: 600;
}
</style>
