import { useEffect, useMemo } from 'react'
import type { ReactNode } from 'react'
import { useStore } from '../store'
import { ORBITS } from '../constants'
import { avgCycleTime, burndown, completedPerMember, fmtDuration, timePerRing, velocity } from '../analytics'

const Card = ({ title, children, hint }: { title: string; hint?: string; children: ReactNode }) => (
  <section className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
    <div className="mb-3 flex items-baseline justify-between gap-2">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">{title}</h3>
      {hint && <span className="text-[10px] text-slate-500">{hint}</span>}
    </div>
    {children}
  </section>
)

function BurndownChart({ points }: { points: ReturnType<typeof burndown> }) {
  if (points.length < 2) return <p className="text-xs text-slate-500">Set a start and end date on the sprint to see a burndown.</p>
  const W = 340, H = 150, L = 26, R = 8, T = 8, B = 20
  const max = Math.max(1, ...points.map((p) => Math.max(p.ideal, p.remaining ?? 0)))
  const x = (i: number) => L + (i / (points.length - 1)) * (W - L - R)
  const y = (v: number) => T + (1 - v / max) * (H - T - B)
  const actual = points.filter((p) => p.remaining != null)
  const ticks = [0, Math.round(max / 2), max]
  const labelEvery = Math.ceil(points.length / 5)
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Burndown chart">
      {ticks.map((v) => (
        <g key={v}>
          <line x1={L} x2={W - R} y1={y(v)} y2={y(v)} stroke="rgba(255,255,255,0.06)" />
          <text x={L - 6} y={y(v) + 3} textAnchor="end" fontSize="9" fill="#64748b">{v}</text>
        </g>
      ))}
      {points.map((p, i) =>
        i % labelEvery === 0 || i === points.length - 1 ? (
          <text key={i} x={x(i)} y={H - 5} textAnchor="middle" fontSize="9" fill="#64748b">{p.label}</text>
        ) : null,
      )}
      <polyline fill="none" stroke="#64748b" strokeDasharray="4 4" strokeWidth="1.5"
        points={points.map((p, i) => `${x(i)},${y(p.ideal)}`).join(' ')} />
      {actual.length > 0 && (
        <>
          <polyline fill="none" stroke="#818cf8" strokeWidth="2.25" strokeLinejoin="round"
            points={actual.map((p) => `${x(p.day)},${y(p.remaining!)}`).join(' ')} />
          {actual.map((p) => (
            <circle key={p.day} cx={x(p.day)} cy={y(p.remaining!)} r="2.5" fill="#818cf8">
              <title>{`${p.label}: ${p.remaining} remaining (ideal ${p.ideal.toFixed(1)})`}</title>
            </circle>
          ))}
        </>
      )}
    </svg>
  )
}

