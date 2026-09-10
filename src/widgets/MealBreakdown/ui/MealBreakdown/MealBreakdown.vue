<template>
  <div v-if="rows.length" :class="$style.wrap">
    <ul :class="$style.list">
      <li v-for="row in rows" :key="row.mealType" :class="$style.row">
        <span :class="$style.name">{{ MEAL_TYPE_LABELS[row.mealType] }}</span>
        <div :class="$style.track">
          <div :class="$style.fill" :style="{ width: row.sharePct + '%' }" />
        </div>
        <span :class="$style.value">~{{ row.avgKcal }} ккал</span>
        <span :class="$style.share">{{ row.sharePct }}%</span>
        <span :class="$style.meta">{{ row.days }} дн.</span>
      </li>
    </ul>
    <p :class="$style.hint">
      Среднее ккал считается только по дням, где этот приём был записан — пропуски не занижают
      среднее. Доля (%) — от суммы средних всех приёмов, грубая прикидка, не строгий разбор дня.
    </p>
  </div>
  <p v-else :class="$style.empty">Веди дневник питания — здесь появится, где утекают калории.</p>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDiaryEntryStore } from '@/entities/DiaryEntry'
import { MEAL_TYPE_LABELS } from '@/shared/config/nutrition'

const store = useDiaryEntryStore()

const rows = computed(() => {
  const data = store.avgKcalByMealType
  const total = data.reduce((sum, row) => sum + row.avgKcal, 0)
  if (!total) return []
  return data
    .map((row) => ({ ...row, sharePct: Math.round((row.avgKcal / total) * 100) }))
    .sort((a, b) => b.avgKcal - a.avgKcal)
})
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
  gap: var(--space-s);
}

.row {
  display: grid;
  grid-template-columns: 90px 1fr auto 44px 56px;
  align-items: center;
  gap: var(--space-s);
}

.name {
  font-size: var(--font-size-m);
  color: var(--text-secondary);
}

.track {
  height: 8px;
  background: var(--bg-elevated);
  border-radius: var(--radius-s);
  overflow: hidden;
}

.fill {
  height: 100%;
  background: var(--accent);
  border-radius: var(--radius-s);
}

.value {
  font-size: var(--font-size-m);
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
}

.share {
  font-size: var(--font-size-s);
  color: var(--text-muted);
  text-align: right;
}

.meta {
  font-size: var(--font-size-s);
  color: var(--text-muted);
  white-space: nowrap;
}

.hint {
  font-size: var(--font-size-s);
  color: var(--text-muted);
}

.empty {
  color: var(--text-muted);
  font-size: var(--font-size-m);
  text-align: center;
  padding: var(--space-l);
}

@media (max-width: 520px) {
  .row {
    grid-template-columns: 70px 1fr 40px;
    grid-template-areas:
      'name value share'
      'track track track';
  }

  .name {
    grid-area: name;
  }
  .value {
    grid-area: value;
    text-align: right;
  }
  .share {
    grid-area: share;
  }
  .track {
    grid-area: track;
  }
  .meta {
    display: none;
  }
}
</style>
