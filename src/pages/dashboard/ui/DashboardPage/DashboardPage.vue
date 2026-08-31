<template>
  <div :class="$style.dashboard">
    <header :class="$style.header">
      <h1 :class="$style.brand">Fit Tracker</h1>
      <BaseButton variant="ghost" @click="onSignOut">Выйти</BaseButton>
    </header>

    <nav :class="$style.tabs">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        :class="[$style.tab, activeTab === tab.key && $style.active]"
        @click="activeTab = tab.key"
      >
        {{ tab.label }}
      </button>
    </nav>

    <div :class="$style.content">
      <template v-if="activeTab === 'weight'">
        <BaseCard title="Записать вес">
          <AddWeightForm />
        </BaseCard>
        <BaseCard title="Цель">
          <WeightGoal />
        </BaseCard>
        <BaseCard title="Динамика веса">
          <WeightTrendChart />
        </BaseCard>
        <BaseCard title="Идеальный темп vs текущий">
          <PaceForecast />
        </BaseCard>
        <BaseCard title="История">
          <WeightHistory />
        </BaseCard>
      </template>

      <template v-else-if="activeTab === 'measurements'">
        <BaseCard title="Записать замеры">
          <AddMeasurementForm />
        </BaseCard>
        <BaseCard title="Состав тела">
          <BodyComposition />
        </BaseCard>
        <BaseCard title="Цели по замерам">
          <MeasurementTargets />
        </BaseCard>
        <BaseCard title="Динамика: талия и плечи">
          <MeasurementTrendChart />
        </BaseCard>
        <BaseCard title="История замеров">
          <MeasurementHistory />
        </BaseCard>
      </template>

      <template v-else-if="activeTab === 'workouts'">
        <BaseCard title="Записать тренировку">
          <WorkoutSessionForm />
        </BaseCard>
        <BaseCard title="История тренировок">
          <WorkoutHistory />
        </BaseCard>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useSessionStore } from '@/entities/Session'
import { useWeightLogStore } from '@/entities/WeightLog'
import { useMeasurementStore } from '@/entities/Measurement'
import { useWorkoutStore } from '@/entities/Workout'
import { AddWeightForm } from '@/features/AddWeightEntry'
import { AddMeasurementForm } from '@/features/AddMeasurementEntry'
import { WorkoutSessionForm } from '@/features/LogWorkoutSession'
import { WeightTrendChart } from '@/widgets/WeightTrendChart'
import { WeightHistory } from '@/widgets/WeightHistory'
import { WeightGoal } from '@/widgets/WeightGoal'
import { PaceForecast } from '@/widgets/PaceForecast'
import { BodyComposition } from '@/widgets/BodyComposition'
import { MeasurementTrendChart } from '@/widgets/MeasurementTrendChart'
import { MeasurementHistory } from '@/widgets/MeasurementHistory'
import { MeasurementTargets } from '@/widgets/MeasurementTargets'
import { WorkoutHistory } from '@/widgets/WorkoutHistory'
import { BaseButton, BaseCard } from '@/shared/ui'

type TabKey = 'weight' | 'measurements' | 'workouts'

const tabs: { key: TabKey; label: string }[] = [
  { key: 'weight', label: 'Вес' },
  { key: 'measurements', label: 'Замеры' },
  { key: 'workouts', label: 'Тренировки' },
]

const activeTab = ref<TabKey>('weight')

const session = useSessionStore()
const router = useRouter()
const weightLog = useWeightLogStore()
const measurements = useMeasurementStore()
const workouts = useWorkoutStore()

onMounted(() => {
  weightLog.load()
  measurements.load()
  workouts.load()
})

async function onSignOut() {
  await session.signOut()
  router.push({ name: 'auth' })
}
</script>

<style module>
.dashboard {
  max-width: 720px;
  margin: 0 auto;
  padding: var(--space-l);
  display: flex;
  flex-direction: column;
  gap: var(--space-l);
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.brand {
  font-size: var(--font-size-xl);
  color: var(--text-primary);
}

.tabs {
  display: flex;
  gap: var(--space-xs);
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-m);
  padding: var(--space-xs);
}

.tab {
  flex: 1;
  padding: var(--space-s) var(--space-m);
  background: transparent;
  border: none;
  border-radius: var(--radius-s);
  color: var(--text-secondary);
  font-size: var(--font-size-m);
  font-weight: 600;
}

.active {
  background: var(--accent);
  color: var(--accent-contrast);
}

.content {
  display: flex;
  flex-direction: column;
  gap: var(--space-l);
}
</style>
