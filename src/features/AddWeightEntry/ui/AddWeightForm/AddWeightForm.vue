<template>
  <form :class="$style['weight-form']" @submit.prevent="onSubmit">
    <div :class="$style.row">
      <BaseTextField v-model="store.form.date" label="Дата" type="date" />
      <BaseTextField
        v-model="store.form.weight"
        label="Вес, кг"
        inputmode="decimal"
        placeholder="89.5"
      />
    </div>
    <BaseButton type="submit" :disabled="!store.canSubmit || store.submitting">
      {{ store.submitting ? 'Сохраняю…' : 'Сохранить вес' }}
    </BaseButton>
  </form>
</template>

<script setup lang="ts">
import { BaseButton, BaseTextField } from '@/shared/ui'
import { useAddWeightStore } from '../../model/store'

const store = useAddWeightStore()

async function onSubmit() {
  await store.submit()
}
</script>

<style module>
.weight-form {
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
