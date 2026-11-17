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
      <DashboardSidebar :tabs="DASHBOARD_TABS" :active="activeTab" @select="selectTab" />

      <div :class="$style.main">
        <DashboardHeader :title="activeTabLabel" @sign-out="onSignOut" />

        <div v-if="sync.loading && sync.loadedOnce" :class="$style.refreshBar" />

        <div v-if="sync.error" :class="$style.errorBanner">
          <span>{{ sync.error }}</span>
          <BaseButton variant="ghost" :disabled="sync.loading" @click="sync.loadAll()">Повторить</BaseButton>
        </div>

        <!-- Первая загрузка: силуэт экрана вместо крутилки — видно, что и где появится. -->
        <div v-if="!sync.loadedOnce" :class="$style.content" aria-busy="true" aria-label="Загрузка">
          <BaseSkeleton :class="[$style.skeletonCard, $style.wide]" />
          <BaseSkeleton :class="$style.skeletonCard" />
          <BaseSkeleton :class="$style.skeletonCard" />
        </div>

        <Transition v-else :enter-active-class="$style.tabEnterActive" mode="out-in">
          <div :key="activeTab" :class="$style.content">
            <template v-if="activeTab === 'today'">
              <p :class="$style.todayDate">{{ todayTitle }}</p>
              <BaseCard title="Питание" :class="$style.wide">
                <TodayNutrition @add="sheets.openFood($event)" />
              </BaseCard>
              <BaseCard title="Вес">
                <TodayWeight @log="sheets.openWeight()" />
              </BaseCard>
              <BaseCard title="Тренировка">
                <TodayWorkout @log="selectTab('workouts')" />
              </BaseCard>
            </template>

            <template v-else-if="activeTab === 'nutrition'">
              <BaseSegmented
                v-model="nutritionView"
                :options="NUTRITION_VIEWS"
                aria-label="Раздел питания"
                :class="$style.wide"
              />

              <template v-if="nutritionView === 'diary'">
                <BaseButton :class="$style.wide" @click="sheets.openFood()">
                  <AppIcon name="plus" />
                  Добавить еду
                </BaseButton>
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

            <template v-else-if="activeTab === 'workouts'">
              <BaseCard title="Записать тренировку" :class="$style.wide">
                <WorkoutSessionForm />
              </BaseCard>
              <BaseCard title="История тренировок" :class="$style.wide">
                <WorkoutHistory />
              </BaseCard>
            </template>

            <template v-else-if="activeTab === 'progress'">
              <p :class="$style.sectionTitle">Вес</p>
              <BaseCard title="Путь к цели">
                <GoalProgress />
              </BaseCard>
              <BaseCard title="Неделя к неделе">
                <WeeklyComparison />
              </BaseCard>
              <BaseCard title="Динамика веса" :class="$style.wide">
                <WeightTrendChart />
              </BaseCard>
              <BaseCard title="Темп: факт и идеал" :class="$style.wide">
                <PaceForecast />
              </BaseCard>
              <BaseCard title="Взвешивания" :class="$style.wide">
                <WeightHistory />
              </BaseCard>

              <p :class="$style.sectionTitle">Питание</p>
              <BaseCard title="Ккал по дням" :class="$style.wide">
                <CalorieTrend />
              </BaseCard>
            </template>

            <template v-else-if="activeTab === 'photos'">
              <BaseCard title="Ориентир" :class="$style.wide">
                <ProgressReferenceView />
              </BaseCard>
              <BaseCard title="Добавить фото">
                <AddProgressPhotoForm />
              </BaseCard>
              <BaseCard title="История фото" :class="$style.wide">
                <PhotoHistory />
              </BaseCard>
            </template>
          </div>
        </Transition>
      </div>
    </div>

    <DashboardBottomNav :tabs="DASHBOARD_TABS" :active="activeTab" @select="selectTab" />

    <BaseSheet :open="sheets.active === 'weight'" title="Вес" @close="sheets.close()">
      <AddWeightForm @saved="sheets.close()" />
    </BaseSheet>
    <BaseSheet :open="sheets.active === 'food'" title="Еда" @close="sheets.close()">
      <AddDiaryEntryForm @saved="sheets.close()" />
    </BaseSheet>
  </div>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent, onMounted, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSessionStore } from '@/entities/Session'
