<template>
  <div v-if="weeks.length" :class="$style.heatmap">
    <div :class="$style.scroll">
      <div :class="$style.months">
        <span v-for="(label, index) in monthLabels" :key="index" :class="$style.month">{{ label }}</span>
      </div>
      <div :class="$style.grid">
        <div v-for="(week, wi) in weeks" :key="wi" :class="$style.week">
          <div
            v-for="cell in week"
            :key="cell.date"
            :class="[$style.cell, $style[cell.cls], selectedDate === cell.date && $style.selected]"
            :title="cell.title"
            @mouseenter="select(cell.date)"
            @click="select(cell.date)"
          />
        </div>
      </div>
    </div>

    <p :class="$style.detail">{{ detail || 'Наведи или нажми на квадрат — покажу день' }}</p>

    <div :class="$style.legend">
      <span :class="[$style.dot, $style.down]" />вниз
      <span :class="[$style.dot, $style.flat]" />стоит
      <span :class="[$style.dot, $style.up]" />вверх
      <span :class="[$style.dot, $style.strong]" />сильно вверх
    </div>
  </div>
  <p v-else :class="$style.empty">Веди вес каждый день — здесь появится календарь.</p>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import dayjs from 'dayjs'
import { useWeightLogStore } from '@/entities/WeightLog'
import { todayISO, addDays, formatHuman } from '@/shared/lib/date'

const MONTHS = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек']

const store = useWeightLogStore()
const selectedDate = ref<string | null>(null)

interface DayInfo {
  weight: number
  prev: number | null
  delta: number | null
}

const infoByDate = computed(() => {
  const map = new Map<string, DayInfo>()
  const items = store.byDateAsc
  for (let i = 0; i < items.length; i++) {
    const prev = i > 0 ? items[i - 1].weight : null
    map.set(items[i].date, {
      weight: items[i].weight,
      prev,
      delta: prev != null ? Math.round((items[i].weight - prev) * 10) / 10 : null,
    })
  }
  return map
})

function mondayOf(dateISO: string): string {
  const d = dayjs(dateISO)
  const offset = (d.day() + 6) % 7 // понедельник = 0
  return d.subtract(offset, 'day').format('YYYY-MM-DD')
}

function cellClass(date: string): string {
  const info = infoByDate.value.get(date)
  if (!info) return 'blank'
  if (info.delta == null) return 'first'
  if (info.delta <= -0.15) return 'down'
  if (info.delta < 0.15) return 'flat'
  if (info.delta < 0.7) return 'up'
  return 'strong'
}

function describe(date: string): string {
  const info = infoByDate.value.get(date)
  const human = formatHuman(date)
  if (!info) return `${human} · нет записи`
  if (info.delta == null) return `${human} · ${info.weight} кг · первая запись`
  const sign = info.delta >= 0 ? '+' : '−'
  return `${human} · ${info.weight} кг · было ${info.prev} · ${sign}${Math.abs(info.delta).toFixed(1)} кг`
}

const weeks = computed(() => {
  const items = store.byDateAsc
  if (!items.length) return []
  const start = mondayOf(items[0].date)
  // До конца года минимум, но не меньше ~года от старта.
  const endOfYear = dayjs().endOf('year').format('YYYY-MM-DD')
  const yearFromStart = addDays(start, 364)
  const end = [todayISO(), endOfYear, yearFromStart].sort()[2]
  const result: { date: string; cls: string; title: string }[][] = []

  let cursor = start
  let guard = 0
  while (cursor <= end && guard < 300) {
    const week: { date: string; cls: string; title: string }[] = []
    for (let d = 0; d < 7; d++) {
      const date = addDays(cursor, d)
      week.push({ date, cls: cellClass(date), title: describe(date) })
    }
    result.push(week)
    cursor = addDays(cursor, 7)
    guard++
  }
  return result
})

const monthLabels = computed(() =>
  weeks.value.map((week, index) => {
    const month = dayjs(week[0].date).month()
    const prev = index > 0 ? dayjs(weeks.value[index - 1][0].date).month() : -1
    return month !== prev ? MONTHS[month] : ''
  }),
)

const detail = computed(() => (selectedDate.value ? describe(selectedDate.value) : ''))

function select(date: string) {
  selectedDate.value = date
}
</script>

<style module>
.heatmap {
  display: flex;
  flex-direction: column;
  gap: var(--space-s);
}

.scroll {
  overflow-x: auto;
  padding-bottom: var(--space-xs);
}

.months {
  display: flex;
  gap: 3px;
  margin-bottom: 4px;
}

.month {
  width: 13px;
  flex: 0 0 13px;
  font-size: 10px;
  color: var(--text-muted);
  white-space: nowrap;
  overflow: visible;
}

.grid {
  display: flex;
  gap: 3px;
}

.week {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.cell {
  width: 13px;
  height: 13px;
  border-radius: 3px;
  background: var(--bg-elevated);
  flex: 0 0 auto;
  cursor: pointer;
}

.selected {
  outline: 2px solid var(--text-primary);
  outline-offset: 1px;
}

.blank {
  background: var(--bg-elevated);
}

.down {
  background: var(--success);
}
.flat {
  background: var(--warning);
}
.up {
  background: var(--danger);
}
.strong {
  background: #000;
  border: 1px solid var(--border);
}
.first {
  background: var(--text-muted);
}

.detail {
  font-size: var(--font-size-s);
  color: var(--text-secondary);
  min-height: 18px;
}

.legend {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  flex-wrap: wrap;
  font-size: var(--font-size-s);
  color: var(--text-muted);
}

.dot {
  width: 12px;
  height: 12px;
  border-radius: 3px;
  margin-left: var(--space-s);
}

.empty {
  color: var(--text-muted);
  font-size: var(--font-size-m);
  text-align: center;
  padding: var(--space-l);
}
</style>
