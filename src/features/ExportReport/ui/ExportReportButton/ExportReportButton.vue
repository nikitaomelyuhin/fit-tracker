<template>
  <BaseButton variant="ghost" @click="store.download()">
    <AppIcon name="download" />
    Отчёт
  </BaseButton>
</template>

<script setup lang="ts">
import { useExportReportStore } from '../../model/store'
import { AppIcon, BaseButton } from '@/shared/ui'

const store = useExportReportStore()
</script>
