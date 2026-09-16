<template>
  <div v-if="debt" :class="[$style.balance, $style[tone]]">
    <span :class="$style.title">Баланс по воде</span>
    <span :class="$style.text">{{ text }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useWeightLogStore } from '@/entities/WeightLog'
import { useDiaryEntryStore } from '@/entities/DiaryEntry'
import { computeWaterDebt, describeWaterDebt } from '@/shared/lib/waterDebt'

const weightLog = useWeightLogStore()
const diaryEntries = useDiaryEntryStore()

const windowStart = computed(() => diaryEntries.dailyKcalAsc[0]?.date ?? null)

const debt = computed(() => {
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

const described = computed(() => describeWaterDebt(debt.value))
const text = computed(() => described.value.text)
const tone = computed(() => described.value.tone)
</script>

<style module>
.balance {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: var(--space-m);
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-left: 3px solid var(--border);
  border-radius: var(--radius-m);
}

.title {
  font-size: var(--font-size-s);
  color: var(--text-secondary);
}

.text {
  font-size: var(--font-size-m);
  font-weight: 600;
  color: var(--text-primary);
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
</style>
