<template>
  <form :class="$style['measurement-form']" @submit.prevent="onSubmit">
    <div :class="$style.row">
      <BaseTextField
        :model-value="store.form.date"
        label="Дата"
        type="date"
        @update:model-value="store.setDate($event)"
      />
      <BaseTextField v-model="store.form.waist" label="Талия" inputmode="decimal" placeholder="82" />
    </div>
    <BaseTextField v-model="store.form.note" label="Заметка" placeholder="—" />
    <BaseButton type="submit" :disabled="!store.canSubmit || store.submitting">
      {{ store.submitting ? 'Сохраняю…' : 'Сохранить замер' }}
    </BaseButton>
  </form>
</template>

<script setup lang="ts">
import { BaseButton, BaseTextField } from '@/shared/ui'
import { useFreshDate } from '@/shared/lib/freshDate'
import { useAddMeasurementStore } from '../../model/store'

const store = useAddMeasurementStore()

useFreshDate(() => store.refreshDateIfUntouched())

async function onSubmit() {
  await store.submit()
}
</script>

<style module>
.measurement-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-m);
}

.row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-m);
}

@media (max-width: 520px) {
  .row {
    grid-template-columns: 1fr;
  }
}
</style>
