<template>
  <div :class="$style.picker">
    <label :class="$style.search">
      <AppIcon name="search" :class="$style.searchIcon" />
      <input
        :class="$style.searchInput"
        :value="picker.query"
        placeholder="Найти упражнение"
        inputmode="search"
        enterkeyhint="search"
        aria-label="Поиск упражнения"
        @input="picker.setQuery(($event.target as HTMLInputElement).value)"
      />
    </label>

    <BaseChips
      v-if="!searching"
      :model-value="picker.tab"
      :options="picker.tabs"
      aria-label="Группа упражнений"
      @update:model-value="picker.setTab($event)"
    />

    <template v-for="group in picker.groups" :key="group.key">
      <p v-if="group.title && group.options.length" :class="$style.groupTitle">{{ group.title }}</p>
      <ul v-if="group.options.length" :class="$style.options">
        <li v-for="option in group.options" :key="option.exercise.id">
          <button
            type="button"
            :class="[$style.option, option.inSession && $style.optionAdded]"
            :disabled="option.inSession"
            @click="picker.pick(option.exercise)"
          >
            <span :class="$style.optionText">
              <span :class="$style.optionName">{{ option.exercise.name }}</span>
              <span :class="$style.meta">
                {{ option.inSession ? 'уже в тренировке' : (option.lastSummary ?? 'ещё не делал') }}
              </span>
            </span>
            <AppIcon :name="option.inSession ? 'check' : 'plus'" :class="$style.optionIcon" />
          </button>
        </li>
      </ul>
    </template>

    <p v-if="picker.isEmpty" :class="$style.empty">
      {{ searching ? 'Такого упражнения пока нет' : 'В этой группе пока пусто' }}
    </p>

    <button type="button" :class="$style.create" @click="picker.startCreate()">
      <AppIcon name="plus" />
      {{ searching ? `Создать «${picker.query.trim()}»` : 'Новое упражнение' }}
    </button>

    <div :class="$style.footer">
      <BaseButton @click="picker.close()">
        Готово<template v-if="session.exercises.length"> · в тренировке {{ session.exercises.length }}</template>
      </BaseButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { AppIcon, BaseButton, BaseChips } from '@/shared/ui'
import { useExercisePickerStore } from '../../model/picker'
import { useLogWorkoutStore } from '../../model/store'

const picker = useExercisePickerStore()
const session = useLogWorkoutStore()

const searching = computed(() => picker.query.trim() !== '')
</script>

<style module>
.picker {
  display: flex;
  flex-direction: column;
  gap: var(--space-s);
}

.search {
  display: flex;
  align-items: center;
  gap: var(--space-s);
  min-height: var(--touch-target);
  padding: 0 var(--space-m);
  background: var(--bg-surface);
  border: var(--border-width) solid var(--border);
  border-radius: var(--radius-m);
  transition:
    border-color var(--duration-fast) var(--ease-out),
    box-shadow var(--duration-fast) var(--ease-out);
}

.search:focus-within {
  border-color: var(--accent);
  box-shadow: var(--focus-halo);
}

.search-icon {
  color: var(--text-muted);
}

.search-input {
  flex: 1;
  min-width: 0;
  padding: var(--space-s) 0;
  background: transparent;
  border: none;
  outline: none;
  font-size: var(--font-size-input);
  color: var(--text-primary);
}

.search-input::placeholder {
  color: var(--text-muted);
}

.group-title {
  margin-top: var(--space-xs);
  font-size: var(--font-size-xs);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--text-muted);
}

.options {
  list-style: none;
  display: flex;
  flex-direction: column;
}

.option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-s);
  width: 100%;
  min-height: var(--touch-target);
  padding: var(--space-s);
  background: transparent;
  border: none;
  border-radius: var(--radius-s);
  text-align: left;
  color: var(--text-primary);
  transition: background var(--duration-fast) var(--ease-out);
}

.option:active {
  background: var(--bg-pressed);
}

/* Уже добавленное не выключается целиком — видно, что оно в тренировке. */
.option-added {
  cursor: default;
}

.option-added .option-name {
  color: var(--text-secondary);
}

.option-text {
  display: flex;
  flex-direction: column;
  gap: var(--space-2xs);
  min-width: 0;
}

.option-name {
  font-size: var(--font-size-m);
}

.meta {
  font-size: var(--font-size-s);
  color: var(--text-muted);
}

.option-icon {
  flex-shrink: 0;
  color: var(--accent);
}

.option-added .option-icon {
  color: var(--success);
}

.empty {
  padding: var(--space-m) 0;
  font-size: var(--font-size-s);
  color: var(--text-muted);
  text-align: center;
}

.create {
  display: inline-flex;
  align-items: center;
  align-self: flex-start;
  gap: var(--space-xs);
  min-height: var(--touch-target);
  padding: 0 var(--space-xs);
  background: transparent;
  border: none;
  color: var(--accent);
  font-size: var(--font-size-s);
  font-weight: 600;
}

/* «Готово» прилипает к низу шторки, пока листаешь список. */
.footer {
  position: sticky;
  bottom: 0;
  display: flex;
  flex-direction: column;
  padding-top: var(--space-s);
  background: var(--bg-surface);
}

@media (hover: hover) {
  .option:not(.option-added):hover {
    background: var(--bg-hover);
  }
}
</style>
