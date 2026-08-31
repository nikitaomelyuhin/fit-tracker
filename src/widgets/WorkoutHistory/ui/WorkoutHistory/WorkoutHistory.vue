<template>
  <div v-if="workouts.sessions.length" :class="$style.list">
    <section
      v-for="session in workouts.sessions"
      :key="session.date + (session.type ?? '')"
      :class="$style.session"
    >
      <div :class="$style.head">
        <span :class="$style.title">
          Тренировка {{ session.type ?? '?' }} · {{ formatHuman(session.date) }}
        </span>
        <BaseButton variant="danger" @click="onDelete(session.date, session.type)">
          {{ isPending(session.date, session.type) ? 'Удалить?' : '✕' }}
        </BaseButton>
      </div>
      <ul :class="$style.exercises">
        <li v-for="entry in session.entries" :key="entry.id" :class="$style.ex">
          <span :class="$style.exName">{{ entry.exercise }}</span>
          <span :class="$style.exVal">{{ summary(entry) }}</span>
          <span v-if="goal(entry)" :class="$style.exGoal">🎯 {{ goal(entry) }}</span>
        </li>
      </ul>
    </section>
  </div>
  <p v-else :class="$style.empty">Тренировок пока нет</p>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useWorkoutStore, type Workout, type WorkoutType } from '@/entities/Workout'
import { BaseButton } from '@/shared/ui'
import { formatHuman } from '@/shared/lib/date'

const workouts = useWorkoutStore()
const pendingKey = ref<string | null>(null)

function keyOf(date: string, type: WorkoutType | null): string {
  return `${date}|${type ?? ''}`
}

function isPending(date: string, type: WorkoutType | null): boolean {
  return pendingKey.value === keyOf(date, type)
}

function onDelete(date: string, type: WorkoutType | null) {
  const key = keyOf(date, type)
  if (pendingKey.value === key) {
    workouts.removeSession(date, type)
    pendingKey.value = null
  } else {
    pendingKey.value = key
  }
}

function summary(entry: Workout): string {
  const weight = entry.weight != null ? `${entry.weight}` : '—'
  const sets = entry.sets != null ? `${entry.sets}` : '—'
  const reps = entry.reps != null ? `${entry.reps}` : '—'
  return `${weight}×${sets}×${reps}`
}

function goal(entry: Workout): string | null {
  if (entry.nextWeight == null && entry.nextReps == null) return null
  const weight = entry.nextWeight != null ? `${entry.nextWeight}` : '—'
  const sets = entry.nextSets != null ? `${entry.nextSets}` : '—'
  const reps = entry.nextReps != null ? `${entry.nextReps}` : '—'
  return `→ ${weight}×${sets}×${reps}`
}
</script>

<style module>
.list {
  display: flex;
  flex-direction: column;
  gap: var(--space-m);
}

.session {
  display: flex;
  flex-direction: column;
  gap: var(--space-s);
  padding: var(--space-m);
  background: var(--bg-elevated);
  border-radius: var(--radius-m);
}

.head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.title {
  font-weight: 600;
  color: var(--text-primary);
}

.exercises {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.ex {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: var(--space-s);
}

.exName {
  color: var(--text-secondary);
  font-size: var(--font-size-m);
}

.exVal {
  color: var(--text-primary);
  font-weight: 600;
  font-size: var(--font-size-s);
}

.exGoal {
  color: var(--warning);
  font-size: var(--font-size-s);
}

.empty {
  color: var(--text-muted);
  font-size: var(--font-size-m);
  text-align: center;
  padding: var(--space-l);
}
</style>
