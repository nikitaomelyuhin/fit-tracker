<template>
  <div v-if="store.groupedByDateDesc.length" :class="$style.wrap">
    <DateRangeFilter v-if="expanded" v-model:from="filterFrom" v-model:to="filterTo" />

    <p v-if="!visibleDays.length" :class="$style.empty">
      {{ expanded ? 'За этот период записей нет.' : 'За последние три дня записей нет.' }}
    </p>

    <div v-else :class="$style.days">
      <div v-for="day in visibleDays" :key="day.date" :class="$style.day">
      <div :class="$style.dayHead">
        <span :class="$style.date">
          {{ formatHuman(day.date) }}
          <span v-if="cheatDays.isCheat(day.date)" :class="$style.cheatBadge">читмил</span>
        </span>
        <span :class="$style.dayTotals">
          {{ day.totals.kcal }} ккал · Б{{ day.totals.protein }} Ж{{ day.totals.fat }} У{{ day.totals.carbs }}
          Кл{{ day.totals.fiber }}
        </span>
      </div>

      <div v-for="meal in day.meals" :key="meal.mealType" :class="$style.meal">
        <div :class="$style.mealHead">
          <span :class="$style.mealLabel">{{ MEAL_TYPE_LABELS[meal.mealType] }}</span>
          <span :class="$style.mealTotals">
            {{ meal.totals.kcal }} ккал · Б{{ meal.totals.protein }} Ж{{ meal.totals.fat }} У{{ meal.totals.carbs }}
            Кл{{ meal.totals.fiber }}
          </span>
        </div>

        <ul :class="$style.list">
          <li v-for="entry in meal.entries" :key="entry.id" :class="$style.row">
            <div :class="$style.rowMain">
              <span :class="$style.name">
                {{ entry.productName }}
                <span v-if="store.isPendingEntry(entry.id)" :class="$style.pending">⏳ не отправлено</span>
              </span>
              <span :class="$style.meta">
                {{ entry.kcal }} ккал · Б{{ entry.protein }} Ж{{ entry.fat }} У{{ entry.carbs }} Кл{{ entry.fiber }}
              </span>
            </div>

            <template v-if="editingId === entry.id">
              <input
                v-model="editAmount"
                :class="$style.amountInput"
                inputmode="decimal"
                @keyup.enter="saveEdit(entry.id)"
              />
              <BaseButton type="button" aria-label="Сохранить порцию" @click="saveEdit(entry.id)">
                <AppIcon name="check" />
              </BaseButton>
              <BaseButton type="button" variant="ghost" aria-label="Отменить" @click="cancelEdit">
                <AppIcon name="close" />
              </BaseButton>
            </template>
            <template v-else>
              <button type="button" :class="$style.amount" @click="startEdit(entry.id, entry.amount)">
                {{ entry.amount }}
              </button>
              <BaseButton type="button" variant="subtle" aria-label="Удалить" @click="onDelete(entry.id)">
<AppIcon name="trash" />
</BaseButton>
            </template>
          </li>
        </ul>
      </div>
    </div>
    </div>

    <BaseButton
      v-if="expanded || store.groupedByDateDesc.length > recentDays.length"
      type="button"
      variant="ghost"
      @click="toggleExpanded"
    >
      {{ expanded ? 'Свернуть' : 'Показать подробнее' }}
    </BaseButton>
  </div>
  <p v-else :class="$style.empty">Дневник пуст — добавь первый приём пищи выше.</p>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useDiaryEntryStore } from '@/entities/DiaryEntry'
import { useCheatDayStore } from '@/entities/CheatDay'
import { MEAL_TYPE_LABELS } from '@/shared/config/nutrition'
import { AppIcon, BaseButton, DateRangeFilter } from '@/shared/ui'
import { addDays, formatHuman, todayISO } from '@/shared/lib/date'
import { toNumber } from '@/shared/lib/number'

/** По умолчанию — сегодня, вчера и позавчера; остальное по кнопке. */
const RECENT_DAYS = 3

const store = useDiaryEntryStore()
const cheatDays = useCheatDayStore()

const editingId = ref<string | null>(null)
const editAmount = ref('')

// Список за всё время нечитаем — по умолчанию показываем последние дни,
// остальное — по клику «показать все» или по своему диапазону дат.
const expanded = ref(false)
const filterFrom = ref('')
const filterTo = ref('')

const isFiltered = computed(() => filterFrom.value !== '' || filterTo.value !== '')

const recentDays = computed(() => {
  const since = addDays(todayISO(), -(RECENT_DAYS - 1))
  return store.groupedByDateDesc.filter((day) => day.date >= since)
})

const visibleDays = computed(() => {
  const days = store.groupedByDateDesc
  if (isFiltered.value) {
    return days.filter(
      (day) => (filterFrom.value === '' || day.date >= filterFrom.value) &&
        (filterTo.value === '' || day.date <= filterTo.value),
    )
  }
  return expanded.value ? days : recentDays.value
})

function clearFilter() {
  filterFrom.value = ''
  filterTo.value = ''
}

function toggleExpanded() {
  expanded.value = !expanded.value
  if (!expanded.value) clearFilter()
}

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
  store.remove(id)
}
</script>

<style module>
.wrap {
  display: flex;
  flex-direction: column;
  gap: var(--space-m);
}


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

.day-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-m);
  padding-bottom: var(--space-xs);
  border-bottom: var(--border-width) solid var(--border);
}

.date {
  font-weight: 700;
  font-size: var(--font-size-l);
  color: var(--text-primary);
}

.cheat-badge {
  margin-left: var(--space-s);
  padding: var(--space-2xs) var(--space-s);
  border-radius: var(--radius-s);
  background: var(--danger);
  color: var(--accent-contrast);
  font-size: var(--font-size-s);
  font-weight: 600;
  vertical-align: middle;
}

.day-totals {
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

.meal-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-m);
}

.meal-label {
  font-size: var(--font-size-s);
  font-weight: 600;
  color: var(--accent);
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.meal-totals {
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

.row-main {
  display: flex;
  flex-direction: column;
  gap: var(--space-2xs);
  min-width: 0;
  flex: 1;
}

.name {
  color: var(--text-primary);
  font-size: var(--font-size-m);
}

.pending {
  margin-left: var(--space-s);
  font-size: var(--font-size-s);
  color: var(--warning);
}

.meta {
  font-size: var(--font-size-s);
  color: var(--text-muted);
}

.amount {
  flex-shrink: 0;
  background: transparent;
  border: var(--border-width) solid var(--border);
  border-radius: var(--radius-s);
  padding: var(--space-xs) var(--space-s);
  color: var(--text-secondary);
  font-size: var(--font-size-s);
  cursor: pointer;
}

.amount-input {
  width: var(--amount-input-width);
  flex-shrink: 0;
  padding: var(--space-xs) var(--space-s);
  background: var(--bg-surface);
  border: var(--border-width) solid var(--accent);
  border-radius: var(--radius-s);
  color: var(--text-primary);
  font-size: var(--font-size-input);
  outline: none;
}

.empty {
  color: var(--text-muted);
  font-size: var(--font-size-m);
  text-align: center;
  padding: var(--space-l);
}
</style>
