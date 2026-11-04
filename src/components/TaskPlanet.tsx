import type { Member, Task } from '../types'
import { PRIORITY_COLORS, PRIORITY_SIZES } from '../constants'

export function PlanetBody({ task, member, hovered = false }: { task: Task; member?: Member; hovered?: boolean }) {
  const pc = PRIORITY_COLORS[task.priority]
  const size = PRIORITY_SIZES[task.priority]
  return (
    <div className="relative flex flex-col items-center" style={{ width: size }}>
      <div
        className="rounded-full flex items-center justify-center font-bold transition-transform duration-150"
        style={{
          width: size,
          height: size,
          fontSize: Math.max(8, Math.round(size * 0.32)),
          transform: hovered ? 'scale(1.25)' : 'scale(1)',
          background: 'radial-gradient(circle at 35% 30%, #334155 0%, #0f172a 80%)',
          border: `2px solid ${pc}`,
          boxShadow: `0 0 ${hovered ? 22 : 12}px ${pc}aa, inset 0 0 8px ${pc}55`,
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
  dimmed: boolean
  dragging: boolean
  hovered: boolean
  register: (id: string, el: HTMLDivElement | null) => void
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
      style={{ width: PRIORITY_SIZES[task.priority], height: PRIORITY_SIZES[task.priority], marginLeft: -PRIORITY_SIZES[task.priority] / 2, marginTop: -PRIORITY_SIZES[task.priority] / 2, zIndex: p.dragging ? 50 : p.hovered ? 40 : 20 }}
    >
      <div
        className="select-none"
        style={{
          opacity: p.dimmed ? 0.25 : 1,
          transition: 'opacity 200ms',
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
        <PlanetBody task={task} member={p.member} hovered={p.hovered || p.dragging} />
      </div>
    </div>
  )
}
