import { reactive } from 'vue'
import { isOfflineError } from '@/shared/lib/network'

export type ToastTone = 'success' | 'error' | 'info'

export interface Toast {
  id: number
  text: string
  tone: ToastTone
  action?: { label: string; run: () => void }
}

const DEFAULT_DURATION_MS = 3000
const UNDO_DURATION_MS = 5000

export const toasts = reactive<Toast[]>([])
let nextId = 1

export function dismissToast(id: number): void {
  const index = toasts.findIndex((toast) => toast.id === id)
  if (index >= 0) toasts.splice(index, 1)
}

export function showToast(
  text: string,
  options: { tone?: ToastTone; action?: Toast['action']; durationMs?: number } = {},
): number {
  const id = nextId++
  toasts.push({ id, text, tone: options.tone ?? 'success', action: options.action })
  // Одновременно держим не больше трёх — старые вытесняются.
  while (toasts.length > 3) toasts.shift()
  setTimeout(() => dismissToast(id), options.durationMs ?? DEFAULT_DURATION_MS)
  return id
}

/** Тост об ошибке сохранения: без сети — понятным текстом, иначе с текстом ошибки. */
export function showSaveError(message: string | null | undefined): void {
  showToast(
    isOfflineError(message) ? 'Нет интернета — не сохранено' : `Не удалось сохранить: ${message ?? 'ошибка'}`,
    { tone: 'error', durationMs: 5000 },
  )
}

/** Отложенные удаления: если закрыть приложение, пока висит «Отменить», удаление всё равно выполнится. */
const pendingCommits = new Map<number, () => void>()

if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', () => {
    for (const commit of pendingCommits.values()) commit()
    pendingCommits.clear()
  })
}

/**
 * Удаление с отменой вместо «Удалить? → Удалить»: элемент сразу пропадает из UI,
 * 5 секунд висит «Отменить», и только потом удаляется на сервере. Если сервер
 * отказал — элемент возвращается и показывается ошибка.
 */
export function deleteWithUndo(options: {
  text: string
  /** Убрать локально (сразу). */
  apply: () => void
  /** Вернуть локально (отмена или ошибка сервера). */
  revert: () => void
  /** Удалить на сервере; false — не получилось. */
  commit: () => Promise<boolean>
}): void {
  options.apply()

  let done = false
  const id = nextId++
  const commitNow = () => {
    if (done) return
    done = true
    pendingCommits.delete(id)
    void options.commit().then((ok) => {
      if (!ok) {
        options.revert()
        showToast('Не удалось удалить', { tone: 'error' })
      }
    })
  }

  pendingCommits.set(id, commitNow)
  toasts.push({
    id,
    text: options.text,
    tone: 'info',
    action: {
      label: 'Отменить',
      run: () => {
        if (done) return
        done = true
        pendingCommits.delete(id)
        options.revert()
        dismissToast(id)
      },
    },
  })
  while (toasts.length > 3) toasts.shift()
  setTimeout(() => {
    dismissToast(id)
    commitNow()
  }, UNDO_DURATION_MS)
}
