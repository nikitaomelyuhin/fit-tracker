<template>
  <div :class="$style.goalProgress">
    <div :class="$style.hero">
      <div :class="$style.heroMain">
        <span :class="$style.heroValue">
          {{ formatKg(store.current) }}<span :class="$style.unit">кг</span>
        </span>
        <span :class="$style.heroCaption">
          {{ store.reached ? 'Цель достигнута 🎉' : `сейчас · цель ${store.goal} кг` }}
        </span>
      </div>
      <span :class="$style.percent">{{ store.progressPct }}%</span>
    </div>

    <div
      :class="$style.bar"
      role="progressbar"
      aria-label="Пройдено пути к цели"
      :aria-valuenow="store.progressPct"
      aria-valuemin="0"
      aria-valuemax="100"
    >
      <div :class="$style.fill" :style="{ width: store.progressPct + '%' }" />
    </div>
    <div :class="$style.barLegend">
      <span>старт {{ formatKg(store.start) }} кг</span>
      <span>осталось {{ formatKg(store.remainingKg) }} кг</span>
    </div>

    <dl :class="$style.stats">
      <div :class="$style.stat">
        <dt :class="$style.statLabel">Сброшено</dt>
        <dd :class="$style.statValue">{{ lostText }}</dd>
      </div>
      <div :class="$style.stat">
        <dt :class="$style.statLabel">Темп</dt>
        <dd :class="[$style.statValue, $style[store.rateTone]]">{{ rateText }}</dd>
      </div>
      <div :class="$style.stat">
        <dt :class="$style.statLabel">Жир (оценка)</dt>
        <dd :class="$style.statValue">{{ store.bodyFatPct != null ? `${store.bodyFatPct}%` : '—' }}</dd>
      </div>
    </dl>

    <ul :class="$style.milestones">
      <li
        v-for="(point, index) in store.milestones"
        :key="point.weight"
        :class="[
          $style.milestone,
          point.kind === 'minor' && $style.milestoneMinor,
          point.reached && $style.milestoneReached,
          index === nextIndex && $style.milestoneNext,
        ]"
      >
        <span :class="$style.marker" aria-hidden="true" />
        <span :class="$style.milestoneWeight">
          {{ point.weight }} кг
          <span v-if="point.bodyFatPct != null" :class="$style.milestoneFat">· жир {{ point.bodyFatPct.toFixed(1) }}%</span>
        </span>
        <span :class="$style.milestoneDate">{{ milestoneText(point) }}</span>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { formatHuman } from '@/shared/lib/date'
import { useGoalProgressStore } from '../../model/store'
import type { GoalMilestone } from '../../model/types'

const store = useGoalProgressStore()

/** Первая непройденная отметка (в том числе мелкая) — ближайшая цель, её подсвечиваем. */
const nextIndex = computed(() => store.milestones.findIndex((point) => !point.reached))

function formatKg(value: number | null): string {
  return value != null ? value.toFixed(1) : '—'
}

const lostText = computed(() => {
  const lost = store.lostKg
  if (lost == null) return '—'
  return lost >= 0 ? `−${lost.toFixed(1)} кг` : `+${Math.abs(lost).toFixed(1)} кг`
})

/** Темп положительный, когда вес уходит, — на экране это минус. */
const rateText = computed(() => {
  const rate = store.ratePerWeek
  if (rate == null) return '—'
  const sign = store.rateTone === 'down' ? '−' : store.rateTone === 'up' ? '+' : ''
  return `${sign}${Math.abs(rate).toFixed(2)} кг/нед`
})

function milestoneText(point: GoalMilestone): string {
  if (point.reached) return 'пройдено'
  return point.expectedDate ? `≈ ${formatHuman(point.expectedDate)}` : '—'
}
</script>

<style module>
.goal-progress {
  display: flex;
  flex-direction: column;
  gap: var(--space-m);
}

.hero {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--space-m);
}

.hero-main {
  display: flex;
  flex-direction: column;
  gap: var(--space-2xs);
}

.hero-value {
  font-size: var(--font-size-xl);
  font-weight: 700;
  line-height: 1.1;
  color: var(--text-primary);
}

.unit {
  margin-left: var(--space-xs);
  font-size: var(--font-size-m);
  font-weight: 600;
  color: var(--text-secondary);
}

.hero-caption {
  font-size: var(--font-size-s);
  color: var(--text-secondary);
}

.percent {
  font-size: var(--font-size-l);
  font-weight: 700;
  color: var(--accent);
}

.bar {
  width: 100%;
  height: var(--progress-bar-height);
  background: var(--bg-elevated);
  border-radius: var(--radius-s);
  overflow: hidden;
}

