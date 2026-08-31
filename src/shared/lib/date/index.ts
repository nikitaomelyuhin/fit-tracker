import dayjs from 'dayjs'

/** Сегодняшняя дата в формате YYYY-MM-DD (для input[type=date] и БД). */
export function todayISO(): string {
  return dayjs().format('YYYY-MM-DD')
}

/** Человеческий формат DD.MM.YYYY. */
export function formatHuman(date: string): string {
  return dayjs(date).format('DD.MM.YYYY')
}

/** Прибавить дни к дате (ISO). */
export function addDays(dateISO: string, days: number): string {
  return dayjs(dateISO).add(days, 'day').format('YYYY-MM-DD')
}

/** Число дней между датами (to - from). */
export function daysBetween(fromISO: string, toISO: string): number {
  return dayjs(toISO).diff(dayjs(fromISO), 'day')
}

/** ISO-дата среды, с которой начинается неделя, содержащая указанную дату (неделя: среда → вторник). */
export function weekStartFor(dateISO: string): string {
  const d = dayjs(dateISO)
  const offset = (d.day() - 3 + 7) % 7 // 3 = среда
  return d.subtract(offset, 'day').format('YYYY-MM-DD')
}

/** ISO-дата среды текущей недели. */
export function currentWeekStartISO(): string {
  return weekStartFor(todayISO())
}
