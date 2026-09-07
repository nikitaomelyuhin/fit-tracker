<template>
  <div v-if="hasData" :class="$style.stats">
    <div :class="$style.stat">
      <span :class="$style.label">Частота</span>
      <span :class="$style.value">{{ frequencyText }}</span>
    </div>
    <div :class="$style.stat">
      <span :class="$style.label">С последней тренировки</span>
      <span :class="[$style.value, staleTone && $style.warn]">{{ sinceLastText }}</span>
    </div>
  </div>
  <p v-else :class="$style.empty">Запиши пару тренировок — здесь появится статистика по частоте.</p>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useWorkoutStore } from '@/entities/Workout'

const store = useWorkoutStore()

const hasData = computed(() => store.sessions.length > 0)

const frequencyText = computed(
  () => `${store.sessionsLast4Weeks} трен. за 4 нед · ~${store.avgSessionsPerWeek}/нед`,
)

const sinceLastText = computed(() => {
  const days = store.daysSinceLastSession
  if (days == null) return '—'
  if (days === 0) return 'сегодня'
  if (days === 1) return 'вчера'
  return `${days} дн. назад`
})
const staleTone = computed(() => (store.daysSinceLastSession ?? 0) >= 5)
</script>

<style module>
.stats {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-xl);
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

.warn {
  color: var(--warning);
}

.empty {
  color: var(--text-muted);
  font-size: var(--font-size-m);
  text-align: center;
  padding: var(--space-l);
}
</style>
