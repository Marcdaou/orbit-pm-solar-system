export type Status = 'discuss' | 'progress' | 'ready' | 'testing' | 'done'
export type Priority = 'low' | 'med' | 'high'

export interface Member {
  id: string
  name: string
  color: string
  initials: string
}

export interface Sprint {
  id: string
  name: string
  goal: string
  startDate: string
  endDate: string
}

export interface Subtask {
  id: string
  title: string
  done: boolean
}

/** One entry per status the task entered, oldest first */
export interface StatusChange {
  status: Status
  at: number
}

export interface Task {
  id: string
  sprintId: string
  title: string
  description: string
  status: Status
  assigneeId: string | null
  priority: Priority
  createdAt: number
  completedAt?: number
  /** Optional deadline, YYYY-MM-DD */
  dueDate?: string
  subtasks: Subtask[]
  history: StatusChange[]
}
