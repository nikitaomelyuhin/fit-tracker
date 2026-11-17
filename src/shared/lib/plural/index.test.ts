import { describe, expect, it } from 'vitest'
import { pluralRu } from './index'

const DAYS: [string, string, string] = ['день', 'дня', 'дней']

describe('pluralRu', () => {
  it('склоняет по последней цифре и исключениям 11–14', () => {
    expect(pluralRu(1, DAYS)).toBe('день')
    expect(pluralRu(2, DAYS)).toBe('дня')
    expect(pluralRu(5, DAYS)).toBe('дней')
    expect(pluralRu(11, DAYS)).toBe('дней')
    expect(pluralRu(12, DAYS)).toBe('дней')
    expect(pluralRu(21, DAYS)).toBe('день')
    expect(pluralRu(24, DAYS)).toBe('дня')
    expect(pluralRu(0, DAYS)).toBe('дней')
  })
})
