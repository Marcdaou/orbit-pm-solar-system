import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Member, Priority, Sprint, Status, StatusChange, Subtask, Task } from './types'
import { MEMBER_COLORS } from './constants'

export const uid = () => Math.random().toString(36).slice(2, 10)
const initialsOf = (name: string) =>
  name.trim().split(/\s+/).map((p) => p[0]?.toUpperCase() ?? '').slice(0, 2).join('') || '?'

export interface Snapshot {
  members: Member[]
  sprints: Sprint[]
  tasks: Task[]
  activeSprintId: string | null
}

const HISTORY_LIMIT = 100

interface State {
  /** Undo/redo stacks of data snapshots. Not persisted (see partialize). */
  past: Snapshot[]
  future: Snapshot[]
  undo: () => void
  redo: () => void
  /** Replace all data (JSON import). Undoable. */
  replaceAll: (data: Snapshot) => void

  members: Member[]
  sprints: Sprint[]
  tasks: Task[]
  activeSprintId: string | null

  setActiveSprint: (id: string) => void
  addSprint: (s: Omit<Sprint, 'id'>) => string
  updateSprint: (id: string, patch: Partial<Omit<Sprint, 'id'>>) => void
  deleteSprint: (id: string) => void

  addTask: (t: { sprintId: string; title: string; description?: string; status?: Status; assigneeId?: string | null; priority?: Priority; dueDate?: string; subtasks?: Subtask[] }) => string
  updateTask: (id: string, patch: Partial<Omit<Task, 'id'>>) => void
  deleteTask: (id: string) => void
  moveTask: (id: string, status: Status) => void

  addMember: (name: string) => void
  removeMember: (id: string) => void
}

const day = 86400000
const iso = (t: number) => new Date(t).toISOString().slice(0, 10)
const now = Date.now()

const seedMembers: Member[] = [
  { id: 'm1', name: 'Ava Chen', initials: 'AC', color: MEMBER_COLORS[0] },
  { id: 'm2', name: 'Liam Novak', initials: 'LN', color: MEMBER_COLORS[1] },
  { id: 'm3', name: 'Sofia Reyes', initials: 'SR', color: MEMBER_COLORS[2] },
  { id: 'm4', name: 'Omar Haddad', initials: 'OH', color: MEMBER_COLORS[3] },
  { id: 'm5', name: 'Mia Park', initials: 'MP', color: MEMBER_COLORS[4] },
]
const seedSprints: Sprint[] = [
  { id: 's0', name: 'Sprint 0 — Foundations', goal: 'Repo, CI and design system', startDate: iso(now - 20 * day), endDate: iso(now - 6 * day) },
  { id: 's1', name: 'Sprint 1 — Launch', goal: 'Ship the MVP to early users', startDate: iso(now - 6 * day), endDate: iso(now + 8 * day) },
  { id: 's2', name: 'Sprint 2 — Polish', goal: 'Performance and UX polish', startDate: iso(now + 8 * day), endDate: iso(now + 22 * day) },
]
const ORDER: Status[] = ['discuss', 'progress', 'ready', 'testing', 'done']
/** Build a task whose history walks the rings in order, `daysPerStep` days per ring, starting `startDaysAgo` days ago */
const mk = (title: string, status: Status, assigneeId: string | null, priority: Priority, sprintId = 's1', startDaysAgo = 6, daysPerStep = 1, dueInDays?: number, subs: [string, boolean][] = []): Task => {
  const createdAt = now - startDaysAgo * day
  const history: StatusChange[] = ORDER.slice(0, ORDER.indexOf(status) + 1).map((st, i) => ({
    status: st,
    at: Math.min(now, createdAt + i * daysPerStep * day),
  }))
  return {
    id: uid(), sprintId, title, description: '', status, assigneeId, priority, createdAt,
    completedAt: status === 'done' ? history[history.length - 1].at : undefined,
    dueDate: dueInDays === undefined ? undefined : iso(now + dueInDays * day),
    subtasks: subs.map(([title, done]) => ({ id: uid(), title, done })),
    history,
  }
}
const seedTasks: Task[] = [
  mk('Repo & CI setup', 'done', 'm5', 'med', 's0', 20, 1),
  mk('Design tokens', 'done', 'm3', 'med', 's0', 19, 2),
  mk('Component library', 'done', 'm1', 'high', 's0', 18, 3),
  mk('Error tracking', 'done', 'm2', 'low', 's0', 16, 2),
  mk('Define user personas', 'discuss', 'm1', 'med'),
  mk('Pricing page copy', 'discuss', 'm4', 'low', 's1', 3),
  mk('Pick analytics tool', 'discuss', null, 'low', 's1', 1),
  mk('Auth flow', 'progress', 'm2', 'high', 's1', 6, 2, 1, [['Login form', true], ['OAuth providers', true], ['Password reset', false], ['Session refresh', false]]),
  mk('Dashboard layout', 'progress', 'm3', 'med', 's1', 5, 2, 4, [['Grid system', true], ['Widgets', false]]),
  mk('Email notifications', 'progress', 'm5', 'med', 's1', 4, 1),
  mk('Onboarding wizard', 'ready', 'm1', 'high', 's1', 6, 1.5, 7, [['Welcome step', true], ['Profile step', true], ['Invite team step', true]]),
  mk('Settings page', 'ready', 'm2', 'low', 's1', 5, 1),
  mk('Payment integration', 'testing', 'm4', 'high', 's1', 6, 1, -2),
  mk('Landing page', 'testing', 'm3', 'med', 's1', 6, 1.2),
  mk('Project setup', 'done', 'm5', 'low', 's1', 6, 0.5),
  mk('Marketing site SEO', 'done', 'm4', 'med', 's1', 6, 1),
  mk('Feature flags', 'done', 'm2', 'low', 's1', 5, 0.8),
  mk('Polish animations', 'discuss', 'm3', 'med', 's2', 0),
]

