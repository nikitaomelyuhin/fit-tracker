<template>
  <form :class="$style.form" @submit.prevent="onSubmit">
    <div :class="$style.row">
      <BaseTextField
        :model-value="store.date"
        label="Дата"
        type="date"
        @update:model-value="store.setDate($event)"
      />
      <BaseSelect v-model="store.mealType" label="Время суток" :options="mealTypeOptions" />
    </div>

    <div :class="$style.dishes">
      <div v-for="row in store.rows" :key="row.key" :class="$style.dish">
        <div :class="$style.dishHead">
          <span :class="$style.dishLabel">Блюдо</span>
          <button
            v-if="store.rows.length > 1"
            type="button"
            :class="$style.removeRow"
            @click="store.removeRow(row.key)"
          >
            Убрать
          </button>
        </div>

        <template v-if="row.custom">
          <BaseTextField
            :model-value="row.custom.name"
            label="Название"
            placeholder="Кусок пиццы"
            @update:model-value="store.setCustomField(row.key, 'name', $event)"
          />
          <BaseSelect
            :model-value="row.custom.unit"
            label="Единица БЖУ ниже"
            :options="unitOptions"
            @update:model-value="store.setCustomField(row.key, 'unit', $event)"
          />
          <div :class="$style.grid4">
            <BaseTextField
              :model-value="row.custom.kcal"
              label="Ккал"
              inputmode="decimal"
              @update:model-value="store.setCustomField(row.key, 'kcal', $event)"
            />
            <BaseTextField
              :model-value="row.custom.protein"
              label="Белки"
              inputmode="decimal"
              @update:model-value="store.setCustomField(row.key, 'protein', $event)"
            />
            <BaseTextField
              :model-value="row.custom.fat"
              label="Жиры"
              inputmode="decimal"
              @update:model-value="store.setCustomField(row.key, 'fat', $event)"
            />
            <BaseTextField
              :model-value="row.custom.carbs"
              label="Углеводы"
              inputmode="decimal"
              @update:model-value="store.setCustomField(row.key, 'carbs', $event)"
            />
          </div>
          <button type="button" :class="$style.clear" @click="store.clearRow(row.key)">
            ✕ отменить свой продукт, вернуться к поиску
          </button>
        </template>

        <template v-else>
          <BaseTextField
            v-if="!store.selectedFor(row.key)"
            :model-value="row.query"
            label="Продукт"
            placeholder="Начни вводить название…"
            @update:model-value="store.setQuery(row.key, $event)"
          />
          <span v-else :class="$style.chosen">
            выбрано: <b>{{ store.selectedFor(row.key)!.name }}</b>
            <button type="button" :class="$style.clear" @click="store.clearRow(row.key)">✕</button>
          </span>

          <ul v-if="store.matchesFor(row.key).length" :class="$style.matches">
            <li v-for="product in store.matchesFor(row.key)" :key="product.id">
              <button type="button" :class="$style.match" @click="store.selectProduct(row.key, product)">
                <span>{{ product.name }}</span>
                <span :class="$style.matchMeta">{{ product.kcal }} ккал / {{ unitLabel(product) }}</span>
              </button>
            </li>
          </ul>
          <p v-else-if="!store.selectedFor(row.key) && row.query.trim()" :class="$style.empty">
            Ничего не нашлось
          </p>

          <button
            v-if="!store.selectedFor(row.key)"
            type="button"
            :class="$style.customLink"
            @click="store.startCustom(row.key)"
          >
            + Свой продукт (разово, без сохранения в базу)
          </button>
        </template>

        <BaseTextField
          v-if="store.resolvedFor(row.key)"
          :model-value="row.amount"
          :label="store.amountLabelFor(row.key)"
          inputmode="decimal"
          :placeholder="store.resolvedFor(row.key)!.unit === 'piece' ? '1' : '150'"
          @update:model-value="store.setAmount(row.key, $event)"
        />

        <div v-if="store.previewFor(row.key)" :class="$style.preview">
          <span>{{ store.previewFor(row.key)!.kcal }} ккал</span>
          <span>Б {{ store.previewFor(row.key)!.protein }}</span>
          <span>Ж {{ store.previewFor(row.key)!.fat }}</span>
          <span>У {{ store.previewFor(row.key)!.carbs }}</span>
        </div>
      </div>
    </div>

    <BaseButton type="button" variant="ghost" @click="store.addRow">+ Ещё блюдо</BaseButton>

    <div v-if="store.validRowsCount > 0" :class="$style.total">
      Итого: {{ store.totalPreview.kcal }} ккал · Б{{ store.totalPreview.protein }}
      Ж{{ store.totalPreview.fat }} У{{ store.totalPreview.carbs }}
    </div>

    <BaseButton type="submit" :disabled="!store.canSubmit || store.submitting">
      {{ store.submitting ? 'Сохраняю…' : 'Сохранить приём пищи' }}
    </BaseButton>
  </form>
</template>

<script setup lang="ts">
import type { Product } from '@/entities/Product'
import { MEAL_TYPE_LABELS } from '@/shared/config/nutrition'
import { BaseButton, BaseSelect, BaseTextField } from '@/shared/ui'
import { useFreshDate } from '@/shared/lib/freshDate'
import { useAddDiaryEntryStore } from '../../model/store'

const store = useAddDiaryEntryStore()

useFreshDate(() => store.refreshDateIfUntouched())

const mealTypeOptions = store.mealTypes.map((type) => ({ value: type, label: MEAL_TYPE_LABELS[type] }))
const unitOptions = [
  { value: 'g', label: 'Граммы (БЖУ на 100г)' },
  { value: 'piece', label: 'Штуки (БЖУ на 1 шт.)' },
]

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

.row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-m);
}

@media (max-width: 520px) {
  .row {
    grid-template-columns: 1fr;
  }
}

.dishes {
  display: flex;
  flex-direction: column;
  gap: var(--space-m);
}

.dish {
  display: flex;
  flex-direction: column;
  gap: var(--space-s);
  padding: var(--space-m);
  background: var(--bg-elevated);
  border-radius: var(--radius-m);
}

.dishHead {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.dishLabel {
  font-size: var(--font-size-s);
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.removeRow {
  background: transparent;
  border: none;
  color: var(--danger);
  font-size: var(--font-size-s);
  cursor: pointer;
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
  text-align: left;
}

.customLink {
  background: transparent;
  border: none;
  color: var(--accent);
  font-size: var(--font-size-s);
  cursor: pointer;
  text-align: left;
  padding: 0;
}

.grid4 {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-s);
}

@media (max-width: 520px) {
  .grid4 {
    grid-template-columns: 1fr 1fr;
  }
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
  background: var(--bg-surface);
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
  background: var(--bg-surface);
  border-radius: var(--radius-m);
  font-size: var(--font-size-s);
  color: var(--text-secondary);
  font-weight: 600;
}

.total {
  padding: var(--space-s) var(--space-m);
  background: var(--bg-elevated);
  border-radius: var(--radius-m);
  font-size: var(--font-size-m);
  font-weight: 700;
  color: var(--text-primary);
}
</style>
