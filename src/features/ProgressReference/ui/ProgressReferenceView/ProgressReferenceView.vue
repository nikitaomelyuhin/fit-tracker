<template>
  <div :class="$style.reference">
    <img v-if="photos.referenceUrl" :src="photos.referenceUrl" alt="Ориентир по прогрессу" :class="$style.img" />

    <label :class="photos.referenceUrl ? $style.replace : $style.upload">
      {{ uploadLabel }}
      <input :class="$style.fileInput" type="file" accept="image/*" :disabled="photos.uploadingReference" @change="onFile" />
    </label>
    <p v-if="photos.error" :class="$style.error">{{ photos.error }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useProgressPhotoStore } from '@/entities/ProgressPhoto'

const photos = useProgressPhotoStore()

const uploadLabel = computed(() => {
  if (photos.uploadingReference) return 'Загружаю…'
  return photos.referenceUrl ? 'Заменить картинку' : 'Загрузить картинку-ориентир'
})

async function onFile(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) await photos.uploadReference(file)
  input.value = ''
}
</script>

<style module>
.reference {
  display: flex;
  flex-direction: column;
  gap: var(--space-s);
}

.img {
  display: block;
  width: 100%;
  border-radius: var(--radius-m);
}

.upload,
.replace {
  position: relative;
  cursor: pointer;
  border-radius: var(--radius-m);
  color: var(--text-secondary);
  font-size: var(--font-size-m);
}

.upload {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 96px;
  padding: var(--space-m);
  background: var(--bg-elevated);
  border: 2px dashed var(--border);
}

.replace {
  align-self: flex-start;
  padding: var(--space-s) 0;
  font-size: var(--font-size-s);
  color: var(--text-muted);
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
