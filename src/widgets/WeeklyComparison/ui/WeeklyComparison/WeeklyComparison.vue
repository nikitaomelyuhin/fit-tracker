<template>
  <div :class="$style.weekly">
    <template v-if="recent.length">
      <ul :class="$style.list">
        <li
          v-for="week in recent"
          :key="week.weekStart"
          :class="[$style.row, isCurrent(week) && $style.rowInProgress]"
        >
          <div :class="$style.rowTop">
            <span :class="$style.rowWeek">{{ weekLabel(week) }}</span>
            <span :class="$style.rowValue">{{ week.averageKg }} кг</span>
          </div>
          <div :class="$style.rowBottom">
            <template v-if="isCurrent(week)">
              <span :class="$style.rowMeta">▸ ещё собирается · {{ week.entries }} взв.</span>
            </template>
            <template v-else-if="week.deltaKg == null">
              <span :class="$style.rowMeta">старт отсчёта</span>
            </template>
            <template v-else>
              <span :class="$style.rowMeta" />
              <span :class="[$style.rowDelta, $style[hintFor(week).tone]]">{{ hintFor(week).text }}</span>
            </template>
          </div>
        </li>
      </ul>

      <p :class="$style.hint">
        Неделя считается со среды по вторник. Ярлык «быстро/медленно» ставится только законченным
        неделям — на 2-3 взвешиваниях он был бы враньём, экстраполяция такого куска шумит слишком
        сильно.
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
import { addDays, currentWeekStartISO, formatHuman } from '@/shared/lib/date'

const WEEKS_SHOWN = 8

const store = useWeightLogStore()

const recent = computed(() => [...store.weeklyAverages].reverse().slice(0, WEEKS_SHOWN))

function isCurrent(week: WeeklyAverage): boolean {
  return week.weekStart === currentWeekStartISO()
}

function weekLabel(week: WeeklyAverage): string {
  return `${formatHuman(week.weekStart)} – ${formatHuman(addDays(week.weekStart, 6))}`
}

interface Hint {
  text: string
  tone: 'good' | 'warn' | 'muted'
}

function hintFor(week: WeeklyAverage): Hint {
  const value = week.deltaKg
  if (value == null) return { text: 'старт', tone: 'muted' }

  const sign = value < 0 ? '−' : value > 0 ? '+' : ''
  const amount = `${sign}${Math.abs(value).toFixed(1)}`

  if (week.gapWeeks != null && week.gapWeeks > 1) {
    return { text: `${amount} · пропуск ${week.gapWeeks - 1} нед.`, tone: 'muted' }
  }
  if (value <= -1.2) return { text: `${amount} · очень быстро`, tone: 'warn' }
  if (value <= -0.4) return { text: `${amount} · в коридоре`, tone: 'good' }
  if (value < -0.1) return { text: `${amount} · медленно`, tone: 'good' }
  if (value <= 0.1) return { text: `${amount} · стоит`, tone: 'muted' }
  return { text: `${amount} · рост`, tone: 'warn' }
}
</script>

<style module>
.weekly {
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
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: var(--space-s) var(--space-m);
  border-radius: var(--radius-m);
  background: var(--bg-elevated);
  border: 1px solid transparent;
}

.rowInProgress {
  border: 1px dashed var(--border);
  background: transparent;
}

.rowTop {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-s);
}

.rowBottom {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-s);
  min-height: 1.2em;
}

.rowWeek {
  font-size: var(--font-size-m);
  color: var(--text-secondary);
  white-space: nowrap;
}

.rowValue {
  flex-shrink: 0;
  min-width: 84px;
  text-align: right;
  font-size: var(--font-size-l);
  font-weight: 700;
  color: var(--text-primary);
  white-space: nowrap;
}

.rowMeta {
  font-size: var(--font-size-s);
  color: var(--text-muted);
}

.rowDelta {
  font-size: var(--font-size-s);
  font-weight: 600;
  white-space: nowrap;
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
</style>
