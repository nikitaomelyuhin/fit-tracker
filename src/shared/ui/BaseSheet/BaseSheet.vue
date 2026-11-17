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
      :enter-from-class="$style.panelHidden"
      :leave-to-class="$style.panelHidden"
      :enter-active-class="$style.panelActive"
      :leave-active-class="$style.panelActive"
    >
      <section
        v-if="open"
        ref="panel"
        :class="[$style.panel, dragging && $style.panelDragging]"
        :style="dragOffset > 0 ? { transform: `translateY(${dragOffset}px)` } : undefined"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="titleId"
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

        <div :class="$style.body">
          <slot />
        </div>
      </section>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { onUnmounted, ref, useId, watch } from 'vue'
import AppIcon from '../AppIcon/AppIcon.vue'

const props = defineProps<{ open: boolean; title: string }>()
const emit = defineEmits<{ close: [] }>()

const titleId = useId()
const panel = ref<HTMLElement | null>(null)

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
  (open) => lockPage(open),
  { immediate: true },
)

onUnmounted(() => lockPage(false))
</script>

<style module>
.overlay {
  position: fixed;
  inset: 0;
  z-index: var(--z-sheet);
  background: var(--overlay);
}

.panel {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: var(--z-sheet);
  display: flex;
  flex-direction: column;
  max-height: var(--sheet-max-height);
  background: var(--bg-surface);
  border-top: var(--border-width) solid var(--border);
  border-radius: var(--radius-l) var(--radius-l) 0 0;
  box-shadow: var(--shadow-elevated);
  transition: transform var(--duration-base) var(--ease-out);
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
  padding: var(--space-s) var(--space-m) calc(var(--space-m) + env(safe-area-inset-bottom));
}

.fade-active {
  transition: opacity var(--duration-base) var(--ease-out);
}

.fade-hidden {
  opacity: 0;
}

.panel-active {
  transition: transform var(--duration-base) var(--ease-out);
}

.panel-hidden {
  transform: translateY(100%);
}

/* На компе — обычный диалог по центру, без свайпа. */
@media (min-width: 861px) {
  .panel {
    left: 50%;
    right: auto;
    bottom: auto;
    top: 50%;
    width: min(var(--sheet-max-width), calc(100vw - var(--space-l) * 2));
    max-height: calc(100dvh - var(--space-xl) * 2);
    border: var(--border-width) solid var(--border);
    border-radius: var(--radius-l);
    transform: translate(-50%, -50%);
  }

  .panel-hidden {
    transform: translate(-50%, -46%);
    opacity: 0;
  }

  .panel-active {
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
