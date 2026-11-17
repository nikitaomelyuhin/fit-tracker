import { readonly, ref } from 'vue'
import { todayISO } from '@/shared/lib/date'

const current = ref(todayISO())

function refresh() {
  const value = todayISO()
  if (value !== current.value) current.value = value
}

// PWA может висеть открытым через полночь: «сегодня» обновляется при возврате
// в приложение и раз в минуту, а всё, что от него зависит, пересчитывается само.
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') refresh()
  })
  setInterval(refresh, 60_000)
}

/** Реактивная сегодняшняя дата (YYYY-MM-DD). */
export const today = readonly(current)
