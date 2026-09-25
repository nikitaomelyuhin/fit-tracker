<template>
  <form :class="$style.form" @submit.prevent="onSubmit">
    <div :class="$style.row">
      <BaseTextField
        :model-value="store.form.date"
        label="Дата"
        type="date"
        @update:model-value="store.setDate($event)"
      />
      <BaseSelect v-model="store.form.angle" label="Ракурс" :options="angleOptions" />
    </div>

    <label :class="$style.fileLabel">
      <span :class="$style.fileLabelText">Фото</span>
      <input
        :class="$style.fileInput"
        type="file"
        accept="image/*"
        @change="onFileChange"
      />
    </label>
    <p v-if="store.form.file" :class="$style.fileName">Выбрано: {{ store.form.file.name }}</p>

    <BaseTextField v-model="store.form.note" label="Заметка" placeholder="—" />

    <BaseButton type="submit" :disabled="!store.canSubmit || store.submitting">
      {{ store.submitting ? 'Загружаю…' : 'Сохранить фото' }}
    </BaseButton>
    <p v-if="photos.error" :class="$style.error">{{ photos.error }}</p>
  </form>
</template>

<script setup lang="ts">
import { useProgressPhotoStore } from '@/entities/ProgressPhoto'
import { PHOTO_ANGLES, PHOTO_ANGLE_LABELS } from '@/shared/config/photos'
import { BaseButton, BaseSelect, BaseTextField } from '@/shared/ui'
import { useFreshDate } from '@/shared/lib/freshDate'
import { useAddProgressPhotoStore } from '../../model/store'

const store = useAddProgressPhotoStore()
const photos = useProgressPhotoStore()

useFreshDate(() => store.refreshDateIfUntouched())

const angleOptions = PHOTO_ANGLES.map((angle) => ({ value: angle, label: PHOTO_ANGLE_LABELS[angle] }))

function onFileChange(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0] ?? null
  store.setFile(file)
}

async function onSubmit() {
  await store.submit()
}
</script>

<style module>
.form {
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

.fileLabel {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.fileLabelText {
  font-size: var(--font-size-s);
  color: var(--text-secondary);
}

.fileInput {
  color: var(--text-primary);
  font-size: var(--font-size-m);
}

.fileName {
  font-size: var(--font-size-s);
  color: var(--text-muted);
}

.error {
  font-size: var(--font-size-s);
  color: var(--danger);
}
</style>
