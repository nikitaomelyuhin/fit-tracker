<template>
  <div :class="$style.dashboard">
    <div
      v-if="pull.distance.value > 0 || pull.refreshing.value"
      :class="$style.pullIndicator"
      :style="{ height: pull.distance.value + 'px' }"
    >
      <span
        :class="[$style.spinner, $style.pullSpinner, pull.refreshing.value && $style.spinning]"
        :style="{ transform: `rotate(${pull.distance.value * 4}deg)`, opacity: Math.min(1, pull.distance.value / pull.threshold) }"
      />
    </div>
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
            <BaseButton variant="ghost" :disabled="sync.loading" @click="sync.loadAll()">
              {{ sync.loading ? 'Обновляю…' : '⟳ Обновить' }}
            </BaseButton>
            <BaseButton variant="ghost" @click="onSignOut">Выйти</BaseButton>
          </div>
        </header>

        <div v-if="sync.loading && sync.loadedOnce" :class="$style.refreshBar" />

        <div v-if="sync.error" :class="$style.errorBanner">
          <span>{{ sync.error }}</span>
          <BaseButton variant="ghost" :disabled="sync.loading" @click="sync.loadAll()">Повторить</BaseButton>
        </div>

        <div v-if="!sync.loadedOnce" :class="$style.loader">
          <span :class="$style.spinner" />
          Загружаю данные…
        </div>

        <template v-else>
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

            <template v-else-if="activeTab === 'workouts'">
              <BaseCard title="Записать тренировку" :class="$style.wide">
                <WorkoutSessionForm />
              </BaseCard>
              <BaseCard title="История тренировок" :class="$style.wide">
                <WorkoutHistory />
              </BaseCard>
            </template>

            <template v-else-if="activeTab === 'nutrition'">
              <div :class="[$style.subTabs, $style.wide]">
                <button
                  v-for="view in nutritionViews"
                  :key="view.key"
                  type="button"
                  :class="[$style.subTab, nutritionView === view.key && $style.subTabActive]"
                  @click="nutritionView = view.key"
                >
                  {{ view.label }}
                </button>
              </div>

              <template v-if="nutritionView === 'diary'">
                <BaseCard title="Записать приём пищи" :class="$style.wide">
                  <AddDiaryEntryForm />
                </BaseCard>
                <BaseCard title="Рацион" :class="$style.wide">
                  <DiaryHistory />
                </BaseCard>
                <BaseCard title="Читмил" :class="$style.wide">
                  <MarkCheatDayForm />
                </BaseCard>
              </template>

              <BaseCard v-else title="База продуктов" :class="$style.wide">
                <ManageProductsPanel />
              </BaseCard>
            </template>

            <template v-else-if="activeTab === 'photos'">
              <BaseCard title="Ориентир" :class="$style.wide">
                <img :src="referenceImgSrc" alt="Ориентир по прогрессу" :class="$style.referenceImg" />
              </BaseCard>
              <BaseCard title="Добавить фото">
                <AddProgressPhotoForm />
              </BaseCard>
              <BaseCard title="История фото" :class="$style.wide">
                <PhotoHistory />
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
              <BaseCard title="Динамика веса" :class="$style.wide">
                <WeightTrendChart />
              </BaseCard>
              <BaseCard title="Календарь веса" :class="$style.wide">
                <WeightHeatmap />
              </BaseCard>
              <BaseCard title="Идеальный темп vs текущий" :class="$style.wide">
                <PaceForecast />
              </BaseCard>

              <p :class="$style.sectionTitle">Питание</p>
              <BaseCard title="Ккал по дням" :class="$style.wide">
                <CalorieTrend />
              </BaseCard>
            </template>
          </div>
        </template>
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
import { computed, defineAsyncComponent, onMounted, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSessionStore } from '@/entities/Session'
import { AddWeightForm } from '@/features/AddWeightEntry'
import { WorkoutSessionForm } from '@/features/LogWorkoutSession'
import { ExportReportButton } from '@/features/ExportReport'
import { AddDiaryEntryForm } from '@/features/AddDiaryEntry'
import { ManageProductsPanel } from '@/features/ManageProducts'
import { AddProgressPhotoForm } from '@/features/AddProgressPhoto'
import { MarkCheatDayForm } from '@/features/MarkCheatDay'
import { PhotoHistory } from '@/widgets/PhotoHistory'
import { WeightHistory } from '@/widgets/WeightHistory'
import { WeightGoal } from '@/widgets/WeightGoal'
import { WorkoutHistory } from '@/widgets/WorkoutHistory'
import { DashboardSummary } from '@/widgets/DashboardSummary'
import { ProgressSummary } from '@/widgets/ProgressSummary'
import { WeeklyComparison } from '@/widgets/WeeklyComparison'
import { DiaryHistory } from '@/widgets/DiaryHistory'
import { WeightHeatmap } from '@/widgets/WeightHeatmap'
import { BaseButton, BaseCard } from '@/shared/ui'
import { usePullToRefresh } from '@/shared/lib/pullToRefresh'
import { useDashboardSyncStore } from '../../model/store'

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

