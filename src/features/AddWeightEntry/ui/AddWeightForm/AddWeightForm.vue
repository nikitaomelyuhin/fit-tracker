<template>
  <form :class="$style.weightForm" @submit.prevent="onSubmit">
    <DateChip :model-value="store.form.date" aria-label="Дата взвешивания" @update:model-value="store.setDate($event)" />

    <div :class="$style.entry">
      <button type="button" :class="$style.nudge" aria-label="Минус 0,1 кг" @click="store.nudge(-0.1)">
        <AppIcon name="minus" />
      </button>
      <BaseTextField
        v-model="store.form.weight"
        large
        autofocus
        aria-label="Вес, кг"
        inputmode="decimal"
        enterkeyhint="done"
        :placeholder="store.previous ? store.previous.weight.toFixed(1) : '89.5'"
      />
      <button type="button" :class="$style.nudge" aria-label="Плюс 0,1 кг" @click="store.nudge(0.1)">
        <AppIcon name="plus" />
      </button>
    </div>

    <p :class="$style.hint">
      <template v-if="store.existing">
        На эту дату уже записано {{ store.existing.weight }} кг — сохранение заменит.
      </template>
      <template v-else-if="store.previous">
        Прошлое взвешивание: {{ store.previous.weight }} кг · {{ formatHuman(store.previous.date) }}
      </template>
      <template v-else>Утром, натощак, после туалета — так цифры сравнимы.</template>
    </p>

    <BaseButton type="submit" :disabled="!store.canSubmit || store.submitting">
      {{ store.submitting ? 'Сохраняю…' : 'Сохранить вес' }}
    </BaseButton>
  </form>
</template>

<script setup lang="ts">
import { AppIcon, BaseButton, BaseTextField, DateChip } from '@/shared/ui'
import { useFreshDate } from '@/shared/lib/freshDate'
import { formatHuman } from '@/shared/lib/date'
import { useAddWeightStore } from '../../model/store'

const emit = defineEmits<{ saved: [] }>()

const store = useAddWeightStore()

useFreshDate(() => store.refreshDateIfUntouched())

async function onSubmit() {
  if (await store.submit()) emit('saved')
}
</script>

<style module>
.weight-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-m);
}

.entry {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: var(--space-s);
}

.nudge {
  display: flex;
  align-items: center;
  justify-content: center;
  width: var(--touch-target);
  height: var(--touch-target);
  background: var(--bg-elevated);
  border: var(--border-width) solid var(--border);
  border-radius: 50%;
  color: var(--text-primary);
  font-size: var(--font-size-m);
  transition:
    background var(--duration-fast) var(--ease-out),
    transform var(--duration-fast) var(--ease-out);
}

.nudge:active {
  background: var(--bg-pressed);
  transform: scale(var(--press-scale));
}

.hint {
  font-size: var(--font-size-s);
  color: var(--text-secondary);
  text-align: center;
}
</style>
