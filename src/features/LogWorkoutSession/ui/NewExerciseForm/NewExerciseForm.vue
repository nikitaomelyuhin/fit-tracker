<template>
  <form :class="$style.form" @submit.prevent="picker.create()">
    <BaseTextField v-model="picker.newExercise.name" label="Название" enterkeyhint="done" autofocus />

    <div :class="$style.field">
      <span :class="$style.label">Группа мышц</span>
      <BaseChips v-model="picker.newExercise.category" :options="EXERCISE_CATEGORIES" aria-label="Группа мышц" />
    </div>

    <label :class="$style.check">
      <input v-model="picker.newExercise.isCore" type="checkbox" :class="$style.checkbox" />
      <span>
        В «Основу»
        <span :class="$style.hint">— будет на первой вкладке при добавлении</span>
      </span>
    </label>

    <div :class="$style.actions">
      <BaseButton variant="ghost" @click="picker.cancelCreate()">Назад</BaseButton>
      <BaseButton type="submit" :disabled="!picker.canCreate">
        {{ picker.saving ? 'Сохраняю…' : 'Добавить в тренировку' }}
      </BaseButton>
    </div>
  </form>
</template>

<script setup lang="ts">
import { EXERCISE_CATEGORIES } from '@/shared/config/exercises'
import { BaseButton, BaseChips, BaseTextField } from '@/shared/ui'
import { useExercisePickerStore } from '../../model/picker'

const picker = useExercisePickerStore()
</script>

<style module>
.form {
  display: flex;
  flex-direction: column;
  gap: var(--space-m);
}

.field {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.label {
  font-size: var(--font-size-s);
  color: var(--text-secondary);
}

.check {
  display: flex;
  align-items: center;
  gap: var(--space-s);
  min-height: var(--touch-target);
  font-size: var(--font-size-m);
  color: var(--text-primary);
}

.checkbox {
  flex-shrink: 0;
  accent-color: var(--accent);
}

.hint {
  font-size: var(--font-size-s);
  color: var(--text-muted);
}

.actions {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: var(--space-s);
}
</style>
