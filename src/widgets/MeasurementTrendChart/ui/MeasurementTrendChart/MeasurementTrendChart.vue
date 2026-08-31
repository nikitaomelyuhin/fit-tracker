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

  return {
    grid: { left: 40, right: 16, top: 36, bottom: 32 },
    tooltip: { trigger: 'axis' },
    legend: { data: ['Талия', 'Плечи'], textStyle: { color: muted }, top: 0 },
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
        name: 'Талия',
        type: 'line',
        smooth: true,
        connectNulls: true,
        data: rows.map((row) => row.waist),
        lineStyle: { color: accent, width: 2 },
        itemStyle: { color: accent },
      },
      {
        name: 'Плечи',
        type: 'line',
        smooth: true,
        connectNulls: true,
        data: rows.map((row) => row.shoulders),
        lineStyle: { color: success, width: 2 },
        itemStyle: { color: success },
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
