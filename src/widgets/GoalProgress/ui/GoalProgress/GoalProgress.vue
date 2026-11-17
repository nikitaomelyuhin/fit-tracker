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
        <dd :class="$style.statValue">{{ rateText }}</dd>
        <dd :class="[$style.band, $style[store.pace.tone]]">{{ store.pace.label }}</dd>
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
        <span :class="$style.milestoneWeight">{{ point.weight }} кг</span>
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

const rateText = computed(() =>
  store.ratePerWeek != null ? `−${store.ratePerWeek.toFixed(2)} кг/нед` : '—',
)

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

.band {
  font-size: var(--font-size-s);
}

.good {
  color: var(--success);
}

.warn {
  color: var(--warning);
}

.muted {
  color: var(--text-muted);
}

.milestones {
  list-style: none;
  display: flex;
  flex-direction: column;
}

.milestone {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: var(--space-s);
  padding: var(--space-xs) var(--space-s);
  border-radius: var(--radius-s);
  font-size: var(--font-size-s);
  color: var(--text-secondary);
}

/* Точка: пройдено — залитая зелёная, ближайшая — акцентное кольцо, дальше — серое кольцо. */
.marker {
  width: var(--legend-dot-size);
  height: var(--legend-dot-size);
  border: var(--border-width-thick) solid var(--border);
  border-radius: 50%;
}

.milestone-weight {
  font-weight: 600;
}

.milestone-date {
  white-space: nowrap;
}

/* Мелкие отметки «для интереса» — тише основных: тонкое кольцо, обычный шрифт, плотнее. */
.milestone-minor {
  padding-block: var(--space-2xs);
  color: var(--text-muted);
}

.milestone-minor .marker {
  border-width: var(--border-width);
}

.milestone-minor .milestone-weight {
  font-weight: 400;
}

.milestone-reached {
  color: var(--text-muted);
}

.milestone-reached .marker {
  background: var(--success);
  border-color: var(--success);
}

.milestone-next {
  padding-block: var(--space-xs);
  background: var(--accent-soft);
  color: var(--text-primary);
}

.milestone-next .marker {
  border-color: var(--accent);
}

.milestone-next .milestone-date {
  font-weight: 600;
}
</style>
