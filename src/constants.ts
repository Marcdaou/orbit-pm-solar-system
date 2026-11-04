import type { Priority, Status } from './types'

export type OrbitStatus = Exclude<Status, 'done'>

export interface OrbitConfig {
  status: OrbitStatus
  label: string
  /** radius as a fraction of the max orbit radius (min(width,height)/2 minus padding) */
  radius: number
  color: string
  /** angular speed in radians/second */
  speed: number
}

// Inner -> outer
export const ORBITS: OrbitConfig[] = [
  { status: 'discuss', label: 'To Discuss', radius: 0.34, color: '#f472b6', speed: 0.30 },
  { status: 'progress', label: 'In Progress', radius: 0.55, color: '#fbbf24', speed: 0.22 },
  { status: 'ready', label: 'Ready for Testing', radius: 0.76, color: '#38bdf8', speed: 0.16 },
  { status: 'testing', label: 'In Testing', radius: 0.97, color: '#a78bfa', speed: 0.12 },
]

export const STATUS_LABELS: Record<Status, string> = {
  discuss: 'To Discuss',
  progress: 'In Progress',
  ready: 'Ready for Testing',
  testing: 'In Testing',
  done: 'Done',
}

export const PRIORITY_COLORS: Record<Priority, string> = {
  low: '#34d399',
  med: '#fbbf24',
  high: '#f87171',
}

export const MEMBER_COLORS = ['#f472b6', '#60a5fa', '#34d399', '#fbbf24', '#a78bfa', '#fb923c', '#2dd4bf', '#f87171']

/** Planet diameter in px, by priority: higher priority = bigger */
export const PRIORITY_SIZES: Record<Priority, number> = {
  low: 26,
  med: 38,
  high: 54,
}

/** Subtask moons: diameter (px), gap from planet surface (px), angular speed (rad/s), finished-moon color */
export const MOON_SIZE = 7
export const MOON_GAP = 7
export const MOON_SPEED = 1.6
export const MOON_DONE_COLOR = '#4b5563'
