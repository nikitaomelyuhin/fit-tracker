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

    <label
      :class="[$style.dropzone, isDragging && $style.dropzoneActive]"
      @dragenter.prevent="onDragEnter"
      @dragover.prevent
      @dragleave.prevent="onDragLeave"
      @drop.prevent="onDrop"
    >
      <span :class="$style.dropzoneText">
        {{ store.form.file ? `Выбрано: ${store.form.file.name}` : 'Перетащи фото сюда или нажми, чтобы выбрать' }}
      </span>
      <input
        :class="$style.fileInput"
        type="file"
        accept="image/*"
        @change="onFileChange"
      />
    </label>

    <BaseTextField v-model="store.form.note" label="Заметка" placeholder="—" />

    <BaseButton type="submit" :disabled="!store.canSubmit || store.submitting">
      {{ store.submitting ? 'Загружаю…' : 'Сохранить фото' }}
    </BaseButton>
    <p v-if="photos.error" :class="$style.error">{{ photos.error }}</p>
  </form>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useProgressPhotoStore } from '@/entities/ProgressPhoto'
import { PHOTO_ANGLES, PHOTO_ANGLE_LABELS } from '@/shared/config/photos'
import { BaseButton, BaseSelect, BaseTextField } from '@/shared/ui'
import { useFreshDate } from '@/shared/lib/freshDate'
import { useAddProgressPhotoStore } from '../../model/store'

const store = useAddProgressPhotoStore()
const photos = useProgressPhotoStore()

useFreshDate(() => store.refreshDateIfUntouched())

const angleOptions = PHOTO_ANGLES.map((angle) => ({ value: angle, label: PHOTO_ANGLE_LABELS[angle] }))

const isDragging = ref(false)

function onFileChange(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0] ?? null
  store.setFile(file)
}

function onDragEnter() {
  isDragging.value = true
}

function onDragLeave() {
  isDragging.value = false
}

function onDrop(event: DragEvent) {
  isDragging.value = false
  const file = event.dataTransfer?.files?.[0] ?? null
  if (file && file.type.startsWith('image/')) store.setFile(file)
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

.dropzone {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  min-height: 96px;
  padding: var(--space-m);
  background: var(--bg-elevated);
  border: 2px dashed var(--border);
  border-radius: var(--radius-m);
  cursor: pointer;
  transition: border-color 0.15s ease, background 0.15s ease;
}

.dropzoneActive {
  border-color: var(--accent);
  background: var(--bg-surface);
}

.dropzoneText {
  font-size: var(--font-size-s);
  color: var(--text-secondary);
}

.fileInput {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  opacity: 0;
}

.error {
  font-size: var(--font-size-s);
  color: var(--danger);
}
</style>
