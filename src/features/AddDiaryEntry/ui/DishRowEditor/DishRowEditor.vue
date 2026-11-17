<template>
  <div :class="$style.dish">
    <!-- Свой продукт: разово, без сохранения в базу. -->
    <template v-if="row.custom">
      <div :class="$style.head">
        <span :class="$style.headLabel">Свой продукт</span>
        <button type="button" :class="$style.textButton" @click="store.clearRow(row.key)">К поиску</button>
      </div>
      <BaseTextField
        :model-value="row.custom.name"
        label="Название"
        placeholder="Кусок пиццы"
        autofocus
        @update:model-value="store.setCustomField(row.key, 'name', $event)"
      />
      <BaseSegmented
        :model-value="row.custom.unit"
        :options="unitOptions"
        aria-label="Единица"
        @update:model-value="store.setCustomField(row.key, 'unit', $event)"
      />
      <div :class="$style.macros">
        <BaseTextField
          v-for="field in macroFields"
          :key="field.key"
          :model-value="row.custom[field.key]"
          :label="field.label"
          inputmode="decimal"
          :placeholder="field.key === 'fiber' ? '0' : ''"
          @update:model-value="store.setCustomField(row.key, field.key, $event)"
        />
      </div>
    </template>

    <!-- Выбранный продукт из базы. -->
    <div v-else-if="selected" :class="$style.selected">
      <div :class="$style.selectedMain">
        <span :class="$style.selectedName">{{ selected.name }}</span>
        <span :class="$style.meta">{{ selected.kcal }} ккал / {{ unitLabel(selected) }}</span>
      </div>
      <button type="button" :class="$style.iconButton" aria-label="Выбрать другой продукт" @click="store.clearRow(row.key)">
        <AppIcon name="close" />
      </button>
    </div>

    <!-- Поиск: пустой запрос — частые продукты, иначе совпадения. -->
    <template v-else>
      <label :class="$style.search">
        <AppIcon name="search" :class="$style.searchIcon" />
        <input
          :class="$style.searchInput"
          :value="row.query"
          placeholder="Найти продукт"
          inputmode="search"
          enterkeyhint="search"
          aria-label="Поиск продукта"
          @input="store.setQuery(row.key, ($event.target as HTMLInputElement).value)"
        />
      </label>

      <p v-if="!row.query.trim() && store.frequentProducts.length" :class="$style.listTitle">Часто ешь</p>
      <ul v-if="options.length" :class="$style.options">
        <li v-for="option in options" :key="option.product.id">
          <button type="button" :class="$style.option" @click="store.selectProduct(row.key, option.product)">
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

      <button type="button" :class="$style.textButton" @click="store.startCustom(row.key)">
        <AppIcon name="plus" />
        Свой продукт без сохранения в базу
      </button>
    </template>

    <template v-if="store.resolvedFor(row.key)">
      <BaseTextField
        :model-value="row.amount"
        :label="store.amountLabelFor(row.key)"
        inputmode="decimal"
        enterkeyhint="done"
        :autofocus="!row.amount"
        :placeholder="store.resolvedFor(row.key)!.unit === 'piece' ? '1' : '150'"
        @update:model-value="store.setAmount(row.key, $event)"
      />
      <p v-if="preview" :class="$style.preview">
        <b>{{ preview.kcal }} ккал</b>
        · Б {{ preview.protein }} · Ж {{ preview.fat }} · У {{ preview.carbs }} · Кл {{ preview.fiber }}
      </p>
    </template>

    <button
      v-if="removable"
      type="button"
      :class="[$style.textButton, $style.remove]"
      @click="store.removeRow(row.key)"
    >
      <AppIcon name="trash" />
      Убрать блюдо
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Product } from '@/entities/Product'
import { AppIcon, BaseSegmented, BaseTextField } from '@/shared/ui'
import { useAddDiaryEntryStore } from '../../model/store'

const props = defineProps<{ rowKey: string; removable: boolean }>()

const store = useAddDiaryEntryStore()

const row = computed(() => store.rows.find((item) => item.key === props.rowKey)!)
const selected = computed(() => store.selectedFor(props.rowKey))
const preview = computed(() => store.previewFor(props.rowKey))

/** Пустой запрос — частые продукты с прошлой порцией; иначе — совпадения поиска. */
const options = computed(() => {
  if (!row.value.query.trim()) {
    return store.frequentProducts.map((item) => ({ product: item.product, lastAmount: item.lastAmount as number | null }))
  }
  return store.matchesFor(props.rowKey).map((product) => ({ product, lastAmount: null }))
})

const unitOptions = [
  { value: 'g', label: 'На 100 г' },
  { value: 'piece', label: 'На 1 шт.' },
]

const macroFields = [
  { key: 'kcal', label: 'Ккал' },
  { key: 'protein', label: 'Белки' },
  { key: 'fat', label: 'Жиры' },
  { key: 'carbs', label: 'Углеводы' },
  { key: 'fiber', label: 'Клетчатка' },
] as const

function unitLabel(product: Product): string {
  return product.unit === 'piece' ? 'шт.' : '100 г'
}

function formatAmount(amount: number, product: Product): string {
  return product.unit === 'piece' ? `${amount} шт.` : `${amount} г`
}
</script>

<style module>
.dish {
  display: flex;
  flex-direction: column;
  gap: var(--space-s);
  padding: var(--space-m);
  background: var(--bg-elevated);
  border-radius: var(--radius-m);
}

.head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-s);
}

.head-label {
  font-size: var(--font-size-s);
  font-weight: 600;
  color: var(--text-secondary);
}

.search {
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
  max-height: var(--dropdown-max-height);
  overflow-y: auto;
  border-radius: var(--radius-s);
}

.option {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-2xs);
  width: 100%;
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

.selected {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-s);
}

.selected-main {
  display: flex;
  flex-direction: column;
  gap: var(--space-2xs);
  min-width: 0;
}

.selected-name {
  font-size: var(--font-size-m);
  font-weight: 600;
  color: var(--text-primary);
}

.icon-button {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-xs);
  background: var(--bg-surface);
  border: none;
  border-radius: 50%;
  color: var(--text-secondary);
  font-size: var(--font-size-m);
}

.text-button {
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

.remove {
  color: var(--text-muted);
}

.macros {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(var(--macro-field-min-width), 1fr));
  gap: var(--space-s);
}

.preview {
  font-size: var(--font-size-s);
  color: var(--text-secondary);
}

.preview b {
  color: var(--text-primary);
}

@media (hover: hover) {
  .option:hover {
    background: var(--bg-hover);
  }
}
</style>
