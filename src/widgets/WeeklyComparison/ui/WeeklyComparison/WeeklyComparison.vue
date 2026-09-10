<template>
  <div :class="$style.weekly">
    <template v-if="current">
      <div :class="$style.headline">
        <div :class="$style.side">
          <span :class="$style.label">Эта неделя</span>
          <span :class="$style.big">{{ current.averageKg }} кг</span>
          <span :class="$style.meta">{{ weekLabel(current) }} · {{ entriesText(current) }}</span>
        </div>
        <div :class="[$style.delta, $style[deltaTone]]">
          <span :class="$style.deltaValue">{{ deltaText }}</span>
          <span :class="$style.deltaHint">{{ deltaHint }}</span>
        </div>
        <div :class="$style.side">
          <span :class="$style.label">Прошлая неделя</span>
          <span :class="$style.big">{{ previous ? previous.averageKg + ' кг' : '—' }}</span>
          <span :class="$style.meta">{{ previous ? weekLabel(previous) : 'нет данных' }}</span>
        </div>
      </div>

      <ul :class="$style.list">
        <li v-for="week in recent" :key="week.weekStart" :class="$style.row">
          <span :class="$style.rowWeek">{{ weekLabel(week) }}</span>
          <span :class="$style.rowValue">{{ week.averageKg }} кг</span>
          <span :class="[$style.rowDelta, $style[tone(week.deltaKg)]]">{{ rowDelta(week) }}</span>
        </li>
      </ul>

      <p :class="$style.hint">
        Неделя считается со среды по вторник. Сравниваются средние за неделю — один день на весах
        это вода и еда, а не жир.
      </p>
    </template>
    <p v-else :class="$style.empty">
      Недельные средние появятся, как только будет хотя бы одно взвешивание.
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useWeightLogStore } from '@/entities/WeightLog'
import type { WeeklyAverage } from '@/entities/WeightLog'
import { addDays, formatHuman } from '@/shared/lib/date'

const WEEKS_SHOWN = 8

const store = useWeightLogStore()

const current = computed(() => store.latestWeek)
const previous = computed(() => store.previousWeek)
const delta = computed(() => store.weekOverWeekDeltaKg)

const recent = computed(() => [...store.weeklyAverages].reverse().slice(0, WEEKS_SHOWN))

const deltaText = computed(() => {
  const value = delta.value
  if (value == null) return '—'
  if (value === 0) return '0 кг'
  return value < 0 ? `−${Math.abs(value).toFixed(1)} кг` : `+${value.toFixed(1)} кг`
})

const deltaTone = computed(() => tone(delta.value))

const deltaHint = computed(() => {
  const value = delta.value
  if (value == null) return 'первая неделя'
  const gap = current.value?.gapWeeks ?? 1
  if (gap > 1) return `пропуск ${gap - 1} нед.`
  if (value <= -1.2) return 'очень быстро'
  if (value <= -0.4) return 'в коридоре'
  if (value < -0.1) return 'медленно'
  if (value <= 0.1) return 'стоит'
  return 'рост'
})

function tone(value: number | null): 'good' | 'warn' | 'muted' {
  if (value == null) return 'muted'
  if (value <= -1.2) return 'warn'
  if (value < -0.1) return 'good'
  if (value <= 0.1) return 'muted'
  return 'warn'
}

function weekLabel(week: WeeklyAverage): string {
  return `${formatHuman(week.weekStart)} – ${formatHuman(addDays(week.weekStart, 6))}`
}

function entriesText(week: WeeklyAverage): string {
  return `${week.entries} взв.`
}

function rowDelta(week: WeeklyAverage): string {
  if (week.deltaKg == null) return 'старт'
  if (week.deltaKg === 0) return '0'
  return week.deltaKg < 0
    ? `−${Math.abs(week.deltaKg).toFixed(1)}`
    : `+${week.deltaKg.toFixed(1)}`
}
</script>

<style module>
.weekly {
  display: flex;
  flex-direction: column;
  gap: var(--space-m);
}

.headline {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: var(--space-m);
}

.side {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.label {
  font-size: var(--font-size-s);
  color: var(--text-secondary);
}

.big {
  font-size: var(--font-size-l);
  font-weight: 700;
  color: var(--text-primary);
}

.meta {
  font-size: var(--font-size-s);
  color: var(--text-muted);
}

.delta {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: var(--space-s) var(--space-m);
  border: 1px solid var(--border);
  border-radius: var(--radius-m);
  background: var(--bg-elevated);
}

.deltaValue {
  font-size: var(--font-size-l);
  font-weight: 700;
}

.deltaHint {
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
  display: grid;
  grid-template-columns: 1fr auto 56px;
  align-items: baseline;
  gap: var(--space-s);
  padding: var(--space-xs) var(--space-s);
  border-radius: var(--radius-s);
  background: var(--bg-elevated);
}

.rowWeek {
  font-size: var(--font-size-s);
  color: var(--text-secondary);
}

.rowValue {
  font-size: var(--font-size-m);
  font-weight: 600;
  color: var(--text-primary);
}

.rowDelta {
  font-size: var(--font-size-s);
  font-weight: 600;
  text-align: right;
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
  .headline {
    grid-template-columns: 1fr 1fr;
  }

  .delta {
    grid-column: 1 / -1;
    order: -1;
    flex-direction: row;
    justify-content: space-between;
  }
}
</style>
