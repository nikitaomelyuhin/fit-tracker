<template>
  <Teleport to="body">
    <Transition
      :enter-from-class="$style.fadeHidden"
      :leave-to-class="$style.fadeHidden"
      :enter-active-class="$style.fadeActive"
      :leave-active-class="$style.fadeActive"
    >
      <div v-if="open" :class="$style.overlay" @click.self="emit('close')" />
    </Transition>

    <Transition
      :enter-from-class="$style.frameHidden"
      :leave-to-class="$style.frameHidden"
      :enter-active-class="$style.frameActive"
      :leave-active-class="$style.frameActive"
    >
      <!-- Рамка = видимая часть экрана (над клавиатурой, если она открыта); шторка прижата к её низу. -->
      <div v-if="open" :class="$style.frame" :style="frameStyle">
        <section
          ref="panel"
          :class="[$style.panel, expanded && $style.panelExpanded, dragging && $style.panelDragging]"
          :style="dragOffset > 0 ? { transform: `translateY(${dragOffset}px)` } : undefined"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="titleId"
          @focusin="onFocusIn"
          @focusout="onFocusOut"
        >
          <header
            :class="$style.head"
            @pointerdown="onDragStart"
            @pointermove="onDragMove"
            @pointerup="onDragEnd"
            @pointercancel="onDragEnd"
          >
            <span :class="$style.handle" aria-hidden="true" />
            <h2 :id="titleId" :class="$style.title">{{ title }}</h2>
            <button type="button" :class="$style.close" aria-label="Закрыть" @click="emit('close')">
              <AppIcon name="close" />
            </button>
          </header>

          <div ref="body" :class="$style.body">
            <slot />
          </div>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, nextTick, onUnmounted, ref, toRef, useId, watch } from 'vue'
import { useVisibleViewport } from '@/shared/lib/visibleViewport'
import AppIcon from '../AppIcon/AppIcon.vue'

const props = defineProps<{
  open: boolean
  title: string
  /** Во всю видимую высоту — например, пока идёт поиск: поле сверху, список до клавиатуры. */
  expanded?: boolean
}>()
const emit = defineEmits<{ close: [] }>()

const titleId = useId()
const panel = ref<HTMLElement | null>(null)
const body = ref<HTMLElement | null>(null)

/* ---------- Клавиатура ---------- */

const viewport = useVisibleViewport(toRef(props, 'open'))

/** Поле ввода в фокусе — на телефоне это значит, что открыта клавиатура. */
const editing = ref(false)

const TEXT_ENTRY =
  'input:not([type=checkbox]):not([type=radio]):not([type=date]):not([type=file]):not([type=button]):not([type=submit]), textarea'

/**
 * Тап по пункту списка сначала снимает фокус с поля, и только потом приходит click.
 * Если шторка в этот момент поменяет размер, палец попадёт не туда — поэтому даём
 * событиям устояться.
 */
const BLUR_SETTLE_MS = 150
let blurTimer: ReturnType<typeof setTimeout> | undefined

function isTextEntry(element: Element | null): boolean {
  return element instanceof HTMLElement && element.matches(TEXT_ENTRY)
}

function onFocusIn(event: FocusEvent) {
  clearTimeout(blurTimer)
  editing.value = isTextEntry(event.target as Element)
}

function onFocusOut() {
  clearTimeout(blurTimer)
  blurTimer = setTimeout(() => {
    const active = document.activeElement
    editing.value = !!panel.value?.contains(active) && isTextEntry(active)
  }, BLUR_SETTLE_MS)
}

const frameStyle = computed(() => {
  const style: Record<string, string> = {}
  if (viewport.top.value != null) style['--viewport-top'] = `${viewport.top.value}px`
  if (viewport.height.value != null) style['--viewport-height'] = `${viewport.height.value}px`
  // Над клавиатурой отступ под home-индикатор не нужен — низ экрана занят ей.
  if (editing.value) style['--sheet-safe-bottom'] = '0px'
  return style
})

/**
 * Клавиатура выехала — шторка ужалась, и поле в фокусе могло оказаться ниже видимой
 * части. Прокручиваем его к середине, чтобы его не закрывал и липкий низ формы.
 */
function revealFocused() {
  const container = body.value
  const active = document.activeElement
  if (!container || !(active instanceof HTMLElement) || !container.contains(active)) return
  const box = container.getBoundingClientRect()
  const field = active.getBoundingClientRect()
  const comfortableBottom = box.top + box.height * (2 / 3)
  if (field.top >= box.top && field.bottom <= comfortableBottom) return
  container.scrollTop += field.top + field.height / 2 - (box.top + box.height / 2)
}

watch(
  () => viewport.height.value,
  () => {
    if (editing.value) nextTick(revealFocused)
  },
)

/* ---------- Свайп вниз ---------- */

/** Свайп вниз за шапку закрывает шторку — как в iOS. Порог — доля высоты шторки. */
const CLOSE_SHARE = 0.25
const dragging = ref(false)
const dragOffset = ref(0)
let startY = 0

