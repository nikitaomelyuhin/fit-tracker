/**
 * Запрет масштабирования страницы, как в нативном приложении. iOS Safari игнорирует
 * user-scalable=no в meta viewport, поэтому щипок гасим ещё и на уровне жестов:
 * gesture* — нестандартные события Safari, двухпальцевый touchmove — на всякий случай.
 * Зум двойным тапом убирается в CSS (touch-action: manipulation в global.css).
 */
export function disablePageZoom(): void {
  const prevent = (event: Event) => event.preventDefault()
  document.addEventListener('gesturestart', prevent)
  document.addEventListener('gesturechange', prevent)
  document.addEventListener(
    'touchmove',
    (event: TouchEvent) => {
      if (event.touches.length > 1) event.preventDefault()
    },
    { passive: false },
  )
}
