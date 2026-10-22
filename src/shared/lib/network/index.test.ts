import { describe, expect, it } from 'vitest'
import { isOfflineError } from './index'

describe('isOfflineError', () => {
  it('узнаёт сетевые ошибки разных браузеров и таймаут', () => {
    expect(isOfflineError('TypeError: Failed to fetch')).toBe(true)
    expect(isOfflineError('Load failed')).toBe(true)
    expect(isOfflineError('NetworkError when attempting to fetch resource.')).toBe(true)
    expect(isOfflineError('TimeoutError: signal timed out')).toBe(true)
  })

  it('отказ сервера по существу — не «нет сети»', () => {
    expect(isOfflineError('new row violates row-level security policy')).toBe(false)
    expect(isOfflineError(null)).toBe(false)
  })
})
