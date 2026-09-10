import { decorateShift, familyLabelOf, sortShiftsByFamily } from '../utils/shiftPalette'

const FALLBACK_EXCEPTIONS = {
  3: {
    type: '排期异常',
    detail: '当前排班存在连续出勤超出规则的情况，请调整后再保存。',
  },
  8: {
    type: '考勤异常',
    detail: '2026-09-08 打卡记录缺失，请核实员工考勤记录。',
  },
}

export default {
  data() {
    return {
      editingShiftId: null,
      editingRotationId: null,
      exceptionDialogVisible: false,
      exceptionEmployee: null,
    }
  },
  computed: {
    activeLegendShift() {
      return this.shifts.find((item) => item.id === this.editingShiftId) || null
    },
    activeLegendRotation() {
      return this.rotations.find((item) => item.id === this.editingRotationId) || null
    },
  },
  methods: {
    editLegendShift(shift) {
      this.editingShiftId = shift.id
      this.shiftEditorVisible = true
    },
    editLegendRotation(rotation) {
      this.editingRotationId = rotation.id
      this.rotationEditorVisible = true
    },
    saveLegendShift(payload = {}) {
      const current = this.activeLegendShift
      if (!current) return
      const family = payload.family || current.family || 'morning'
      const level = Number(payload.level) || Number(current.level) || 1
      const familyLabel = familyLabelOf(family)
      const jumped = payload.shiftType === 'jump' ? '(跳)' : ''
      const name = family === 'rest' ? '休息' : `${jumped}${familyLabel}${level}次`
      const short = family === 'rest' ? '休' : `${jumped}${familyLabel.replace('班', '')}${level}`
      const updated = decorateShift({
        ...current,
        name,
        short,
        family,
        level,
        time: payload.time || current.time,
        shiftType: payload.shiftType || 'fixed',
        jumpCount: payload.jumpCount || null,
        crossNight: payload.crossNight || 'no',
        segments: payload.segments || [],
      })
      this.shifts = sortShiftsByFamily(this.shifts.map((item) => (item.id === current.id ? updated : item)))
      this.shiftEditorVisible = false
      this.editingShiftId = null
      this.markBoardDirty()
      this.notify(`班次“${name}”已修改`)
    },
    deleteLegendShift(id) {
      const current = this.shifts.find((item) => item.id === id)
      this.shifts = this.shifts.filter((item) => item.id !== id)
      this.boardRows = this.boardRows.map((row) => ({
        ...row,
        shifts: Object.fromEntries(Object.entries(row.shifts || {}).map(([key, value]) => [key, value === id ? '休' : value])),
      }))
      this.cycleConfigs = this.cycleConfigs.map((item) => ({ ...item, pattern: (item.pattern || []).map((value) => (value === id ? '休' : value)) }))
      this.rotations = this.rotations.map((item) => ({ ...item, dayShifts: (item.dayShifts || []).map((value) => (value === id ? '' : value)) }))
      this.shiftEditorVisible = false
      this.editingShiftId = null
      this.markBoardDirty()
      this.notify(`班次“${current ? current.name : id}”已删除`)
    },
    saveLegendRotation(payload = {}) {
      const current = this.activeLegendRotation
      if (!current) return
      this.rotations = this.rotations.map((item) => (item.id === current.id ? {
        ...item,
        name: payload.name,
        cycleDays: payload.cycleDays,
        content: payload.content,
        dayShifts: payload.dayShifts || [],
        time: `${payload.cycleDays || 7}天周期`,
      } : item))
      this.rotationEditorVisible = false
      this.editingRotationId = null
      this.markBoardDirty()
      this.notify(`轮班规则“${payload.name}”已修改`)
    },
    deleteLegendRotation(id) {
      const current = this.rotations.find((item) => item.id === id)
      this.rotations = this.rotations.filter((item) => item.id !== id)
      this.rotationEditorVisible = false
      this.editingRotationId = null
      this.markBoardDirty()
      this.notify(`轮班规则“${current ? current.name : id}”已删除`)
    },
    rotationLegendStyle() {
      return { background: '#e6edff', color: '#3c6ef0', borderColor: '#c8d7fb' }
    },
    personException(row) {
      return row.exception || FALLBACK_EXCEPTIONS[row.id] || null
    },
    openPersonException(row) {
      const exception = this.personException(row)
      if (!exception) return
      this.exceptionEmployee = { ...row, exception }
      this.exceptionDialogVisible = true
    },
  },
}
