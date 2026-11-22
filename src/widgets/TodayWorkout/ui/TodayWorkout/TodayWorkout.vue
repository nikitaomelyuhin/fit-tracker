<template>
  <div :class="$style.workout">
    <template v-if="store.todaySession">
      <span :class="$style.title">Тренировка</span>
      <span :class="$style.done">
        <AppIcon name="check" />
        сделана · {{ store.todaySession.entries.length }} {{ exercisesWord(store.todaySession.entries.length) }}
      </span>
    </template>
    <template v-else>
      <span :class="$style.caption">Сегодня ещё не было</span>
      <span :class="$style.title">Тренировка</span>
      <span v-if="store.lastSession" :class="$style.muted">
        прошлая: {{ formatHuman(store.lastSession.date) }}
        <template v-if="store.daysSinceLast != null">({{ daysAgoText(store.daysSinceLast) }})</template>
        · {{ store.lastSession.entries.length }} {{ exercisesWord(store.lastSession.entries.length) }}
      </span>
    </template>

    <BaseButton :variant="store.todaySession ? 'ghost' : 'primary'" @click="emit('log')">
      {{ store.todaySession ? 'Открыть' : 'Записать тренировку' }}
      <AppIcon name="chevronRight" />
    </BaseButton>
  </div>
</template>

<script setup lang="ts">
import { AppIcon, BaseButton } from '@/shared/ui'
import { formatHuman } from '@/shared/lib/date'
import { pluralRu } from '@/shared/lib/plural'
import { useTodayWorkoutStore } from '../../model/store'

const emit = defineEmits<{ log: [] }>()

const store = useTodayWorkoutStore()

function exercisesWord(count: number): string {
  return pluralRu(count, ['упражнение', 'упражнения', 'упражнений'])
}

function daysAgoText(days: number): string {
  return days === 1 ? 'вчера' : `${days} ${pluralRu(days, ['день', 'дня', 'дней'])} назад`
}
</script>

<style module>
.workout {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.caption {
  font-size: var(--font-size-xs);
  color: var(--text-muted);
}

.title {
  font-size: var(--font-size-xl);
  font-weight: 700;
  line-height: 1.1;
  color: var(--text-primary);
}

.done {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
  font-size: var(--font-size-s);
  color: var(--success);
}

.muted {
  font-size: var(--font-size-s);
  color: var(--text-muted);
}

.workout > button {
  margin-top: var(--space-s);
}
</style>
