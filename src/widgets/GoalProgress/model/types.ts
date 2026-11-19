/** Куда идёт вес: down — уходит, up — растёт, flat — на месте. */
export type RateTone = 'down' | 'up' | 'flat'

/** main — основная отметка (и цель), minor — промежуточная «для интереса». */
export type MilestoneKind = 'main' | 'minor'

export interface MilestonePoint {
  weight: number
  kind: MilestoneKind
}

export interface GoalMilestone {
  weight: number
  kind: MilestoneKind
  reached: boolean
  /** % жира на этом весе: у пройденных — оценка на тот день, у остальных — прогноз; null — оценки нет. */
  bodyFatPct: number | null
  /** Ожидаемая дата по текущему темпу — только для непройденных отметок; null — темп не считается. */
  expectedDate: string | null
}
