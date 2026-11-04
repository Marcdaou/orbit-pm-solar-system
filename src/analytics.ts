import type { Member, Sprint, Status, Task } from './types'

export const DAY = 86400000
const startOf = (d: string) => new Date(d + 'T00:00:00').getTime()

export interface BurndownPoint {
  /** day index from sprint start (0 = start) */
  day: number
  label: string
  /** remaining open tasks at the end of that day; null for days in the future */
  remaining: number | null
  ideal: number
}

/** Remaining = tasks that existed by the end of the day and weren't done yet. */
export function burndown(sprint: Sprint, tasks: Task[], now = Date.now()): BurndownPoint[] {
  const start = startOf(sprint.startDate)
  const end = startOf(sprint.endDate)
  if (!(end > start)) return []
  const days = Math.round((end - start) / DAY)
  const st = tasks.filter((t) => t.sprintId === sprint.id)
  const scope = st.length
  const pts: BurndownPoint[] = []
  for (let i = 0; i <= days; i++) {
    const cutoff = start + (i + 1) * DAY
    const inFuture = start + i * DAY > now
    const remaining = inFuture
      ? null
      : st.filter((t) => Math.min(t.createdAt, start) < cutoff && !(t.completedAt && t.completedAt < cutoff)).length
    pts.push({
      day: i,
      label: new Date(start + i * DAY).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      remaining,
      ideal: scope * (1 - i / days),
    })
  }
  return pts
}

export interface MemberCount {
  member: Member | null
  count: number
}

export function completedPerMember(sprintId: string, tasks: Task[], members: Member[]): MemberCount[] {
  const done = tasks.filter((t) => t.sprintId === sprintId && t.status === 'done')
  const rows: MemberCount[] = members.map((m) => ({ member: m, count: done.filter((t) => t.assigneeId === m.id).length }))
  const unassigned = done.filter((t) => !t.assigneeId || !members.some((m) => m.id === t.assigneeId)).length
  if (unassigned) rows.push({ member: null, count: unassigned })
  return rows.sort((a, b) => b.count - a.count)
}

/** Mean created → done duration (ms) over completed tasks, or null if none. */
export function avgCycleTime(tasks: Task[]): number | null {
  const done = tasks.filter((t) => t.status === 'done' && t.completedAt)
  if (!done.length) return null
  return done.reduce((s, t) => s + (t.completedAt! - t.createdAt), 0) / done.length
}

export interface Velocity {
  sprint: Sprint
  completed: number
  scope: number
}

export function velocity(sprints: Sprint[], tasks: Task[]): Velocity[] {
  return [...sprints]
    .sort((a, b) => a.startDate.localeCompare(b.startDate))
    .map((s) => {
      const st = tasks.filter((t) => t.sprintId === s.id)
      return { sprint: s, scope: st.length, completed: st.filter((t) => t.status === 'done').length }
    })
}

/** Average time (ms) a task spent on each ring, from status history. Open stints count up to `now`. */
export function timePerRing(tasks: Task[], now = Date.now()): Record<Exclude<Status, 'done'>, number | null> {
  const total: Record<string, number> = {}
  const n: Record<string, number> = {}
  for (const t of tasks) {
    const h = t.history ?? []
    h.forEach((c, i) => {
      if (c.status === 'done') return
      const until = h[i + 1]?.at ?? now
      total[c.status] = (total[c.status] ?? 0) + Math.max(0, until - c.at)
      n[c.status] = (n[c.status] ?? 0) + 1
    })
  }
  const avg = (s: string) => (n[s] ? total[s] / n[s] : null)
  return { discuss: avg('discuss'), progress: avg('progress'), ready: avg('ready'), testing: avg('testing') }
}

export function fmtDuration(ms: number | null): string {
  if (ms == null) return '—'
  const h = ms / 3600000
  if (h < 1) return `${Math.max(1, Math.round(ms / 60000))}m`
  if (h < 48) return `${h.toFixed(h < 10 ? 1 : 0)}h`
  return `${(h / 24).toFixed(1)}d`
}
