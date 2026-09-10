<template>
  <div :class="$style.dashboard">
    <div :class="$style.shell">
      <aside :class="$style.sidebar">
        <div :class="$style.sidebarBrand">Fit Tracker</div>
        <nav :class="$style.sidebarNav">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            :class="[$style.navItem, activeTab === tab.key && $style.navItemActive]"
            @click="selectTab(tab.key)"
          >
            <span :class="$style.navIcon">{{ tab.icon }}</span>
            {{ tab.label }}
          </button>
        </nav>
      </aside>

      <div :class="$style.main">
        <header :class="$style.header">
          <h1 :class="$style.brand">Fit Tracker</h1>
          <div :class="$style.actions">
            <ExportReportButton />
            <BaseButton variant="ghost" @click="reloadPage">⟳ Обновить</BaseButton>
            <BaseButton variant="ghost" @click="onSignOut">Выйти</BaseButton>
          </div>
        </header>

        <DashboardSummary />

        <div :class="$style.content">
          <template v-if="activeTab === 'weight'">
            <BaseCard title="Записать вес">
              <AddWeightForm />
            </BaseCard>
            <BaseCard title="История" :class="$style.wide">
              <WeightHistory />
            </BaseCard>
          </template>

          <template v-else-if="activeTab === 'measurements'">
            <BaseCard title="Записать замеры">
              <AddMeasurementForm />
            </BaseCard>
            <BaseCard title="История замеров" :class="$style.wide">
              <MeasurementHistory />
            </BaseCard>
          </template>

          <template v-else-if="activeTab === 'workouts'">
            <BaseCard title="Записать тренировку" :class="$style.wide">
              <WorkoutSessionForm />
            </BaseCard>
            <BaseCard title="История тренировок" :class="$style.wide">
              <WorkoutHistory />
            </BaseCard>
          </template>

          <template v-else-if="activeTab === 'nutrition'">
            <BaseCard title="Записать приём пищи" :class="$style.wide">
              <AddDiaryEntryForm />
            </BaseCard>
            <BaseCard title="Рацион" :class="$style.wide">
              <DiaryHistory />
            </BaseCard>
            <BaseCard title="База продуктов" :class="$style.wide">
              <ManageProductsPanel />
            </BaseCard>
          </template>

          <template v-else-if="activeTab === 'analytics'">
            <p :class="$style.sectionTitle">Вес</p>
            <BaseCard title="Цель">
              <WeightGoal />
            </BaseCard>
            <BaseCard title="Прогресс">
              <ProgressSummary />
            </BaseCard>
            <BaseCard title="Неделя к неделе">
              <WeeklyComparison />
            </BaseCard>
            <BaseCard title="Анализ" :class="$style.wide">
              <Analysis />
            </BaseCard>
            <BaseCard title="Динамика веса" :class="$style.wide">
              <WeightTrendChart />
            </BaseCard>
            <BaseCard title="Календарь веса" :class="$style.wide">
              <WeightHeatmap />
            </BaseCard>
            <BaseCard title="Идеальный темп vs текущий" :class="$style.wide">
              <PaceForecast />
            </BaseCard>

            <p :class="$style.sectionTitle">Замеры</p>
            <BaseCard title="Состав тела">
              <BodyComposition />
            </BaseCard>
            <BaseCard title="Цели по замерам">
              <MeasurementTargets />
            </BaseCard>

            <p :class="$style.sectionTitle">Тренировки</p>
            <BaseCard title="Прогрессия весов" :class="$style.wide">
              <GymProgress />
            </BaseCard>

            <p :class="$style.sectionTitle">Питание</p>
            <BaseCard title="Ккал по дням" :class="$style.wide">
              <CalorieTrend />
            </BaseCard>
            <BaseCard title="Баланс" :class="$style.wide">
              <EnergyBalance />
            </BaseCard>
          </template>
        </div>
      </div>
    </div>

    <nav :class="$style.bottomNav">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        :class="[$style.bottomNavItem, activeTab === tab.key && $style.navItemActive]"
        @click="selectTab(tab.key)"
      >
        <span :class="$style.navIcon">{{ tab.icon }}</span>
        <span :class="$style.bottomNavLabel">{{ tab.label }}</span>
      </button>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSessionStore } from '@/entities/Session'
