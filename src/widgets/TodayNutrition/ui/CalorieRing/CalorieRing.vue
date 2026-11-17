<template>
  <div :class="$style.ring">
    <svg viewBox="0 0 100 100" :class="$style.svg" aria-hidden="true">
      <circle :class="$style.track" cx="50" cy="50" :r="RADIUS" />
      <circle
        :class="[$style.value, $style[tone]]"
        cx="50"
        cy="50"
        :r="RADIUS"
        :stroke-dasharray="CIRCUMFERENCE"
        :stroke-dashoffset="CIRCUMFERENCE * (1 - share)"
      />
    </svg>
    <div :class="$style.center">
      <span :class="$style.kcal">{{ kcal }}</span>
      <span :class="$style.caption">ккал</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { KcalStatus } from '../../model/types'

defineProps<{ kcal: number; share: number; tone: KcalStatus }>()

/** Геометрия в единицах viewBox (100×100), размер на экране задаёт --ring-size. */
const RADIUS = 43
const CIRCUMFERENCE = 2 * Math.PI * RADIUS
</script>

<style module>
.ring {
  position: relative;
  flex-shrink: 0;
  width: var(--ring-size);
  height: var(--ring-size);
}

.svg {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.track,
.value {
  fill: none;
  stroke-width: 9;
}

.track {
  stroke: var(--bg-elevated);
}

.value {
  stroke-linecap: round;
  transition:
    stroke-dashoffset var(--duration-slow) var(--ease-out),
    stroke var(--duration-slow) var(--ease-out);
}

.empty,
.under {
  stroke: var(--accent);
}

.in-range {
  stroke: var(--success);
}

.over {
  stroke: var(--warning);
}

.cheat {
  stroke: var(--text-muted);
}

.center {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.kcal {
  font-size: var(--font-size-l);
  font-weight: 700;
  color: var(--text-primary);
}

.caption {
  font-size: var(--font-size-xs);
  color: var(--text-muted);
}
</style>
