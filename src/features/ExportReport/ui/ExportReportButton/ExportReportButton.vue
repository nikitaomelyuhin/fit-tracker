<template>
  <BaseButton variant="ghost" @click="store.download()">↓ Отчёт</BaseButton>
</template>

<script setup lang="ts">
import { useExportReportStore } from '../../model/store'
import { BaseButton } from '@/shared/ui'

const store = useExportReportStore()
</script>
