import { decorateShift } from '../utils/shiftPalette'

function timeIntervals(time = '') {
  return String(time || '').split('/').map((range) => {
    const matched = range.match(/(\d{1,2}):(\d{2})\s*[-~～—–]\s*(\d{1,2}):(\d{2})/)
    if (!matched) return null
    const start = Number(matched[1]) * 60 + Number(matched[2])
    let end = Number(matched[3]) * 60 + Number(matched[4])
    if (end <= start) end += 1440
    return [start, end]
  }).filter(Boolean)
}

function boundaryInterval(shift = {}) {
  const sourceSegments = Array.isArray(shift.segments) && shift.segments.length
    ? shift.segments
    : timeIntervals(shift.time).map(([start, end]) => ({ start, end }))
  if (!sourceSegments.length) return null
  let previousEnd = null
  const normalized = sourceSegments.map((segment) => {
    let start = Number.isFinite(segment.start) ? segment.start : timeIntervals(`${segment.startTime}-${segment.endTime}`)[0]?.[0]
    let end = Number.isFinite(segment.end) ? segment.end : timeIntervals(`${segment.startTime}-${segment.endTime}`)[0]?.[1]
    if (!Number.isFinite(start) || !Number.isFinite(end)) return null
    while (previousEnd !== null && start < previousEnd) {
      start += 1440
      end += 1440
    }
    if (end <= start) end += 1440
    previousEnd = end
    return { start, end, startBound: segment.startBound, endBound: segment.endBound }
  }).filter(Boolean)
  if (!normalized.length) return null
  const first = normalized[0]
  const last = normalized[normalized.length - 1]
  const startBound = Number(first.startBound ?? shift.startBoundaryHours ?? 0.5) || 0
  const endBound = Number(last.endBound ?? shift.endBoundaryHours ?? 0.5) || 0
  return [first.start - startBound * 60, last.end + endBound * 60]
}

function overlapsByBoundary(first = {}, second = {}) {
  const firstRange = boundaryInterval(first)
  const secondRange = boundaryInterval(second)
  if (!firstRange || !secondRange) return false
  return [-1440, 0, 1440].some((offset) => (
    firstRange[0] < secondRange[1] + offset && secondRange[0] + offset < firstRange[1]
  ))
}

export default {
  methods: {
    togglePickerShift(shiftId, selected) {
      if (!selected) {
        this.selectedPickerShiftIds = this.selectedPickerShiftIds.filter((id) => id !== shiftId)
        return
      }
      const nextShift = this.resolveZnShiftRecord(shiftId)
      const conflictIds = this.selectedPickerShiftIds.filter((id) => {
        const selectedShift = this.resolveZnShiftRecord(id)
        return selectedShift && nextShift && overlapsByBoundary(selectedShift, nextShift)
      })
      this.selectedPickerShiftIds = this.selectedPickerShiftIds
        .filter((id) => !conflictIds.includes(id) && id !== shiftId)
        .concat(shiftId)
      if (conflictIds.length && !this.isBackOfficeZn) this.showShiftPickerMessage('warning', '已自动取消边界冲突班次')
    },
    clearPickerShifts() {
      this.selectedPickerShiftIds = []
    },
    resolvePickerShiftValue() {
      if (!this.selectedPickerShiftIds.length) return null
      if (this.selectedPickerShiftIds.length > 1) {
        const ids = [...this.selectedPickerShiftIds]
        const id = `COMBO:${ids.join('+')}`
        if (this.shifts.some((shift) => shift.id === id)) return id
        const selected = ids.map((shiftId) => this.resolveZnShiftRecord(shiftId)).filter(Boolean)
        this.shifts = this.shifts.concat([decorateShift({
          ...(selected[0] || {}), id,
          name: selected.map((shift) => shift.name).join(' / '),
          short: selected.map((shift) => shift.short || shift.name).join('/'),
          time: selected.map((shift) => shift.time).join(' / '),
          constituentIds: ids, composite: true, isRest: false, isEmpty: false,
        })])
        return id
      }
      const nextId = this.selectedPickerShiftIds[0]
      if (nextId === 'EMPTY') return 'EMPTY'
      const shift = this.shifts.find((item) => item.id === nextId)
      return shift && shift.isRest ? '休' : nextId
    },
    showShiftPickerMessage(type, message) {
      if (this._shiftPickerMessageInstance && typeof this._shiftPickerMessageInstance.close === 'function') {
        this._shiftPickerMessageInstance.close()
      }
      const instance = this.$message({
        type, message, duration: 3000, showClose: false,
        onClose: () => {
          if (this._shiftPickerMessageInstance === instance) this._shiftPickerMessageInstance = null
        },
      })
      this._shiftPickerMessageInstance = instance
    },
  },
}
