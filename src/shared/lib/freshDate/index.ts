import { onMounted, onUnmounted } from 'vue'

/**
 * Вызывает refresh() при маунте и при возврате вкладки/PWA из фона — если приложение
 * провисело открытым за полночь, дата в форме должна подхватить новый день, а не
 * оставаться вчерашней до случайного ручного обновления страницы.
 */
export function useFreshDate(refresh: () => void): void {
  onMounted(refresh)

  function onVisible() {
    if (document.visibilityState === 'visible') refresh()
  }

  document.addEventListener('visibilitychange', onVisible)
  onUnmounted(() => document.removeEventListener('visibilitychange', onVisible))
}
