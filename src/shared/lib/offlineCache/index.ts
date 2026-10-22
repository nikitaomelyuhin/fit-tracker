/**
 * Локальная копия данных в localStorage — чтобы приложение открывалось и
 * показывало последние данные без интернета (например, в зале).
 */
const PREFIX = 'fit-tracker:cache:'

export function readCache<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

export function writeCache<T>(key: string, value: T): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value))
  } catch {
    // Переполнение/запрет хранилища — кэш необязателен, работаем без него.
  }
}

/** Стереть все локальные копии (при выходе из аккаунта). */
export function clearCache(): void {
  try {
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith(PREFIX)) localStorage.removeItem(key)
    }
  } catch {
    // нет доступа к хранилищу — нечего и чистить
  }
}
