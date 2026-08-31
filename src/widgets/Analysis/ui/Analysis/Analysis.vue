<template>
  <ul :class="$style.list">
    <li v-for="(finding, index) in findings" :key="index" :class="[$style.item, $style[finding.tone]]">
      <span :class="$style.icon">{{ finding.tone === 'warn' ? '⚠️' : 'ℹ️' }}</span>
      <p :class="$style.text">{{ finding.text }}</p>
    </li>
  </ul>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useWeightLogStore } from '@/entities/WeightLog'
import { useWorkoutStore } from '@/entities/Workout'
import { WORKOUT_TEMPLATES } from '@/shared/config/workouts'
import { todayISO, addDays, daysBetween } from '@/shared/lib/date'

interface Finding {
  tone: 'info' | 'warn'
  text: string
}

const weightLog = useWeightLogStore()
const workout = useWorkoutStore()

const assistNames = new Set(
  Object.values(WORKOUT_TEMPLATES)
    .flat()
    .filter((exercise) => exercise.assist)
    .map((exercise) => exercise.name),
)

/** Тренд веса за последние ~3 недели (кг/нед), по крайним точкам окна. */
const recentRateWeek = computed<number | null>(() => {
  const last = weightLog.byDateDesc[0]
  if (!last) return null
  const windowStart = addDays(last.date, -21)
  const items = weightLog.byDateAsc.filter((item) => item.date >= windowStart)
  if (items.length < 2) return null
  const recent = weightLog.currentWeekAverage ?? last.weight
  const days = daysBetween(items[0].date, last.date) || 1
  return ((recent - items[0].weight) / days) * 7
})

/** Силовые ползут вниз? (по основным упражнениям за ~5 недель) */
const strengthDeclining = computed(() => {
  const since = addDays(todayISO(), -35)
  const byExercise = new Map<string, { date: string; weight: number }[]>()
  for (const item of workout.items) {
    if (item.weight == null || item.date < since || assistNames.has(item.exercise)) continue
    const arr = byExercise.get(item.exercise) ?? []
    arr.push({ date: item.date, weight: item.weight })
    byExercise.set(item.exercise, arr)
  }
  let withData = 0
  let declining = 0
  for (const entries of byExercise.values()) {
    if (entries.length < 2) continue
    withData++
    entries.sort((a, b) => (a.date < b.date ? -1 : 1))
    if (entries[entries.length - 1].weight < entries[0].weight) declining++
  }
  return withData >= 3 && declining >= Math.ceil(withData / 2)
})

const workoutsLast21 = computed(
  () => workout.sessions.filter((session) => session.date >= addDays(todayISO(), -21)).length,
)

const findings = computed<Finding[]>(() => {
  const first = weightLog.byDateAsc[0]
  const last = weightLog.byDateDesc[0]
  if (!first || !last) {
    return [{ tone: 'info', text: 'Начни вести вес — анализ появится, когда накопится пара недель.' }]
  }

  const dataDays = daysBetween(first.date, last.date)
  if (dataDays < 18) {
    return [
      {
        tone: 'info',
        text: 'Данных меньше 3 недель — ранние колебания это вода и еда, не жир. Копи вес ежедневно, по темпу выводы позже.',
      },
    ]
  }

  const result: Finding[] = []
  const rate = recentRateWeek.value

  if (rate == null) {
    result.push({ tone: 'info', text: 'Мало взвешиваний за последние 3 недели — вбивай чаще, чтобы оценить темп.' })
  } else if (rate <= -1.0) {
    result.push({
      tone: 'warn',
      text: `Теряешь быстро (~${Math.abs(rate).toFixed(1)} кг/нед) — на сушке это риск для мышц. Чуть добавь калорий, держи белок и рабочие веса.`,
    })
  } else if (rate <= -0.4) {
    result.push({ tone: 'info', text: `Вес снижается (~${Math.abs(rate).toFixed(1)} кг/нед), в целевом коридоре — ничего не меняй.` })
  } else if (rate <= -0.15) {
    result.push({ tone: 'info', text: `Снижение медленное (~${Math.abs(rate).toFixed(1)} кг/нед). Хочешь быстрее — минус ~150–200 ккал или +1 кардио в неделю.` })
  } else if (rate < 0.15) {
    result.push({
      tone: 'warn',
      text: 'Вес стоит ~3 недели. Тренировки идут, значит дело в балансе калорий — вероятно вышел из дефицита. Урежь питание на ~150–250 ккал ИЛИ добавь кардио (проверь, не стало ли активности меньше, чем раньше).',
    })
  } else {
    result.push({
      tone: 'warn',
      text: `Вес растёт (~${rate.toFixed(1)} кг/нед) — почти точно калорий больше поддержки. Урежь питание и/или добавь кардио.`,
    })
  }

  if (workoutsLast21.value < 4) {
    result.push({
      tone: 'warn',
      text: `Тренировок за 3 недели мало (${workoutsLast21.value}). Для сохранения мышц на сушке держи 2 в неделю.`,
    })
  }

  if (strengthDeclining.value) {
    result.push({
      tone: 'warn',
      text: 'Рабочие веса ползут вниз — возможен слишком жёсткий дефицит или недосып. Добавь немного еды/сна, следи, чтобы силовые держались.',
    })
  }

  return result
})
</script>

<style module>
.list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: var(--space-s);
}

.item {
  display: flex;
  align-items: flex-start;
  gap: var(--space-s);
  padding: var(--space-s) var(--space-m);
  border-left: 3px solid var(--border);
  border-radius: var(--radius-s);
  background: var(--bg-elevated);
}

.info {
  border-left-color: var(--accent);
}

.warn {
  border-left-color: var(--warning);
}

.icon {
  line-height: 1.4;
}

.text {
  font-size: var(--font-size-m);
  color: var(--text-primary);
  line-height: 1.4;
}
</style>
