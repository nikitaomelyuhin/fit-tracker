<template>
  <form :class="$style.form" @submit.prevent="onSubmit">
    <DateChip :model-value="store.date" aria-label="Дата приёма пищи" @update:model-value="store.setDate($event)" />
    <BaseSegmented
      :model-value="store.mealType"
      :options="mealTypeOptions"
      aria-label="Приём пищи"
      @update:model-value="store.setMealType($event)"
    />

    <div :class="$style.dishes">
      <DishRowEditor
        v-for="row in store.rows"
        :key="row.key"
        :row-key="row.key"
        :removable="store.rows.length > 1"
      />
    </div>

    <button type="button" :class="$style.addDish" @click="store.addRow">
      <AppIcon name="plus" />
      Ещё блюдо
    </button>

    <div :class="$style.footer">
      <p v-if="store.validRowsCount > 0" :class="$style.total">
        <b>{{ store.totalPreview.kcal }} ккал</b>
        · Б {{ store.totalPreview.protein }} · Ж {{ store.totalPreview.fat }} · У {{ store.totalPreview.carbs }}
      </p>
      <BaseButton type="submit" :disabled="!store.canSubmit || store.submitting">
        {{ store.submitting ? 'Сохраняю…' : submitLabel }}
      </BaseButton>
    </div>
  </form>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { MEAL_TYPE_LABELS } from '@/shared/config/nutrition'
import { AppIcon, BaseButton, BaseSegmented, DateChip } from '@/shared/ui'
import { useFreshDate } from '@/shared/lib/freshDate'
import { useAddDiaryEntryStore } from '../../model/store'
import DishRowEditor from '../DishRowEditor/DishRowEditor.vue'

const emit = defineEmits<{ saved: [] }>()

const store = useAddDiaryEntryStore()

useFreshDate(() => store.refreshDateIfUntouched())

const mealTypeOptions = store.mealTypes.map((type) => ({ value: type, label: MEAL_TYPE_LABELS[type] }))

const submitLabel = computed(() =>
  store.validRowsCount > 1 ? `Добавить ${store.validRowsCount} блюда` : 'Добавить',
)

async function onSubmit() {
  if (await store.submit()) emit('saved')
}
</script>

<style module>
.form {
  display: flex;
  flex-direction: column;
  gap: var(--space-m);
}

.dishes {
  display: flex;
  flex-direction: column;
  gap: var(--space-s);
}

.add-dish {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-xs);
  min-height: var(--touch-target);
  padding: var(--space-s);
  background: transparent;
  border: var(--border-width) dashed var(--border);
  border-radius: var(--radius-m);
  color: var(--text-secondary);
  font-size: var(--font-size-m);
  font-weight: 600;
}

.add-dish:active {
  background: var(--bg-pressed);
}

/* Итог и кнопка всегда под пальцем: прилипают к низу шторки при прокрутке. */
.footer {
  position: sticky;
  bottom: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-s);
  margin: 0 calc(-1 * var(--space-m));
  padding: var(--space-s) var(--space-m) calc(var(--space-s) + env(safe-area-inset-bottom));
  background: var(--bg-surface);
  border-top: var(--border-width) solid var(--border);
}

.total {
  font-size: var(--font-size-s);
  color: var(--text-secondary);
  text-align: center;
}

.total b {
  color: var(--text-primary);
}

@media (hover: hover) {
  .add-dish:hover {
    border-color: var(--text-muted);
    color: var(--text-primary);
  }
}
</style>
