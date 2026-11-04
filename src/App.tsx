import { useCallback, useEffect, useState } from 'react'
import { useStore } from './store'
import Header from './components/Header'
import SolarSystem from './components/SolarSystem'
import CompletedPanel from './components/CompletedPanel'
import TaskModal from './components/TaskModal'
import SprintModal from './components/SprintModal'
import TeamModal from './components/TeamModal'
import AnalyticsPanel from './components/AnalyticsPanel'
import FilterBar from './components/FilterBar'
import { primaryBtn } from './components/Modal'
import { EMPTY_FILTERS, matchesFilters, type TaskFilters } from './filters'

export default function App() {
  const hasSprints = useStore((s) => s.sprints.length > 0)
  const activeSprintId = useStore((s) => s.activeSprintId)

  const tasks = useStore((s) => s.tasks)
  const members = useStore((s) => s.members)
  const [filters, setFilters] = useState<TaskFilters>(EMPTY_FILTERS)
  const orbiting = tasks.filter((t) => t.sprintId === activeSprintId && t.status !== 'done')
  const matchCount = orbiting.filter((t) => matchesFilters(t, filters, members)).length
  // Clicking an avatar spotlights only that member; clicking it again clears the spotlight
  const spotlight = filters.assignees.length === 1 ? filters.assignees[0] : null
  const onSpotlight = (id: string | null) => setFilters((f) => ({ ...f, assignees: id ? [id] : [] }))
  // Browser tab title mirrors active sprint progress, e.g. "62% · Sprint 1 — Orbit PM"
  const sprintName = useStore((s) => s.sprints.find((sp) => sp.id === s.activeSprintId)?.name)
  const sprintTasks = tasks.filter((t) => t.sprintId === activeSprintId)
  const sprintDone = sprintTasks.filter((t) => t.status === 'done').length
  const titlePercent = sprintTasks.length ? Math.round((sprintDone / sprintTasks.length) * 100) : 0
  useEffect(() => {
    document.title = sprintName ? `${titlePercent}% · ${sprintName} — Orbit PM` : 'Orbit PM'
  }, [sprintName, titlePercent])

  const [taskOpen, setTaskOpen] = useState(false)
  const [taskId, setTaskId] = useState<string | null>(null)
  const [sprintOpen, setSprintOpen] = useState(false)
  const [sprintId, setSprintId] = useState<string | null>(null)
  const [teamOpen, setTeamOpen] = useState(false)
  const [analyticsOpen, setAnalyticsOpen] = useState(false)
  const closeAnalytics = useCallback(() => setAnalyticsOpen(false), [])

  const openTask = (id: string | null) => { setTaskId(id); setTaskOpen(true) }
  const openSprint = (id: string | null) => { setSprintId(id); setSprintOpen(true) }

  // Shortcuts: "N" new task; Ctrl/Cmd+Z undo; Ctrl/Cmd+Shift+Z or Ctrl+Y redo.
  // Ignored while typing (inputs keep native text undo) or when any modal is open.
  const anyModalOpen = taskOpen || sprintOpen || teamOpen || analyticsOpen
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) return
      if (anyModalOpen) return
      const k = e.key.toLowerCase()
      if ((e.metaKey || e.ctrlKey) && !e.altKey && (k === 'z' || k === 'y')) {
        e.preventDefault()
        const { undo, redo } = useStore.getState()
        if (k === 'y' || e.shiftKey) redo()
        else undo()
        return
      }
      if (k !== 'n' || e.metaKey || e.ctrlKey || e.altKey) return
      if (!hasSprints) return
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
        onAnalytics={() => setAnalyticsOpen((o) => !o)}
        spotlight={spotlight}
        onSpotlight={onSpotlight}
      />
      <main className="relative flex-1 overflow-hidden">
        <SolarSystem onEditTask={(id) => openTask(id)} filters={filters} />
        {hasSprints && <FilterBar filters={filters} onChange={setFilters} matchCount={matchCount} total={orbiting.length} />}
        <CompletedPanel onEditTask={(id) => openTask(id)} />
        <AnalyticsPanel open={analyticsOpen} onClose={closeAnalytics} />
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
