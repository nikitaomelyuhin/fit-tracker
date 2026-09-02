<template>
  <ul v-if="store.byDateDesc.length" :class="$style.list">
    <li v-for="entry in store.byDateDesc" :key="entry.id" :class="$style.row">
      <div :class="$style.head">
        <span :class="$style.date">{{ formatHuman(entry.date) }}</span>
        <BaseButton variant="danger" @click="onDelete(entry.id)">
          {{ pendingId === entry.id ? 'Удалить?' : '✕' }}
        </BaseButton>
      </div>
      <div :class="$style.metrics">
        <span v-for="metric in metricsOf(entry)" :key="metric.label" :class="$style.metric">
          <b :class="$style.metricLabel">{{ metric.label }}</b> {{ metric.value }}
        </span>
      </div>
    </li>
  </ul>
  <p v-else :class="$style.empty">Замеров пока нет</p>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useMeasurementStore, type Measurement } from '@/entities/Measurement'
import { BaseButton } from '@/shared/ui'
import { formatHuman } from '@/shared/lib/date'

const store = useMeasurementStore()

const pendingId = ref<string | null>(null)

function onDelete(id: string) {
  if (pendingId.value === id) {
    store.remove(id)
    pendingId.value = null
  } else {
    pendingId.value = id
  }
}

function metricsOf(entry: Measurement) {
  return [
    { label: 'Талия', value: entry.waist },
    { label: 'Плечи', value: entry.shoulders },
    { label: 'Грудь', value: entry.chest },
    { label: 'Рука', value: entry.arm },
    { label: 'Предпл', value: entry.forearm },
  ].filter((metric) => metric.value != null)
}
</script>

<style module>
.list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: var(--space-s);
}

.row {
  display: flex;
  flex-direction: column;
  gap: var(--space-s);
  padding: var(--space-s) var(--space-m);
  background: var(--bg-elevated);
  border-radius: var(--radius-m);
}

.head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.date {
  color: var(--text-secondary);
  font-size: var(--font-size-s);
}

.metrics {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-s) var(--space-m);
}

.metric {
  font-size: var(--font-size-s);
  color: var(--text-primary);
}

.metricLabel {
  color: var(--text-muted);
  font-weight: 400;
}

.empty {
  color: var(--text-muted);
  font-size: var(--font-size-m);
  text-align: center;
  padding: var(--space-l);
}
</style>
