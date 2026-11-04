import type { Snapshot } from './store'

const STATUSES = ['discuss', 'progress', 'ready', 'testing', 'done']
const PRIORITIES = ['low', 'med', 'high']

export function exportJSON(data: Snapshot) {
  const payload = { app: 'orbit-pm', version: 1, exportedAt: new Date().toISOString(), ...data }
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `orbit-pm-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null
const str = (v: unknown) => typeof v === 'string'

/** Parse and validate an exported file. Throws an Error with a readable message on bad input. */
export function parseBackup(text: string): Snapshot {
  let raw: unknown
  try { raw = JSON.parse(text) } catch { throw new Error('File is not valid JSON.') }
  if (!isObj(raw)) throw new Error('Unexpected file format.')
  const { members, sprints, tasks, activeSprintId } = raw
  if (!Array.isArray(members) || !Array.isArray(sprints) || !Array.isArray(tasks))
    throw new Error('Missing members, sprints or tasks.')
  if (!members.every((m) => isObj(m) && str(m.id) && str(m.name) && str(m.color) && str(m.initials)))
    throw new Error('Invalid member entry.')
  if (!sprints.every((s) => isObj(s) && str(s.id) && str(s.name)))
    throw new Error('Invalid sprint entry.')
  if (!tasks.every((t) => isObj(t) && str(t.id) && str(t.sprintId) && str(t.title) && STATUSES.includes(t.status as string) && PRIORITIES.includes(t.priority as string)))
    throw new Error('Invalid task entry.')
  const sprintIds = new Set(sprints.map((s) => (s as { id: string }).id))
  const active = str(activeSprintId) && sprintIds.has(activeSprintId) ? activeSprintId : (sprints[0] as { id: string } | undefined)?.id ?? null
  return {
    members: members as Snapshot['members'],
    sprints: sprints.map((s) => ({ goal: '', startDate: '', endDate: '', ...(s as object) })) as Snapshot['sprints'],
    tasks: tasks.map((t) => ({ description: '', assigneeId: null, createdAt: Date.now(), ...(t as object) })) as Snapshot['tasks'],
    activeSprintId: active,
  }
}
