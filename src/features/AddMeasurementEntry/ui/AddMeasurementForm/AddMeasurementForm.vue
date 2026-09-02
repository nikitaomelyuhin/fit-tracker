<template>
  <form :class="$style['measurement-form']" @submit.prevent="onSubmit">
    <BaseTextField v-model="store.form.date" label="Дата" type="date" />
    <div :class="$style.grid">
      <BaseTextField v-model="store.form.waist" label="Талия" inputmode="decimal" placeholder="82" />
      <BaseTextField v-model="store.form.chest" label="Грудь" inputmode="decimal" placeholder="108" />
      <BaseTextField v-model="store.form.shoulders" label="Плечи" inputmode="decimal" placeholder="127" />
      <BaseTextField v-model="store.form.arm" label="Рука" inputmode="decimal" placeholder="40" />
      <BaseTextField v-model="store.form.forearm" label="Предплечье" inputmode="decimal" placeholder="31" />
    </div>
    <BaseTextField v-model="store.form.note" label="Заметка" placeholder="—" />
    <BaseButton type="submit" :disabled="!store.canSubmit || store.submitting">
      {{ store.submitting ? 'Сохраняю…' : 'Сохранить замеры' }}
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

.grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-m);
}

@media (max-width: 520px) {
  .grid {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