import { useWeightLogStore } from '@/entities/WeightLog'
import { useMeasurementStore } from '@/entities/Measurement'
import { useWorkoutStore } from '@/entities/Workout'
import { useProductStore } from '@/entities/Product'
import { useDiaryEntryStore } from '@/entities/DiaryEntry'
import { AddWeightForm } from '@/features/AddWeightEntry'
import { AddMeasurementForm } from '@/features/AddMeasurementEntry'
import { WorkoutSessionForm } from '@/features/LogWorkoutSession'
import { ExportReportButton, useExportReportStore } from '@/features/ExportReport'
import { AddDiaryEntryForm } from '@/features/AddDiaryEntry'
import { ManageProductsPanel } from '@/features/ManageProducts'
import { WeightHistory } from '@/widgets/WeightHistory'
import { WeightGoal } from '@/widgets/WeightGoal'
import { BodyComposition } from '@/widgets/BodyComposition'
import { MeasurementHistory } from '@/widgets/MeasurementHistory'
import { MeasurementTargets } from '@/widgets/MeasurementTargets'
import { WorkoutHistory } from '@/widgets/WorkoutHistory'
import { DashboardSummary } from '@/widgets/DashboardSummary'
import { ProgressSummary } from '@/widgets/ProgressSummary'
import { WeeklyComparison } from '@/widgets/WeeklyComparison'
import { GymProgress } from '@/widgets/GymProgress'
import { DiaryHistory } from '@/widgets/DiaryHistory'
import { EnergyBalance } from '@/widgets/EnergyBalance'
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
const CalorieTrend = defineAsyncComponent(() =>
  import('@/widgets/CalorieTrend').then((m) => m.CalorieTrend),
)

type TabKey = 'weight' | 'measurements' | 'workouts' | 'nutrition' | 'analytics'

const tabs: { key: TabKey; label: string; icon: string }[] = [
  { key: 'weight', label: 'Вес', icon: '⚖️' },
  { key: 'measurements', label: 'Замеры', icon: '📏' },
  { key: 'workouts', label: 'Тренировки', icon: '🏋️' },
  { key: 'nutrition', label: 'Питание', icon: '🍽️' },
  { key: 'analytics', label: 'Аналитика', icon: '📊' },
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
const products = useProductStore()
const diaryEntries = useDiaryEntryStore()
const exportReport = useExportReportStore()

async function loadAll() {
  await Promise.all([
    weightLog.load(),
    measurements.load(),
    workouts.load(),
    products.load(),
    diaryEntries.load(),
  ])
  // Тихий локальный бэкап раз в день — только когда данные точно загружены,
  // иначе первый в жизни бэкап мог бы сохраниться пустым.
  exportReport.autoBackupIfDue()
}

function reloadPage() {
  window.location.reload()
}

onMounted(loadAll)

async function onSignOut() {
  await session.signOut()
  router.push({ name: 'auth' })
}
</script>

<style module>
.dashboard {
  max-width: 1600px;
  margin: 0 auto;
  padding: var(--space-l);
}

.shell {
  display: flex;
  align-items: flex-start;
  gap: var(--space-l);
}

.sidebar {
  flex: 0 0 220px;
  position: sticky;
  top: var(--space-l);
  display: flex;
  flex-direction: column;
  gap: var(--space-m);
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-m);
  padding: var(--space-m);
}

.sidebarBrand {
  font-size: var(--font-size-l);
  font-weight: 700;
  color: var(--text-primary);
  padding: 0 var(--space-s);
}

.sidebarNav {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.navItem {
  display: flex;
  align-items: center;
  gap: var(--space-s);
  padding: var(--space-s) var(--space-m);
  background: transparent;
  border: none;
  border-radius: var(--radius-s);
  color: var(--text-secondary);
  font-size: var(--font-size-m);
  font-weight: 600;
  text-align: left;
}

.navIcon {
  font-size: 1.1em;
  line-height: 1;
}

.navItemActive {
  background: var(--accent);
  color: var(--accent-contrast);
}

.main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-l);
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-m);
  flex-wrap: wrap;
}

.actions {
  display: flex;
  gap: var(--space-s);
  flex-wrap: wrap;
}

.brand {
  font-size: var(--font-size-xl);
  color: var(--text-primary);
}

.content {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(360px, 1fr));
  gap: var(--space-l);
  align-items: stretch;
}

.wide {
  grid-column: 1 / -1;
}

.sectionTitle {
  grid-column: 1 / -1;
  font-size: var(--font-size-s);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--text-muted);
  margin-top: var(--space-m);
  padding-bottom: var(--space-xs);
  border-bottom: 1px solid var(--border);
}

.sectionTitle:first-child {
  margin-top: 0;
}

.bottomNav {
  display: none;
}

.bottomNavLabel {
  font-size: 10px;
}

@media (max-width: 860px) {
  .sidebar {
    display: none;
  }

  .dashboard {
    padding-bottom: calc(64px + env(safe-area-inset-bottom));
  }

  .bottomNav {
    display: flex;
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 20;
    background: var(--bg-surface);
    border-top: 1px solid var(--border);
    padding: var(--space-xs) var(--space-xs) calc(var(--space-xs) + env(safe-area-inset-bottom));
  }

  .bottomNavItem {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    padding: var(--space-xs);
    background: transparent;
    border: none;
    border-radius: var(--radius-s);
    color: var(--text-secondary);
  }
}

@media (max-width: 520px) {
  .dashboard {
    padding: var(--space-m);
    padding-bottom: calc(64px + env(safe-area-inset-bottom));
  }

  .content {
    grid-template-columns: 1fr;
  }
}
</style>