export default function AnalyticsPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const tasks = useStore((s) => s.tasks)
  const members = useStore((s) => s.members)
  const sprints = useStore((s) => s.sprints)
  const activeSprintId = useStore((s) => s.activeSprintId)
  const sprint = sprints.find((s) => s.id === activeSprintId)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const data = useMemo(() => {
    if (!sprint) return null
    const sprintTasks = tasks.filter((t) => t.sprintId === sprint.id)
    return {
      burn: burndown(sprint, tasks),
      perMember: completedPerMember(sprint.id, tasks, members),
      cycle: avgCycleTime(sprintTasks),
      cycleAll: avgCycleTime(tasks),
      vel: velocity(sprints, tasks),
      rings: timePerRing(sprintTasks),
      done: sprintTasks.filter((t) => t.status === 'done').length,
      total: sprintTasks.length,
    }
  }, [sprint, sprints, tasks, members])

  const maxMember = Math.max(1, ...(data?.perMember.map((r) => r.count) ?? [1]))
  const maxVel = Math.max(1, ...(data?.vel.map((v) => v.scope) ?? [1]))
  const maxRing = Math.max(1, ...Object.values(data?.rings ?? {}).map((v) => v ?? 0))

  return (
    <>
      <div
        className={`absolute inset-0 z-40 bg-black/40 transition-opacity duration-300 ${open ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
        onClick={onClose}
      />
      <aside
        aria-label="Sprint analytics"
        aria-hidden={!open}
        className={`absolute right-0 top-0 z-50 flex h-full w-[400px] max-w-full flex-col border-l border-white/10 bg-slate-950/95 shadow-2xl backdrop-blur transition-transform duration-300 ease-out ${open ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-slate-100">Sprint analytics</h2>
            <p className="truncate text-xs text-slate-400">{sprint?.name ?? 'No active sprint'}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close analytics" className="rounded-md px-2 py-1 text-slate-400 hover:bg-white/10 hover:text-slate-100">✕</button>
        </div>

        {data && (
          <div className="flex-1 space-y-4 overflow-y-auto p-5">
            <div className="grid grid-cols-3 gap-3">
              {[
                ['Done', `${data.done}/${data.total}`],
                ['Avg cycle', fmtDuration(data.cycle)],
                ['All-time cycle', fmtDuration(data.cycleAll)],
              ].map(([k, v]) => (
                <div key={k} className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
                  <div className="text-lg font-semibold text-slate-100">{v}</div>
                  <div className="text-[10px] uppercase tracking-wide text-slate-500">{k}</div>
                </div>
              ))}
            </div>

            <Card title="Burndown" hint="— ideal   ● remaining">
              <BurndownChart points={data.burn} />
            </Card>

            <Card title="Completed per member">
              <div className="space-y-2">
                {data.perMember.map((r) => (
                  <div key={r.member?.id ?? 'none'} className="flex items-center gap-2 text-xs">
                    <span className="w-24 truncate text-slate-300">{r.member?.name ?? 'Unassigned'}</span>
                    <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-white/5">
                      <div className="h-full rounded-full" style={{ width: `${(r.count / maxMember) * 100}%`, background: r.member?.color ?? '#94a3b8' }} />
                    </div>
                    <span className="w-5 text-right tabular-nums text-slate-300">{r.count}</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card title="Avg time on each ring" hint="from status history">
              <div className="space-y-2">
                {ORBITS.map((o) => {
                  const v = data.rings[o.status]
                  return (
                    <div key={o.status} className="flex items-center gap-2 text-xs">
                      <span className="w-24 truncate text-slate-300">{o.label}</span>
                      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-white/5">
                        <div className="h-full rounded-full" style={{ width: `${((v ?? 0) / maxRing) * 100}%`, background: o.color }} />
                      </div>
                      <span className="w-10 text-right tabular-nums text-slate-300">{fmtDuration(v)}</span>
                    </div>
                  )
                })}
              </div>
            </Card>

            <Card title="Velocity by sprint" hint="completed / scope">
              <div className="flex h-36 items-end gap-3">
                {data.vel.map((v) => {
                  const active = v.sprint.id === sprint?.id
                  return (
                    <div key={v.sprint.id} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1" title={`${v.sprint.name}: ${v.completed} of ${v.scope} done`}>
                      <span className="text-[10px] tabular-nums text-slate-300">{v.completed}/{v.scope}</span>
                      <div className="relative w-full max-w-10 rounded-t-md bg-white/10" style={{ height: `${(v.scope / maxVel) * 100}%` }}>
                        <div className={`absolute bottom-0 w-full rounded-t-md ${active ? 'bg-indigo-400' : 'bg-emerald-400/80'}`} style={{ height: v.scope ? `${(v.completed / v.scope) * 100}%` : 0 }} />
                      </div>
                      <span className={`w-full truncate text-center text-[10px] ${active ? 'text-indigo-300' : 'text-slate-500'}`}>{v.sprint.name.split(' — ')[0]}</span>
                    </div>
                  )
                })}
              </div>
            </Card>
          </div>
        )}
      </aside>
    </>
  )
}
