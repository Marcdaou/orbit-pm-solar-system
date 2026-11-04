import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Member, Priority, Sprint, Status, Subtask, Task } from './types'
import { MEMBER_COLORS } from './constants'

export const uid = () => Math.random().toString(36).slice(2, 10)
const initialsOf = (name: string) =>
  name.trim().split(/\s+/).map((p) => p[0]?.toUpperCase() ?? '').slice(0, 2).join('') || '?'

interface State {
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
  { id: 's1', name: 'Sprint 1 — Launch', goal: 'Ship the MVP to early users', startDate: iso(now), endDate: iso(now + 14 * day) },
  { id: 's2', name: 'Sprint 2 — Polish', goal: 'Performance and UX polish', startDate: iso(now + 14 * day), endDate: iso(now + 28 * day) },
]
const mk = (title: string, status: Status, assigneeId: string | null, priority: Priority, sprintId = 's1', dueInDays?: number, subs: [string, boolean][] = []): Task => ({
  id: uid(), sprintId, title, description: '', status, assigneeId, priority, createdAt: now,
  dueDate: dueInDays === undefined ? undefined : iso(now + dueInDays * day),
  completedAt: status === 'done' ? now : undefined,
  subtasks: subs.map(([title, done]) => ({ id: uid(), title, done })),
})
const seedTasks: Task[] = [
  mk('Define user personas', 'discuss', 'm1', 'med'),
  mk('Pricing page copy', 'discuss', 'm4', 'low'),
  mk('Pick analytics tool', 'discuss', null, 'low'),
  mk('Auth flow', 'progress', 'm2', 'high', 's1', 1, [['Login form', true], ['OAuth providers', true], ['Password reset', false], ['Session refresh', false]]),
  mk('Dashboard layout', 'progress', 'm3', 'med', 's1', 4, [['Grid system', true], ['Widgets', false]]),
  mk('Email notifications', 'progress', 'm5', 'med'),
  mk('Onboarding wizard', 'ready', 'm1', 'high', 's1', 10, [['Welcome step', true], ['Profile step', true], ['Invite team step', true]]),
  mk('Settings page', 'ready', 'm2', 'low'),
  mk('Payment integration', 'testing', 'm4', 'high', 's1', -2),
  mk('Landing page', 'testing', 'm3', 'med'),
  mk('Project setup', 'done', 'm5', 'low'),
  mk('Polish animations', 'discuss', 'm3', 'med', 's2'),
]

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      members: seedMembers,
      sprints: seedSprints,
      tasks: seedTasks,
      activeSprintId: 's1',

      setActiveSprint: (id) => set({ activeSprintId: id }),
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
        }
        set((st) => ({ tasks: [...st.tasks, task] }))
        return id
      },
      updateTask: (id, patch) =>
        set((st) => ({
          tasks: st.tasks.map((t) => {
            if (t.id !== id) return t
            const next = { ...t, ...patch }
            if (patch.status && patch.status !== t.status) next.completedAt = patch.status === 'done' ? Date.now() : undefined
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
    }),
    {
      name: 'orbit-pm-v1',
      version: 1,
      // v0 -> v1: tasks gained a `subtasks` checklist
      migrate: (persisted, version) => {
        const st = persisted as { tasks?: Task[] }
        if (version < 1 && st?.tasks) st.tasks = st.tasks.map((t) => ({ ...t, subtasks: t.subtasks ?? [] }))
        return st as State
      },
    },
  ),
)