type TabKey = 'weight' | 'workouts' | 'nutrition' | 'photos' | 'analytics'

const tabs: { key: TabKey; label: string; icon: string }[] = [
  { key: 'weight', label: 'Вес', icon: '⚖️' },
  { key: 'workouts', label: 'Тренировки', icon: '🏋️' },
  { key: 'nutrition', label: 'Питание', icon: '🍽️' },
  { key: 'photos', label: 'Фото', icon: '📸' },
  { key: 'analytics', label: 'Аналитика', icon: '📊' },
]

const route = useRoute()
const router = useRouter()
const activeTab = computed<TabKey>(() => (route.params.tab as TabKey) || 'weight')

function selectTab(tab: TabKey) {
  router.push({ name: 'dashboard', params: { tab } })
}

// Абсолютный путь «/…» на GitHub Pages ломается: сайт живёт в подпапке /fit-tracker/.
const referenceImgSrc = `${import.meta.env.BASE_URL}progress-reference.webp`

const session = useSessionStore()
const sync = useDashboardSyncStore()

// На телефоне кнопки «Обновить» нет — обновление свайпом вниз от верха страницы.
const pull = usePullToRefresh(() => sync.loadAll())

type NutritionView = 'diary' | 'products'
const nutritionViews: { key: NutritionView; label: string }[] = [
  { key: 'diary', label: 'Рацион' },
  { key: 'products', label: 'Продукты' },
]
const nutritionView = ref<NutritionView>('diary')

// Вернулся во вкладку/приложение или появилась сеть — подтягиваем свежие данные
// (например, внесённые с телефона), без ручного обновления страницы.
function onVisible() {
  if (document.visibilityState === 'visible') void sync.refreshIfStale()
}
function onOnline() {
  void sync.refreshIfStale()
}

onMounted(() => {
  void sync.loadAll()
  document.addEventListener('visibilitychange', onVisible)
  window.addEventListener('online', onOnline)
})

onUnmounted(() => {
  document.removeEventListener('visibilitychange', onVisible)
  window.removeEventListener('online', onOnline)
})

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

.loader {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-m);
  min-height: 50vh;
  color: var(--text-secondary);
  font-size: var(--font-size-m);
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--border);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.pullIndicator {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  overflow: hidden;
  padding-bottom: var(--space-s);
}

.pullSpinner {
  width: 24px;
  height: 24px;
  animation: none;
}

.spinning {
  animation: spin 0.8s linear infinite;
}

.subTabs {
  display: flex;
  gap: var(--space-xs);
  padding: var(--space-xs);
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-m);
}

.subTab {
  flex: 1;
  padding: var(--space-s) var(--space-m);
  background: transparent;
  border: none;
  border-radius: var(--radius-s);
  color: var(--text-secondary);
  font-size: var(--font-size-m);
  font-weight: 600;
}

.subTabActive {
  background: var(--accent);
  color: var(--accent-contrast);
}

.refreshBar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  z-index: 30;
  background: linear-gradient(90deg, transparent, var(--accent), transparent);
  background-size: 50% 100%;
  background-repeat: no-repeat;
  animation: refresh-slide 1s linear infinite;
}

@keyframes refresh-slide {
  from {
    background-position: -50% 0;
  }
  to {
    background-position: 150% 0;
  }
}

.errorBanner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-m);
  flex-wrap: wrap;
  padding: var(--space-s) var(--space-m);
  background: var(--bg-elevated);
  border-left: 3px solid var(--danger);
  border-radius: var(--radius-m);
  color: var(--text-primary);
  font-size: var(--font-size-m);
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

.referenceImg {
  display: block;
  width: 100%;
  max-width: 100%;
  border-radius: var(--radius-m);
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

  /* На телефоне отчёт, выход и «Обновить» не нужны — обновление свайпом вниз. */
  .actions {
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
