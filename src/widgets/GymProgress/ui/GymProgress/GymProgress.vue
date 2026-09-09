<template>
  <ul v-if="rows.length" :class="$style.list">
    <li v-for="row in rows" :key="row.name" :class="$style.row">
      <span :class="$style.name">{{ row.name }}</span>
      <span :class="$style.deltas">
        <span :class="[$style.change, row.weightPositive ? $style.good : $style.muted]">{{
          row.weightText
        }}</span>
        <span
          v-if="row.volumeText"
          :class="[$style.volume, row.volumePositive ? $style.good : $style.warn]"
          >{{ row.volumeText }}</span
        >
      </span>
    </li>
  </ul>
  <p v-else :class="$style.empty">Нужно 3+ тренировки одного упражнения (первая — входная, не считается).</p>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useWorkoutStore } from '@/entities/Workout'

const store = useWorkoutStore()

interface Row {
  name: string
  weightText: string
  weightPositive: boolean
  volumeText: string
  volumePositive: boolean
}

function signed(value: number, digits = 1): string {
  const rounded = Math.abs(value).toFixed(digits)
  return value >= 0 ? `+${rounded}` : `−${rounded}`
}

const rows = computed<Row[]>(() =>
  store.exerciseProgress.map((entry) => {
    const weightPositive = entry.assist ? entry.weightDelta < 0 : entry.weightDelta > 0
    return {
      name: entry.name,
      weightText: entry.assist
        ? `помощь ${signed(entry.weightDelta)} кг`
        : `${signed(entry.weightDelta)} кг`,
      weightPositive,
      volumeText: entry.volumeDelta != null ? `тоннаж ${signed(entry.volumeDelta, 0)} кг` : '',
      volumePositive: (entry.volumeDelta ?? 0) > 0,
    }
  }),
)
</script>

<style module>
.list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-m);
  padding: var(--space-s) var(--space-m);
  background: var(--bg-elevated);
  border-radius: var(--radius-m);
}

.name {
  color: var(--text-secondary);
  font-size: var(--font-size-m);
}

.deltas {
  display: flex;
  align-items: baseline;
  gap: var(--space-m);
  flex-shrink: 0;
}

.change {
  font-weight: 600;
  font-size: var(--font-size-m);
}

.volume {
  font-size: var(--font-size-s);
}

.good {
  color: var(--success);
}

.warn {
  color: var(--warning);
}

.muted {
  color: var(--text-muted);
}

.empty {
  color: var(--text-muted);
  font-size: var(--font-size-m);
  text-align: center;
  padding: var(--space-l);
}
</style>
