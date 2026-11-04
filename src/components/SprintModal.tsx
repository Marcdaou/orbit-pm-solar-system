import { useEffect, useState } from 'react'
import { useStore } from '../store'
import Modal, { dangerBtn, ghostBtn, inputCls, labelCls, primaryBtn } from './Modal'

interface Props {
  open: boolean
  sprintId: string | null
  onClose: () => void
}

const iso = (t: number) => new Date(t).toISOString().slice(0, 10)

export default function SprintModal({ open, sprintId, onClose }: Props) {
  const { sprints, tasks, addSprint, updateSprint, deleteSprint } = useStore()
  const sprint = sprintId ? sprints.find((s) => s.id === sprintId) : undefined

  const [name, setName] = useState('')
  const [goal, setGoal] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    if (!open) return
    setConfirmDelete(false)
    if (sprint) {
      setName(sprint.name)
      setGoal(sprint.goal)
      setStartDate(sprint.startDate)
      setEndDate(sprint.endDate)
    } else {
      setName('')
      setGoal('')
      setStartDate(iso(Date.now()))
      setEndDate(iso(Date.now() + 14 * 86400000))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, sprintId])

  const canSave = name.trim().length > 0

  const save = () => {
    if (!canSave) return
    const data = { name: name.trim(), goal, startDate, endDate }
    if (sprintId && sprint) updateSprint(sprintId, data)
    else addSprint(data)
    onClose()
  }

  const taskCount = sprintId ? tasks.filter((t) => t.sprintId === sprintId).length : 0

  return (
    <Modal open={open} title={sprintId ? 'Edit sprint' : 'New sprint'} onClose={onClose}>
      <form onSubmit={(e) => { e.preventDefault(); save() }} className="space-y-4">
        <div>
          <label className={labelCls}>Name</label>
          <input autoFocus className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="Sprint 3 — Growth" />
        </div>
        <div>
          <label className={labelCls}>Goal</label>
          <textarea className={inputCls + ' resize-none'} rows={2} value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="What should this sprint achieve?" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Start</label>
            <input type="date" className={inputCls + ' [color-scheme:dark]'} value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>End</label>
            <input type="date" className={inputCls + ' [color-scheme:dark]'} value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
        </div>

        {sprintId && confirmDelete && (
          <div className="rounded-lg border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-200">
            Deleting this sprint also deletes its {taskCount} task{taskCount === 1 ? '' : 's'}. This cannot be undone.
          </div>
        )}

        <div className="flex items-center justify-between gap-2 pt-2">
          <div>
            {sprintId && !confirmDelete && (
              <button type="button" className={dangerBtn} onClick={() => setConfirmDelete(true)}>Delete</button>
            )}
            {sprintId && confirmDelete && (
              <div className="flex items-center gap-2">
                <button type="button" className={dangerBtn} onClick={() => { deleteSprint(sprintId); onClose() }}>Confirm delete</button>
                <button type="button" className={ghostBtn} onClick={() => setConfirmDelete(false)}>Keep</button>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <button type="button" className={ghostBtn} onClick={onClose}>Cancel</button>
            <button type="submit" className={primaryBtn} disabled={!canSave}>{sprintId ? 'Save' : 'Create'}</button>
          </div>
        </div>
      </form>
    </Modal>
  )
}
