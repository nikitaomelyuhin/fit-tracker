<template>
  <div v-if="store.groupedByDateDesc.length" :class="$style.days">
    <div v-for="day in store.groupedByDateDesc" :key="day.date" :class="$style.day">
      <div :class="$style.dayHead">
        <span :class="$style.date">{{ formatHuman(day.date) }}</span>
        <span v-if="statsFor(day.date)" :class="$style.dayStats">
          {{ statsFor(day.date)!.weight }} кг
          <template v-if="statsFor(day.date)!.bodyFatPct != null">
            · {{ statsFor(day.date)!.bodyFatPct }}% жира
          </template>
        </span>
      </div>
      <div :class="$style.photos">
        <div v-for="photo in day.photos" :key="photo.id" :class="$style.photo">
          <a v-if="photo.url" :href="photo.url" target="_blank" rel="noopener">
            <img :src="photo.url" :alt="PHOTO_ANGLE_LABELS[photo.angle]" :class="$style.img" />
          </a>
          <div :class="$style.photoFoot">
            <span :class="$style.angle">{{ PHOTO_ANGLE_LABELS[photo.angle] }}</span>
            <BaseButton type="button" variant="danger" @click="onDelete(photo.id)">
              {{ pendingId === photo.id ? 'Удалить?' : '✕' }}
            </BaseButton>
          </div>
        </div>
      </div>
    </div>
  </div>
  <p v-else :class="$style.empty">Фото пока нет — добавь первое выше.</p>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useProgressPhotoStore } from '@/entities/ProgressPhoto'
import { useWeightLogStore } from '@/entities/WeightLog'
import { useDiaryEntryStore } from '@/entities/DiaryEntry'
import { PHOTO_ANGLE_LABELS } from '@/shared/config/photos'
import { DAILY_KCAL_TARGET } from '@/shared/config/pace'
import { estimateBodyFatPct } from '@/shared/lib/bodyFat'
import { BaseButton } from '@/shared/ui'
import { formatHuman } from '@/shared/lib/date'

const store = useProgressPhotoStore()
const weightLog = useWeightLogStore()
const diaryEntries = useDiaryEntryStore()
const pendingId = ref<string | null>(null)

const weightByDate = computed(() => new Map(weightLog.byDateAsc.map((w) => [w.date, w.weight])))
const kcalByDate = computed(() => new Map(diaryEntries.dailyKcalAsc.map((d) => [d.date, d.kcal])))
const fallbackKcal = computed(() => diaryEntries.effectiveDailyKcal(DAILY_KCAL_TARGET))

/** Вес и оценка % жира на дату фото — только если в этот день реально есть взвешивание. */
function statsFor(date: string): { weight: number; bodyFatPct: number | null } | null {
  const weight = weightByDate.value.get(date)
  if (weight == null) return null

  const start = weightLog.byDateAsc[0]
  const bodyFatPct = start
    ? estimateBodyFatPct({
        startDate: start.date,
        startWeight: start.weight,
        toDate: date,
        weightAtTarget: weight,
        weightAt: (d) => weightByDate.value.get(d) ?? null,
        kcalAt: (d) => kcalByDate.value.get(d) ?? null,
        fallbackKcal: fallbackKcal.value,
      })
    : null

  return { weight, bodyFatPct }
}

function onDelete(id: string) {
  if (pendingId.value === id) {
    store.remove(id)
    pendingId.value = null
  } else {
    pendingId.value = id
  }
}
</script>

<style module>
.days {
  display: flex;
  flex-direction: column;
  gap: var(--space-l);
}

.day {
  display: flex;
  flex-direction: column;
  gap: var(--space-s);
}

.dayHead {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-m);
  padding-bottom: var(--space-xs);
  border-bottom: 1px solid var(--border);
}

.date {
  font-weight: 700;
  font-size: var(--font-size-l);
  color: var(--text-primary);
}

.dayStats {
  font-size: var(--font-size-m);
  color: var(--text-secondary);
  white-space: nowrap;
}

.photos {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-m);
}

.photo {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  width: 160px;
}

.img {
  width: 100%;
  aspect-ratio: 3 / 4;
  object-fit: cover;
  border-radius: var(--radius-m);
  background: var(--bg-elevated);
}

.photoFoot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-s);
}

.angle {
  font-size: var(--font-size-s);
  color: var(--text-muted);
}

.empty {
  color: var(--text-muted);
  font-size: var(--font-size-m);
  text-align: center;
  padding: var(--space-l);
}
</style>
