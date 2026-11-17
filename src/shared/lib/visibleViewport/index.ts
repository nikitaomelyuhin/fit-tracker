import { onScopeDispose, ref, watch, type Ref } from 'vue'

/**
 * Видимая часть экрана — то, что не закрыто экранной клавиатурой.
 *
 * В iOS клавиатура не уменьшает окно: элемент с `position: fixed; bottom: 0`
 * остаётся под ней, а Safari вместо этого сдвигает страницу вверх, чтобы показать
 * поле в фокусе. Где реально видимая область, знает только `visualViewport`:
 * `top` — её сдвиг от верха окна, `height` — высота. Это координаты для fixed-элемента,
 * который должен стоять ровно в видимой части. Без поддержки API — null.
 */
export function useVisibleViewport(active: Ref<boolean>) {
  const top = ref<number | null>(null)
  const height = ref<number | null>(null)

  function update() {
    const viewport = window.visualViewport
    if (!viewport) return
    top.value = Math.round(viewport.offsetTop)
    height.value = Math.round(viewport.height)
  }

  function subscribe(on: boolean) {
    const viewport = typeof window !== 'undefined' ? window.visualViewport : null
    if (!viewport) return
    if (on) {
      viewport.addEventListener('resize', update)
      viewport.addEventListener('scroll', update)
      update()
    } else {
      viewport.removeEventListener('resize', update)
      viewport.removeEventListener('scroll', update)
      top.value = null
      height.value = null
    }
  }

  watch(active, subscribe, { immediate: true })
  onScopeDispose(() => subscribe(false))

  return { top, height }
}
