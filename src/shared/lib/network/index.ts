/**
 * Ошибка из-за отсутствия/зависания сети (а не отказ сервера по существу).
 * Тексты отличаются по браузерам: Chrome — «Failed to fetch», Safari — «Load failed»,
 * Firefox — «NetworkError…», наш таймаут — «signal timed out».
 */
export function isOfflineError(message: string | null | undefined): boolean {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return true
  return /failed to fetch|load failed|networkerror|network request failed|timed out|timeout|aborted/i.test(
    message ?? '',
  )
}
