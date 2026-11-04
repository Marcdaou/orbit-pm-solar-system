import type { Member, Task } from '../types'
import { MOON_DONE_COLOR, MOON_SIZE, PRIORITY_COLORS, PRIORITY_SIZES } from '../constants'
import { heatColor, taskDecay } from '../decay'

export function PlanetBody({ task, member, hovered = false, now = Date.now() }: { task: Task; member?: Member; hovered?: boolean; now?: number }) {
  const decay = taskDecay(task.dueDate, now)
  const pc = PRIORITY_COLORS[task.priority]
  const warm = !decay.overdue && decay.heat > 0
  const glow = warm ? heatColor(decay.heat) : pc
  const glowPx = (hovered ? 22 : 12) + (warm ? decay.heat * 14 : 0)
  const size = PRIORITY_SIZES[task.priority]
  return (
    <div className="relative flex flex-col items-center" style={{ width: size }}>
      <div
        className={`rounded-full flex items-center justify-center font-bold transition-transform duration-150 ${decay.overdue ? 'animate-overdue-pulse' : ''}`}
        data-decay={decay.overdue ? 'overdue' : warm ? 'warm' : 'none'}
        style={{
          width: size,
          height: size,
          fontSize: Math.max(8, Math.round(size * 0.32)),
          transform: hovered ? 'scale(1.25)' : 'scale(1)',
          background: decay.overdue
            ? 'radial-gradient(circle at 35% 30%, #7f1d1d 0%, #1f0a0a 80%)'
            : warm
              ? `radial-gradient(circle at 35% 30%, color-mix(in srgb, ${glow} ${Math.round(decay.heat * 45)}%, #334155) 0%, #0f172a 80%)`
              : 'radial-gradient(circle at 35% 30%, #334155 0%, #0f172a 80%)',
          border: `2px solid ${decay.overdue ? '#ef4444' : pc}`,
          boxShadow: decay.overdue ? undefined : `0 0 ${glowPx}px ${warm ? glow : pc + 'aa'}, inset 0 0 8px ${pc}55`,
          color: member?.color ?? '#94a3b8',
        }}
      >
        {member?.initials ?? '?'}
      </div>
      <div
        className="absolute top-full mt-1 text-[10px] leading-tight text-slate-200 text-center truncate pointer-events-none"
        style={{ maxWidth: 92, textShadow: '0 0 4px #000, 0 0 8px #000', whiteSpace: 'nowrap' }}
      >
        {task.title}
      </div>
    </div>
  )
}

interface Props {
  task: Task
  member?: Member
  now: number
  dimmed: boolean
  dragging: boolean
  hovered: boolean
  register: (id: string, el: HTMLDivElement | null) => void
  registerMoons: (id: string, el: HTMLDivElement | null) => void
  onPointerDown: (e: React.PointerEvent, id: string) => void
  onPointerMove: (e: React.PointerEvent, id: string) => void
  onPointerUp: (e: React.PointerEvent, id: string) => void
  onPointerCancel: (e: React.PointerEvent, id: string) => void
  onEnter: (id: string) => void
  onLeave: (id: string) => void
}

export default function TaskPlanet(p: Props) {
  const { task } = p
  return (
    <div
      ref={(el) => p.register(task.id, el)}
      className="absolute left-0 top-0"
      style={{ width: PRIORITY_SIZES[task.priority], height: PRIORITY_SIZES[task.priority], marginLeft: -PRIORITY_SIZES[task.priority] / 2, marginTop: -PRIORITY_SIZES[task.priority] / 2, zIndex: p.dragging ? 50 : p.hovered ? 40 : p.dimmed ? 10 : 20 }}
    >
      <div
        className="select-none"
        style={{
          // Non-matching tasks fade and shrink; hovering or dragging one brings it back to full
          opacity: p.dimmed && !p.hovered && !p.dragging ? 0.15 : 1,
          transform: p.dimmed && !p.hovered && !p.dragging ? 'scale(0.6)' : 'scale(1)',
          transition: 'opacity 250ms, transform 250ms',
          cursor: p.dragging ? 'grabbing' : 'grab',
          touchAction: 'none',
        }}
        onPointerDown={(e) => p.onPointerDown(e, task.id)}
        onPointerMove={(e) => p.onPointerMove(e, task.id)}
        onPointerUp={(e) => p.onPointerUp(e, task.id)}
        onPointerCancel={(e) => p.onPointerCancel(e, task.id)}
        onPointerEnter={() => p.onEnter(task.id)}
        onPointerLeave={() => p.onLeave(task.id)}
      >
        <PlanetBody task={task} member={p.member} hovered={p.hovered || p.dragging} now={p.now} />
      </div>
      {/* subtask moons: positioned per frame by SolarSystem's rAF loop */}
      <div
        ref={(el) => p.registerMoons(task.id, el)}
        className="absolute pointer-events-none"
        style={{ left: '50%', top: '50%', width: 0, height: 0, opacity: p.dimmed ? 0.25 : 1, transition: 'opacity 200ms' }}
      >
        {(task.subtasks ?? []).map((st) => (
          <div
            key={st.id}
            data-done={st.done || undefined}
            className="absolute rounded-full"
            style={{
              width: MOON_SIZE,
              height: MOON_SIZE,
              left: -MOON_SIZE / 2,
              top: -MOON_SIZE / 2,
              background: st.done ? MOON_DONE_COLOR : 'radial-gradient(circle at 35% 30%, #f8fafc 0%, #cbd5e1 70%)',
              boxShadow: st.done ? 'none' : `0 0 6px ${PRIORITY_COLORS[task.priority]}`,
              transition: 'background 300ms, box-shadow 300ms',
            }}
          />
        ))}
      </div>
    </div>
  )
}
