/** Читает значение дизайн-токена (CSS-переменной) для использования в JS (например, в ECharts). */
export function cssToken(name: string, fallback = ''): string {
  if (typeof window === 'undefined') return fallback
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return value || fallback
}