.fill {
  height: 100%;
  background: var(--accent);
  border-radius: var(--radius-s);
  transition: width var(--duration-slow) var(--ease-out);
}

.bar-legend {
  display: flex;
  justify-content: space-between;
  gap: var(--space-m);
  margin-top: calc(-1 * var(--space-s));
  font-size: var(--font-size-xs);
  color: var(--text-muted);
}

.stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-m);
  padding: var(--space-m) 0;
  border-top: var(--border-width) solid var(--border);
  border-bottom: var(--border-width) solid var(--border);
}

.stat {
  display: flex;
  flex-direction: column;
  gap: var(--space-2xs);
}

.stat-label {
  font-size: var(--font-size-s);
  color: var(--text-secondary);
}

.stat-value {
  font-size: var(--font-size-l);
  font-weight: 600;
  color: var(--text-primary);
}

.down {
  color: var(--success);
}

.up {
  color: var(--danger);
}

.flat {
  color: var(--text-muted);
}

.milestones {
  list-style: none;
  display: flex;
  flex-direction: column;
}

/*
 * Отметки стоят на линии маршрута: основные — крупные узлы и крупный шрифт,
 * мелкие «для интереса» — точки на линии, мелкий бледный шрифт со сдвигом.
 */
.milestone {
  position: relative;
  display: grid;
  grid-template-columns: var(--timeline-rail-width) 1fr auto;
  align-items: center;
  column-gap: var(--space-s);
  padding: var(--space-s) var(--space-s) var(--space-s) var(--space-xs);
  border-radius: var(--radius-s);
  font-size: var(--font-size-m);
  color: var(--text-primary);
}

/* Линия маршрута через центры отметок; пройденный участок — зелёный. */
.milestone::before {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  left: calc(var(--space-xs) + var(--timeline-rail-width) / 2);
  width: var(--border-width-thick);
  background: var(--border);
  transform: translateX(-50%);
}

.milestone:first-child::before {
  top: 50%;
}

.milestone:last-child::before {
  bottom: 50%;
}

.milestone-reached::before {
  background: var(--success);
}

.marker {
  position: relative;
  z-index: 1;
  justify-self: center;
  width: var(--timeline-node-size);
  height: var(--timeline-node-size);
  border: var(--border-width-thick) solid var(--text-muted);
  border-radius: 50%;
  background: var(--bg-surface);
}

.milestone-weight {
  font-weight: 700;
}

/* Прогноз % жира рядом с весом — вторичная информация, тише веса. */
.milestone-fat {
  margin-left: var(--space-xs);
  font-size: var(--font-size-s);
  font-weight: 400;
  color: var(--text-muted);
}

.milestone-date {
  white-space: nowrap;
  font-size: var(--font-size-s);
  color: var(--text-secondary);
}

/* Мелкие отметки. */
.milestone-minor {
  padding-block: var(--space-2xs);
  font-size: var(--font-size-xs);
  color: var(--text-muted);
}

.milestone-minor .marker {
  width: var(--timeline-tick-size);
  height: var(--timeline-tick-size);
  border: none;
  background: var(--text-muted);
}

.milestone-minor .milestone-weight {
  padding-left: var(--space-s);
  font-weight: 400;
}

.milestone-minor .milestone-fat {
  font-size: var(--font-size-xs);
}

.milestone-minor .milestone-date {
  font-size: var(--font-size-xs);
  color: var(--text-muted);
}

/* Пройденные — зелёный узел, текст приглушён. */
.milestone-reached {
  color: var(--text-muted);
}

.milestone-reached .marker {
  background: var(--success);
  border-color: var(--success);
}

.milestone-reached .milestone-date {
  color: var(--text-muted);
}

/* Ближайшая непройденная — подсветка и акцентный узел, даже если она мелкая. */
.milestone-next {
  background: var(--accent-soft);
  color: var(--text-primary);
}

.milestone-next .marker {
  width: var(--timeline-node-size);
  height: var(--timeline-node-size);
  border: var(--border-width-thick) solid var(--accent);
  background: var(--bg-surface);
}

.milestone-next .milestone-date {
  color: var(--text-primary);
  font-weight: 600;
}

.milestone-next .milestone-fat {
  color: var(--text-secondary);
}

.milestone-minor.milestone-next {
  padding-block: var(--space-xs);
  font-size: var(--font-size-s);
}

.milestone-minor.milestone-next .milestone-date,
.milestone-minor.milestone-next .milestone-fat {
  font-size: var(--font-size-s);
}
</style>
