import { useState } from 'react'
import { useStore } from '../store'
import Modal, { ghostBtn, inputCls, primaryBtn } from './Modal'

interface Props {
  open: boolean
  onClose: () => void
}

export default function TeamModal({ open, onClose }: Props) {
  const { members, tasks, addMember, removeMember } = useStore()
  const [name, setName] = useState('')

  const add = () => {
    if (!name.trim()) return
    addMember(name)
    setName('')
  }

  return (
    <Modal open={open} title="Team" onClose={onClose}>
      <ul className="mb-5 space-y-2">
        {members.length === 0 && <li className="text-sm text-slate-400">No members yet.</li>}
        {members.map((m) => {
          const count = tasks.filter((t) => t.assigneeId === m.id).length
          return (
            <li key={m.id} className="flex items-center gap-3 rounded-lg border border-white/5 bg-white/5 px-3 py-2">
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-slate-900"
                style={{ background: m.color }}
              >
                {m.initials}
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-slate-100">{m.name}</div>
                <div className="text-xs text-slate-400">{count} task{count === 1 ? '' : 's'}</div>
              </div>
              <button type="button" className={ghostBtn + ' !px-2 !py-1 text-xs hover:!text-red-300'} onClick={() => removeMember(m.id)}>
                Remove
              </button>
            </li>
          )
        })}
      </ul>
      <div className="flex gap-2">
        <input
          className={inputCls}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add() } }}
          placeholder="Add member name"
        />
        <button type="button" className={primaryBtn} onClick={add} disabled={!name.trim()}>Add</button>
      </div>
    </Modal>
  )
}
