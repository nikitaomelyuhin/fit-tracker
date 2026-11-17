export type PaceTone = 'good' | 'warn' | 'muted'

export interface PaceBand {
  label: string
  tone: PaceTone
}

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
  /** Ожидаемая дата по текущему темпу — только для непройденных отметок; null — темп не считается. */
  expectedDate: string | null
}
