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

const MONTHS_GENITIVE = [
  'января',
  'февраля',
  'марта',
  'апреля',
  'мая',
  'июня',
  'июля',
  'августа',
  'сентября',
  'октября',
  'ноября',
  'декабря',
]

const WEEKDAYS = ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота']

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

/** «Сегодня» / «Вчера» / «Завтра», иначе «30 авг» — для чипов дат в формах. */
export function relativeDayLabel(dateISO: string): string {
  const diff = daysBetween(todayISO(), dateISO)
  if (diff === 0) return 'Сегодня'
  if (diff === -1) return 'Вчера'
  if (diff === 1) return 'Завтра'
  return formatHuman(dateISO)
}

/** Полная дата с днём недели: «вторник, 17 ноября». */
export function formatLongWithWeekday(dateISO: string): string {
  const d = dayjs(dateISO)
  return `${WEEKDAYS[d.day()]}, ${d.date()} ${MONTHS_GENITIVE[d.month()]}`
}
