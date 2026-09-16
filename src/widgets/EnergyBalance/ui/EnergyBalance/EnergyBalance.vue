<template>
  <div :class="$style.wrap">
    <p v-if="daysUntilReady > 0" :class="$style.empty">
      Собираем данные — статистика появится через {{ daysUntilReady }} дн. (нужна неделя дневника,
      чтобы шум по дням усреднился).
    </p>
    <template v-else-if="ledger">
      <div :class="[$style.debt, $style[debtTone]]">
        {{ debtText }}
      </div>

      <div v-if="weeklyRows.length" :class="$style.weekly">
        <p :class="$style.subtitle">Реальный расход по неделям (без часов)</p>
        <ul :class="$style.list">
          <li v-for="row in weeklyRows" :key="row.weekStart" :class="$style.row">
            <span :class="$style.rowWeek">{{ weekLabel(row.weekStart) }}</span>
            <span :class="$style.rowValue">~{{ row.expenditure }} ккал/день расход</span>
            <span :class="$style.rowMeta">ел {{ row.avgIntake }}</span>
          </li>
        </ul>
      </div>
      <p v-else :class="$style.hint">
        Недель с пересечением веса и рациона пока нет — появятся, когда наберётся хотя бы одна
        полная неделя с записями в дневнике.
      </p>

      <p :class="$style.hint">
        «Долг» — разница между тем, сколько жира должно было уйти по калориям (дневник) и сколько
        реально ушло по весам, с {{ formatHuman(windowStart!) }}. Дни без записи в рационе просто
        пропускаются, а не считаются нулём.
      </p>
    </template>
    <p v-else :class="$style.empty">
      Веди дневник питания несколько дней — здесь появится реальный расход и «долг по воде».
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useWeightLogStore } from '@/entities/WeightLog'
import { useDiaryEntryStore } from '@/entities/DiaryEntry'
import { computeWaterDebt, describeWaterDebt } from '@/shared/lib/waterDebt'
import { KCAL_PER_KG } from '@/shared/config/pace'
import { addDays, daysBetween, formatHuman, todayISO } from '@/shared/lib/date'

const MIN_DAYS = 7

const weightLog = useWeightLogStore()
const diaryEntries = useDiaryEntryStore()

const windowStart = computed(() => diaryEntries.dailyKcalAsc[0]?.date ?? null)

/** Пока не наберётся неделя дневника — цифры слишком шумные, чтобы показывать. */
const daysUntilReady = computed(() => {
  const start = windowStart.value
  if (!start) return MIN_DAYS
  const daysSinceStart = daysBetween(start, todayISO()) + 1
  return Math.max(0, MIN_DAYS - daysSinceStart)
})

const ledger = computed(() => {
  const start = windowStart.value
  if (!start) return null

  const weightByDate = new Map(weightLog.byDateAsc.map((w) => [w.date, w.weight]))
  const kcalByDate = new Map(diaryEntries.dailyKcalAsc.map((d) => [d.date, d.kcal]))
  const startWeight =
    weightByDate.get(start) ?? weightLog.byDateAsc.find((w) => w.date >= start)?.weight ?? null

  return computeWaterDebt({
    fromDate: start,
    startWeight,
    currentWeight: weightLog.smoothedWeight,
    weightAt: (date) => weightByDate.get(date) ?? null,
    kcalAt: (date) => kcalByDate.get(date) ?? null,
  })
})

const debtTone = computed(() => describeWaterDebt(ledger.value).tone)
const debtText = computed(() => describeWaterDebt(ledger.value).text)

function weekLabel(weekStart: string): string {
  return `${formatHuman(weekStart)} – ${formatHuman(addDays(weekStart, 6))}`
}

const weeklyRows = computed(() => {
  return weightLog.weeklyAverages
    .filter((week) => week.deltaKg != null)
    .map((week) => {
      const to = addDays(week.weekStart, 6)
      const avgIntake = diaryEntries.averageKcalInRange(week.weekStart, to)
      if (avgIntake == null) return null
      const expenditure = Math.round(avgIntake - (week.deltaKg! / 7) * KCAL_PER_KG)
      return { weekStart: week.weekStart, avgIntake, expenditure }
    })
    .filter((row): row is { weekStart: string; avgIntake: number; expenditure: number } => row != null)
    .reverse()
})
</script>

<style module>
.wrap {
  display: flex;
  flex-direction: column;
  gap: var(--space-m);
}

.debt {
  padding: var(--space-m);
  background: var(--bg-elevated);
  border-radius: var(--radius-m);
  font-size: var(--font-size-m);
  font-weight: 600;
  color: var(--text-primary);
  border-left: 3px solid var(--border);
}

.warn {
  border-left-color: var(--warning);
}

.good {
  border-left-color: var(--success);
}

.muted {
  border-left-color: var(--border);
}

.subtitle {
  font-size: var(--font-size-s);
  color: var(--text-secondary);
  margin-bottom: var(--space-xs);
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

.rowMeta {
  font-size: var(--font-size-s);
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