import { AddWeightForm } from '@/features/AddWeightEntry'
import { WorkoutSessionForm } from '@/features/LogWorkoutSession'
import { AddDiaryEntryForm } from '@/features/AddDiaryEntry'
import { ManageProductsPanel } from '@/features/ManageProducts'
import { AddProgressPhotoForm } from '@/features/AddProgressPhoto'
import { MarkCheatDayForm } from '@/features/MarkCheatDay'
import { ProgressReferenceView } from '@/features/ProgressReference'
import { PhotoHistory } from '@/widgets/PhotoHistory'
import { WeightHistory } from '@/widgets/WeightHistory'
import { GoalProgress } from '@/widgets/GoalProgress'
import { WorkoutHistory } from '@/widgets/WorkoutHistory'
import { WeeklyComparison } from '@/widgets/WeeklyComparison'
import { DiaryHistory } from '@/widgets/DiaryHistory'
import { TodayNutrition } from '@/widgets/TodayNutrition'
import { TodayWeight } from '@/widgets/TodayWeight'
import { TodayWorkout } from '@/widgets/TodayWorkout'
import { AppIcon, BaseButton, BaseCard, BaseSegmented, BaseSheet, BaseSkeleton } from '@/shared/ui'
import { usePullToRefresh } from '@/shared/lib/pullToRefresh'
import { formatLongWithWeekday } from '@/shared/lib/date'
import { today } from '@/shared/lib/today'
import { useDashboardSyncStore } from '../../model/store'
import { useDashboardSheetsStore } from '../../model/sheets'
import type { DashboardTabKey, NutritionView } from '../../model/types'
import { DASHBOARD_TABS, NUTRITION_VIEWS } from '../../config/tabs'
import DashboardSidebar from '../DashboardSidebar/DashboardSidebar.vue'
import DashboardHeader from '../DashboardHeader/DashboardHeader.vue'
import DashboardBottomNav from '../DashboardBottomNav/DashboardBottomNav.vue'

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

const route = useRoute()
const router = useRouter()
const activeTab = computed<DashboardTabKey>(
  () => (route.params.tab as DashboardTabKey) || 'today',
)
const activeTabLabel = computed(
  () => DASHBOARD_TABS.find((tab) => tab.key === activeTab.value)?.label ?? 'Fit Tracker',
)

function selectTab(tab: DashboardTabKey) {
  router.push({ name: 'dashboard', params: { tab } })
}

/** «Вторник, 17 ноября» — шапка экрана «Сегодня». */
const todayTitle = computed(() => {
  const text = formatLongWithWeekday(today.value)
  return text.charAt(0).toUpperCase() + text.slice(1)
})

const session = useSessionStore()
const sync = useDashboardSyncStore()
const sheets = useDashboardSheetsStore()

// На телефоне кнопки «Обновить» нет — обновление свайпом вниз от верха страницы.
const pull = usePullToRefresh(() => sync.loadAll())

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
  max-width: var(--layout-max-width);
  margin: 0 auto;
  padding: var(--space-l);
}

.shell {
  display: flex;
  align-items: flex-start;
  gap: var(--space-l);
}

.main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-l);
}

.spinner {
  width: var(--spinner-size-l);
  height: var(--spinner-size-l);
  border: var(--spinner-stroke) solid var(--border);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin var(--duration-spin) linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.pull-indicator {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  overflow: hidden;
  padding-bottom: var(--space-s);
}

.pull-spinner {
  width: var(--spinner-size-m);
  height: var(--spinner-size-m);
  animation: none;
}

.spinning {
  animation: spin var(--duration-spin) linear infinite;
}

/* Подвкладки — сегментированный переключатель, как в iOS. */
.refresh-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: var(--border-width-accent);
  z-index: var(--z-progress);
  background: linear-gradient(90deg, transparent, var(--accent), transparent);
  background-size: 50% 100%;
  background-repeat: no-repeat;
  animation: refresh-slide var(--duration-loop) linear infinite;
}

@keyframes refresh-slide {
  from {
    background-position: -50% 0;
  }
  to {
    background-position: 150% 0;
  }
}

.error-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-m);
  flex-wrap: wrap;
  padding: var(--space-s) var(--space-m);
  background: var(--danger-soft);
  border-left: var(--border-width-accent) solid var(--danger);
  border-radius: var(--radius-m);
  color: var(--text-primary);
  font-size: var(--font-size-m);
}

.content {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(var(--card-min-width), 1fr));
  gap: var(--space-l);
  align-items: stretch;
}

/* Смена вкладки: контент мягко проявляется снизу вверх. */
.tab-enter-active {
  animation: tab-in var(--duration-base) var(--ease-out);
}

@keyframes tab-in {
  from {
    opacity: 0;
    transform: translateY(var(--space-s));
  }
}

@media (prefers-reduced-motion: reduce) {
  .tab-enter-active {
    animation: none;
  }
}

.wide {
  grid-column: 1 / -1;
}

.today-date {
  grid-column: 1 / -1;
  font-size: var(--font-size-l);
  font-weight: 700;
  color: var(--text-primary);
}

.skeleton-card {
  min-height: var(--skeleton-card-height);
  border-radius: var(--radius-l);
}

.section-title {
  grid-column: 1 / -1;
  font-size: var(--font-size-s);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--text-muted);
  margin-top: var(--space-m);
  padding-bottom: var(--space-xs);
  border-bottom: var(--border-width) solid var(--border);
}

.section-title:first-child {
  margin-top: 0;
}

@media (max-width: 860px) {
  .dashboard {
    padding-bottom: calc(var(--bottom-nav-height) + env(safe-area-inset-bottom));
  }
}

@media (max-width: 520px) {
  .dashboard {
    padding: var(--space-m);
    padding-bottom: calc(var(--bottom-nav-height) + env(safe-area-inset-bottom));
  }

  .main {
    gap: var(--space-m);
  }

  .content {
    grid-template-columns: 1fr;
    gap: var(--space-m);
  }
}
</style>
