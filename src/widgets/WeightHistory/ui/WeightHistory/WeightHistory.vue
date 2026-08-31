<template>
  <ul v-if="store.byDateDesc.length" :class="$style.list">
    <li v-for="entry in store.byDateDesc" :key="entry.id" :class="$style.row">
      <span :class="$style.date">{{ formatHuman(entry.date) }}</span>
      <span :class="$style.weight">{{ entry.weight }} кг</span>
      <BaseButton variant="danger" @click="onDelete(entry.id)">
        {{ pendingId === entry.id ? 'Удалить?' : '✕' }}
      </BaseButton>
    </li>
  </ul>
  <p v-else :class="$style.empty">Записей пока нет</p>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useWeightLogStore } from '@/entities/WeightLog'
import { BaseButton } from '@/shared/ui'
import { formatHuman } from '@/shared/lib/date'

const store = useWeightLogStore()

// Удаление в два клика: первый — «Удалить?», второй — подтверждение.
const pendingId = ref<string | null>(null)

function onDelete(id: string) {
  if (pendingId.value === id) {
    store.remove(id)
    pendingId.value = null
  } else {
    pendingId.value = id
  }
}
</script>

<style module>
.list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.row {
  display: grid;
  grid-template-columns: 1fr auto auto;
  align-items: center;
  gap: var(--space-m);
  padding: var(--space-s) var(--space-m);
  background: var(--bg-elevated);
  border-radius: var(--radius-m);
}

.date {
  color: var(--text-secondary);
  font-size: var(--font-size-s);
}

.weight {
  color: var(--text-primary);
  font-weight: 600;
}

.empty {
  color: var(--text-muted);
  font-size: var(--font-size-m);
  text-align: center;
  padding: var(--space-l);
}
</style>
