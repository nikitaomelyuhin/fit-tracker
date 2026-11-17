import { describe, expect, it } from 'vitest'
import { milestonePoints } from './milestonePoints'

describe('milestonePoints', () => {
  it('добавляет мелкие отметки между основными, не дублируя их', () => {
    const points = milestonePoints([100, 95], 93, 1)
    expect(points).toEqual([
      { weight: 100, kind: 'main' },
      { weight: 99, kind: 'minor' },
      { weight: 98, kind: 'minor' },
      { weight: 97, kind: 'minor' },
      { weight: 96, kind: 'minor' },
      { weight: 95, kind: 'main' },
      { weight: 94, kind: 'minor' },
      { weight: 93, kind: 'main' },
    ])
  })

  it('без шага — только основные и цель', () => {
    expect(milestonePoints([100, 95], 90, 0).map((p) => p.weight)).toEqual([100, 95, 90])
  })
})
