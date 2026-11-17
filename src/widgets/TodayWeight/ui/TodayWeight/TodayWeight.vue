<template>
  <div :class="$style.weight">
    <div v-if="store.todayEntry" :class="$style.logged">
      <span :class="$style.value">{{ store.todayEntry.weight }}<span :class="$style.unit">кг</span></span>
      <span :class="$style.done"><AppIcon name="check" /> записан сегодня</span>
    </div>
    <template v-else>
      <BaseButton @click="emit('log')">
        <AppIcon name="plus" />
        Записать вес
      </BaseButton>
      <span v-if="store.latest" :class="$style.muted">
        последний: {{ store.latest.weight }} кг · {{ relativeDayLabel(store.latest.date).toLowerCase() }}
      </span>
    </template>

    <dl :class="$style.facts">
      <div :class="$style.fact">
        <dt>Среднее за неделю</dt>
        <dd>
          {{ store.weekAverage != null ? `${store.weekAverage} кг` : '—' }}
          <span v-if="deltaText" :class="[$style.delta, $style[deltaTone]]">{{ deltaText }}</span>
        </dd>
      </div>
      <div :class="$style.fact">
        <dt>ПП-стрик</dt>
        <dd>
          <AppIcon name="flame" :class="$style.flame" />
          {{ store.streak }} дн.
          <span :class="$style.muted">· рекорд {{ store.bestStreak }}</span>
        </dd>
      </div>
    </dl>

    <button v-if="store.todayEntry" type="button" :class="$style.edit" @click="emit('log')">
      Изменить
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { AppIcon, BaseButton } from '@/shared/ui'
import { relativeDayLabel } from '@/shared/lib/date'
import { useTodayWeightStore } from '../../model/store'

const emit = defineEmits<{ log: [] }>()

const store = useTodayWeightStore()

/** Изменение недели к неделе; шум меньше 0,05 кг не красим. */
const deltaText = computed(() => {
  const delta = store.weekDelta
  if (delta == null) return ''
  const abs = Math.abs(delta).toFixed(1)
  return delta < 0 ? `−${abs}` : `+${abs}`
})

const deltaTone = computed(() => {
  const delta = store.weekDelta
  if (delta == null || Math.abs(delta) < 0.05) return 'muted'
  return delta < 0 ? 'good' : 'warn'
})
</script>

<style module>
.weight {
  display: flex;
  flex-direction: column;
  gap: var(--space-m);
}

.logged {
  display: flex;
  flex-direction: column;
  gap: var(--space-2xs);
}

.value {
  font-size: var(--font-size-xl);
  font-weight: 700;
  line-height: 1.1;
  color: var(--text-primary);
}

.unit {
  margin-left: var(--space-xs);
  font-size: var(--font-size-m);
  font-weight: 600;
  color: var(--text-secondary);
}

.done {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
  font-size: var(--font-size-s);
  color: var(--success);
}

.muted {
  font-size: var(--font-size-s);
  color: var(--text-muted);
}

.facts {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-m);
}

.fact dt {
  font-size: var(--font-size-xs);
  color: var(--text-muted);
}

.fact dd {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: var(--space-xs);
  font-size: var(--font-size-m);
  font-weight: 600;
  color: var(--text-primary);
}

.delta {
  font-size: var(--font-size-s);
}

.good {
  color: var(--success);
}

.warn {
  color: var(--warning);
}

.flame {
  align-self: center;
  color: var(--warning);
}

.edit {
  align-self: flex-start;
  padding: 0;
  background: transparent;
  border: none;
  color: var(--accent);
  font-size: var(--font-size-s);
  font-weight: 600;
}
</style>
