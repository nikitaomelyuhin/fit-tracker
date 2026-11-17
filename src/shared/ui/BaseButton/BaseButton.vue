<template>
  <button :class="[$style.button, $style[variant]]" :type="type" :disabled="disabled">
    <slot />
  </button>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    variant?: 'primary' | 'ghost' | 'danger'
    type?: 'button' | 'submit'
    disabled?: boolean
  }>(),
  { variant: 'primary', type: 'button', disabled: false },
)
</script>

<style module>
.button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-xs);
  padding: var(--space-s) var(--space-m);
  border: var(--border-width) solid transparent;
  border-radius: var(--radius-m);
  font-size: var(--font-size-m);
  font-weight: 600;
  transition:
    background var(--duration-fast) var(--ease-out),
    border-color var(--duration-fast) var(--ease-out),
    color var(--duration-fast) var(--ease-out),
    filter var(--duration-fast) var(--ease-out),
    transform var(--duration-fast) var(--ease-out);
}

/* Нажатие чувствуется и на телефоне: кнопка чуть «проседает». */
.button:active:not(:disabled) {
  transform: scale(var(--press-scale));
}

.button:disabled {
  opacity: var(--opacity-disabled);
  cursor: not-allowed;
}

.primary {
  background: var(--accent);
  color: var(--accent-contrast);
}

.primary:active:not(:disabled) {
  filter: brightness(0.92);
}

.ghost {
  background: transparent;
  border-color: var(--border);
  color: var(--text-secondary);
}

.ghost:active:not(:disabled) {
  background: var(--bg-pressed);
}

.danger {
  background: transparent;
  border-color: transparent;
  color: var(--danger);
  padding: var(--space-xs) var(--space-s);
}

.danger:active:not(:disabled) {
  background: var(--danger-soft);
}

/* Наведение — только там, где есть мышь: на тач-экране hover «залипает» после тапа. */
@media (hover: hover) {
  .primary:hover:not(:disabled) {
    filter: brightness(1.08);
  }

  .ghost:hover:not(:disabled) {
    background: var(--bg-hover);
    color: var(--text-primary);
  }

  .danger:hover:not(:disabled) {
    background: var(--danger-soft);
  }
}
</style>
