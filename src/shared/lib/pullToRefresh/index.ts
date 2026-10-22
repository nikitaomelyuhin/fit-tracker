import { onMounted, onUnmounted, ref } from 'vue'

/** Насколько оттянуть (px), чтобы запустилось обновление. */
const THRESHOLD = 70
/** Сопротивление: экран едет медленнее пальца, как в нативных приложениях. */
const RESISTANCE = 0.5

/**
 * Обновление свайпом вниз от верха страницы (на телефоне вместо кнопки «Обновить»).
 * Возвращает, насколько сейчас оттянуто, и идёт ли обновление — для индикатора.
 */
export function usePullToRefresh(onRefresh: () => Promise<unknown>) {
  const distance = ref(0)
  const refreshing = ref(false)
  let startY: number | null = null

  function onStart(event: TouchEvent) {
    startY = window.scrollY <= 0 && !refreshing.value ? event.touches[0].clientY : null
  }

  function onMove(event: TouchEvent) {
    if (startY == null) return
    const delta = event.touches[0].clientY - startY
    distance.value = delta > 0 ? Math.min(delta * RESISTANCE, THRESHOLD * 1.5) : 0
  }

  async function onEnd() {
    if (startY == null) return
    startY = null
    if (distance.value < THRESHOLD) {
      distance.value = 0
      return
    }
    refreshing.value = true
    distance.value = THRESHOLD
    try {
      await onRefresh()
    } finally {
      refreshing.value = false
      distance.value = 0
    }
  }

  onMounted(() => {
    window.addEventListener('touchstart', onStart, { passive: true })
    window.addEventListener('touchmove', onMove, { passive: true })
    window.addEventListener('touchend', onEnd)
    window.addEventListener('touchcancel', onEnd)
  })

  onUnmounted(() => {
    window.removeEventListener('touchstart', onStart)
    window.removeEventListener('touchmove', onMove)
    window.removeEventListener('touchend', onEnd)
    window.removeEventListener('touchcancel', onEnd)
  })

  return { distance, refreshing, threshold: THRESHOLD }
}
