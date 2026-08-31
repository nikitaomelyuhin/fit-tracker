<template>
  <div :class="$style.pace">
    <template v-if="start != null && startDate">
      <div :class="$style.rows">
        <div :class="$style.row">
          <span :class="$style.label"><span :class="$style.dotIdeal" />Идеальный (2200 ккал)</span>
          <span :class="$style.value">{{ idealText }}</span>
        </div>
        <div :class="$style.row">
          <span :class="$style.label"><span :class="$style.dotActual" />Твой темп сейчас</span>
          <span :class="[$style.value, behind && $style.warn]">{{ actualText }}</span>
        </div>
      </div>

      <VChart :option="option" autoresize :class="$style.chart" />
      <p :class="$style.hint">Прогноз уточняется по мере взвешиваний — сейчас данных мало.</p>
    </template>
    <p v-else :class="$style.empty">Добавь вес, чтобы построить прогноз.</p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { LineChart } from 'echarts/charts'
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  MarkLineComponent,
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import dayjs from 'dayjs'
import { useWeightLogStore } from '@/entities/WeightLog'
import { WEIGHT_GOAL_KG } from '@/shared/config/goals'
import { DAILY_KCAL_TARGET } from '@/shared/config/pace'
import { projectIdealPace } from '@/shared/lib/pace'
import { addDays, daysBetween, todayISO, formatHuman } from '@/shared/lib/date'
import { cssToken } from '@/shared/lib/theme'

use([LineChart, GridComponent, TooltipComponent, LegendComponent, MarkLineComponent, CanvasRenderer])

const store = useWeightLogStore()
const goal = WEIGHT_GOAL_KG

const startEntry = computed(() => store.byDateAsc[0] ?? null)
const start = computed(() => startEntry.value?.weight ?? null)
const startDate = computed(() => startEntry.value?.date ?? null)
const current = computed(() => store.currentWeekAverage ?? store.byDateDesc[0]?.weight ?? null)

const ideal = computed(() =>
  start.value != null ? projectIdealPace(start.value, goal, DAILY_KCAL_TARGET) : [],
)
const idealDays = computed(() => (ideal.value.length ? ideal.value[ideal.value.length - 1].day : 0))
const idealText = computed(() =>
  startDate.value
    ? `~${months(idealDays.value)} мес · до ${formatHuman(addDays(startDate.value, idealDays.value))}`
    : '—',
)

const elapsed = computed(() =>
  startDate.value ? Math.max(1, daysBetween(startDate.value, todayISO())) : 0,
)
const lost = computed(() =>
  start.value != null && current.value != null ? start.value - current.value : 0,
)
const rate = computed(() => (elapsed.value > 0 ? lost.value / elapsed.value : 0)) // кг/день
const actualEtaDays = computed(() =>
  rate.value > 0 && current.value != null ? (current.value - goal) / rate.value : null,
)
const actualText = computed(() => {
  if (actualEtaDays.value == null) return 'мало данных (темп ~0)'
  return `~${months(actualEtaDays.value)} мес · до ${formatHuman(addDays(todayISO(), Math.round(actualEtaDays.value)))}`
})
const behind = computed(() => actualEtaDays.value != null && actualEtaDays.value > idealDays.value)

const projection = computed(() => {
  if (actualEtaDays.value == null || current.value == null) return null
  const etaDate = addDays(todayISO(), Math.round(actualEtaDays.value))
  return [
    [dayjs(todayISO()).valueOf(), round1(current.value)],
    [dayjs(etaDate).valueOf(), goal],
  ]
})

function months(days: number): number {
  return Math.max(1, Math.round(days / 30.4))
}

function round1(value: number): number {
  return Math.round(value * 10) / 10
}

const option = computed(() => {
  const border = cssToken('--border', '#2a2f3a')
  const muted = cssToken('--text-muted', '#6b7280')
  const success = cssToken('--success', '#35c07a')
  const accent = cssToken('--accent', '#4f8cff')
  const warning = cssToken('--warning', '#e0a63a')

  const idealData = ideal.value.map((point) => [
    dayjs(addDays(startDate.value!, point.day)).valueOf(),
    round1(point.weight),
  ])
  const weekly = store.weeklyAverageByDateAsc
  const actualData = store.byDateAsc.map((row, index) => [dayjs(row.date).valueOf(), weekly[index]])

  const yMax = Math.ceil((start.value ?? goal) + 1)
  const yMin = goal - 2

  const legendData = ['Идеальный', 'Твой факт']
  const series: unknown[] = [
    {
      name: 'Идеальный',
      type: 'line',
      showSymbol: false,
      smooth: true,
      data: idealData,
      lineStyle: { color: success, width: 2.5 },
      itemStyle: { color: success },
      markLine: {
        silent: true,
        symbol: 'none',
        data: [
          {
            yAxis: goal,
            lineStyle: { color: success, type: 'dashed' },
            label: { formatter: `Цель ${goal}`, color: success, position: 'insideStartTop' },
          },
        ],
      },
    },
    {
      name: 'Твой факт',
      type: 'line',
      symbolSize: 10,
      data: actualData,
      lineStyle: { color: accent, width: 3 },
      itemStyle: { color: accent },
    },
  ]

  if (projection.value) {
    legendData.push('Твой прогноз')
    series.push({
      name: 'Твой прогноз',
      type: 'line',
      showSymbol: false,
      data: projection.value,
      lineStyle: { color: warning, width: 2.5, type: 'dashed' },
      itemStyle: { color: warning },
    })
  }

  return {
    grid: { left: 40, right: 20, top: 36, bottom: 28 },
    tooltip: { trigger: 'axis' },
    legend: { data: legendData, textStyle: { color: muted }, top: 0 },
    xAxis: { type: 'time', axisLine: { lineStyle: { color: border } }, axisLabel: { color: muted } },
    yAxis: {
      type: 'value',
      min: yMin,
      max: yMax,
      splitLine: { lineStyle: { color: border } },
      axisLabel: { color: muted },
    },
    series,
  }
})
</script>

<style module>
.pace {
  display: flex;
  flex-direction: column;
  gap: var(--space-m);
}

.rows {
  display: flex;
  flex-direction: column;
  gap: var(--space-s);
}

.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-m);
}

.label {
  display: inline-flex;
  align-items: center;
  gap: var(--space-s);
  font-size: var(--font-size-m);
  color: var(--text-secondary);
}

.dotIdeal,
.dotActual {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.dotIdeal {
  background: var(--success);
}

.dotActual {
  background: var(--warning);
}

.value {
  font-weight: 700;
  font-size: var(--font-size-l);
  color: var(--text-primary);
}

.warn {
  color: var(--warning);
}

.chart {
  width: 100%;
  height: 360px;
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