const snap = (st: Snapshot): Snapshot => ({
  members: st.members, sprints: st.sprints, tasks: st.tasks, activeSprintId: st.activeSprintId,
})
/** Backfill a history for tasks persisted before status tracking existed */
export const backfillHistory = (t: Omit<Task, 'history'> & { history?: StatusChange[] }): Task => {
  if (t.history?.length) return t as Task
  const history: StatusChange[] = [{ status: t.status === 'done' ? 'discuss' : t.status, at: t.createdAt }]
  if (t.status === 'done') history.push({ status: 'done', at: t.completedAt ?? t.createdAt })
  return { ...t, history }
}

export const useStore = create<State>()(
  persist(
    (rawSet, get) => {
      // Every data mutation goes through `set`, which first records an undo snapshot.
      // State is immutable, so a snapshot is just the current references.
      type Upd = Partial<State> | ((st: State) => Partial<State>)
      const set = (u: Upd) =>
        rawSet((st) => ({
          ...(typeof u === 'function' ? u(st) : u),
          past: [...st.past, snap(st)].slice(-HISTORY_LIMIT),
          future: [],
        }))
      return {
      past: [],
      future: [],
      undo: () =>
        rawSet((st) => {
          const prev = st.past[st.past.length - 1]
          if (!prev) return {}
          return { ...prev, past: st.past.slice(0, -1), future: [snap(st), ...st.future] }
        }),
      redo: () =>
        rawSet((st) => {
          const next = st.future[0]
          if (!next) return {}
          return { ...next, past: [...st.past, snap(st)], future: st.future.slice(1) }
        }),
      replaceAll: (data) => set(snap(data)),

      members: seedMembers,
      sprints: seedSprints,
      tasks: seedTasks,
      activeSprintId: 's1',

      setActiveSprint: (id) => rawSet({ activeSprintId: id }),
      addSprint: (s) => {
        const id = uid()
        set((st) => ({ sprints: [...st.sprints, { ...s, id }], activeSprintId: id }))
        return id
      },
      updateSprint: (id, patch) => set((st) => ({ sprints: st.sprints.map((s) => (s.id === id ? { ...s, ...patch } : s)) })),
      deleteSprint: (id) =>
        set((st) => {
          const sprints = st.sprints.filter((s) => s.id !== id)
          return {
            sprints,
            tasks: st.tasks.filter((t) => t.sprintId !== id),
            activeSprintId: st.activeSprintId === id ? sprints[0]?.id ?? null : st.activeSprintId,
          }
        }),

      addTask: (t) => {
        const id = uid()
        const status = t.status ?? 'discuss'
        const task: Task = {
          id, sprintId: t.sprintId, title: t.title, description: t.description ?? '', status,
          assigneeId: t.assigneeId ?? null, priority: t.priority ?? 'med', createdAt: Date.now(),
          completedAt: status === 'done' ? Date.now() : undefined,
          dueDate: t.dueDate || undefined,
          subtasks: t.subtasks ?? [],
          history: [{ status, at: Date.now() }],
        }
        set((st) => ({ tasks: [...st.tasks, task] }))
        return id
      },
      updateTask: (id, patch) =>
        set((st) => ({
          tasks: st.tasks.map((t) => {
            if (t.id !== id) return t
            const next = { ...t, ...patch, history: t.history }
            if (patch.status && patch.status !== t.status) {
              const at = Date.now()
              next.completedAt = patch.status === 'done' ? at : undefined
              next.history = [...(t.history ?? []), { status: patch.status, at }]
            }
            return next
          }),
        })),
      deleteTask: (id) => set((st) => ({ tasks: st.tasks.filter((t) => t.id !== id) })),
      moveTask: (id, status) => get().updateTask(id, { status }),

      addMember: (name) =>
        set((st) => ({
          members: [...st.members, { id: uid(), name: name.trim(), initials: initialsOf(name), color: MEMBER_COLORS[st.members.length % MEMBER_COLORS.length] }],
        })),
      removeMember: (id) =>
        set((st) => ({
          members: st.members.filter((m) => m.id !== id),
          tasks: st.tasks.map((t) => (t.assigneeId === id ? { ...t, assigneeId: null } : t)),
        })),
    }},
    {
      name: 'orbit-pm-v1',
      version: 2,
      partialize: ({ members, sprints, tasks, activeSprintId }) => ({ members, sprints, tasks, activeSprintId }),
      // v0 -> v1: tasks gained a `subtasks` checklist
      // v1 -> v2: tasks gained a status `history`; backfill it from createdAt/completedAt
      migrate: (persisted, version) => {
        const st = persisted as { tasks?: Task[] }
        if (version < 1 && st?.tasks) st.tasks = st.tasks.map((t) => ({ ...t, subtasks: t.subtasks ?? [] }))
        if (version < 2 && st?.tasks) st.tasks = st.tasks.map(backfillHistory)
        return st as State
      },
    },
  ),
)
