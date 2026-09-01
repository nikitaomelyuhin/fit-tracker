<template>
  <div ref="wrap" :class="$style.wrap">
    <div :class="$style.calendar">
      <div v-if="years.length > 1" :class="$style.header">
        <select v-model.number="selectedYear" :class="$style.yearSelect">
          <option v-for="y in years" :key="y" :value="y">{{ y }}</option>
        </select>
      </div>

      <div :class="$style.monthsRow">
        <span :class="$style.dayspacer" />
        <div :class="$style.months">
          <span v-for="(label, index) in monthLabels" :key="index" :class="$style.month">{{ label }}</span>
        </div>
      </div>

      <div :class="$style.body">
        <div :class="$style.days">
          <span v-for="(label, index) in DAY_LABELS" :key="index" :class="$style.dayLabel">{{ label }}</span>
        </div>
        <div :class="$style.grid" @mouseleave="hideTip">
          <div v-for="(week, wi) in weeks" :key="wi" :class="$style.week">
            <div
              v-for="cell in week"
              :key="cell.date"
              :class="[$style.cell, $style[cell.cls]]"
              @mouseenter="showTip($event, cell.date)"
              @click="showTip($event, cell.date)"
            />
          </div>
        </div>
      </div>

      <div :class="$style.legend">
        <span :class="[$style.dot, $style.down]" />вниз
        <span :class="[$style.dot, $style.flat]" />стоит
        <span :class="[$style.dot, $style.up]" />вверх
        <span :class="[$style.dot, $style.strong]" />сильно вверх
      </div>
    </div>

    <div v-if="tip" :class="$style.tooltip" :style="{ left: tip.left + 'px', top: tip.top + 'px' }">
      {{ tip.text }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import dayjs from 'dayjs'
import { useWeightLogStore } from '@/entities/WeightLog'
import { addDays, formatHuman } from '@/shared/lib/date'

const MONTHS = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек']
const DAY_LABELS = ['Пн', '', 'Ср', '', 'Пт', '', '']

const store = useWeightLogStore()

const wrap = ref<HTMLElement | null>(null)
const tip = ref<{ text: string; left: number; top: number } | null>(null)

const selectedYear = ref(dayjs().year())

const years = computed(() => {
  const set = new Set<number>()
  for (const item of store.byDateAsc) set.add(dayjs(item.date).year())
  set.add(dayjs().year())
  return [...set].sort((a, b) => b - a)
})

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
  const start = mondayOf(`${selectedYear.value}-01-01`)
  const end = `${selectedYear.value}-12-31`
  const result: { date: string; cls: string }[][] = []
  let cursor = start
  let guard = 0
  while (cursor <= end && guard < 60) {
    const week: { date: string; cls: string }[] = []
    for (let d = 0; d < 7; d++) {
      const date = addDays(cursor, d)
      week.push({ date, cls: cellClass(date) })
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

function showTip(event: MouseEvent, date: string) {
  const cell = event.currentTarget as HTMLElement
  const box = wrap.value?.getBoundingClientRect()
  if (!box) return
  const rect = cell.getBoundingClientRect()
  tip.value = {
    text: describe(date),
    left: rect.left - box.left + rect.width / 2,
    top: rect.top - box.top,
  }
}

function hideTip() {
  tip.value = null
}
</script>

<style module>
.wrap {
  position: relative;
  display: flex;
  gap: var(--space-m);
  align-items: flex-start;
}

.calendar {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-s);
}

.header {
  display: flex;
  justify-content: flex-end;
}

.yearSelect {
  padding: var(--space-xs) var(--space-s);
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: var(--radius-s);
  color: var(--text-primary);
  font-size: var(--font-size-s);
}

.monthsRow {
  display: flex;
  gap: 4px;
}

.dayspacer {
  flex: 0 0 22px;
}

.months {
  flex: 1;
  display: flex;
  gap: 2px;
}

.month {
  flex: 1 1 0;
  min-width: 0;
  font-size: 9px;
  color: var(--text-muted);
  white-space: nowrap;
  overflow: visible;
}

.body {
  display: flex;
  gap: 4px;
  align-items: stretch;
}

.days {
  flex: 0 0 22px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.dayLabel {
  flex: 1 1 0;
  display: flex;
  align-items: center;
  font-size: 9px;
  color: var(--text-muted);
}

.grid {
  flex: 1;
  display: flex;
  gap: 2px;
}

.week {
  flex: 1 1 0;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.cell {
  width: 100%;
  aspect-ratio: 1;
  border-radius: 2px;
  background: var(--bg-elevated);
  cursor: pointer;
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

.years {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.year {
  padding: 2px 10px;
  background: transparent;
  border: none;
  border-radius: var(--radius-s);
  color: var(--text-muted);
  font-size: var(--font-size-s);
  text-align: right;
}

.yearActive {
  background: var(--accent);
  color: var(--accent-contrast);
  font-weight: 600;
}

.tooltip {
  position: absolute;
  transform: translate(-50%, calc(-100% - 6px));
  padding: var(--space-xs) var(--space-s);
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: var(--radius-s);
  font-size: var(--font-size-s);
  color: var(--text-primary);
  white-space: nowrap;
  pointer-events: none;
  z-index: 10;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
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
</style>
