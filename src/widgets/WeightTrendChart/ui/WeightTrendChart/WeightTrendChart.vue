<template>
  <div :class="$style.chart">
    <VChart v-if="hasData" :option="option" autoresize :class="$style.canvas" />
    <p v-else :class="$style.empty">Добавь вес, чтобы увидеть график</p>
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
import { useWeightLogStore } from '@/entities/WeightLog'
import { formatHuman } from '@/shared/lib/date'
import { cssToken } from '@/shared/lib/theme'
import { WEIGHT_GOAL_KG, WEIGHT_MILESTONES_KG } from '@/shared/config/goals'

use([LineChart, GridComponent, TooltipComponent, LegendComponent, MarkLineComponent, CanvasRenderer])

const store = useWeightLogStore()
const hasData = computed(() => store.byDateAsc.length > 0)

const option = computed(() => {
  const rows = store.byDateAsc
  const border = cssToken('--border', '#2a2f3a')
  const muted = cssToken('--text-muted', '#6b7280')
  const accent = cssToken('--accent', '#4f8cff')
  const success = cssToken('--success', '#35c07a')

  const weights = rows.map((row) => row.weight)
  const weeklyAvg = store.weeklyAverageByDateAsc
  // Масштаб — только по факту веса. Если считать по цели/вехам, реальные
  // колебания (пара кг) тонут в диапазоне до цели (может быть 15+ кг).
  const yMin = Math.floor(Math.min(...weights, ...weeklyAvg) - 1)
  const yMax = Math.ceil(Math.max(...weights, ...weeklyAvg) + 1)

  const inRange = (value: number) => value >= yMin && value <= yMax

  const markLineData = [
    ...(inRange(WEIGHT_GOAL_KG)
      ? [
          {
            yAxis: WEIGHT_GOAL_KG,
            lineStyle: { color: success, type: 'dashed', width: 2 },
            label: { formatter: `Цель ${WEIGHT_GOAL_KG}`, color: success, position: 'insideEndTop' },
          },
        ]
      : []),
    ...WEIGHT_MILESTONES_KG.filter(inRange).map((milestone) => ({
      yAxis: milestone,
      lineStyle: { color: muted, type: 'dotted', width: 1 },
      label: { formatter: `${milestone}`, color: muted, position: 'insideEndTop', fontSize: 10 },
    })),
  ]

  return {
    grid: { left: 44, right: 16, top: 36, bottom: 32 },
    tooltip: { trigger: 'axis' },
    legend: { data: ['Вес (день)', 'Среднее/нед'], textStyle: { color: muted }, top: 0 },
    xAxis: {
      type: 'category',
      data: rows.map((row) => formatHuman(row.date)),
      axisLine: { lineStyle: { color: border } },
      axisLabel: { color: muted },
    },
    yAxis: {
      type: 'value',
      min: yMin,
      max: yMax,
      splitLine: { lineStyle: { color: border } },
      axisLabel: { color: muted },
    },
    series: [
      {
        // Недельное среднее меняется скачком раз в неделю, а не плавно —
        // smooth тут рисовал бы волну там, где на деле плоская ступенька.
        name: 'Среднее/нед',
        type: 'line',
        smooth: false,
        showSymbol: false,
        data: weeklyAvg,
        lineStyle: { color: muted, width: 1.5, type: 'dashed' },
        itemStyle: { color: muted },
        markLine: { silent: true, symbol: 'none', data: markLineData },
      },
      {
        name: 'Вес (день)',
        type: 'line',
        smooth: true,
        showSymbol: true,
        symbolSize: 6,
        data: weights,
        lineStyle: { color: accent, width: 3 },
        itemStyle: { color: accent },
        areaStyle: { opacity: 0.1 },
      },
    ],
  }
})
</script>

<style module>
.chart {
  width: 100%;
  height: 300px;
}

.canvas {
  width: 100%;
  height: 100%;
}

.empty {
  color: var(--text-muted);
  font-size: var(--font-size-m);
  text-align: center;
  padding: var(--space-l);
}
</style>
