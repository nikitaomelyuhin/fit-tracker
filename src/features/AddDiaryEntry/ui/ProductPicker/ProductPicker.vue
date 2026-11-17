<template>
  <div :class="$style.picker">
    <div :class="[$style.searchRow, searching && $style.searchRowPinned]">
      <label :class="$style.search">
        <AppIcon name="search" :class="$style.searchIcon" />
        <input
          ref="input"
          :class="$style.searchInput"
          :value="row.query"
          placeholder="Найти продукт"
          inputmode="search"
          enterkeyhint="search"
          aria-label="Поиск продукта"
          @focus="store.openSearch(rowKey)"
          @input="store.setQuery(rowKey, ($event.target as HTMLInputElement).value)"
          @keydown.enter.prevent="pickFirst"
        />
      </label>
      <button v-if="searching" type="button" :class="$style.cancel" @click="cancel">Отмена</button>
    </div>

    <p v-if="!row.query.trim() && store.frequentProducts.length" :class="$style.listTitle">Часто ешь</p>
    <ul v-if="options.length" :class="[$style.options, !searching && $style.optionsCompact]">
      <li v-for="option in options" :key="option.product.id">
        <button type="button" :class="$style.option" @click="store.selectProduct(rowKey, option.product)">
          <span :class="$style.optionName">{{ option.product.name }}</span>
          <span :class="$style.meta">
            <template v-if="option.lastAmount != null">
              {{ formatAmount(option.lastAmount, option.product) }} ·
            </template>
            {{ option.product.kcal }} ккал / {{ unitLabel(option.product) }}
          </span>
        </button>
      </li>
    </ul>
    <p v-else-if="row.query.trim()" :class="$style.empty">Ничего не нашлось</p>

    <button type="button" :class="$style.custom" @click="store.startCustom(rowKey)">
      <AppIcon name="plus" />
      Свой продукт без сохранения в базу
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Product } from '@/entities/Product'
import { AppIcon } from '@/shared/ui'
import { useAddDiaryEntryStore } from '../../model/store'

const props = defineProps<{ rowKey: string }>()

const store = useAddDiaryEntryStore()

const row = computed(() => store.rows.find((item) => item.key === props.rowKey)!)
const searching = computed(() => store.searchRowKey === props.rowKey)

/** Пустой запрос — частые продукты с прошлой порцией; иначе — совпадения поиска. */
const options = computed(() => {
  if (!row.value.query.trim()) {
    return store.frequentProducts.map((item) => ({ product: item.product, lastAmount: item.lastAmount as number | null }))
  }
  return store.matchesFor(props.rowKey).map((product) => ({ product, lastAmount: null }))
})

function unitLabel(product: Product): string {
  return product.unit === 'piece' ? 'шт.' : '100 г'
}

function formatAmount(amount: number, product: Product): string {
  return product.unit === 'piece' ? `${amount} шт.` : `${amount} г`
}

const input = ref<HTMLInputElement | null>(null)

/** Enter на клавиатуре — взять первый результат, а не отправить всю форму. */
function pickFirst() {
  const first = options.value[0]
  if (first) store.selectProduct(props.rowKey, first.product)
}

function cancel() {
  input.value?.blur()
  store.cancelSearch()
}
</script>

<style module>
.picker {
  display: flex;
  flex-direction: column;
  gap: var(--space-s);
}

.search-row {
  display: flex;
  align-items: center;
  gap: var(--space-s);
}

/* В режиме поиска поле прилипает к верху шторки, список прокручивается под ним. */
.search-row-pinned {
  position: sticky;
  top: calc(-1 * var(--space-s));
  z-index: 1;
  margin: calc(-1 * var(--space-s)) calc(-1 * var(--space-m)) 0;
  padding: var(--space-s) var(--space-m);
  background: var(--bg-surface);
}

.search {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: var(--space-s);
  min-height: var(--touch-target);
  padding: 0 var(--space-m);
  background: var(--bg-surface);
  border: var(--border-width) solid var(--border);
  border-radius: var(--radius-m);
  transition:
    border-color var(--duration-fast) var(--ease-out),
    box-shadow var(--duration-fast) var(--ease-out);
}

.search-row-pinned .search {
  background: var(--bg-elevated);
}

.search:focus-within {
  border-color: var(--accent);
  box-shadow: var(--focus-halo);
}

.search-icon {
  color: var(--text-muted);
}

.search-input {
  flex: 1;
  min-width: 0;
  padding: var(--space-s) 0;
  background: transparent;
  border: none;
  outline: none;
  font-size: var(--font-size-input);
  color: var(--text-primary);
}

.search-input::placeholder {
  color: var(--text-muted);
}

.cancel {
  flex-shrink: 0;
  min-height: var(--touch-target);
  padding: 0 var(--space-xs);
  background: transparent;
  border: none;
  color: var(--accent);
  font-size: var(--font-size-m);
  font-weight: 600;
}

.list-title {
  font-size: var(--font-size-xs);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--text-muted);
}

.options {
  list-style: none;
  display: flex;
  flex-direction: column;
  border-radius: var(--radius-s);
}

/* В обычной форме список частых — короткий, со своей прокруткой. */
.options-compact {
  max-height: var(--dropdown-max-height);
  overflow-y: auto;
}

.option {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-2xs);
  width: 100%;
  min-height: var(--touch-target);
  padding: var(--space-s);
  background: transparent;
  border: none;
  border-radius: var(--radius-s);
  text-align: left;
  color: var(--text-primary);
  transition: background var(--duration-fast) var(--ease-out);
}

.option:active {
  background: var(--bg-pressed);
}

.option-name {
  font-size: var(--font-size-m);
}

.meta {
  font-size: var(--font-size-s);
  color: var(--text-muted);
}

.empty {
  font-size: var(--font-size-s);
  color: var(--text-muted);
}

.custom {
  display: inline-flex;
  align-items: center;
  align-self: flex-start;
  gap: var(--space-xs);
  padding: var(--space-xs) 0;
  background: transparent;
  border: none;
  color: var(--accent);
  font-size: var(--font-size-s);
  font-weight: 600;
}

@media (hover: hover) {
  .option:hover {
    background: var(--bg-hover);
  }
}
</style>
