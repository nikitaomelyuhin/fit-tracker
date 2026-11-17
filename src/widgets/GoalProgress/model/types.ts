export type PaceTone = 'good' | 'warn' | 'muted'

export interface PaceBand {
  label: string
  tone: PaceTone
}

export interface GoalMilestone {
  weight: number
  reached: boolean
  /** Ожидаемая дата по текущему темпу — только для непройденных отметок; null — темп не считается. */
  expectedDate: string | null
}
