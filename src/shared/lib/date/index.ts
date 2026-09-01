import dayjs from 'dayjs'

const MONTHS_SHORT = [
  'янв',
  'фев',
  'мар',
  'апр',
  'мая',
  'июн',
  'июл',
  'авг',
  'сен',
  'окт',
  'ноя',
  'дек',
]

/** Сегодняшняя дата в формате YYYY-MM-DD (для input[type=date] и БД). */
export function todayISO(): string {
  return dayjs().format('YYYY-MM-DD')
}

/** Человеческий формат: «30 авг» (месяц текстом, без года). */
export function formatHuman(date: string): string {
  const d = dayjs(date)
  return `${d.date()} ${MONTHS_SHORT[d.month()]}`
}

/** Прибавить дни к дате (ISO). */
export function addDays(dateISO: string, days: number): string {
  return dayjs(dateISO).add(days, 'day').format('YYYY-MM-DD')
}

/** Число дней между датами (to - from). */
export function daysBetween(fromISO: string, toISO: string): number {
  return dayjs(toISO).diff(dayjs(fromISO), 'day')
}

/** ISO-дата среды, с которой начинается неделя, содержащая указанную дату (среда → вторник). */
export function weekStartFor(dateISO: string): string {
  const d = dayjs(dateISO)
  const offset = (d.day() - 3 + 7) % 7 // 3 = среда
  return d.subtract(offset, 'day').format('YYYY-MM-DD')
}

/** ISO-дата среды текущей недели. */
export function currentWeekStartISO(): string {
  return weekStartFor(todayISO())
}
