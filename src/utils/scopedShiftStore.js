const STORAGE_KEY = 'attendance-scoped-shifts-v1'

function scopeKey(context = {}) {
  const department = context.department || 'default'
  const attendanceGroup = context.attendanceGroup || 'default'
  return `${department}::${attendanceGroup}`
}

function readStore() {
  if (typeof window === 'undefined' || !window.localStorage) return {}
  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '{}')
  } catch (error) {
    return {}
  }
}

export function loadScopedShifts(context = {}) {
  const rows = readStore()[scopeKey(context)]
  return Array.isArray(rows) ? rows.map((row) => ({ ...row })) : []
}

export function mergeScopedShifts(base = [], context = {}) {
  const shifts = new Map((base || []).map((shift) => [shift.id, shift]))
  loadScopedShifts(context).forEach((shift) => {
    if (Array.from(shifts.values()).some((item) => item.id === shift.id || item.name === shift.name)) return
    shifts.set(shift.id, shift)
  })
  return Array.from(shifts.values())
}

export function upsertScopedShift(context = {}, shift = {}) {
  if (!shift.id || typeof window === 'undefined' || !window.localStorage) return
  const store = readStore()
  const key = scopeKey(context)
  const rows = Array.isArray(store[key]) ? store[key] : []
  const index = rows.findIndex((item) => item.id === shift.id || item.name === shift.name)
  const value = JSON.parse(JSON.stringify(shift))
  if (index >= 0) rows.splice(index, 1, value)
  else rows.push(value)
  store[key] = rows
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
}
