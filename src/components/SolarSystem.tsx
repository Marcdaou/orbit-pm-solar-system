import { useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { useStore } from '../store'
import { ORBITS, PRIORITY_COLORS, PRIORITY_SIZES, STATUS_LABELS } from '../constants'
import type { Task } from '../types'
import Sun from './Sun'
import OrbitRing from './OrbitRing'
import TaskPlanet, { PlanetBody } from './TaskPlanet'

interface Props {
  onEditTask: (id: string) => void
  assigneeFilter: string | null
}

interface Departing {
  key: string
  task: Task
  x: number
  y: number
  fx: number
  fy: number
}

interface DragState {
  id: string
  sx: number
  sy: number
  moved: boolean
}

const orbitIndex = (status: string) => ORBITS.findIndex((o) => o.status === status)

export default function SolarSystem({ onEditTask, assigneeFilter }: Props) {
  const tasks = useStore((s) => s.tasks)
  const members = useStore((s) => s.members)
  const sprints = useStore((s) => s.sprints)
  const activeSprintId = useStore((s) => s.activeSprintId)
  const moveTask = useStore((s) => s.moveTask)

  const containerRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ w: 0, h: 0 })
  const sizeRef = useRef(size)
  sizeRef.current = size

  const els = useRef(new Map<string, HTMLDivElement>())
  const angles = useRef(new Map<string, number>())
  const pos = useRef(new Map<string, { x: number; y: number }>())
  const hoveredRef = useRef<string | null>(null)
  const dragRef = useRef<DragState | null>(null)

  const [hover, setHover] = useState<{ id: string; x: number; y: number } | null>(null)
  const [dragging, setDragging] = useState<string | null>(null)
  const [target, setTarget] = useState<string | null>(null) // 'o0'.. | 'eject'
  const [departing, setDeparting] = useState<Departing[]>([])

  const visible = useMemo(
    () => tasks.filter((t) => t.sprintId === activeSprintId && t.status !== 'done'),
    [tasks, activeSprintId],
  )
  const visibleRef = useRef(visible)
  visibleRef.current = visible

  const sprint = sprints.find((s) => s.id === activeSprintId)
  const sprintTasks = tasks.filter((t) => t.sprintId === activeSprintId)
  const doneCount = sprintTasks.filter((t) => t.status === 'done').length
  const percent = sprintTasks.length ? Math.round((doneCount / sprintTasks.length) * 100) : 0

  const cx = size.w / 2
  const cy = size.h / 2
  const maxR = Math.max(0, Math.min(size.w, size.h) / 2 - 30)
  const maxRRef = useRef(maxR)
  maxRRef.current = maxR

  // measure
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }))
    ro.observe(el)
    setSize({ w: el.clientWidth, h: el.clientHeight })
    return () => ro.disconnect()
  }, [])

  // animation loop
  useEffect(() => {
    let raf = 0
    let last = performance.now()
    const tick = (t: number) => {
      const dt = Math.min(0.05, (t - last) / 1000)
      last = t
      const { w, h } = sizeRef.current
      const R = maxRRef.current
      if (w > 0 && R > 0) {
        const list = visibleRef.current
        const counts = ORBITS.map(() => 0)
        list.forEach((tk) => {
          const oi = orbitIndex(tk.status)
          if (oi >= 0) counts[oi]++
        })
        const seen = ORBITS.map(() => 0)
        for (const tk of list) {
          const oi = orbitIndex(tk.status)
          if (oi < 0) continue
          const idx = seen[oi]++
          if (!angles.current.has(tk.id)) {
            angles.current.set(tk.id, (idx / counts[oi]) * Math.PI * 2 + oi * 0.9)
          }
          const el = els.current.get(tk.id)
          if (!el || dragRef.current?.id === tk.id) continue
          let a = angles.current.get(tk.id)!
          if (hoveredRef.current !== tk.id) {
            a += ORBITS[oi].speed * dt
            angles.current.set(tk.id, a)
          }
          const r = ORBITS[oi].radius * R
          const x = w / 2 + r * Math.cos(a)
          const y = h / 2 + r * Math.sin(a)
          pos.current.set(tk.id, { x, y })
          el.style.transform = `translate(${x}px, ${y}px)`
          el.style.visibility = 'visible'
        }
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  // detect tasks that became done -> fly out
  const prevRef = useRef(new Map<string, Task>())
  useEffect(() => {
    const cur = new Map(visible.map((t) => [t.id, t]))
    const gone: Task[] = []
    prevRef.current.forEach((_pt, id) => {
      if (cur.has(id)) return
      const now = tasks.find((t) => t.id === id)
      if (now && now.status === 'done' && now.sprintId === activeSprintId) gone.push(now)
    })
    prevRef.current = cur
    if (!gone.length) return
    const { w, h } = sizeRef.current
    const dist = Math.max(w, h)
    const entries: Departing[] = gone.map((task) => {
      const p = pos.current.get(task.id) ?? { x: w / 2, y: h / 2 }
      let dx = p.x - w / 2
      let dy = p.y - h / 2
      if (Math.hypot(dx, dy) < 1) {
        dx = 1
        dy = 0
      }
      const len = Math.hypot(dx, dy)
      dx /= len
      dy /= len
      pos.current.delete(task.id)
      angles.current.delete(task.id)
      return { key: `${task.id}-${Date.now()}`, task, x: p.x, y: p.y, fx: dx * dist, fy: dy * dist }
    })
    setDeparting((d) => [...d, ...entries])
    const keys = entries.map((e) => e.key)
    window.setTimeout(() => setDeparting((d) => d.filter((e) => !keys.includes(e.key))), 1300)
  }, [visible, tasks, activeSprintId])

  const stars = useMemo(
    () =>
      Array.from({ length: 110 }, (_, i) => ({
        i,
        left: Math.random() * 100,
        top: Math.random() * 100,
        s: Math.random() * 2 + 0.6,
        d: Math.random() * 4,
        dur: 2 + Math.random() * 4,
      })),
    [],
  )

  // ---- interaction ----
  const register = (id: string, el: HTMLDivElement | null) => {
    if (el) {
      els.current.set(id, el)
      if (!pos.current.has(id)) el.style.visibility = 'hidden'
    } else {
      els.current.delete(id)
    }
  }

  const localPoint = (e: React.PointerEvent) => {
    const rect = containerRef.current!.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  const classify = (x: number, y: number): { orbit: number; eject: boolean } => {
    const d = Math.hypot(x - cx, y - cy)
    const R = maxRRef.current
    if (d > ORBITS[ORBITS.length - 1].radius * R + 40) return { orbit: ORBITS.length - 1, eject: true }
    let best = 0
    let bd = Infinity
    ORBITS.forEach((o, i) => {
      const dd = Math.abs(d - o.radius * R)
      if (dd < bd) {
        bd = dd
        best = i
      }
    })
    return { orbit: best, eject: false }
  }

  const onPointerDown = (e: React.PointerEvent, id: string) => {
    if (e.button !== 0) return
    e.currentTarget.setPointerCapture(e.pointerId)
    dragRef.current = { id, sx: e.clientX, sy: e.clientY, moved: false }
  }

  const onPointerMove = (e: React.PointerEvent, id: string) => {
    const d = dragRef.current
    if (!d || d.id !== id) return
    if (!d.moved && Math.hypot(e.clientX - d.sx, e.clientY - d.sy) < 5) return
    if (!d.moved) {
      d.moved = true
      setDragging(id)
      setHover(null)
    }
    const p = localPoint(e)
    pos.current.set(id, p)
    const el = els.current.get(id)
    if (el) el.style.transform = `translate(${p.x}px, ${p.y}px)`
    const c = classify(p.x, p.y)
    const key = c.eject ? 'eject' : `o${c.orbit}`
    setTarget((prev) => (prev === key ? prev : key))
  }

  const endDrag = (e: React.PointerEvent, id: string, cancel: boolean) => {
    const d = dragRef.current
    if (!d || d.id !== id) return
    dragRef.current = null
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId)
    setDragging(null)
    setTarget(null)
    hoveredRef.current = null
    setHover(null)
    if (cancel) return
    if (!d.moved) {
      onEditTask(id)
      return
    }
    const p = localPoint(e)
    const c = classify(p.x, p.y)
    angles.current.set(id, Math.atan2(p.y - cy, p.x - cx))
    pos.current.set(id, p)
    moveTask(id, c.eject ? 'done' : ORBITS[c.orbit].status)
  }

  const onEnter = (id: string) => {
    if (dragRef.current) return
    hoveredRef.current = id
    const p = pos.current.get(id)
    if (p) setHover({ id, x: p.x, y: p.y })
  }
  const onLeave = (id: string) => {
    if (dragRef.current?.id === id) return
    if (hoveredRef.current === id) hoveredRef.current = null
    setHover((h) => (h?.id === id ? null : h))
  }

  const hoverTask = hover ? visible.find((t) => t.id === hover.id) : undefined
  const hoverMember = hoverTask ? members.find((m) => m.id === hoverTask.assigneeId) : undefined
  const ejectActive = target === 'eject'

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden"
      style={{ background: 'radial-gradient(ellipse at center, #0e1330 0%, #070815 55%, #03030a 100%)' }}
    >
      {/* starfield */}
      {stars.map((s) => (
        <span
          key={s.i}
          className="absolute rounded-full bg-white animate-twinkle pointer-events-none"
          style={{ left: `${s.left}%`, top: `${s.top}%`, width: s.s, height: s.s, animationDelay: `${s.d}s`, animationDuration: `${s.dur}s` }}
        />
      ))}

      {/* eject zone */}
      {dragging && (
        <div
          className="absolute inset-0 pointer-events-none z-0 transition-all duration-200"
          style={{ boxShadow: ejectActive ? 'inset 0 0 140px 30px rgba(52,211,153,.45)' : 'inset 0 0 80px 10px rgba(52,211,153,.12)' }}
        >
          <div
            className={`absolute left-1/2 top-3 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
              ejectActive ? 'bg-emerald-400/30 text-emerald-200 border-emerald-300 scale-110' : 'bg-slate-900/60 text-slate-400 border-white/10'
            }`}
          >
            🚀 Eject to complete
          </div>
        </div>
      )}

      {size.w > 0 && (
        <>
          {ORBITS.map((o, i) => (
            <div key={o.status} className="absolute inset-0 pointer-events-none">
              <OrbitRing radius={o.radius * maxR} color={o.color} label={o.label} count={visible.filter((t) => t.status === o.status).length} highlighted={target === `o${i}`} />
            </div>
          ))}

          <Sun size={Math.max(50, maxR * 0.3)} name={sprint?.name ?? 'No sprint'} percent={percent} done={doneCount} total={sprintTasks.length} />

          {visible.map((t) => (
            <TaskPlanet
              key={t.id}
              task={t}
              member={members.find((m) => m.id === t.assigneeId)}
              dimmed={!!assigneeFilter && t.assigneeId !== assigneeFilter}
              dragging={dragging === t.id}
              hovered={hover?.id === t.id}
              register={register}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={(e, id) => endDrag(e, id, false)}
              onPointerCancel={(e, id) => endDrag(e, id, true)}
              onEnter={onEnter}
              onLeave={onLeave}
            />
          ))}

          {departing.map((d) => (
            <div
              key={d.key}
              className="absolute animate-fly-out pointer-events-none z-30"
              style={{ left: d.x - PRIORITY_SIZES[d.task.priority] / 2, top: d.y - PRIORITY_SIZES[d.task.priority] / 2, '--fly-x': `${d.fx}px`, '--fly-y': `${d.fy}px` } as CSSProperties}
            >
              <PlanetBody task={d.task} member={members.find((m) => m.id === d.task.assigneeId)} hovered />
            </div>
          ))}
        </>
      )}

      {/* tooltip */}
      {hover && hoverTask && !dragging && (
        <div
          className="absolute z-50 pointer-events-none w-52 rounded-lg bg-slate-900/90 backdrop-blur border border-white/15 p-2.5 shadow-xl"
          style={{ left: hover.x, top: hover.y - 32, transform: 'translate(-50%, -100%)' }}
        >
          <div className="text-sm font-semibold text-slate-100 leading-snug">{hoverTask.title}</div>
          <div className="mt-1.5 flex flex-col gap-0.5 text-[11px] text-slate-300">
            <div>
              <span className="text-slate-500">Assignee: </span>
              <span style={{ color: hoverMember?.color }}>{hoverMember?.name ?? 'Unassigned'}</span>
            </div>
            <div>
              <span className="text-slate-500">Priority: </span>
              <span className="font-semibold capitalize" style={{ color: PRIORITY_COLORS[hoverTask.priority] }}>
                {hoverTask.priority === 'med' ? 'medium' : hoverTask.priority}
              </span>
            </div>
            <div>
              <span className="text-slate-500">Status: </span>
              {STATUS_LABELS[hoverTask.status]}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
