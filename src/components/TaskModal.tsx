import { useEffect, useState } from 'react'
import { uid, useStore } from '../store'
import { PRIORITY_COLORS, STATUS_LABELS } from '../constants'
import type { Priority, Status, Subtask } from '../types'
import Modal, { dangerBtn, ghostBtn, inputCls, labelCls, primaryBtn } from './Modal'

interface Props {
  open: boolean
  taskId: string | null
  onClose: () => void
}

const PRIORITIES: Priority[] = ['low', 'med', 'high']
const PRIORITY_LABEL: Record<Priority, string> = { low: 'Low', med: 'Medium', high: 'High' }

export default function TaskModal({ open, taskId, onClose }: Props) {
  const { tasks, members, sprints, activeSprintId, addTask, updateTask, deleteTask } = useStore()
  const task = taskId ? tasks.find((t) => t.id === taskId) : undefined

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<Status>('discuss')
  const [assigneeId, setAssigneeId] = useState<string | null>(null)
  const [priority, setPriority] = useState<Priority>('med')
  const [sprintId, setSprintId] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [subtasks, setSubtasks] = useState<Subtask[]>([])
  const [newSub, setNewSub] = useState('')

  useEffect(() => {
    if (!open) return
    setConfirmDelete(false)
    setNewSub('')
    if (task) {
      setTitle(task.title)
      setDescription(task.description)
      setStatus(task.status)
      setAssigneeId(task.assigneeId)
      setPriority(task.priority)
      setSprintId(task.sprintId)
      setDueDate(task.dueDate ?? '')
      setSubtasks(task.subtasks ?? [])
    } else {
      setTitle('')
      setDescription('')
      setStatus('discuss')
      setAssigneeId(null)
      setPriority('med')
      setSprintId(activeSprintId ?? sprints[0]?.id ?? '')
      setDueDate('')
      setSubtasks([])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, taskId])

  const canSave = title.trim().length > 0 && sprintId !== ''

  const doneSubs = subtasks.filter((st) => st.done).length
  const subPercent = subtasks.length ? Math.round((doneSubs / subtasks.length) * 100) : 0
  const addSub = () => {
    const t = newSub.trim()
    if (!t) return
    setSubtasks((s) => [...s, { id: uid(), title: t, done: false }])
    setNewSub('')
  }

  const save = () => {
    if (!canSave) return
    const subs = subtasks.filter((st) => st.title.trim()).map((st) => ({ ...st, title: st.title.trim() }))
    if (taskId && task) {
      updateTask(taskId, { title: title.trim(), description, status, assigneeId, priority, sprintId, dueDate: dueDate || undefined, subtasks: subs })
    } else {
      addTask({ sprintId, title: title.trim(), description, status, assigneeId, priority, dueDate: dueDate || undefined, subtasks: subs })
    }
    onClose()
  }

  return (
    <Modal open={open} title={taskId ? 'Edit task' : 'New task'} onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          save()
        }}
        className="space-y-4"
      >
        <div>
          <label className={labelCls}>Title</label>
          <input autoFocus className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What needs to be done?" />
        </div>
        <div>
          <label className={labelCls}>Description</label>
          <textarea className={inputCls + ' resize-none'} rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional details" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Status</label>
            <select className={inputCls} value={status} onChange={(e) => setStatus(e.target.value as Status)}>
              {(Object.keys(STATUS_LABELS) as Status[]).map((s) => (
                <option key={s} value={s} className="bg-slate-900">{STATUS_LABELS[s]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Assignee</label>
            <select className={inputCls} value={assigneeId ?? ''} onChange={(e) => setAssigneeId(e.target.value || null)}>
              <option value="" className="bg-slate-900">Unassigned</option>
              {members.map((m) => (
                <option key={m.id} value={m.id} className="bg-slate-900">{m.name}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className={labelCls}>Priority</label>
          <div className="grid grid-cols-3 gap-2">
            {PRIORITIES.map((p) => {
              const sel = priority === p
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className="flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm transition hover:bg-white/10"
                  style={{
                    borderColor: sel ? PRIORITY_COLORS[p] : 'rgba(255,255,255,0.1)',
                    background: sel ? PRIORITY_COLORS[p] + '22' : 'rgba(255,255,255,0.05)',
                    color: sel ? '#fff' : '#cbd5e1',
                  }}
                >
                  <span className="h-2 w-2 rounded-full" style={{ background: PRIORITY_COLORS[p] }} />
                  {PRIORITY_LABEL[p]}
                </button>
              )
            })}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Sprint</label>
            <select className={inputCls} value={sprintId} onChange={(e) => setSprintId(e.target.value)}>
              {sprints.map((s) => (
                <option key={s.id} value={s.id} className="bg-slate-900">{s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Due date</label>
            <div className="flex gap-1">
              <input type="date" className={inputCls + ' [color-scheme:dark]'} value={dueDate} onChange={(e) => setDueDate(e.target.value)} aria-label="Due date" />
              {dueDate && (
                <button type="button" className={ghostBtn + ' px-2'} onClick={() => setDueDate('')} title="Clear due date">✕</button>
              )}
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-baseline justify-between">
            <label className={labelCls}>Subtasks (moons)</label>
            {subtasks.length > 0 && (
              <span className="text-xs text-slate-400" data-testid="subtask-progress-label">{doneSubs}/{subtasks.length} · {subPercent}%</span>
            )}
          </div>
          {subtasks.length > 0 && (
            <div className="mb-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10" role="progressbar" aria-valuenow={subPercent} aria-valuemin={0} aria-valuemax={100}>
              <div className="h-full rounded-full bg-gradient-to-r from-sky-400 to-emerald-400 transition-all duration-300" style={{ width: `${subPercent}%` }} />
            </div>
          )}
          <ul className="max-h-40 space-y-1 overflow-y-auto">
            {subtasks.map((st) => (
              <li key={st.id} className="group flex items-center gap-2 rounded-md px-1 py-0.5 hover:bg-white/5">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-emerald-400"
                  checked={st.done}
                  onChange={() => setSubtasks((s) => s.map((x) => (x.id === st.id ? { ...x, done: !x.done } : x)))}
                />
                <input
                  className={`flex-1 bg-transparent text-sm outline-none ${st.done ? 'text-slate-500 line-through' : 'text-slate-200'}`}
                  value={st.title}
                  onChange={(e) => setSubtasks((s) => s.map((x) => (x.id === st.id ? { ...x, title: e.target.value } : x)))}
                />
                <button
                  type="button"
                  aria-label="Remove subtask"
                  className="px-1 text-slate-500 opacity-0 transition hover:text-red-300 group-hover:opacity-100"
                  onClick={() => setSubtasks((s) => s.filter((x) => x.id !== st.id))}
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
          <div className="mt-1 flex gap-2">
            <input
              className={inputCls}
              value={newSub}
              onChange={(e) => setNewSub(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addSub()
                }
              }}
              placeholder="Add a subtask and press Enter"
            />
            <button type="button" className={ghostBtn} onClick={addSub} disabled={!newSub.trim()}>Add</button>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 pt-2">
          <div>
            {taskId && !confirmDelete && (
              <button type="button" className={dangerBtn} onClick={() => setConfirmDelete(true)}>Delete</button>
            )}
            {taskId && confirmDelete && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-red-300">Delete?</span>
                <button type="button" className={dangerBtn} onClick={() => { deleteTask(taskId); onClose() }}>Yes</button>
                <button type="button" className={ghostBtn} onClick={() => setConfirmDelete(false)}>No</button>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <button type="button" className={ghostBtn} onClick={onClose}>Cancel</button>
            <button type="submit" className={primaryBtn} disabled={!canSave}>{taskId ? 'Save' : 'Create'}</button>
          </div>
        </div>
      </form>
    </Modal>
  )
}
