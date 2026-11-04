import { useStore } from '../store'
import { ghostBtn, primaryBtn } from './Modal'

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
        <button type="button" className={ghostBtn + ' !py-1.5'} onClick={onTeam}>Team</button>
        <button type="button" className={primaryBtn + ' !py-1.5'} onClick={onNewTask} disabled={sprints.length === 0}>+ New task</button>
      </div>
    </header>
  )
}
