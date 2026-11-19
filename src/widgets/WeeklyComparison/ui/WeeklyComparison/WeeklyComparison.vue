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
              <span :class="$style.rowMeta">идёт · {{ week.entries }} взв.</span>
            </template>
            <template v-else-if="week.deltaKg == null">
              <span :class="$style.rowMeta">старт отсчёта</span>
            </template>
            <template v-else>
              <span :class="$style.rowMeta" />
              <span :class="[$style.rowDelta, $style[deltaFor(week).tone]]">{{ deltaFor(week).text }}</span>
            </template>
          </div>
        </li>
      </ul>
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

interface Delta {
  text: string
  /** down — вес ушёл, up — пришёл, flat — в пределах округления. */
  tone: 'down' | 'up' | 'flat'
}

/** Изменение к прошлой неделе — просто число со знаком, цветом по направлению. */
function deltaFor(week: WeeklyAverage): Delta {
  const value = week.deltaKg ?? 0
  const rounded = Math.round(value * 10) / 10
  const sign = rounded < 0 ? '−' : rounded > 0 ? '+' : ''
  const amount = `${sign}${Math.abs(rounded).toFixed(1)} кг`
  const tone = rounded < 0 ? 'down' : rounded > 0 ? 'up' : 'flat'

  // Разрыв в данных — изменение набежало за несколько недель, это надо видеть.
  if (week.gapWeeks != null && week.gapWeeks > 1) {
    return { text: `${amount} · за ${week.gapWeeks} нед.`, tone }
  }
  return { text: amount, tone }
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
  gap: var(--space-2xs);
  padding: var(--space-s) var(--space-m);
  border-radius: var(--radius-m);
  background: var(--bg-elevated);
  border: var(--border-width) solid transparent;
}

.row-in-progress {
  border: var(--border-width) dashed var(--border);
  background: transparent;
}

.row-top {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-s);
}

.row-bottom {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-s);
  min-height: 1.2em;
}

.row-week {
  font-size: var(--font-size-m);
  color: var(--text-secondary);
  white-space: nowrap;
}

.row-value {
  flex-shrink: 0;
  min-width: var(--stat-value-min-width);
  text-align: right;
  font-size: var(--font-size-l);
  font-weight: 700;
  color: var(--text-primary);
  white-space: nowrap;
}

.row-meta {
  font-size: var(--font-size-s);
  color: var(--text-muted);
}

.row-delta {
  font-size: var(--font-size-s);
  font-weight: 600;
  white-space: nowrap;
}

.down {
  color: var(--success);
}

.up {
  color: var(--danger);
}

.flat {
  color: var(--text-muted);
}

.empty {
  color: var(--text-muted);
  font-size: var(--font-size-m);
  text-align: center;
  padding: var(--space-l);
}
</style>
