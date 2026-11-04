import { useEffect, useState } from 'react'
import { useStore } from './store'
import Header from './components/Header'
import SolarSystem from './components/SolarSystem'
import CompletedPanel from './components/CompletedPanel'
import TaskModal from './components/TaskModal'
import SprintModal from './components/SprintModal'
import TeamModal from './components/TeamModal'
import { primaryBtn } from './components/Modal'

export default function App() {
  const hasSprints = useStore((s) => s.sprints.length > 0)
  const activeSprintId = useStore((s) => s.activeSprintId)

  const [assigneeFilter, setAssigneeFilter] = useState<string | null>(null)
  const [taskOpen, setTaskOpen] = useState(false)
  const [taskId, setTaskId] = useState<string | null>(null)
  const [sprintOpen, setSprintOpen] = useState(false)
  const [sprintId, setSprintId] = useState<string | null>(null)
  const [teamOpen, setTeamOpen] = useState(false)

  const openTask = (id: string | null) => { setTaskId(id); setTaskOpen(true) }
  const openSprint = (id: string | null) => { setSprintId(id); setSprintOpen(true) }

  // Press "N" to create a new task (ignored while typing or when any modal is open)
  const anyModalOpen = taskOpen || sprintOpen || teamOpen
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== 'n' || e.metaKey || e.ctrlKey || e.altKey) return
      const t = e.target as HTMLElement | null
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) return
      if (anyModalOpen || !hasSprints) return
      e.preventDefault()
      setTaskId(null)
      setTaskOpen(true)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [anyModalOpen, hasSprints])

  return (
    <div className="flex h-screen flex-col bg-[#05060f]">
      <Header
        onNewTask={() => openTask(null)}
        onNewSprint={() => openSprint(null)}
        onEditSprint={() => activeSprintId && openSprint(activeSprintId)}
        onTeam={() => setTeamOpen(true)}
        assigneeFilter={assigneeFilter}
        onFilterChange={setAssigneeFilter}
      />
      <main className="relative flex-1 overflow-hidden">
        <SolarSystem onEditTask={(id) => openTask(id)} assigneeFilter={assigneeFilter} />
        <CompletedPanel onEditTask={(id) => openTask(id)} />
        {!hasSprints && (
          <div className="absolute inset-0 z-10 flex items-center justify-center p-6">
            <div className="max-w-sm rounded-2xl border border-white/10 bg-slate-900/80 p-8 text-center shadow-2xl backdrop-blur">
              <div className="mx-auto mb-4 h-14 w-14 rounded-full bg-gradient-to-br from-amber-300 via-orange-400 to-pink-500 shadow-lg shadow-orange-500/30" />
              <h2 className="mb-2 text-xl font-semibold text-slate-100">Your universe is empty</h2>
              <p className="mb-5 text-sm text-slate-400">Create a sprint to start launching tasks into orbit.</p>
              <button type="button" className={primaryBtn} onClick={() => openSprint(null)}>Create your first sprint</button>
            </div>
          </div>
        )}
      </main>
      <TaskModal open={taskOpen} taskId={taskId} onClose={() => setTaskOpen(false)} />
      <SprintModal open={sprintOpen} sprintId={sprintId} onClose={() => setSprintOpen(false)} />
      <TeamModal open={teamOpen} onClose={() => setTeamOpen(false)} />
    </div>
  )
}
