<template>
  <div :class="$style.goal">
    <div :class="$style.stats">
      <div :class="$style.stat">
        <span :class="$style.label">Сейчас</span>
        <span :class="$style.value">{{ currentText }}</span>
      </div>
      <div :class="$style.stat">
        <span :class="$style.label">Цель</span>
        <span :class="$style.value">{{ goal }} кг</span>
      </div>
      <div :class="$style.stat">
        <span :class="$style.label">Осталось</span>
        <span :class="[$style.value, reached && $style.done]">{{ remainingText }}</span>
      </div>
    </div>

    <div :class="$style.bar">
      <div :class="$style.fill" :style="{ width: progress + '%' }" />
    </div>
    <p :class="$style.progressText">{{ progress }}% пути пройдено</p>

    <ul :class="$style.milestones">
      <li
        v-for="point in checkpoints"
        :key="point"
        :class="[$style.milestone, isReached(point) && $style.reachedItem]"
      >
        <span :class="$style.check">{{ isReached(point) ? '✓' : '○' }}</span>
        {{ point }} кг
      </li>
    </ul>

    <p :class="$style.hint">«Сейчас» — {{ currentIsAverage ? 'средний за текущую неделю (ср→вт)' : 'последняя запись' }}.</p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useWeightLogStore } from '@/entities/WeightLog'
import { WEIGHT_GOAL_KG, WEIGHT_MILESTONES_KG } from '@/shared/config/goals'

const store = useWeightLogStore()
const goal = WEIGHT_GOAL_KG
const checkpoints = [...WEIGHT_MILESTONES_KG, WEIGHT_GOAL_KG]

const currentIsAverage = computed(() => store.currentWeekAverage != null)
const current = computed(() => store.currentWeekAverage ?? store.byDateDesc[0]?.weight ?? null)
const start = computed(() => store.byDateAsc[0]?.weight ?? null)

const reached = computed(() => current.value != null && current.value <= goal)

const remaining = computed(() =>
  current.value != null ? Math.max(0, current.value - goal) : null,
)

const progress = computed(() => {
  if (current.value == null || start.value == null || start.value <= goal) {
    return reached.value ? 100 : 0
  }
  const value = ((start.value - current.value) / (start.value - goal)) * 100
  return Math.min(100, Math.max(0, Math.round(value)))
})

const currentText = computed(() => (current.value != null ? `${current.value} кг` : '—'))
const remainingText = computed(() => {
  if (reached.value) return 'Цель достигнута 🎉'
  return remaining.value != null ? `${remaining.value.toFixed(1)} кг` : '—'
})

function isReached(point: number): boolean {
  return current.value != null && current.value <= point
}
</script>

<style module>
.goal {
  display: flex;
  flex-direction: column;
  gap: var(--space-m);
}

.stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-m);
}

.stat {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.label {
  font-size: var(--font-size-s);
  color: var(--text-secondary);
}

.value {
  font-size: var(--font-size-l);
  font-weight: 600;
  color: var(--text-primary);
}

.done {
  color: var(--success);
}

.bar {
  width: 100%;
  height: 8px;
  background: var(--bg-elevated);
  border-radius: var(--radius-s);
  overflow: hidden;
}

.fill {
  height: 100%;
  background: var(--accent);
  border-radius: var(--radius-s);
  transition: width 0.3s ease;
}

.progressText {
  font-size: var(--font-size-s);
  color: var(--text-secondary);
}

.milestones {
  list-style: none;
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-s);
}

.milestone {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-xs) var(--space-s);
  background: var(--bg-elevated);
  border-radius: var(--radius-s);
  font-size: var(--font-size-s);
  color: var(--text-muted);
}

.reachedItem {
  color: var(--success);
}

.check {
  font-weight: 700;
}

.hint {
  font-size: var(--font-size-s);
  color: var(--text-muted);
}
</style>
