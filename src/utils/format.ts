/** 日期时间格式化工具 */

const pad = (n: number): string => String(n).padStart(2, '0')

/** 格式化为 YYYY-MM-DD */
export function formatDate(ts: number): string {
  const d = new Date(ts)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** 格式化为 HH:MM:SS */
export function formatClock(ts: number): string {
  const d = new Date(ts)
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

/** 人类友好的相对时间 */
export function formatRelative(ts: number): string {
  const diff = Date.now() - ts
  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour

  if (diff < minute) return '刚刚'
  if (diff < hour) return `${Math.floor(diff / minute)} 分钟前`
  if (diff < day) return `${Math.floor(diff / hour)} 小时前`
  if (diff < 2 * day) return '昨天'
  if (diff < 7 * day) return `${Math.floor(diff / day)} 天前`
  return formatDate(ts)
}
