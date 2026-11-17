<template>
  <div v-if="store.byDateDesc.length" :class="$style.wrap">
    <DateRangeFilter v-model:from="filterFrom" v-model:to="filterTo" />

    <p v-if="!visibleEntries.length" :class="$style.empty">За этот период записей нет.</p>

    <ul v-else :class="$style.list">
      <li v-for="entry in visibleEntries" :key="entry.id" :class="$style.row">
        <span :class="$style.date">{{ relativeDayLabel(entry.date) }}</span>
        <span :class="$style.weight">
          {{ entry.weight }} кг
          <span v-if="store.isPendingDate(entry.date)" :class="$style.pending">не отправлено</span>
        </span>
        <BaseButton variant="subtle" aria-label="Удалить" @click="onDelete(entry.id)">
<AppIcon name="trash" />
</BaseButton>
      </li>
    </ul>

    <BaseButton
      v-if="!isFiltered && store.byDateDesc.length > DEFAULT_SHOWN"
      type="button"
      variant="ghost"
      @click="expanded = !expanded"
    >
      {{ expanded ? 'Свернуть' : `Показать все записи (${store.byDateDesc.length})` }}
    </BaseButton>
  </div>
  <p v-else :class="$style.empty">Записей пока нет</p>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useWeightLogStore } from '@/entities/WeightLog'
import { AppIcon, BaseButton, DateRangeFilter } from '@/shared/ui'
import { relativeDayLabel } from '@/shared/lib/date'

const DEFAULT_SHOWN = 14

const store = useWeightLogStore()

// Список за всё время нечитаем — по умолчанию последние записи,
// остальное — по клику «показать все» или по своему диапазону дат.
const expanded = ref(false)
const filterFrom = ref('')
const filterTo = ref('')

const isFiltered = computed(() => filterFrom.value !== '' || filterTo.value !== '')

const visibleEntries = computed(() => {
  const entries = store.byDateDesc
  if (isFiltered.value) {
    return entries.filter(
      (entry) => (filterFrom.value === '' || entry.date >= filterFrom.value) &&
        (filterTo.value === '' || entry.date <= filterTo.value),
    )
  }
  return expanded.value ? entries : entries.slice(0, DEFAULT_SHOWN)
})


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


.list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.row {
  display: grid;
  grid-template-columns: 1fr auto auto;
  align-items: center;
  gap: var(--space-m);
  padding: var(--space-s) var(--space-m);
  background: var(--bg-elevated);
  border-radius: var(--radius-m);
}

.date {
  color: var(--text-secondary);
  font-size: var(--font-size-s);
}

.pending {
  margin-left: var(--space-xs);
  font-size: var(--font-size-s);
  color: var(--warning);
}

.weight {
  color: var(--text-primary);
  font-weight: 600;
}

.empty {
  color: var(--text-muted);
  font-size: var(--font-size-m);
  text-align: center;
  padding: var(--space-l);
}
</style>
