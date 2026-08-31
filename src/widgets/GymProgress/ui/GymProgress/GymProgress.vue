<template>
  <ul v-if="rows.length" :class="$style.list">
    <li v-for="row in rows" :key="row.name" :class="$style.row">
      <span :class="$style.name">{{ row.name }}</span>
      <span :class="[$style.change, row.positive ? $style.good : $style.muted]">{{ row.text }}</span>
    </li>
  </ul>
  <p v-else :class="$style.empty">Нужно 2+ тренировки, чтобы показать прогрессию весов.</p>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useWorkoutStore } from '@/entities/Workout'
import { WORKOUT_TEMPLATES } from '@/shared/config/workouts'

const store = useWorkoutStore()

const assistNames = new Set(
  Object.values(WORKOUT_TEMPLATES)
    .flat()
    .filter((exercise) => exercise.assist)
    .map((exercise) => exercise.name),
)

interface Row {
  name: string
  text: string
  positive: boolean
}

const rows = computed<Row[]>(() => {
  const byExercise = new Map<string, { date: string; weight: number }[]>()
  for (const item of store.items) {
    if (item.weight == null) continue
    const arr = byExercise.get(item.exercise) ?? []
    arr.push({ date: item.date, weight: item.weight })
    byExercise.set(item.exercise, arr)
  }

  const result: Row[] = []
  for (const [name, entries] of byExercise) {
    if (entries.length < 2) continue
    entries.sort((a, b) => (a.date < b.date ? -1 : 1))
    const rawDelta = entries[entries.length - 1].weight - entries[0].weight
    const assist = assistNames.has(name)
    const positive = assist ? rawDelta < 0 : rawDelta > 0
    const sign = rawDelta >= 0 ? '+' : '−'
    const abs = Math.abs(rawDelta).toFixed(1)
    const text = assist ? `помощь ${sign}${abs} кг` : `${sign}${abs} кг`
    result.push({ name, text, positive })
  }
  return result
})
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

.change {
  font-weight: 600;
  font-size: var(--font-size-m);
}

.good {
  color: var(--success);
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
