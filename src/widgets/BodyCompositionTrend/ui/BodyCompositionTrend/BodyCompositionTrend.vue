<template>
  <div :class="$style.chart">
    <VChart v-if="hasData" :option="option" autoresize :class="$style.canvas" />
    <p v-else :class="$style.empty">Добавь замеры (талия, шея) и вес — покажу жир и мышцы во времени.</p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { LineChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { useMeasurementStore } from '@/entities/Measurement'
import { useWeightLogStore } from '@/entities/WeightLog'
import { navyBodyFatMale } from '@/shared/lib/bodyfat'
import { HEIGHT_CM } from '@/shared/config/profile'
import { formatHuman, daysBetween } from '@/shared/lib/date'
import { cssToken } from '@/shared/lib/theme'

use([LineChart, GridComponent, TooltipComponent, LegendComponent, CanvasRenderer])

const measurement = useMeasurementStore()
const weightLog = useWeightLogStore()

function round1(value: number): number {
  return Math.round(value * 10) / 10
}

/** Ближайшая по дате запись веса. */
function weightNear(dateISO: string): number | null {
  const items = weightLog.byDateAsc
  if (!items.length) return null
  let best = items[0]
  let bestDiff = Infinity
  for (const item of items) {
    const diff = Math.abs(daysBetween(item.date, dateISO))
    if (diff < bestDiff) {
      bestDiff = diff
      best = item
    }
  }
  return best.weight
}

const points = computed(() =>
  measurement.byDateAsc
    .map((m) => {
      if (m.waist == null || m.neck == null) return null
      const bodyFat = navyBodyFatMale(m.waist, m.neck, HEIGHT_CM)
      const weight = weightNear(m.date)
      if (bodyFat == null || weight == null) return null
      const fat = (weight * bodyFat) / 100
      return { date: m.date, fat: round1(fat), lean: round1(weight - fat) }
    })
    .filter((point): point is { date: string; fat: number; lean: number } => point != null),
)

const hasData = computed(() => points.value.length > 0)

const option = computed(() => {
  const border = cssToken('--border', '#2a2f3a')
  const muted = cssToken('--text-muted', '#6b7280')
  const accent = cssToken('--accent', '#4f8cff')
  const warning = cssToken('--warning', '#e0a63a')
  const rows = points.value

  return {
    grid: { left: 40, right: 16, top: 32, bottom: 28 },
    tooltip: { trigger: 'axis', valueFormatter: (value: number) => `${value} кг` },
    legend: { data: ['Сухая масса', 'Жировая масса'], textStyle: { color: muted }, top: 0 },
    xAxis: {
      type: 'category',
      data: rows.map((row) => formatHuman(row.date)),
      axisLine: { lineStyle: { color: border } },
      axisLabel: { color: muted },
    },
    yAxis: {
      type: 'value',
      scale: true,
      splitLine: { lineStyle: { color: border } },
      axisLabel: { color: muted },
    },
    series: [
      {
        name: 'Сухая масса',
        type: 'line',
        smooth: true,
        symbolSize: 7,
        data: rows.map((row) => row.lean),
        lineStyle: { color: accent, width: 2.5 },
        itemStyle: { color: accent },
      },
      {
        name: 'Жировая масса',
        type: 'line',
        smooth: true,
        symbolSize: 7,
        data: rows.map((row) => row.fat),
        lineStyle: { color: warning, width: 2.5 },
        itemStyle: { color: warning },
      },
    ],
  }
})
</script>

<style module>
.chart {
  width: 100%;
  height: 280px;
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
