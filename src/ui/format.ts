export function formatDate(value: string, now = new Date()) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return value
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const date = new Date(year, month - 1, day)
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  )
    return value
  const prefix = year === now.getFullYear() ? '' : `${year} 年 `
  return `${prefix}${month} 月 ${day} 日（${'日一二三四五六'[date.getDay()]}）`
}
export function formatMonth(value: string) {
  const match = /^(\d{4})-(\d{2})$/.exec(value)
  if (!match || Number(match[2]) < 1 || Number(match[2]) > 12) return value
  return `${Number(match[1])} 年 ${Number(match[2])} 月`
}

export function formatDateTime(value: string, now = new Date()) {
  const date = new Date(value)
  if (!Number.isFinite(date.getTime())) return value
  const day = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  const time = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
  return `${formatDate(day, now)} ${time}`
}
