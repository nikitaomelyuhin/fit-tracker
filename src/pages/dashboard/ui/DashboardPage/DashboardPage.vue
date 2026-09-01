<template>
  <div :class="$style.dashboard">
    <nav :class="$style.tabs">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        :class="[$style.tab, activeTab === tab.key && $style.active]"
        @click="selectTab(tab.key)"
      >
        {{ tab.label }}
      </button>
    </nav>

    <header :class="$style.header">
      <h1 :class="$style.brand">Fit Tracker</h1>
      <div :class="$style.actions">
        <BaseButton variant="ghost" @click="reloadAll">⟳ Обновить</BaseButton>
        <BaseButton variant="ghost" @click="onSignOut">Выйти</BaseButton>
      </div>
    </header>

    <DashboardSummary />

    <div :class="$style.content">
      <template v-if="activeTab === 'weight'">
        <BaseCard title="Записать вес">
          <AddWeightForm />
        </BaseCard>
        <BaseCard title="Цель">
          <WeightGoal />
        </BaseCard>
        <BaseCard title="Прогресс">
          <ProgressSummary />
        </BaseCard>
        <BaseCard title="Анализ">
          <Analysis />
        </BaseCard>
        <BaseCard title="Динамика веса">
          <WeightTrendChart />
        </BaseCard>
        <BaseCard title="Календарь веса">
          <WeightHeatmap />
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
        <BaseCard title="Жир и мышцы во времени">
          <BodyCompositionTrend />
        </BaseCard>
        <BaseCard title="Цели по замерам">
          <MeasurementTargets />
        </BaseCard>
        <BaseCard title="История замеров">
          <MeasurementHistory />
        </BaseCard>
      </template>

      <template v-else-if="activeTab === 'workouts'">
        <BaseCard title="Записать тренировку">
          <WorkoutSessionForm />
        </BaseCard>
        <BaseCard title="Прогрессия весов">
          <GymProgress />
        </BaseCard>
        <BaseCard title="История тренировок">
          <WorkoutHistory />
        </BaseCard>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSessionStore } from '@/entities/Session'
import { useWeightLogStore } from '@/entities/WeightLog'
import { useMeasurementStore } from '@/entities/Measurement'
import { useWorkoutStore } from '@/entities/Workout'
import { AddWeightForm } from '@/features/AddWeightEntry'
import { AddMeasurementForm } from '@/features/AddMeasurementEntry'
import { WorkoutSessionForm } from '@/features/LogWorkoutSession'
import { WeightHistory } from '@/widgets/WeightHistory'
import { WeightGoal } from '@/widgets/WeightGoal'
import { BodyComposition } from '@/widgets/BodyComposition'
import { MeasurementHistory } from '@/widgets/MeasurementHistory'
import { MeasurementTargets } from '@/widgets/MeasurementTargets'
import { WorkoutHistory } from '@/widgets/WorkoutHistory'
import { DashboardSummary } from '@/widgets/DashboardSummary'
import { ProgressSummary } from '@/widgets/ProgressSummary'
import { GymProgress } from '@/widgets/GymProgress'
import { Analysis } from '@/widgets/Analysis'
import { WeightHeatmap } from '@/widgets/WeightHeatmap'
import { BaseButton, BaseCard } from '@/shared/ui'

// Тяжёлые графики (echarts) грузим лениво — легче первый рендер на мобилках.
const WeightTrendChart = defineAsyncComponent(() =>
  import('@/widgets/WeightTrendChart').then((m) => m.WeightTrendChart),
)
const PaceForecast = defineAsyncComponent(() =>
  import('@/widgets/PaceForecast').then((m) => m.PaceForecast),
)
const BodyCompositionTrend = defineAsyncComponent(() =>
  import('@/widgets/BodyCompositionTrend').then((m) => m.BodyCompositionTrend),
)

type TabKey = 'weight' | 'measurements' | 'workouts'

const tabs: { key: TabKey; label: string }[] = [
  { key: 'weight', label: 'Вес' },
  { key: 'measurements', label: 'Замеры' },
  { key: 'workouts', label: 'Тренировки' },
]

const route = useRoute()
const router = useRouter()
const activeTab = computed<TabKey>(() => (route.params.tab as TabKey) || 'weight')

function selectTab(tab: TabKey) {
  router.push({ name: 'dashboard', params: { tab } })
}

const session = useSessionStore()
const weightLog = useWeightLogStore()
const measurements = useMeasurementStore()
const workouts = useWorkoutStore()

function reloadAll() {
  weightLog.load()
  measurements.load()
  workouts.load()
}

onMounted(reloadAll)

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
  gap: var(--space-m);
}

.actions {
  display: flex;
  gap: var(--space-s);
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
