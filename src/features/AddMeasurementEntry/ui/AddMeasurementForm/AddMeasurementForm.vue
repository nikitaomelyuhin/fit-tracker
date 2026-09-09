<template>
  <form :class="$style['measurement-form']" @submit.prevent="onSubmit">
    <div :class="$style.row">
      <BaseTextField v-model="store.form.date" label="Дата" type="date" />
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
import { useAddMeasurementStore } from '../../model/store'

const store = useAddMeasurementStore()

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
