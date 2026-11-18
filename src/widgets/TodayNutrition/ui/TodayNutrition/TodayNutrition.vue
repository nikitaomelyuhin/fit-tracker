<template>
  <div :class="$style.nutrition">
    <div :class="$style.summary">
      <CalorieRing :kcal="store.totals.kcal" :share="store.ringShare" :tone="store.status" />
      <div :class="$style.status">
        <span :class="[$style.headline, $style[store.status]]">{{ headline }}</span>
        <span :class="$style.range">цель {{ store.range.min }}–{{ store.range.max }} ккал</span>
        <dl :class="$style.macros">
          <div v-for="macro in macros" :key="macro.label" :class="$style.macro">
            <dt>{{ macro.label }}</dt>
            <dd :class="macro.low && $style.low">{{ macro.value }}</dd>
          </div>
        </dl>
      </div>
    </div>

    <TodayMealList :meals="store.meals" @add="emit('add', $event)" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { MealType } from '@/shared/config/nutrition'
import { useTodayNutritionStore } from '../../model/store'
import CalorieRing from '../CalorieRing/CalorieRing.vue'
import TodayMealList from '../TodayMealList/TodayMealList.vue'

const emit = defineEmits<{ add: [mealType: MealType] }>()

const store = useTodayNutritionStore()

const headline = computed(() => {
  switch (store.status) {
    case 'cheat':
      return 'Читмил — не считаем'
    case 'empty':
      return `${store.target} ккал на день`
    case 'over':
      return `Перебор ${store.totals.kcal - store.range.max} ккал`
    default:
      return store.remainingKcal > 0 ? `Осталось ${store.remainingKcal} ккал` : 'В коридоре'
  }
})

const macros = computed(() => {
  const totals = store.totals
  return [
    { label: 'Белки', value: `${Math.round(totals.protein)} г`, low: false },
    { label: 'Жиры', value: `${Math.round(totals.fat)} г`, low: false },
    { label: 'Углев.', value: `${Math.round(totals.carbs)} г`, low: false },
    {
      label: 'Клетч.',
      value: `${Math.round(totals.fiber)}/${store.fiberRange.min} г`,
      // Клетчатку подсвечиваем, только когда день уже набран, а её всё ещё мало.
      low: store.status === 'inRange' && totals.fiber < store.fiberRange.min,
    },
  ]
})
</script>

<style module>
.nutrition {
  display: flex;
  flex-direction: column;
  gap: var(--space-m);
}

.summary {
  display: flex;
  align-items: center;
  gap: var(--space-m);
}

.status {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-2xs);
}

.headline {
  font-size: var(--font-size-l);
  font-weight: 700;
  color: var(--text-primary);
}

.in-range {
  color: var(--success);
}

.over {
  color: var(--warning);
}

.cheat {
  color: var(--text-secondary);
}

.range {
  font-size: var(--font-size-s);
  color: var(--text-muted);
}

.macros {
  display: grid;
  grid-template-columns: repeat(4, auto);
  justify-content: start;
  gap: var(--space-xs) var(--space-m);
  margin-top: var(--space-s);
}

.macro {
  display: flex;
  flex-direction: column;
}

.macro dt {
  font-size: var(--font-size-xs);
  color: var(--text-muted);
}

.macro dd {
  font-size: var(--font-size-s);
  font-weight: 600;
  color: var(--text-primary);
}

.macro .low {
  color: var(--warning);
}
</style>
