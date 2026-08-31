<template>
  <div :class="$style.chart">
    <VChart v-if="hasData" :option="option" autoresize :class="$style.canvas" />
    <p v-else :class="$style.empty">Добавь замеры, чтобы увидеть график</p>
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
import { formatHuman } from '@/shared/lib/date'
import { cssToken } from '@/shared/lib/theme'

use([LineChart, GridComponent, TooltipComponent, LegendComponent, CanvasRenderer])

const store = useMeasurementStore()
const hasData = computed(() => store.byDateAsc.length > 0)

const option = computed(() => {
  const rows = store.byDateAsc
  const border = cssToken('--border', '#2a2f3a')
  const muted = cssToken('--text-muted', '#6b7280')
  const accent = cssToken('--accent', '#4f8cff')
  const success = cssToken('--success', '#35c07a')
  const warning = cssToken('--warning', '#e0a63a')

  const metrics = [
    { name: 'Талия', color: accent, data: rows.map((r) => r.waist) },
    { name: 'Плечи', color: success, data: rows.map((r) => r.shoulders) },
    { name: 'Грудь', color: warning, data: rows.map((r) => r.chest) },
    { name: 'Рука', color: '#b57bff', data: rows.map((r) => r.arm) },
    { name: 'Предпл.', color: '#5ec8c8', data: rows.map((r) => r.forearm) },
  ]

  return {
    grid: { left: 40, right: 16, top: 36, bottom: 28 },
    tooltip: { trigger: 'axis' },
    legend: { data: metrics.map((m) => m.name), textStyle: { color: muted }, top: 0 },
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
    series: metrics.map((metric) => ({
      name: metric.name,
      type: 'line',
      smooth: true,
      connectNulls: true,
      symbolSize: 6,
      data: metric.data,
      lineStyle: { color: metric.color, width: 2 },
      itemStyle: { color: metric.color },
    })),
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
