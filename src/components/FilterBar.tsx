import { useEffect, useRef } from 'react'
import { useStore } from '../store'
import { ORBITS, PRIORITY_COLORS } from '../constants'
import type { Priority } from '../types'
import { EMPTY_FILTERS, isFiltering, toggleIn, UNASSIGNED, type TaskFilters } from '../filters'

interface Props {
  filters: TaskFilters
  onChange: (f: TaskFilters) => void
  matchCount: number
  total: number
}

const PRIORITIES: { p: Priority; label: string }[] = [
  { p: 'high', label: 'High' },
  { p: 'med', label: 'Medium' },
  { p: 'low', label: 'Low' },
]

function Chip({ active, color, onClick, children, title }: { active: boolean; color: string; onClick: () => void; children: React.ReactNode; title?: string }) {
  return (
    <button
      type="button"
      title={title}
      aria-pressed={active}
      onClick={onClick}
      className="flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-medium transition"
      style={{
        borderColor: active ? color : 'rgba(255,255,255,0.1)',
        background: active ? `${color}26` : 'rgba(255,255,255,0.03)',
        color: active ? '#f1f5f9' : '#94a3b8',
      }}
    >
      <span className="h-2 w-2 rounded-full" style={{ background: color }} />
      {children}
    </button>
  )
}

export default function FilterBar({ filters, onChange, matchCount, total }: Props) {
  const members = useStore((s) => s.members)
  const inputRef = useRef<HTMLInputElement>(null)
  const active = isFiltering(filters)

  // "/" focuses search, Escape clears it
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      const typing = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)
      if (e.key === '/' && !typing && !document.querySelector('[role="dialog"]')) {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const set = (patch: Partial<TaskFilters>) => onChange({ ...filters, ...patch })

  return (
    <div className="absolute left-3 top-3 z-30 flex w-72 flex-col gap-2.5 rounded-xl border border-white/10 bg-slate-950/75 p-3 shadow-xl backdrop-blur">
      <div className="relative">
        <input
          ref={inputRef}
          type="search"
          aria-label="Search tasks"
          placeholder="Search tasks…  ( / )"
          value={filters.query}
          onChange={(e) => set({ query: e.target.value })}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              set({ query: '' })
              e.currentTarget.blur()
            }
          }}
          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-indigo-400/70"
        />
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Assignee</span>
        <div className="flex flex-wrap gap-1">
          {members.map((m) => (
            <Chip key={m.id} active={filters.assignees.includes(m.id)} color={m.color} title={m.name} onClick={() => set({ assignees: toggleIn(filters.assignees, m.id) })}>
              {m.name.split(' ')[0]}
            </Chip>
          ))}
          <Chip active={filters.assignees.includes(UNASSIGNED)} color="#64748b" onClick={() => set({ assignees: toggleIn(filters.assignees, UNASSIGNED) })}>
            Unassigned
          </Chip>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Priority</span>
        <div className="flex flex-wrap gap-1">
          {PRIORITIES.map(({ p, label }) => (
            <Chip key={p} active={filters.priorities.includes(p)} color={PRIORITY_COLORS[p]} onClick={() => set({ priorities: toggleIn(filters.priorities, p) })}>
              {label}
            </Chip>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Status</span>
        <div className="flex flex-wrap gap-1">
          {ORBITS.map((o) => (
            <Chip key={o.status} active={filters.statuses.includes(o.status)} color={o.color} onClick={() => set({ statuses: toggleIn(filters.statuses, o.status) })}>
              {o.label}
            </Chip>
          ))}
        </div>
      </div>

      {active && (
        <div className="flex items-center justify-between border-t border-white/10 pt-2 text-[11px]">
          <span className="text-slate-400">
            <span className="font-semibold text-slate-100">{matchCount}</span> of {total} tasks match
          </span>
          <button type="button" onClick={() => onChange(EMPTY_FILTERS)} className="rounded px-1.5 py-0.5 text-indigo-300 transition hover:bg-white/5 hover:text-indigo-200">
            Clear all
          </button>
        </div>
      )}
    </div>
  )
}
