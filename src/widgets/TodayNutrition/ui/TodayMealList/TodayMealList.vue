<template>
  <ul :class="$style.meals">
    <li v-for="meal in meals" :key="meal.mealType" :class="$style.meal">
      <div :class="$style.main">
        <span :class="$style.label">{{ meal.label }}</span>
        <span :class="$style.names">{{ meal.names.length ? namesText(meal.names) : '—' }}</span>
      </div>
      <span v-if="meal.kcal != null" :class="$style.kcal">{{ meal.kcal }}</span>
      <button
        type="button"
        :class="$style.add"
        :aria-label="`Добавить: ${meal.label.toLowerCase()}`"
        @click="emit('add', meal.mealType)"
      >
        <AppIcon name="plus" />
      </button>
    </li>
  </ul>
</template>

<script setup lang="ts">
import type { MealType } from '@/shared/config/nutrition'
import { AppIcon } from '@/shared/ui'
import type { TodayMeal } from '../../model/types'

defineProps<{ meals: TodayMeal[] }>()
const emit = defineEmits<{ add: [mealType: MealType] }>()

/** «Яйца, хлеб и ещё 2» — подпись не длиннее двух названий. */
function namesText(names: string[]): string {
  const shown = names.slice(0, 2).join(', ')
  return names.length > 2 ? `${shown} и ещё ${names.length - 2}` : shown
}
</script>

<style module>
.meals {
  list-style: none;
  display: flex;
  flex-direction: column;
}

.meal {
  display: grid;
  grid-template-columns: 1fr auto auto;
  align-items: center;
  gap: var(--space-s);
  padding: var(--space-s) 0;
  border-top: var(--border-width) solid var(--border);
}

.main {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-2xs);
  min-width: 0;
}

.label {
  font-size: var(--font-size-m);
  font-weight: 600;
  color: var(--text-primary);
}

.names {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: var(--font-size-s);
  color: var(--text-muted);
}

.kcal {
  font-size: var(--font-size-m);
  font-weight: 600;
  color: var(--text-secondary);
}

.add {
  display: flex;
  align-items: center;
  justify-content: center;
  width: var(--touch-target);
  height: var(--touch-target);
  background: var(--accent-soft);
  border: none;
  border-radius: 50%;
  color: var(--accent);
  font-size: var(--font-size-m);
  transition: transform var(--duration-fast) var(--ease-out);
}

.add:active {
  transform: scale(var(--press-scale));
}
</style>
