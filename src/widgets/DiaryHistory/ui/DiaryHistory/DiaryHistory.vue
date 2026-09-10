<template>
  <div v-if="store.groupedByDateDesc.length" :class="$style.days">
    <div v-for="day in store.groupedByDateDesc" :key="day.date" :class="$style.day">
      <div :class="$style.dayHead">
        <span :class="$style.date">{{ formatHuman(day.date) }}</span>
        <span :class="$style.dayTotals">
          {{ day.totals.kcal }} ккал · Б{{ day.totals.protein }} Ж{{ day.totals.fat }} У{{ day.totals.carbs }}
        </span>
      </div>

      <div v-for="meal in day.meals" :key="meal.mealType" :class="$style.meal">
        <div :class="$style.mealHead">
          <span :class="$style.mealLabel">{{ MEAL_TYPE_LABELS[meal.mealType] }}</span>
          <span :class="$style.mealTotals">
            {{ meal.totals.kcal }} ккал · Б{{ meal.totals.protein }} Ж{{ meal.totals.fat }} У{{ meal.totals.carbs }}
          </span>
        </div>

        <ul :class="$style.list">
          <li v-for="entry in meal.entries" :key="entry.id" :class="$style.row">
            <div :class="$style.rowMain">
              <span :class="$style.name">{{ entry.productName }}</span>
              <span :class="$style.meta">{{ entry.kcal }} ккал · Б{{ entry.protein }} Ж{{ entry.fat }} У{{ entry.carbs }}</span>
            </div>

            <template v-if="editingId === entry.id">
              <input
                v-model="editAmount"
                :class="$style.amountInput"
                inputmode="decimal"
                @keyup.enter="saveEdit(entry.id)"
              />
              <BaseButton type="button" @click="saveEdit(entry.id)">✓</BaseButton>
              <BaseButton type="button" variant="ghost" @click="cancelEdit">✕</BaseButton>
            </template>
            <template v-else>
              <button type="button" :class="$style.amount" @click="startEdit(entry.id, entry.amount)">
                {{ entry.amount }}
              </button>
              <BaseButton type="button" variant="danger" @click="onDelete(entry.id)">
                {{ pendingId === entry.id ? 'Удалить?' : '✕' }}
              </BaseButton>
            </template>
          </li>
        </ul>
      </div>
    </div>
  </div>
  <p v-else :class="$style.empty">Дневник пуст — добавь первый приём пищи выше.</p>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useDiaryEntryStore } from '@/entities/DiaryEntry'
import { MEAL_TYPE_LABELS } from '@/shared/config/nutrition'
import { BaseButton } from '@/shared/ui'
import { formatHuman } from '@/shared/lib/date'
import { toNumber } from '@/shared/lib/number'

const store = useDiaryEntryStore()

const editingId = ref<string | null>(null)
const editAmount = ref('')
const pendingId = ref<string | null>(null)

function startEdit(id: string, amount: number) {
  editingId.value = id
  editAmount.value = String(amount)
}

function cancelEdit() {
  editingId.value = null
  editAmount.value = ''
}

async function saveEdit(id: string) {
  const amount = toNumber(editAmount.value)
  if (amount != null && amount > 0) await store.updateAmount(id, amount)
  cancelEdit()
}

function onDelete(id: string) {
  if (pendingId.value === id) {
    store.remove(id)
    pendingId.value = null
  } else {
    pendingId.value = id
  }
}
</script>

<style module>
.days {
  display: flex;
  flex-direction: column;
  gap: var(--space-l);
}

.day {
  display: flex;
  flex-direction: column;
  gap: var(--space-s);
}

.dayHead {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-m);
  padding-bottom: var(--space-xs);
  border-bottom: 1px solid var(--border);
}

.date {
  font-weight: 700;
  font-size: var(--font-size-l);
  color: var(--text-primary);
}

.dayTotals {
  font-size: var(--font-size-m);
  color: var(--text-primary);
  font-weight: 600;
}

.meal {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  padding-left: var(--space-s);
}

.mealHead {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-m);
}

.mealLabel {
  font-size: var(--font-size-s);
  font-weight: 600;
  color: var(--accent);
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.mealTotals {
  font-size: var(--font-size-s);
  color: var(--text-muted);
}

.list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.row {
  display: flex;
  align-items: center;
  gap: var(--space-s);
  padding: var(--space-s) var(--space-m);
  background: var(--bg-elevated);
  border-radius: var(--radius-m);
}

.rowMain {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  flex: 1;
}

.name {
  color: var(--text-primary);
  font-size: var(--font-size-m);
}

.meta {
  font-size: var(--font-size-s);
  color: var(--text-muted);
}

.amount {
  flex-shrink: 0;
  background: transparent;
  border: 1px solid var(--border);
  border-radius: var(--radius-s);
  padding: var(--space-xs) var(--space-s);
  color: var(--text-secondary);
  font-size: var(--font-size-s);
  cursor: pointer;
}

.amountInput {
  width: 64px;
  flex-shrink: 0;
  padding: var(--space-xs) var(--space-s);
  background: var(--bg-surface);
  border: 1px solid var(--accent);
  border-radius: var(--radius-s);
  color: var(--text-primary);
  font-size: var(--font-size-s);
  outline: none;
}

.empty {
  color: var(--text-muted);
  font-size: var(--font-size-m);
  text-align: center;
  padding: var(--space-l);
}
</style>
