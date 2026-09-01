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
            :class="[$style.cell, $style[cell.cls]]"
            :title="cell.title"
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
  <p v-else :class="$style.empty">Веди вес каждый день — здесь появится календарь.</p>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import dayjs from 'dayjs'
import { useWeightLogStore } from '@/entities/WeightLog'
import { todayISO, addDays, formatHuman } from '@/shared/lib/date'

const MONTHS = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек']

const store = useWeightLogStore()

const weightByDate = computed(() => {
  const map = new Map<string, number>()
  for (const item of store.items) map.set(item.date, item.weight)
  return map
})

/** Изменение веса относительно предыдущей записи. */
const deltaByDate = computed(() => {
  const map = new Map<string, number>()
  const items = store.byDateAsc
  for (let i = 1; i < items.length; i++) {
    map.set(items[i].date, items[i].weight - items[i - 1].weight)
  }
  return map
})

function mondayOf(dateISO: string): string {
  const d = dayjs(dateISO)
  const offset = (d.day() + 6) % 7 // понедельник = 0
  return d.subtract(offset, 'day').format('YYYY-MM-DD')
}

function cellClass(date: string): string {
  if (!weightByDate.value.has(date)) return 'blank'
  const delta = deltaByDate.value.get(date)
  if (delta == null) return 'first'
  if (delta <= -0.15) return 'down'
  if (delta < 0.15) return 'flat'
  if (delta < 0.7) return 'up'
  return 'strong'
}

const weeks = computed(() => {
  const items = store.byDateAsc
  if (!items.length) return []
  const start = mondayOf(items[0].date)
  const end = todayISO()
  const result: { date: string; cls: string; title: string }[][] = []

  let cursor = start
  let guard = 0
  while (cursor <= end && guard < 300) {
    const week: { date: string; cls: string; title: string }[] = []
    for (let d = 0; d < 7; d++) {
      const date = addDays(cursor, d)
      const weight = weightByDate.value.get(date)
      const title = weight != null ? `${formatHuman(date)} — ${weight} кг` : formatHuman(date)
      week.push({ date, cls: cellClass(date), title })
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
</script>

<style module>
.heatmap {
  display: flex;
  flex-direction: column;
  gap: var(--space-m);
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
}

.blank {
  background: var(--bg-elevated);
}

.empty {
  color: var(--text-muted);
  font-size: var(--font-size-m);
  text-align: center;
  padding: var(--space-l);
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