/** Свайп только у нижней шторки; на компе это диалог по центру (см. стили, тот же брейкпоинт). */
const SHEET_MEDIA = '(max-width: 860px)'

function onDragStart(event: PointerEvent) {
  if ((event.target as HTMLElement).closest('button')) return
  if (!window.matchMedia(SHEET_MEDIA).matches) return
  dragging.value = true
  startY = event.clientY
  ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
}

function onDragMove(event: PointerEvent) {
  if (!dragging.value) return
  dragOffset.value = Math.max(0, event.clientY - startY)
}

function onDragEnd() {
  if (!dragging.value) return
  dragging.value = false
  const height = panel.value?.offsetHeight ?? 0
  if (height && dragOffset.value > height * CLOSE_SHARE) emit('close')
  dragOffset.value = 0
}

/* ---------- Открытие ---------- */

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') emit('close')
}

/** Пока шторка открыта, страница под ней не прокручивается. */
function lockPage(locked: boolean) {
  document.documentElement.style.overflow = locked ? 'hidden' : ''
  if (locked) document.addEventListener('keydown', onKeydown)
  else document.removeEventListener('keydown', onKeydown)
}

watch(
  () => props.open,
  (open) => {
    lockPage(open)
    if (!open) {
      clearTimeout(blurTimer)
      editing.value = false
    }
  },
  { immediate: true },
)

onUnmounted(() => {
  clearTimeout(blurTimer)
  lockPage(false)
})
</script>

<style module>
.overlay {
  position: fixed;
  inset: 0;
  z-index: var(--z-sheet);
  background: var(--overlay);
}

/*
 * Рамка повторяет видимую часть экрана (данные visualViewport, см. frameStyle):
 * с клавиатурой она кончается ровно над ней. Сама рамка прозрачна для нажатий —
 * тап выше шторки попадает в затемнение и закрывает её.
 */
.frame {
  /* Отступ под home-индикатор; с открытой клавиатурой обнуляется (см. frameStyle). */
  --sheet-safe-bottom: env(safe-area-inset-bottom);

  position: fixed;
  left: 0;
  right: 0;
  top: calc(var(--viewport-top, 0px) + var(--sheet-top-gap));
  height: calc(var(--viewport-height, 100dvh) - var(--sheet-top-gap));
  z-index: var(--z-sheet);
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  pointer-events: none;
}

.panel {
  display: flex;
  flex-direction: column;
  max-height: 100%;
  background: var(--bg-surface);
  border-top: var(--border-width) solid var(--border);
  border-radius: var(--radius-l) var(--radius-l) 0 0;
  box-shadow: var(--shadow-elevated);
  pointer-events: auto;
  transition: transform var(--duration-base) var(--ease-out);
}

.panel-expanded {
  height: 100%;
}

.panel-dragging {
  transition: none;
}

.head {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-m);
  padding: var(--space-l) var(--space-m) var(--space-s);
  touch-action: none;
  cursor: grab;
}

.handle {
  position: absolute;
  top: var(--space-s);
  left: 50%;
  width: var(--sheet-handle-width);
  height: var(--sheet-handle-height);
  border-radius: var(--sheet-handle-height);
  background: var(--border);
  transform: translateX(-50%);
}

.title {
  font-size: var(--font-size-l);
  font-weight: 700;
  color: var(--text-primary);
}

.close {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-xs);
  background: var(--bg-elevated);
  border: none;
  border-radius: 50%;
  color: var(--text-secondary);
  font-size: var(--font-size-m);
}

.close:active {
  background: var(--bg-pressed);
}

.body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: var(--space-s) var(--space-m) calc(var(--space-m) + var(--sheet-safe-bottom));
}

.fade-active {
  transition: opacity var(--duration-base) var(--ease-out);
}

.fade-hidden {
  opacity: 0;
}

.frame-active {
  transition: transform var(--duration-base) var(--ease-out);
}

.frame-hidden {
  transform: translateY(100%);
}

/* На компе — обычный диалог по центру, без свайпа. */
@media (min-width: 861px) {
  .frame {
    top: 0;
    height: 100dvh;
    align-items: center;
    justify-content: center;
    padding: var(--space-xl) var(--space-l);
  }

  .panel {
    width: min(var(--sheet-max-width), 100%);
    border: var(--border-width) solid var(--border);
    border-radius: var(--radius-l);
  }

  .panel-expanded {
    height: auto;
  }

  .frame-hidden {
    transform: translateY(var(--space-l));
    opacity: 0;
  }

  .frame-active {
    transition:
      transform var(--duration-base) var(--ease-out),
      opacity var(--duration-base) var(--ease-out);
  }

  .head {
    cursor: default;
    padding-top: var(--space-m);
  }

  .handle {
    display: none;
  }

  .body {
    padding-bottom: var(--space-l);
  }
}
</style>
