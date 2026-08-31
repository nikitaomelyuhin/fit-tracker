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
  border: 1px solid transparent;
  border-radius: var(--radius-m);
  font-size: var(--font-size-m);
  font-weight: 600;
  transition: opacity 0.15s ease, background 0.15s ease;
}

.button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.primary {
  background: var(--accent);
  color: var(--accent-contrast);
}

.ghost {
  background: transparent;
  border-color: var(--border);
  color: var(--text-secondary);
}

.danger {
  background: transparent;
  border-color: transparent;
  color: var(--danger);
  padding: var(--space-xs) var(--space-s);
}
</style>
