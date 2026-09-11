<template>
  <section class="temporary-shift-editor">
    <div class="temporary-shift-editor__notice">
      <i class="el-icon-warning" aria-hidden="true"></i>
      <span>选择人员及日期，可临时调整上下班时间，点击确定后生效，请谨慎操作哦！</span>
    </div>

    <div class="temporary-shift-editor__filters" :class="{ 'is-person-enabled': showPersonFilter }">
      <label v-if="showPersonFilter" class="temporary-shift-editor__filter">
        <span><i>*</i>人员</span>
        <el-select
          v-model="filterPersonIds"
          multiple
          collapse-tags
          filterable
          class="temporary-shift-editor__person-select"
          placeholder="请选择人员"
          popper-class="overseas-select-popper shift-picker-control-popper temporary-person-select-popper"
          @change="onPersonChange"
        >
          <el-option
            v-for="person in people"
            :key="person.id"
            :label="`${person.name}（${person.code}）`"
            :value="person.id"
          />
        </el-select>
      </label>
      <label class="temporary-shift-editor__filter">
        <span><i>*</i>班次日期</span>
        <el-date-picker
          v-model="shiftDate"
          type="date"
          format="yyyy-MM-dd"
          value-format="yyyy-MM-dd"
          :clearable="false"
          popper-class="shift-picker-control-popper"
          placeholder="请选择班次日期"
        />
      </label>
    </div>

    <div v-if="canEdit" class="temporary-shift-editor__table-wrap">
      <table class="temporary-shift-editor__table" aria-label="临时排班编辑表">
        <thead>
          <tr>
            <th>{{ showPersonFilter ? '人员' : '班次名称' }}</th>
            <th>是否跨夜</th>
            <th>上班边界时长</th>
            <th>上班打卡边界</th>
            <th>上下班时间</th>
            <th>下班边界时长</th>
            <th>下班打卡边界</th>
            <th>班次时长(时)</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in tableRows" :key="row.key">
            <td v-if="row.isFirstForPerson" :rowspan="row.rowspan" class="temporary-shift-editor__name">
              <template v-if="row.person">
                <strong>{{ row.person.name }}</strong>
                <small>{{ row.person.code }}</small>
              </template>
              <template v-else>{{ shiftName }}</template>
            </td>
            <td>
              <el-select
                :value="row.segment.crossNight"
                popper-class="overseas-select-popper shift-picker-control-popper"
                @change="updateSegment(row.segmentIndex, { crossNight: $event })"
              >
                <el-option label="否" value="否" />
                <el-option label="是" value="是" />
              </el-select>
            </td>
            <td>
              <el-select
                :value="startBoundaryHoursFor(row.segment)"
                popper-class="overseas-select-popper shift-picker-control-popper"
                @change="updateSegment(row.segmentIndex, { boundaryHours: $event, startBoundaryHours: $event })"
              >
                <el-option v-for="hour in boundaryOptions" :key="hour.value" :label="hour.label" :value="hour.value" />
              </el-select>
            </td>
            <td class="temporary-shift-editor__readonly">{{ startBoundaryFor(row.segment) }}</td>
            <td class="temporary-shift-editor__time-cell">
              <el-time-picker
                is-range
                :value="[row.segment.startTime, row.segment.endTime]"
                format="HH:mm"
                value-format="HH:mm"
                :clearable="false"
                range-separator="至"
                start-placeholder="上班时间"
                end-placeholder="下班时间"
                popper-class="shift-picker-control-popper temporary-shift-time-popper"
                class="temporary-shift-editor__time-range"
                @input="updateSegmentTimeRange(row.segmentIndex, $event)"
              />
            </td>
            <td>
              <el-select
                :value="endBoundaryHoursFor(row.segment)"
                popper-class="overseas-select-popper shift-picker-control-popper"
                @change="updateSegment(row.segmentIndex, { endBoundaryHours: $event })"
              >
                <el-option v-for="hour in boundaryOptions" :key="hour.value" :label="hour.label" :value="hour.value" />
              </el-select>
            </td>
            <td class="temporary-shift-editor__readonly">{{ endBoundaryFor(row.segment) }}</td>
            <td class="temporary-shift-editor__readonly">{{ durationFor(row.segment) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-else class="temporary-shift-editor__empty">请选择人员和日期后修改对应班次</div>
  </section>
</template>

<script>
function timeToMinutes(value) {
  const matched = String(value || '').match(/^(\d{1,2}):(\d{2})$/)
  return matched ? Number(matched[1]) * 60 + Number(matched[2]) : null
}

function minutesToTime(value) {
  const normalized = ((value % 1440) + 1440) % 1440
  return `${String(Math.floor(normalized / 60)).padStart(2, '0')}:${String(normalized % 60).padStart(2, '0')}`
}

export default {
  name: 'TemporaryShiftEditor',
  props: {
    value: { type: Object, default: () => ({}) },
    shiftName: { type: String, default: '--' },
    people: { type: Array, default: () => [] },
    dates: { type: Array, default: () => [] },
    selectedPersonId: { type: [String, Number], default: '' },
    showPersonFilter: { type: Boolean, default: false },
  },
  data() {
    return {
      filterPersonIds: this.selectedPersonId ? [this.selectedPersonId] : [],
      boundaryOptions: [0.5, 1, 1.5, 2, 3].map((value) => ({ label: String(value), value })),
    }
  },
  computed: {
    shiftDate: {
      get() { return this.value.date || '' },
      set(date) {
        this.updateValue({ date })
        this.emitTargetChange(this.filterPersonIds, date)
      },
    },
    editableSegments() {
      if (Array.isArray(this.value.segments) && this.value.segments.length) return this.value.segments
      if (!this.value.startTime || !this.value.endTime) return []
      const boundaryHours = Number(this.value.boundaryHours) || 1
      return [{
        crossNight: this.value.crossNight || '否',
        boundaryHours,
        startBoundaryHours: Number(this.value.startBoundaryHours ?? boundaryHours),
        endBoundaryHours: Number(this.value.endBoundaryHours ?? boundaryHours),
        startTime: this.value.startTime,
        endTime: this.value.endTime,
      }]
    },
    selectedPeople() {
      if (!this.showPersonFilter) return []
      const selectedIds = new Set(this.filterPersonIds.map((id) => String(id)))
      return this.people.filter((person) => selectedIds.has(String(person.id)))
    },
    tableRows() {
      const segments = this.editableSegments
      const people = this.showPersonFilter ? this.selectedPeople : [null]
      return people.flatMap((person, personIndex) => segments.map((segment, segmentIndex) => ({
        key: `${person ? person.id : 'single'}-${segmentIndex}`,
        person,
        personIndex,
        segment,
        segmentIndex,
        isFirstForPerson: segmentIndex === 0,
        rowspan: segments.length,
      })))
    },
    canEdit() {
      return Boolean(this.shiftDate && this.editableSegments.length && (!this.showPersonFilter || this.filterPersonIds.length))
    },
  },
  watch: {
    selectedPersonId: {
      immediate: true,
      handler(value) { this.filterPersonIds = value ? [value] : [] },
    },
  },
  methods: {
    updateValue(patch) {
      this.$emit('input', { ...this.value, ...patch })
    },
    emitTargetChange(personIds, date) {
      if (this.showPersonFilter) this.$emit('target-change', { personIds: [...(personIds || [])], date })
    },
    onPersonChange(personIds) {
      this.emitTargetChange(personIds, this.shiftDate)
    },
    updateSegment(index, patch) {
      const segments = this.editableSegments.map((segment, itemIndex) => (
        itemIndex === index ? { ...segment, ...patch } : { ...segment }
      ))
      this.updateValue({ segments, ...segments[0] })
    },
    updateSegmentTimeRange(index, value) {
      if (!Array.isArray(value) || value.length !== 2) return
      const next = {
        ...(this.editableSegments[index] || {}),
        startTime: value[0],
        endTime: value[1],
      }
      next.crossNight = this.inferCrossNight(next.startTime, next.endTime)
      this.updateSegment(index, next)
    },
    inferCrossNight(startTime, endTime) {
      const start = timeToMinutes(startTime)
      const end = timeToMinutes(endTime)
      return start != null && end != null && end <= start ? '是' : '否'
    },
    startBoundaryHoursFor(segment) {
      const value = segment.startBoundaryHours != null ? segment.startBoundaryHours : segment.boundaryHours
      return Number(value) || 0
    },
    endBoundaryHoursFor(segment) {
      const value = segment.endBoundaryHours != null ? segment.endBoundaryHours : segment.boundaryHours
      return Number(value) || 0
    },
    startBoundaryFor(segment) {
      const start = timeToMinutes(segment.startTime)
      return start == null ? '--' : minutesToTime(start - this.startBoundaryHoursFor(segment) * 60)
    },
    endBoundaryFor(segment) {
      const end = timeToMinutes(segment.endTime)
      return end == null ? '--' : minutesToTime(end + this.endBoundaryHoursFor(segment) * 60)
    },
    durationFor(segment) {
      const start = timeToMinutes(segment.startTime)
      let end = timeToMinutes(segment.endTime)
      if (start == null || end == null) return '--'
      if (segment.crossNight === '是' || end <= start) end += 1440
      const hours = Math.round(((end - start) / 60) * 10) / 10
      return Number.isInteger(hours) ? String(hours) : hours.toFixed(1)
    },
  },
}
</script>

<style scoped>
.temporary-shift-editor { display: flex; flex-direction: column; gap: 16px; width: 100%; min-width: 0; color: #525765; font-size: 14px; }
.temporary-shift-editor__notice { display: flex; align-items: flex-start; gap: 8px; min-height: 40px; padding: 8px 12px; border: 1px solid #ffe1a8; border-radius: 8px; background: #fff8e6; font-size: 14px; line-height: 22px; }
.temporary-shift-editor__notice i { flex-shrink: 0; margin-top: 3px; color: #fa8c16; font-size: 16px; }
.temporary-shift-editor__filters { display: grid; grid-template-columns: minmax(240px, 1fr); row-gap: 16px; column-gap: 24px; margin-top: 0; }
.temporary-shift-editor__filters.is-person-enabled { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.temporary-shift-editor__filter { display: grid; grid-template-columns: 72px minmax(0, 1fr); align-items: center; gap: 8px; min-width: 0; font-size: 14px; }
.temporary-shift-editor__filter > span { color: #525765; text-align: right; white-space: nowrap; }
.temporary-shift-editor__filter > span i { margin-right: 4px; color: #f5222d; font-style: normal; }
.temporary-shift-editor__filter .el-select,
.temporary-shift-editor__filter .el-date-editor { width: 100%; }
.temporary-shift-editor__table-wrap { box-sizing: border-box; width: 100%; max-width: 100%; min-width: 0; max-height: calc(100vh - 360px); margin-top: 0; overflow: auto; overscroll-behavior: contain; touch-action: pan-x pan-y; border: 1px solid #e4e5e9; border-radius: 8px; background: #fff; isolation: isolate; }
.temporary-shift-editor__table { width: 1120px; min-width: 1120px; table-layout: fixed; border-collapse: separate; border-spacing: 0; color: #525765; font-size: 14px; }
.temporary-shift-editor__table th { height: 48px; padding: 8px; background: #f5f5f6; color: #23252b; font-weight: 500; text-align: left; white-space: nowrap; }
.temporary-shift-editor__table td { height: 48px; padding: 8px; background: #fff; vertical-align: middle; }
.temporary-shift-editor__table th,
.temporary-shift-editor__table td { border-right: 1px solid #e4e5e9; border-bottom: 1px solid #e4e5e9; }
.temporary-shift-editor__table tr > :last-child { border-right: 0; }
.temporary-shift-editor__table tbody tr:last-child td { border-bottom: 0; }
.temporary-shift-editor__table th:nth-child(1) { width: 96px; }
.temporary-shift-editor__table th:nth-child(2) { width: 96px; }
.temporary-shift-editor__table th:nth-child(3) { width: 112px; }
.temporary-shift-editor__table th:nth-child(4) { width: 112px; }
.temporary-shift-editor__table th:nth-child(5) { width: 240px; }
.temporary-shift-editor__table th:nth-child(6) { width: 112px; }
.temporary-shift-editor__table th:nth-child(7) { width: 112px; }
.temporary-shift-editor__table th:nth-child(8) { width: 96px; }
.temporary-shift-editor__table th:last-child,
.temporary-shift-editor__table td:last-child { position: sticky; right: 0; width: 96px; min-width: 96px; background-clip: padding-box; box-shadow: -1px 0 0 #e4e5e9; }
.temporary-shift-editor__table th:last-child { z-index: 3; background: #f5f5f6; }
.temporary-shift-editor__table td:last-child { z-index: 2; background: #fff; }
.temporary-shift-editor__name { color: #23252b; font-weight: 500; text-align: left; }
.temporary-shift-editor__name strong,
.temporary-shift-editor__name small { display: block; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.temporary-shift-editor__name strong { color: #23252b; font-size: 14px; font-weight: 500; line-height: 20px; }
.temporary-shift-editor__name small { color: #868d9f; font-size: 12px; font-weight: 400; line-height: 16px; }
.temporary-shift-editor__readonly { color: #525765; }
.temporary-shift-editor__empty { display: flex; align-items: center; justify-content: center; min-height: 120px; margin-top: 0; border: 1px dashed #e4e5e9; border-radius: 8px; background: #fafafb; color: #868d9f; font-size: 14px; }
.temporary-shift-editor ::v-deep .el-input__inner { height: 32px; border-radius: 8px; font-size: 14px; line-height: 32px; }
.temporary-shift-editor ::v-deep .el-input__icon { line-height: 32px; }
.temporary-shift-editor__table ::v-deep .el-select,
.temporary-shift-editor__table ::v-deep .el-date-editor { width: 100%; }
.temporary-shift-editor__time-range.el-range-editor.el-input__inner { width: 100%; height: 32px; padding: 0 8px; border-radius: 8px; }
.temporary-shift-editor__time-range.el-range-editor:hover { border-color: #d8e2fc; }
.temporary-shift-editor__time-range.el-range-editor.is-active,
.temporary-shift-editor__time-range.el-range-editor.is-active:hover { border-color: #3c6ef0; box-shadow: none; }
.temporary-shift-editor__time-range ::v-deep .el-range-input { width: calc(50% - 22px); color: #23252b; font-size: 14px; }
.temporary-shift-editor__time-range ::v-deep .el-range-separator { width: 20px; padding: 0; color: #525765; font-size: 14px; line-height: 30px; }
.temporary-shift-editor__time-range ::v-deep .el-range__icon,
.temporary-shift-editor__time-range ::v-deep .el-range__close-icon { line-height: 30px; }
</style>

<style>
.shift-picker-dialog.is-temporary.el-dialog { width: min(660px, calc(100vw - 32px)) !important; min-width: 0; max-width: 660px; }
.shift-picker-dialog.is-temporary .el-dialog__body { padding: 16px 20px; }
.shift-picker-dialog.is-toolbar-temporary.el-dialog { top: 50% !important; left: 50% !important; width: min(800px, calc(100vw - 32px)) !important; min-width: 0; max-width: 800px; transform: translate(-50%, -50%) !important; }
.shift-picker-dialog.is-toolbar-temporary .el-dialog__header { padding: 0 24px; }
.shift-picker-dialog.is-toolbar-temporary .el-dialog__headerbtn { top: 16px; right: 24px; }
.shift-picker-dialog.is-toolbar-temporary .el-dialog__body { padding: 24px; }
.shift-picker-dialog.is-toolbar-temporary .el-dialog__footer { padding: 12px 24px 16px; }

/* 人员多选标签使用紧凑矩形态，避免默认胶囊样式。 */
.shift-picker-dialog .temporary-shift-editor__person-select .el-select__tags { flex-wrap: nowrap; overflow: hidden; }
.shift-picker-dialog .temporary-shift-editor__person-select .el-tag {
  height: 24px;
  padding: 0 8px;
  border: 0;
  border-radius: 4px;
  background: #f5f5f6;
  color: #23252b;
  line-height: 24px;
}
.shift-picker-dialog .temporary-shift-editor__person-select .el-tag .el-tag__close { color: #868d9f; background: #d9d9d9; }

/* 人员下拉使用16px标准复选框；选中只改变勾选框，不改变整行文字颜色。 */
.temporary-person-select-popper.overseas-select-popper.el-select-dropdown .el-select-dropdown__list { padding-right: 0; padding-left: 0; }
.temporary-person-select-popper.overseas-select-popper.el-select-dropdown .el-select-dropdown__item,
.temporary-person-select-popper.overseas-select-popper.el-select-dropdown .el-select-dropdown__item.selected {
  position: relative;
  display: flex;
  align-items: center;
  height: 40px;
  padding: 0 12px 0 40px;
  border-radius: 0;
  background: #fff;
  color: #23252b;
  font-weight: 400;
  line-height: 40px;
}
.temporary-person-select-popper.overseas-select-popper.el-select-dropdown .el-select-dropdown__item.hover,
.temporary-person-select-popper.overseas-select-popper.el-select-dropdown .el-select-dropdown__item:hover,
.temporary-person-select-popper.overseas-select-popper.el-select-dropdown .el-select-dropdown__item.selected.hover,
.temporary-person-select-popper.overseas-select-popper.el-select-dropdown .el-select-dropdown__item.selected:hover { background: #f5f5f6; color: #23252b; }
.temporary-person-select-popper.el-select-dropdown.is-multiple .el-select-dropdown__item::before {
  position: absolute;
  top: 50% !important;
  left: 12px !important;
  box-sizing: border-box;
  width: 16px !important;
  height: 16px !important;
  border: 1px solid #d9d9d9 !important;
  border-radius: 4px !important;
  background: #fff !important;
  content: '';
  pointer-events: none;
  transform: translateY(-50%) !important;
}
.temporary-person-select-popper.el-select-dropdown.is-multiple .el-select-dropdown__item.selected::before { border-color: #3c6ef0 !important; background: #3c6ef0 !important; }
.temporary-person-select-popper.el-select-dropdown.is-multiple .el-select-dropdown__item::after {
  position: absolute;
  top: calc(50% - 6px) !important;
  right: auto !important;
  bottom: auto !important;
  left: 17px !important;
  display: block !important;
  box-sizing: border-box;
  width: 3px !important;
  height: 7px !important;
  margin: 0 !important;
  border: solid transparent !important;
  border-width: 0 2px 2px 0 !important;
  content: '' !important;
  font-size: 0 !important;
  line-height: 0 !important;
  pointer-events: none;
  transform: rotate(45deg) !important;
  transform-origin: center !important;
}
.temporary-person-select-popper.el-select-dropdown.is-multiple .el-select-dropdown__item.selected::after { border-color: #fff !important; }

.temporary-shift-time-popper.el-time-range-picker {
  width: 354px;
  overflow: hidden;
  border: 0;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(35, 37, 43, .16);
  color: #525765;
  font-size: 14px;
}
.temporary-shift-time-popper .el-time-range-picker__content { padding: 0; }
.temporary-shift-time-popper .el-time-range-picker__cell { padding: 0; }
.temporary-shift-time-popper .el-time-range-picker__cell:first-child { border-right: 1px solid #e4e5e9; }
.temporary-shift-time-popper .el-time-range-picker__header { height: 48px; margin: 0; border-bottom: 0; color: #23252b; font-size: 14px; font-weight: 500; line-height: 48px; }
.temporary-shift-time-popper .el-time-range-picker__body { height: 224px; overflow: hidden; border: 0; border-radius: 0; }
.temporary-shift-time-popper .el-time-spinner__wrapper { max-height: 224px; }
.temporary-shift-time-popper .el-time-spinner__wrapper::before,
.temporary-shift-time-popper .el-time-spinner__wrapper::after,
.temporary-shift-time-popper .el-time-panel__content::before,
.temporary-shift-time-popper .el-time-panel__content::after { display: none !important; border: 0 !important; }
.temporary-shift-time-popper .el-time-spinner__item { width: calc(100% - 12px); height: 32px; margin: 0 6px; box-sizing: border-box; border-radius: 8px; color: #525765; font-size: 14px; line-height: 32px; }
.temporary-shift-time-popper .el-time-spinner__item:hover:not(.disabled):not(.active) { background: #f5f5f6; }
.temporary-shift-time-popper .el-time-spinner__item.active:not(.disabled) { background: #ecf1fe; color: #3c6ef0; font-weight: 500; }
.temporary-shift-time-popper .el-time-panel__footer { display: flex; min-height: 48px; padding: 8px 12px; align-items: center; justify-content: flex-end; box-sizing: border-box; border-color: #e4e5e9; line-height: 32px; }
.temporary-shift-time-popper .el-time-panel__footer::before { content: '此刻'; margin-right: auto; color: #3c6ef0; font-size: 14px; line-height: 32px; }
.temporary-shift-time-popper .el-time-panel__footer button { display: inline-flex; height: 32px; margin: 0 0 0 8px; padding: 0 12px; align-items: center; justify-content: center; box-sizing: border-box; border-radius: 8px; font-size: 14px; line-height: 32px; }
.temporary-shift-time-popper .el-time-panel__btn.cancel { color: #525765; background: #f5f5f6; }
.temporary-shift-time-popper .el-time-panel__btn.confirm { color: #fff; background: #3c6ef0; }
</style>
