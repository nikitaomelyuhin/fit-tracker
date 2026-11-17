<template>
  <header :class="$style.header">
    <h1 :class="$style.title">{{ title }}</h1>
    <div :class="$style.actions">
      <ExportReportButton />
      <BaseButton variant="ghost" :disabled="sync.loading" @click="sync.loadAll()">
        <AppIcon name="refresh" :class="sync.loading && $style.spinning" />
        {{ sync.loading ? 'Обновляю…' : 'Обновить' }}
      </BaseButton>
      <BaseButton variant="ghost" @click="emit('sign-out')">
        <AppIcon name="logout" />
        Выйти
      </BaseButton>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ExportReportButton } from '@/features/ExportReport'
import { AppIcon, BaseButton } from '@/shared/ui'
import { useDashboardSyncStore } from '../../model/store'

defineProps<{ title: string }>()
const emit = defineEmits<{ 'sign-out': [] }>()

const sync = useDashboardSyncStore()
</script>

<style module>
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-m);
  flex-wrap: wrap;
}

.title {
  font-size: var(--font-size-xl);
  color: var(--text-primary);
}

.actions {
  display: flex;
  gap: var(--space-s);
  flex-wrap: wrap;
}

.spinning {
  animation: spin var(--duration-spin) linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* На телефоне шапка не нужна: где ты — видно по нижней навигации, отчёт/выход/
   «Обновить» убраны, обновление свайпом вниз. */
@media (max-width: 860px) {
  .header {
    display: none;
  }
}
</style>
