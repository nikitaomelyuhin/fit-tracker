<template>
  <div :class="$style.panel">
    <form :class="$style.form" @submit.prevent="onSubmit">
      <BaseTextField
        :model-value="store.date"
        label="Дата"
        type="date"
        @update:model-value="store.setDate($event)"
      />
      <BaseButton type="submit" :disabled="!store.canSubmit || store.submitting">
        {{ store.submitting ? 'Сохраняю…' : 'Отметить читмилом' }}
      </BaseButton>
    </form>
    <p :class="$style.hint">
      День без подсчёта: на графике виден как «много ккал», в средние и план не входит.
    </p>

    <ul v-if="cheatDays.byDateDesc.length" :class="$style.list">
      <li v-for="item in cheatDays.byDateDesc" :key="item.id" :class="$style.item">
        <span :class="$style.date">{{ formatHuman(item.date) }}</span>
        <BaseButton type="button" variant="danger" aria-label="Удалить" @click="onDelete(item.id)">
          ✕
        </BaseButton>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { useCheatDayStore } from '@/entities/CheatDay'
import { BaseButton, BaseTextField } from '@/shared/ui'
import { formatHuman } from '@/shared/lib/date'
import { useFreshDate } from '@/shared/lib/freshDate'
import { useMarkCheatDayStore } from '../../model/store'

const store = useMarkCheatDayStore()
const cheatDays = useCheatDayStore()

useFreshDate(() => store.refreshDateIfUntouched())

async function onSubmit() {
  await store.submit()
}

function onDelete(id: string) {
  cheatDays.remove(id)
}
</script>

<style module>
.panel {
  display: flex;
  flex-direction: column;
  gap: var(--space-m);
}

.form {
  display: flex;
  flex-direction: column;
  gap: var(--space-m);
}

.hint {
  font-size: var(--font-size-s);
  color: var(--text-muted);
}

.list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-m);
  padding: var(--space-s) var(--space-m);
  background: var(--bg-elevated);
  border-radius: var(--radius-m);
}

.date {
  color: var(--text-primary);
  font-size: var(--font-size-m);
}
</style>
