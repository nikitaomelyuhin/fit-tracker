import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vitest/config'

// Отдельно от vite.config.ts — тестам не нужен PWA-плагин.
export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
