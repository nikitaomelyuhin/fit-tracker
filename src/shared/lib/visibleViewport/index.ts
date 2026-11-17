import { onScopeDispose, ref, watch, type Ref } from 'vue'

/**
 * Видимая часть экрана с учётом экранной клавиатуры.
 *
 * В iOS клавиатура не уменьшает окно: элемент с `position: fixed; bottom: 0`
 * остаётся под ней, а Safari вместо этого сдвигает всю страницу вверх, чтобы
 * показать поле в фокусе, — верх шторки уезжает за экран, и прокрутить к нему
 * нельзя. Реально видимую область знает только `visualViewport`.
 *
 * `keyboardInset` — на сколько поднять низ fixed-элемента, чтобы он стоял ровно
 * над клавиатурой (учитывает и сдвиг страницы); `visibleHeight` — высота
 * видимой области. Пока клавиатуры нет — 0 и null.
 */
export function useVisibleViewport(active: Ref<boolean>) {
  const keyboardInset = ref(0)
  const visibleHeight = ref<number | null>(null)

  function update() {
    const viewport = window.visualViewport
    if (!viewport) return
    const inset = Math.max(0, Math.round(window.innerHeight - viewport.height - viewport.offsetTop))
    keyboardInset.value = inset
    visibleHeight.value = inset > 0 ? Math.round(viewport.height) : null
  }

  function reset() {
    keyboardInset.value = 0
    visibleHeight.value = null
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
      reset()
    }
  }

  watch(active, subscribe, { immediate: true })
  onScopeDispose(() => subscribe(false))

  return { keyboardInset, visibleHeight }
}
