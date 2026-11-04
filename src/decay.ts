// Due-date "orbital decay" and sprint "sun dimming" helpers.
const DAY = 86400000

/** Days remaining until the end of the due date (local time). Negative = overdue. */
export function daysLeft(dueDate: string, now: number): number {
  const [y, m, d] = dueDate.split('-').map(Number)
  const end = new Date(y, m - 1, d, 23, 59, 59, 999).getTime()
  return (end - now) / DAY
}

/** Days before the deadline at which a planet starts to warm up. */
export const WARM_WINDOW_DAYS = 7

export interface Decay {
  /** 0 = cool / no deadline, 1 = due now */
  heat: number
  overdue: boolean
  days: number | null
}

export function taskDecay(dueDate: string | undefined, now: number): Decay {
  if (!dueDate) return { heat: 0, overdue: false, days: null }
  const days = daysLeft(dueDate, now)
  if (days < 0) return { heat: 1, overdue: true, days }
  return { heat: Math.max(0, Math.min(1, 1 - days / WARM_WINDOW_DAYS)), overdue: false, days }
}

/** Warm glow color: yellow → orange → red-orange as heat rises. */
export function heatColor(heat: number): string {
  const hue = 50 - heat * 40 // 50 (amber) → 10 (red-orange)
  return `hsl(${hue}, 100%, ${60 - heat * 8}%)`
}

export function dueLabel(dueDate: string, now: number): string {
  const d = daysLeft(dueDate, now)
  if (d < 0) {
    const n = Math.ceil(-d)
    return `Overdue by ${n} day${n === 1 ? '' : 's'}`
  }
  const n = Math.floor(d)
  if (n === 0) return 'Due today'
  if (n === 1) return 'Due tomorrow'
  return `Due in ${n} days`
}

/** Fraction of the sprint elapsed (0..1+, >1 means past its end). null if dates are invalid. */
export function sprintElapsed(startDate: string, endDate: string, now: number): number | null {
  const s = new Date(startDate + 'T00:00:00').getTime()
  const e = new Date(endDate + 'T23:59:59').getTime()
  if (!isFinite(s) || !isFinite(e) || e <= s) return null
  return Math.max(0, (now - s) / (e - s))
}
