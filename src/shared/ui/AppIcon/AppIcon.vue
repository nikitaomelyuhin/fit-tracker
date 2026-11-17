<template>
  <svg
    :class="$style.icon"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    <path v-for="d in ICON_PATHS[name]" :key="d" :d="d" />
  </svg>
</template>

<script setup lang="ts">
import { ICON_PATHS } from '@/shared/config/icons'
import type { AppIconName } from '@/shared/types/icon'

defineProps<{ name: AppIconName }>()
</script>

<style module>
/* Размер — от шрифта родителя: иконка в кнопке и в навигации подстраивается сама. */
.icon {
  flex-shrink: 0;
  width: 1.25em;
  height: 1.25em;
}
</style>
