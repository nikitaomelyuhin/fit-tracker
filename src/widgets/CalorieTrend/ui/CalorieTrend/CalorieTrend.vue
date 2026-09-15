<template>
  <div :class="$style.wrap">
    <template v-if="hasData">
      <div :class="$style.stats">
        <div :class="$style.stat">
          <span :class="$style.label">Среднее за 7 дней с записями</span>
          <span :class="$style.value">{{ average7 != null ? `${average7} ккал` : '—' }}</span>
        </div>
        <div :class="$style.stat">
          <span :class="$style.label">Цель</span>
          <span :class="$style.value">{{ DAILY_KCAL_RANGE.min }}–{{ DAILY_KCAL_RANGE.max }} ккал</span>
        </div>
        <div :class="$style.stat">
          <span :class="$style.label">Дней с записями</span>
          <span :class="$style.value">{{ store.dailyKcalAsc.length }}</span>
        </div>
      </div>

      <VChart :option="option" autoresize :class="$style.chart" />
      <p :class="$style.hint">
        Показаны только дни, где что-то записано в рацион — пропуски не считаются нулём и не портят
        среднее.
      </p>
    </template>
    <p v-else :class="$style.empty">Запиши пару приёмов пищи — здесь появится график по дням.</p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { BarChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, MarkLineComponent, MarkAreaComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { useDiaryEntryStore } from '@/entities/DiaryEntry'
import { DAILY_KCAL_RANGE, DAILY_KCAL_TARGET } from '@/shared/config/pace'
import { formatHuman } from '@/shared/lib/date'
import { cssToken } from '@/shared/lib/theme'

use([BarChart, GridComponent, TooltipComponent, MarkLineComponent, MarkAreaComponent, CanvasRenderer])

const store = useDiaryEntryStore()
const target = DAILY_KCAL_TARGET

const hasData = computed(() => store.dailyKcalAsc.length > 0)
const average7 = computed(() => store.recentAverageKcal(7))

const option = computed(() => {
  const border = cssToken('--border', '#2a2f3a')
  const muted = cssToken('--text-muted', '#6b7280')
  const success = cssToken('--success', '#35c07a')
  const warning = cssToken('--warning', '#e0a63a')

  const rows = store.dailyKcalAsc

  return {
    grid: { left: 48, right: 16, top: 16, bottom: 32 },
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: rows.map((row) => formatHuman(row.date)),
      axisLine: { lineStyle: { color: border } },
      axisLabel: { color: muted },
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: border } },
      axisLabel: { color: muted },
    },
    series: [
      {
        name: 'Ккал',
        type: 'bar',
        data: rows.map((row) => ({
          value: row.kcal,
          itemStyle: {
            color: row.kcal >= DAILY_KCAL_RANGE.min && row.kcal <= DAILY_KCAL_RANGE.max ? success : warning,
          },
        })),
        barMaxWidth: 28,
        markArea: {
          silent: true,
          itemStyle: { color: success, opacity: 0.08 },
          data: [[{ yAxis: DAILY_KCAL_RANGE.min }, { yAxis: DAILY_KCAL_RANGE.max }]],
        },
        markLine: {
          silent: true,
          symbol: 'none',
          data: [
            {
              yAxis: target,
              lineStyle: { color: muted, type: 'dashed' },
              label: { formatter: `Оптимум ${target}`, color: muted },
            },
          ],
        },
      },
    ],
  }
})
</script>

<style module>
.wrap {
  display: flex;
  flex-direction: column;
  gap: var(--space-m);
}

.stats {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-xl);
}

.stat {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.label {
  font-size: var(--font-size-s);
  color: var(--text-secondary);
}

.value {
  font-size: var(--font-size-l);
  font-weight: 700;
  color: var(--text-primary);
}

.chart {
  width: 100%;
  height: 280px;
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
