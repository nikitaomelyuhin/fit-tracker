import { registerSW } from 'virtual:pwa-register'
import { useAddWeightStore } from '@/features/AddWeightEntry'
import { useAddDiaryEntryStore } from '@/features/AddDiaryEntry'
import { useLogWorkoutStore } from '@/features/LogWorkoutSession'
import { useManageProductsStore } from '@/features/ManageProducts'
import { useAddProgressPhotoStore } from '@/features/AddProgressPhoto'

/** Как часто перепроверять, можно ли уже применить скачанное обновление. */
const RETRY_MS = 5_000

/** Есть ли в какой-нибудь форме введённое, но не сохранённое. */
function hasUnsavedInput(): boolean {
  return [
    useAddWeightStore().isDirty,
    useAddDiaryEntryStore().isDirty,
    useLogWorkoutStore().isDirty,
    useManageProductsStore().isDirty,
    useAddProgressPhotoStore().isDirty,
  ].some(Boolean)
}

/**
 * Обновление приложения. Новая версия скачивается в фоне, но страница перезагружается
 * только когда во всех формах пусто — иначе обновление посреди записи тренировки стирало
 * бы введённое. Вызывать после установки Pinia.
 */
export function setupPwaUpdates(): void {
  let registration: ServiceWorkerRegistration | undefined
  let updateReady = false

  const updateSW = registerSW({
    immediate: true,
    onNeedRefresh: () => {
      updateReady = true
      tryApply()
    },
    onRegisteredSW: (_url, reg) => {
      registration = reg
    },
  })

  function tryApply() {
    if (!updateReady || hasUnsavedInput()) return
    updateReady = false
    void updateSW(true) // активирует новую версию и перезагружает страницу
  }

  // PWA-окно при возврате из фона не перезагружается, поэтому проверку обновления
  // досылаем сами. Без сети она просто падает — проверим в следующий раз.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') registration?.update().catch(() => {})
    tryApply()
  })
  setInterval(tryApply, RETRY_MS)
}
