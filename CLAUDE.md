These rules are strict and must always be followed when generating or modifying code.

PROJECT
--------------------------------------------------
Fit Tracker — личное веб-приложение (SPA) для ежедневного ввода веса, замеров тела и тренировок.
Данные хранятся в Supabase (Postgres) и доступны с любого устройства. Установка как PWA.

Stack: Vue 3 (script setup, TS) + Vite + Pinia + vue-router + Supabase + ECharts (vue-echarts) + dayjs.

--------------------------------------------------
ARCHITECTURE (FSD)
--------------------------------------------------
Layers (top → bottom): app → pages → widgets → features → entities → shared

• A layer can import ONLY from lower layers
• Slices inside the same layer cannot import each other
Exceptions: entities, shared

Allowed:   features/AddWeight → entities/WeightLog
Forbidden: entities/WeightLog → features/AddWeight

--------------------------------------------------
PUBLIC API OF SLICES
--------------------------------------------------
All external imports go through the slice's index.ts.

Allowed:   import { WeightLog } from '@/entities/WeightLog'
Forbidden: import { useWeightStore } from '@/entities/WeightLog/model/store'

--------------------------------------------------
STORES (IMPORTANT)
--------------------------------------------------
All business logic lives in Pinia stores.
Store responsibilities: application state, form state, Supabase requests, business logic, side effects.
Components stay mostly presentational.

--------------------------------------------------
DATA / SUPABASE
--------------------------------------------------
• The Supabase CLIENT instance lives ONLY in shared/supabase (infrastructure).
• All queries (select/insert/update/delete) live INSIDE stores. Never in components, never in api/ folders.
• Do NOT create api/ folders.

Forbidden: entities/WeightLog/api/fetch.ts
Correct:   entities/WeightLog/model/store.ts  (calls supabase.from('weight_logs')...)

--------------------------------------------------
FORMS
--------------------------------------------------
Form values live in store state, not in component refs.

Forbidden (in component): const weight = ref('')
Correct:   weightStore.form.weight

--------------------------------------------------
TYPES
--------------------------------------------------
Types are defined separately: model/types.ts or shared/types/.
Exception: InitialState can stay inside the store.

--------------------------------------------------
UI STRUCTURE
--------------------------------------------------
UI components live inside a ui/ directory, each component in its OWN folder:

features/AddWeight/
  ui/
    AddWeightForm/
      AddWeightForm.vue
      AddWeightForm.module.css   (or <style module> inside the SFC)

Do NOT nest component folders inside component folders.
Decompose components that grow too large.

--------------------------------------------------
STYLING
--------------------------------------------------
CSS Modules only (<style module> or *.module.css). Usage: $style.container.
CSS classes: kebab-case (.home-page, .weight-form).

--------------------------------------------------
DESIGN TOKENS
--------------------------------------------------
Never hardcode colors / sizes. Use variables from app/styles/tokens.css:
var(--text-primary), var(--font-size-m), var(--bg-surface), var(--space-m), var(--radius-m).

--------------------------------------------------
NAMING
--------------------------------------------------
Domain-based names: AddWeightForm, MeasurementList, WorkoutRow, WeightTrendChart.
Not: FormBlock, BigList, InfoSection.

--------------------------------------------------
REVIEW CHECKLIST
--------------------------------------------------
• layer import rules
• public API via index.ts
• business logic + Supabase requests only in stores
• no api/ folders
• correct ui/ structure, one folder per component, no nesting
• CSS modules + design tokens (no hardcoded values)
• domain-based naming, component decomposition
If a rule is violated — propose refactoring.
