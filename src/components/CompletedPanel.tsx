import { useMemo, useState } from 'react'
import { useStore } from '../store'

export default function CompletedPanel({ onEditTask }: { onEditTask: (id: string) => void }) {
  const tasks = useStore((s) => s.tasks)
  const members = useStore((s) => s.members)
  const activeSprintId = useStore((s) => s.activeSprintId)
  const moveTask = useStore((s) => s.moveTask)
  const [open, setOpen] = useState(false)

  const done = useMemo(
    () => tasks.filter((t) => t.sprintId === activeSprintId && t.status === 'done').sort((a, b) => (b.completedAt ?? 0) - (a.completedAt ?? 0)),
    [tasks, activeSprintId],
  )

  return (
    <div className="absolute bottom-4 left-4 z-30 w-72 rounded-xl bg-slate-900/70 backdrop-blur border border-white/10 shadow-xl overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-3 py-2 text-sm font-semibold text-slate-100 hover:bg-white/5"
      >
        <span className="flex items-center gap-2">
          <span className="text-emerald-400">✓</span> Completed
          <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs">{done.length}</span>
        </span>
        <span className="text-slate-400 text-xs">{open ? '▾' : '▸'}</span>
      </button>
      {open && (
        <div className="max-h-64 overflow-y-auto border-t border-white/10">
          {done.length === 0 && <div className="px-3 py-4 text-xs text-slate-400">Nothing completed yet. Drag a planet out of orbit!</div>}
          {done.map((t) => {
            const m = members.find((x) => x.id === t.assigneeId)
            return (
              <div
                key={t.id}
                onClick={() => onEditTask(t.id)}
                className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-white/5 border-b border-white/5 last:border-b-0"
              >
                <div
                  className="w-7 h-7 shrink-0 rounded-full flex items-center justify-center text-[10px] font-bold bg-slate-800 border"
                  style={{ color: m?.color ?? '#94a3b8', borderColor: m?.color ?? '#475569' }}
                  title={m?.name ?? 'Unassigned'}
                >
                  {m?.initials ?? '?'}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs text-slate-100 truncate">{t.title}</div>
                  <div className="text-[10px] text-slate-400">{t.completedAt ? new Date(t.completedAt).toLocaleDateString() : '—'}</div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    moveTask(t.id, 'testing')
                  }}
                  className="text-[10px] px-2 py-1 rounded-md bg-white/10 hover:bg-white/20 text-slate-200"
                >
                  Reopen
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
