<template>
  <div :class="$style.wrap">
    <p v-if="daysUntilReady > 0" :class="$style.empty">
      Собираем данные — статистика появится через {{ daysUntilReady }} дн. (нужна неделя дневника,
      чтобы шум по дням усреднился).
    </p>
    <template v-else-if="ledger">
      <div :class="$style.headline">
        <span :class="$style.label">Вода сверх ожидаемого по калориям</span>
        <span :class="[$style.value, $style[debtTone]]">{{ waterValueText }}</span>
      </div>

      <p :class="$style.hint">{{ debtText }}</p>
      <p :class="$style.hint">
        Считается с {{ formatHuman(windowStart!) }}: сколько жира должно было уйти по калориям
        (дневник) минус сколько реально ушло по весам. Дни без записи в рационе пропускаются, а
        не считаются нулём — это оценка, не точное измерение.
      </p>
    </template>
    <p v-else :class="$style.empty">
      Веди дневник питания несколько дней — здесь появится оценка задержанной воды.
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useWeightLogStore } from '@/entities/WeightLog'
import { useDiaryEntryStore } from '@/entities/DiaryEntry'
import { computeWaterDebt, describeWaterDebt } from '@/shared/lib/waterDebt'
import { daysBetween, formatHuman, todayISO } from '@/shared/lib/date'

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

/** Один явный знак+число наверху — «сколько воды», без домешивания текста-объяснения. */
const waterValueText = computed(() => {
  const debtKg = ledger.value?.debtKg
  if (debtKg == null) return '—'
  const grams = Math.round(debtKg * 1000)
  if (Math.abs(grams) < 150) return '0 г'
  return grams > 0 ? `+${grams} г` : `${grams} г`
})
</script>

<style module>
.wrap {
  display: flex;
  flex-direction: column;
  gap: var(--space-m);
}

.headline {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: var(--space-m);
  background: var(--bg-elevated);
  border-radius: var(--radius-m);
  border-left: 3px solid var(--border);
}

.label {
  font-size: var(--font-size-s);
  color: var(--text-secondary);
}

.value {
  font-size: var(--font-size-xl);
  font-weight: 700;
  color: var(--text-primary);
}

.warn {
  border-left-color: var(--warning);
  color: var(--warning);
}

.good {
  border-left-color: var(--success);
  color: var(--success);
}

.muted {
  border-left-color: var(--border);
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
