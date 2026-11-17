<template>
  <span :class="$style.skeleton" aria-hidden="true" />
</template>

<style module>
/* Заглушка на время загрузки: размер задаёт родитель через class. */
.skeleton {
  display: block;
  min-height: var(--space-m);
  border-radius: var(--radius-s);
  background: linear-gradient(90deg, var(--bg-elevated) 25%, var(--bg-hover) 50%, var(--bg-elevated) 75%);
  background-color: var(--bg-elevated);
  background-size: 200% 100%;
  animation: shimmer var(--duration-shimmer) linear infinite;
}

@keyframes shimmer {
  from {
    background-position: 200% 0;
  }
  to {
    background-position: -200% 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .skeleton {
    animation: none;
  }
}
</style>
