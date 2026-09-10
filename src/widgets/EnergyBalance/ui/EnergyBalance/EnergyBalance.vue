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
import { maintenanceKcal } from '@/shared/lib/pace'
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

interface Ledger {
  loggedDays: number
  expectedFatLossKg: number
  actualLossKg: number | null
  debtKg: number | null
}

const ledger = computed<Ledger | null>(() => {
  const start = windowStart.value
  if (!start) return null

  const weightByDate = new Map(weightLog.byDateAsc.map((w) => [w.date, w.weight]))
  const kcalByDate = new Map(diaryEntries.dailyKcalAsc.map((d) => [d.date, d.kcal]))

  let cumulativeDeficitKcal = 0
  let loggedDays = 0
  let cursor = start
  const today = todayISO()
  let guard = 0
  while (cursor <= today && guard < 400) {
    const kcal = kcalByDate.get(cursor)
    if (kcal != null) {
      const weight = weightByDate.get(cursor) ?? weightLog.smoothedWeight
      if (weight != null) {
        cumulativeDeficitKcal += maintenanceKcal(weight) - kcal
        loggedDays++
      }
    }
    cursor = addDays(cursor, 1)
    guard++
  }

  if (loggedDays === 0) return null

  const expectedFatLossKg = cumulativeDeficitKcal / KCAL_PER_KG
  const startWeight =
    weightByDate.get(start) ?? weightLog.byDateAsc.find((w) => w.date >= start)?.weight ?? null
  const currentWeight = weightLog.smoothedWeight
  const actualLossKg =
    startWeight != null && currentWeight != null ? startWeight - currentWeight : null
  const debtKg = actualLossKg != null ? expectedFatLossKg - actualLossKg : null

  return { loggedDays, expectedFatLossKg, actualLossKg, debtKg }
})

const debtTone = computed<'good' | 'warn' | 'muted'>(() => {
  const debtKg = ledger.value?.debtKg
  if (debtKg == null) return 'muted'
  const grams = Math.abs(debtKg * 1000)
  if (grams < 150) return 'muted'
  return debtKg > 0 ? 'warn' : 'good'
})

const debtText = computed(() => {
  const l = ledger.value
  if (!l) return ''
  if (l.debtKg == null) {
    return `По калориям должно было уйти ~${Math.round(l.expectedFatLossKg * 1000)} г жира — вес пока сравнить не с чем.`
  }
  const grams = Math.round(l.debtKg * 1000)
  if (Math.abs(grams) < 150) return 'Долгов нет — весы и калории сходятся.'
  if (grams > 0) {
    return `Организм придерживает примерно ${grams} г воды — по калориям должно было уйти больше. Рано или поздно спишется одним сливом.`
  }
  return `Весы обогнали калории примерно на ${Math.abs(grams)} г — реальный расход, похоже, выше, чем считает формула.`
})

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
