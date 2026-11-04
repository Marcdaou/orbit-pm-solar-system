import { useStore } from '../store'
import { useRef, useState } from 'react'
import { ghostBtn, primaryBtn } from './Modal'
import { exportJSON, parseBackup } from '../backup'

interface Props {
  onNewTask: () => void
  onNewSprint: () => void
  onEditSprint: () => void
  onTeam: () => void
  spotlight: string | null
  onSpotlight: (id: string | null) => void
}

const fmt = (d: string) =>
  d ? new Date(d + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : ''

export default function Header({ onNewTask, onNewSprint, onEditSprint, onTeam, spotlight, onSpotlight }: Props) {
  const { sprints, members, activeSprintId, setActiveSprint } = useStore()
  const sprint = sprints.find((s) => s.id === activeSprintId)
  const canUndo = useStore((s) => s.past.length > 0)
  const canRedo = useStore((s) => s.future.length > 0)
  const fileRef = useRef<HTMLInputElement>(null)
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null)
  const flash = (ok: boolean, text: string) => {
    setNotice({ ok, text })
    window.setTimeout(() => setNotice(null), 3500)
  }

  const onExport = () => {
    const { members, sprints, tasks, activeSprintId } = useStore.getState()
    exportJSON({ members, sprints, tasks, activeSprintId })
    flash(true, `Exported ${tasks.length} tasks`)
  }
  const onImportFile = async (file: File | undefined) => {
    if (!file) return
    try {
      const data = parseBackup(await file.text())
      useStore.getState().replaceAll(data)
      flash(true, `Imported ${data.tasks.length} tasks · Ctrl+Z to revert`)
    } catch (err) {
      flash(false, `Import failed: ${(err as Error).message}`)
    } finally {
      if (fileRef.current) fileRef.current.value = ''
    }
  }
  const iconBtn = ghostBtn + ' !px-2.5 !py-1.5'

  return (
    <header className="relative z-20 flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-white/10 bg-slate-950/70 px-5 py-3 backdrop-blur">
      <div className="flex items-center gap-2.5">
        <div className="relative h-8 w-8 rounded-full bg-gradient-to-br from-amber-300 via-orange-400 to-pink-500 shadow-lg shadow-orange-500/30">
          <span className="absolute inset-[-5px] rounded-full border border-indigo-300/50" style={{ transform: 'rotateX(65deg)' }} />
        </div>
        <span className="bg-gradient-to-r from-indigo-200 to-violet-300 bg-clip-text text-lg font-bold tracking-tight text-transparent">
          Orbit PM
        </span>
      </div>

      <div className="flex items-center gap-2">
        {sprints.length > 0 ? (
          <>
            <select
              aria-label="Active sprint"
              value={activeSprintId ?? ''}
              onChange={(e) => setActiveSprint(e.target.value)}
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-slate-100 outline-none transition focus:border-indigo-400/70"
            >
              {sprints.map((s) => (
                <option key={s.id} value={s.id} className="bg-slate-900">{s.name}</option>
              ))}
            </select>
            <button type="button" className={ghostBtn + ' !px-2.5 !py-1.5'} onClick={onEditSprint} disabled={!sprint} title="Edit sprint">
              ✎
            </button>
          </>
        ) : (
          <span className="text-sm text-slate-500">No sprints</span>
        )}
        <button type="button" className={ghostBtn + ' !py-1.5'} onClick={onNewSprint}>+ New sprint</button>
      </div>

      {sprint && (
        <div className="hidden min-w-0 max-w-xs flex-col text-xs leading-tight text-slate-400 lg:flex">
          {sprint.goal && <span className="truncate text-slate-300">{sprint.goal}</span>}
          {(sprint.startDate || sprint.endDate) && <span>{fmt(sprint.startDate)} – {fmt(sprint.endDate)}</span>}
        </div>
      )}

      <div className="ml-auto flex items-center gap-3">
        <div className="flex items-center -space-x-1.5" role="group" aria-label="Spotlight a member">
          {members.map((m) => {
            const sel = spotlight === m.id
            return (
              <button
                key={m.id}
                type="button"
                title={sel ? `${m.name} (click to clear spotlight)` : `Spotlight ${m.name}`}
                aria-pressed={sel}
                onClick={() => onSpotlight(sel ? null : m.id)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-slate-900 transition hover:z-10 hover:scale-110"
                style={{
                  background: m.color,
                  opacity: spotlight && !sel ? 0.4 : 1,
                  boxShadow: sel ? `0 0 0 2px #05060f, 0 0 0 4px ${m.color}` : '0 0 0 2px #05060f',
                  zIndex: sel ? 10 : undefined,
                }}
              >
                {m.initials}
              </button>
            )
          })}
        </div>
        <div className="flex items-center gap-1">
          <button type="button" className={iconBtn} onClick={() => useStore.getState().undo()} disabled={!canUndo} title="Undo (Ctrl+Z)" aria-label="Undo">↶</button>
          <button type="button" className={iconBtn} onClick={() => useStore.getState().redo()} disabled={!canRedo} title="Redo (Ctrl+Shift+Z)" aria-label="Redo">↷</button>
        </div>
        <div className="relative flex items-center gap-1">
          <button type="button" className={ghostBtn + ' !py-1.5'} onClick={onExport} title="Download all data as JSON">Export</button>
          <button type="button" className={ghostBtn + ' !py-1.5'} onClick={() => fileRef.current?.click()} title="Replace all data from a JSON export">Import</button>
          <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" aria-label="Import JSON file" onChange={(e) => onImportFile(e.target.files?.[0])} />
          {notice && (
            <div role="status" className={`absolute right-0 top-full mt-2 whitespace-nowrap rounded-lg border px-3 py-1.5 text-xs shadow-xl ${notice.ok ? 'border-emerald-400/30 bg-emerald-950/90 text-emerald-200' : 'border-rose-400/30 bg-rose-950/90 text-rose-200'}`}>
              {notice.text}
            </div>
          )}
        </div>
        <button type="button" className={ghostBtn + ' !py-1.5'} onClick={onTeam}>Team</button>
        <button type="button" className={primaryBtn + ' !py-1.5'} onClick={onNewTask} disabled={sprints.length === 0}>+ New task</button>
      </div>
    </header>
  )
}
