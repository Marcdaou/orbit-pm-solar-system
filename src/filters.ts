import type { Member, Priority, Status, Task } from './types'

/** Sentinel id used in `assignees` for tasks with no assignee. */
export const UNASSIGNED = '__none__'

export interface TaskFilters {
  query: string
  assignees: string[]
  priorities: Priority[]
  statuses: Status[]
}

export const EMPTY_FILTERS: TaskFilters = { query: '', assignees: [], priorities: [], statuses: [] }

export const isFiltering = (f: TaskFilters) =>
  f.query.trim() !== '' || f.assignees.length > 0 || f.priorities.length > 0 || f.statuses.length > 0

/** AND across categories, OR within a category. Query matches title, description or assignee name. */
export function matchesFilters(t: Task, f: TaskFilters, members: Member[]): boolean {
  if (f.assignees.length && !f.assignees.includes(t.assigneeId ?? UNASSIGNED)) return false
  if (f.priorities.length && !f.priorities.includes(t.priority)) return false
  if (f.statuses.length && !f.statuses.includes(t.status)) return false
  const q = f.query.trim().toLowerCase()
  if (q) {
    const name = members.find((m) => m.id === t.assigneeId)?.name ?? ''
    if (![t.title, t.description, name].some((s) => s.toLowerCase().includes(q))) return false
  }
  return true
}

export const toggleIn = <T,>(arr: T[], v: T): T[] => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v])
