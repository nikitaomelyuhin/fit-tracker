<template>
  <div :class="$style.pace">
    <template v-if="hasEnough">
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
      <p :class="$style.hint">{{ hint }}</p>
    </template>
    <p v-else :class="$style.empty">
      Мало данных для прогноза — веди вес хотя бы пару недель, и здесь появится сравнение твоего темпа с идеальным.
    </p>
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
import { addDays, todayISO, formatHuman } from '@/shared/lib/date'
import { cssToken } from '@/shared/lib/theme'

use([LineChart, GridComponent, TooltipComponent, LegendComponent, MarkLineComponent, CanvasRenderer])

const store = useWeightLogStore()
const goal = WEIGHT_GOAL_KG

const start = computed(() => store.byDateAsc[0]?.weight ?? null)
const current = computed(() => store.smoothedWeight)

// «Чистая» точка отсчёта — без стартового слива воды (см. cleanStart в сторе).
const cleanStart = computed(() => store.cleanStart)
const pace = computed(() => store.paceVsPlan)

// Прогноз показываем только когда после окна адаптации накопилось достаточно данных.
const hasEnough = computed(() => Boolean(cleanStart.value?.ready))

const ideal = computed(() => {
  const baseline = cleanStart.value
  if (!baseline || !baseline.ready) return []
  return projectIdealPace(baseline.baselineWeight, goal, DAILY_KCAL_TARGET).map((point) => ({
    day: point.day,
    weight: point.weight,
    date: addDays(baseline.baselineDate, point.day),
  }))
})
const idealText = computed(() => {
  const p = pace.value
  if (!p) return '—'
  return `~${months(daysFromToday(p.planEtaDate))} мес · до ${formatHuman(p.planEtaDate)}`
})

const actualEtaDays = computed(() => pace.value?.actualEtaDays ?? null)
const actualText = computed(() => {
  const p = pace.value
  if (!p || p.actualEtaDate == null) return 'мало данных (темп ~0)'
  return `~${months(daysFromToday(p.actualEtaDate))} мес · до ${formatHuman(p.actualEtaDate)}`
})
const behind = computed(() => (pace.value?.diffDays ?? 0) > 0)

const projection = computed(() => {
  const p = pace.value
  if (!p || p.actualEtaDate == null || current.value == null) return null
  return [
    [dayjs(todayISO()).valueOf(), round1(current.value)],
    [dayjs(p.actualEtaDate).valueOf(), goal],
  ]
})

const hint = computed(() => {
  const baseline = cleanStart.value
  if (!baseline || baseline.waterDropKg < 0.3) {
    return 'Прогноз уточняется по мере взвешиваний — сейчас данных мало.'
  }
  return `Первые ${baseline.windowDays} дн. (~${baseline.waterDropKg.toFixed(1)} кг воды/гликогена) не в счёт — план и темп считаются от ${formatHuman(baseline.baselineDate)}.`
})

function daysFromToday(dateISO: string): number {
  return Math.max(0, dayjs(dateISO).diff(dayjs(todayISO()), 'day'))
}

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

  const idealData = ideal.value.map((point) => [dayjs(point.date).valueOf(), round1(point.weight)])
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
