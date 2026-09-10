<template>
  <el-drawer
    title="添加员工"
    :visible.sync="innerVisible"
    direction="rtl"
    :size="1000"
    append-to-body
    :wrapper-closable="true"
    custom-class="zn-form-drawer zn-add-employee-drawer"
    @open="onOpen"
  >
    <div class="zn-form-drawer__body zn-add-employee-drawer__body">
      <div class="arrow-steps zn-add-employee-steps" role="list" aria-label="添加员工步骤">
        <div
          v-for="(item, index) in employeeSteps"
          :key="item.title"
          class="arrow-step"
          :class="{
            'is-active': index === activeEmployeeStep,
            'is-complete': index < activeEmployeeStep,
            'is-pending': index > activeEmployeeStep,
            'is-start': index === 0,
            'is-end': index === employeeSteps.length - 1,
          }"
          role="listitem"
          :aria-current="index === activeEmployeeStep ? 'step' : null"
        >
          <span class="arrow-step__skin" aria-hidden="true">
            <i class="arrow-step__cap arrow-step__cap--l"></i>
            <i class="arrow-step__body"></i>
            <i class="arrow-step__cap arrow-step__cap--r"></i>
          </span>
          <span class="arrow-step__num" aria-hidden="true">{{ index + 1 }}</span>
          <span class="arrow-step__label">
            <img class="arrow-step__icon" :src="employeeStepStateIcon(index)" alt="" />
            <strong>{{ item.title }}</strong>
          </span>
        </div>
      </div>
      <template v-if="step === 'select'">
      <el-form
        :model="query"
        label-position="right"
        label-width="88px"
        class="zn-form-drawer__form"
        @submit.native.prevent
      >
        <div class="zn-form-drawer__grid zn-form-drawer__grid--3 zn-form-drawer__grid--ellipsis zn-add-employee-drawer__query-grid">
          <el-form-item label="部门" required>
            <el-select v-model="query.department" filterable placeholder="请选择部门" popper-class="overseas-select-popper">
              <el-option
                v-for="item in departmentOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="岗位">
            <el-select v-model="query.position" placeholder="全部" popper-class="overseas-select-popper">
              <el-option label="全部" value="all" />
              <el-option label="分拣员岗" value="sorter" />
            </el-select>
          </el-form-item>
          <el-form-item label="ERP">
            <el-input v-model="query.erp" clearable placeholder="请输入ERP" />
          </el-form-item>
          <el-form-item label="姓名">
            <el-input v-model="query.name" clearable placeholder="请输入姓名" />
          </el-form-item>
          <el-form-item label="用工性质">
            <el-select v-model="query.empType" clearable placeholder="请选择用工性质" popper-class="overseas-select-popper">
              <el-option label="A-全日制劳动合同工" value="A" />
              <el-option label="I-非全日制劳动合同工" value="I" />
            </el-select>
          </el-form-item>
          <div class="zn-form-drawer__query-actions">
            <el-button @click="resetQuery">重置</el-button>
            <el-button type="primary" @click="search">筛选</el-button>
          </div>
        </div>
      </el-form>

      <div class="zn-add-employee-drawer__table-shell">
      <el-table
        ref="table"
        :data="pagedRows"
        border
        height="100%"
        class="zn-form-drawer__table"
        header-cell-class-name="zn-form-drawer__th"
        :row-class-name="employeeRowClassName"
        @selection-change="onSelectionChange"
      >
        <el-table-column
          type="selection"
          width="56"
          align="left"
          header-align="left"
          class-name="is-selection"
          label-class-name="is-selection"
          :selectable="isEmployeeSelectable"
        />
        <el-table-column prop="name" label="姓名" min-width="96" align="left" header-align="left" show-overflow-tooltip>
          <template slot-scope="{ row }">
            <span :title="isEmployeeSelectable(row) ? '' : '已在排班表中，不可重复添加'">{{ row.name }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="erp" label="ERP" min-width="120" align="left" header-align="left" show-overflow-tooltip />
        <el-table-column prop="attendanceGroup" label="考勤组" min-width="120" align="left" header-align="left" show-overflow-tooltip />
        <el-table-column prop="position" label="岗位" min-width="96" align="left" header-align="left" show-overflow-tooltip />
        <el-table-column prop="gender" label="性别" width="88" align="left" header-align="left" />
        <el-table-column prop="empTypeLabel" label="用工性质" min-width="168" align="left" header-align="left" show-overflow-tooltip />
        <template slot="empty">
          <div class="zn-add-employee-empty-state" role="status">
            <span class="zn-add-employee-empty-state__illustration" aria-hidden="true">
              <img class="zn-add-employee-empty-state__shadow" :src="assetUrl('empty-state/empty-shadow.svg')" alt="" width="50" height="16" />
              <img class="zn-add-employee-empty-state__doc" :src="assetUrl('empty-state/empty-doc.svg')" alt="" width="36" height="30" />
            </span>
            <p>还没有相关内容</p>
          </div>
        </template>
      </el-table>
      </div>

      <div class="zn-form-drawer__pagination">
        <span class="zn-form-drawer__total">共 {{ filteredRows.length }} 条</span>
        <el-pagination
          background
          layout="prev, pager, next, sizes, jumper"
          :page-sizes="[10, 20, 50]"
          :page-size.sync="pageSize"
          :current-page.sync="page"
          :total="filteredRows.length"
        />
      </div>
      </template>

      <template v-else>
        <div class="zn-add-employee-config-list">
          <section v-for="row in configurationRows" :key="row.erp" class="zn-add-employee-config-card">
            <div class="zn-add-employee-config-table" role="table">
              <div class="zn-add-employee-config-table__head zn-add-employee-config-table__grid" role="row">
                <span role="columnheader">员工</span>
                <span role="columnheader">排班起始时间</span>
                <span role="columnheader">排班方式</span>
                <span role="columnheader">选择班次/轮班</span>
                <span role="columnheader">循环周期</span>
                <span role="columnheader">休息时间</span>
              </div>
              <div class="zn-add-employee-config-card__controls zn-add-employee-config-table__grid" role="row">
                <div class="zn-add-employee-config-control is-person" role="cell">
                  <div class="zn-add-employee-config-person">
                    <strong>{{ row.name }}</strong>
                    <span>{{ row.erp }}</span>
                  </div>
                </div>
                <div class="zn-add-employee-config-control is-date" role="cell">
                  <el-date-picker
                    v-model="row.startDate"
                    type="date"
                    value-format="yyyy-MM-dd"
                    format="yyyy-MM-dd"
                    placeholder="请选择日期"
                    popper-class="shift-picker-control-popper"
                  />
                </div>
                <div class="zn-add-employee-config-control" role="cell">
                  <el-select v-model="row.scheduleType" popper-class="overseas-select-popper" @change="onScheduleTypeChange(row)">
                    <el-option label="班次" value="shift" />
                    <el-option label="轮班" value="rotation" :disabled="rotationOptions.length === 0" />
                  </el-select>
                </div>
                <div class="zn-add-employee-config-control is-schedule" role="cell">
                  <el-popover
                    v-model="row.pickerVisible"
                    placement="bottom-start"
                    trigger="click"
                    popper-class="zn-rotation-day-popper zn-add-employee-shift-popper"
                    :width="560"
                  >
                    <div class="zn-rotation-day-picker zn-add-employee-shift-picker" role="listbox">
                      <button
                        v-for="item in scheduleOptions(row)"
                        :key="item.id"
                        type="button"
                        class="zn-rotation-day-picker__option zn-add-employee-shift-picker__option"
                        :class="{ 'is-selected': row.scheduleId === item.id }"
                        @click="selectSchedule(row, item)"
                      >
                        <span class="zn-rotation-day-picker__check zn-add-employee-shift-picker__check"><i class="el-icon-check"></i></span>
                        <span class="shift-picker-chip" :style="scheduleChipStyle(row, item)" :title="`${scheduleCardName(row, item)} ${scheduleCardTime(row, item)}`">
                          <b>{{ scheduleCardName(row, item) }}</b>
                          <small>{{ scheduleCardTime(row, item) }}</small>
                        </span>
                      </button>
                    </div>
                    <button slot="reference" type="button" class="zn-add-employee-schedule-trigger">
                      <span v-if="!row.scheduleId" class="zn-add-employee-config-empty">＋选择</span>
                      <span v-else class="shift-picker-chip" :style="scheduleChipStyle(row, selectedSchedule(row))" :title="`${scheduleCardName(row, selectedSchedule(row))} ${scheduleCardTime(row, selectedSchedule(row))}`">
                        <b>{{ scheduleCardName(row, selectedSchedule(row)) }}</b>
                        <small>{{ scheduleCardTime(row, selectedSchedule(row)) }}</small>
                      </span>
                    </button>
                  </el-popover>
                </div>
                <div class="zn-add-employee-config-control" role="cell">
                  <div class="zn-add-employee-number-field">
                    <el-input v-model.number="row.cycleDays" inputmode="numeric" maxlength="2" @blur="normalizeCycleDays(row)" />
                    <span>天</span>
                  </div>
                </div>
                <div class="zn-add-employee-config-control" role="cell">
                  <div class="zn-add-employee-number-field">
                    <el-input v-model.number="row.restDays" inputmode="numeric" maxlength="2" @blur="normalizeRestDays(row)" />
                    <span>天</span>
                  </div>
                </div>
              </div>
            </div>

            <div v-if="row.scheduleId" class="zn-add-employee-period-preview">
              <el-popover
                v-model="row.dayEditorVisible"
                trigger="manual"
                placement="top-start"
                popper-class="zn-rotation-day-popper zn-add-employee-day-editor-popper"
                :width="560"
              >
                <div class="zn-rotation-day-picker" role="listbox">
                  <button
                    v-for="item in dayEditOptions"
                    :key="`${row.erp}-edit-${item.id}`"
                    type="button"
                    class="zn-rotation-day-picker__option"
                    :class="{ 'is-selected': isDayEditSelected(row, item) }"
                    @click="applyDayOverride(row, item)"
                  >
                    <span class="zn-rotation-day-picker__check"><i class="el-icon-check"></i></span>
                    <span class="shift-picker-chip" :style="scheduleChipStyle({ scheduleType: 'shift' }, item)" :title="`${item.name} ${item.time || '00:00-23:59'}`">
                      <b>{{ item.name }}</b>
                      <small>{{ item.time || '00:00-23:59' }}</small>
                    </span>
                  </button>
                </div>
                <span
                  slot="reference"
                  class="zn-add-employee-day-editor-anchor"
                  :style="{ left: `${row.dayEditorAnchorLeft || 0}px` }"
                ></span>
              </el-popover>
              <div class="zn-add-employee-period-preview__scroll">
                <div class="zn-add-employee-period-preview__track">
                  <div
                    v-for="day in previewDays(row)"
                    :key="`${row.erp}-${day.index}`"
                    class="zn-add-employee-period-day"
                    :class="{ 'is-overridden': day.isOverridden }"
                    :title="`${day.label}，双击修改班次`"
                    @dblclick="openDayEditor(row, day, $event)"
                  >
                    <div class="zn-add-employee-period-day__head">
                      <strong>{{ day.label }}</strong>
                      <span>{{ day.week }}</span>
                    </div>
                    <div class="zn-add-employee-period-day__body">
                      <span v-if="day.isRest" class="zn-add-employee-period-day__rest">休</span>
                      <span v-else class="overview-shift-chip is-regular zn-add-employee-period-day__shift" :style="previewShiftStyle(day.shift)" :title="`${day.shift.name} ${day.shift.time || ''}`">
                        <b>{{ day.shift.short || day.shift.name }}</b>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </template>
    </div>

    <div class="zn-form-drawer__footer">
      <div class="zn-form-drawer__footer-actions">
        <el-button @click="close">取消</el-button>
        <el-button v-if="step === 'configure'" @click="backToSelection">上一步</el-button>
        <el-button v-if="step === 'select'" type="primary" :disabled="selected.length === 0" @click="goToConfiguration">下一步</el-button>
        <el-button v-else type="primary" :disabled="!configurationComplete" @click="confirm">确认</el-button>
      </div>
    </div>
  </el-drawer>
</template>

<script>
import { assetUrl } from '../utils/assetUrl'
import { resolveShiftChipStyle, sortShiftsByFamily } from '../utils/shiftPalette'

const ALL_EMPLOYEES = [
  { name: '张培', erp: 'zhangpei18', attendanceGroup: '异常处理组', position: '分拣员岗', gender: '女', empType: 'A', empTypeLabel: 'A-全日制劳动合同工' },
  { name: '李洁丽', erp: 'lijieli3', attendanceGroup: '自动小件组', position: '分拣员岗', gender: '女', empType: 'A', empTypeLabel: 'A-全日制劳动合同工' },
  { name: '王强', erp: 'wangqiang12', attendanceGroup: '异常处理组', position: '分拣员岗', gender: '男', empType: 'A', empTypeLabel: 'A-全日制劳动合同工' },
  { name: '赵敏', erp: 'zhaomin8', attendanceGroup: '自动小件组', position: '分拣员岗', gender: '女', empType: 'I', empTypeLabel: 'I-非全日制劳动合同工' },
  { name: '刘洋', erp: 'liuyang22', attendanceGroup: '异常处理组', position: '分拣员岗', gender: '男', empType: 'A', empTypeLabel: 'A-全日制劳动合同工' },
  { name: '陈晨', erp: 'chenchen5', attendanceGroup: '自动小件组', position: '分拣员岗', gender: '女', empType: 'A', empTypeLabel: 'A-全日制劳动合同工' },
  { name: '周杰', erp: 'zhoujie9', attendanceGroup: '异常处理组', position: '分拣员岗', gender: '男', empType: 'I', empTypeLabel: 'I-非全日制劳动合同工' },
  { name: '吴倩', erp: 'wuqian6', attendanceGroup: '自动小件组', position: '分拣员岗', gender: '女', empType: 'A', empTypeLabel: 'A-全日制劳动合同工' },
  { name: '郑浩', erp: 'zhenghao3', attendanceGroup: '异常处理组', position: '分拣员岗', gender: '男', empType: 'A', empTypeLabel: 'A-全日制劳动合同工' },
  { name: '冯雪', erp: 'fengxue2', attendanceGroup: '自动小件组', position: '分拣员岗', gender: '女', empType: 'A', empTypeLabel: 'A-全日制劳动合同工' },
  { name: '曹阳', erp: 'caoyang7', attendanceGroup: '异常处理组', position: '分拣员岗', gender: '男', empType: 'I', empTypeLabel: 'I-非全日制劳动合同工' },
  { name: '孙忠林', erp: 'sunzhonglin3', attendanceGroup: '自动小件组', position: '分拣员岗', gender: '男', empType: 'A', empTypeLabel: 'A-全日制劳动合同工' },
  { name: '侯帅庭', erp: 'houshuaiting', attendanceGroup: '异常处理组', position: '分拣员岗', gender: '男', empType: 'I', empTypeLabel: 'I-非全日制劳动合同工' },
  { name: '李晓梅', erp: 'lixiaomei1', attendanceGroup: '自动小件组', position: '分拣员岗', gender: '女', empType: 'A', empTypeLabel: 'A-全日制劳动合同工' },
  { name: '张志豪', erp: 'zhangzhihao2', attendanceGroup: '异常处理组', position: '分拣员岗', gender: '男', empType: 'A', empTypeLabel: 'A-全日制劳动合同工' },
  { name: '王芳', erp: 'wangfang3', attendanceGroup: '自动小件组', position: '分拣员岗', gender: '女', empType: 'A', empTypeLabel: 'A-全日制劳动合同工' },
  { name: '刘强', erp: 'liuqiang4', attendanceGroup: '异常处理组', position: '分拣员岗', gender: '男', empType: 'I', empTypeLabel: 'I-非全日制劳动合同工' },
  { name: '黄蕾', erp: 'huanglei11', attendanceGroup: '自动小件组', position: '分拣员岗', gender: '女', empType: 'A', empTypeLabel: 'A-全日制劳动合同工' },
  { name: '徐凯', erp: 'xukai15', attendanceGroup: '异常处理组', position: '分拣员岗', gender: '男', empType: 'A', empTypeLabel: 'A-全日制劳动合同工' },
]

function createDefaultQuery() {
  return {
    department: 'jd-logistics',
    position: 'all',
    erp: '',
    name: '',
    empType: '',
  }
}

export default {
  name: 'AddEmployeeDrawer',
  props: {
    visible: { type: Boolean, default: false },
    departmentLabel: { type: String, default: '' },
    shiftOptions: { type: Array, default: () => [] },
    rotationOptions: { type: Array, default: () => [] },
    existingEmployees: { type: Array, default: () => [] },
  },
  data() {
    return {
      query: createDefaultQuery(),
      appliedQuery: createDefaultQuery(),
      page: 1,
      pageSize: 10,
      selected: [],
      step: 'select',
      employeeSteps: [
        {
          title: '选择人员',
          activeIcon: assetUrl('figma-stepper/icon-form.svg'),
          pendingIcon: assetUrl('figma-stepper/icon-document.svg'),
        },
        {
          title: '配置排班',
          activeIcon: assetUrl('figma-stepper/icon-form.svg'),
          pendingIcon: assetUrl('figma-stepper/icon-document.svg'),
        },
      ],
      configurationRows: [],
      departmentOptions: [
        { value: 'jd-logistics', label: '京东集团-京东物流-亚洲一号西安智能物流中心' },
        { value: 'tz-yz', label: '通州片区 · 北京亦庄智配中心站' },
        { value: 'hb-zn-01', label: '华北职能后线 · 一组' },
      ],
      allRows: ALL_EMPLOYEES,
    }
  },
  computed: {
    innerVisible: {
      get() {
        return this.visible
      },
      set(val) {
        this.$emit('update:visible', val)
      },
    },
    scheduledNameMatch() {
      return this.matchesScheduledEmployeeName(this.appliedQuery.name)
    },
    filteredRows() {
      const q = this.appliedQuery
      if (this.scheduledNameMatch) return []
      return this.allRows.filter((row) => {
        if (!this.isEmployeeSelectable(row)) return false
        if (q.position && q.position !== 'all' && row.position !== '分拣员岗') return false
        if (q.erp && !row.erp.toLowerCase().includes(q.erp.trim().toLowerCase())) return false
        if (q.name && !row.name.includes(q.name.trim())) return false
        if (q.empType && row.empType !== q.empType) return false
        return true
      })
    },
    pagedRows() {
      const start = (this.page - 1) * this.pageSize
      return this.filteredRows.slice(start, start + this.pageSize)
    },
    existingEmployeeKeySet() {
      const keys = []
      this.existingEmployees.filter(Boolean).forEach((item) => {
        const code = typeof item === 'object' ? (item.code || item.erp) : item
        if (code) keys.push(`erp:${String(code).toLowerCase()}`)
        if (item && typeof item === 'object' && item.name) keys.push(`name:${String(item.name).trim()}`)
      })
      return new Set(keys)
    },
    configurationComplete() {
      return this.configurationRows.length > 0 && this.configurationRows.every((row) => (
        row.scheduleType && row.scheduleId && row.startDate && row.cycleDays > 0
        && row.restDays >= 0 && row.restDays < row.cycleDays
      ))
    },
    activeEmployeeStep() {
      return this.step === 'select' ? 0 : 1
    },
    dayEditOptions() {
      const shifts = sortShiftsByFamily(this.shiftOptions).filter((item) => item.id !== 'REST' && item.id !== '休')
      return [...shifts, { id: 'REST', name: '休息', time: '00:00-23:59' }]
    },
  },
  watch: {
    pageSize() {
      this.page = 1
    },
  },
  methods: {
    assetUrl,
    employeeStepStateIcon(index) {
      const item = this.employeeSteps[index]
      if (index < this.activeEmployeeStep) return assetUrl('figma-stepper/check.svg')
      if (index === this.activeEmployeeStep) return item.activeIcon
      return item.pendingIcon
    },
    onOpen() {
      this.query = createDefaultQuery()
      this.appliedQuery = createDefaultQuery()
      this.page = 1
      this.pageSize = 10
      this.selected = []
      this.step = 'select'
      this.configurationRows = []
      this.$nextTick(() => {
        if (this.$refs.table) this.$refs.table.clearSelection()
      })
    },
    resetQuery() {
      this.query = createDefaultQuery()
      this.appliedQuery = createDefaultQuery()
      this.page = 1
      this.selected = []
      this.$nextTick(() => {
        if (this.$refs.table) this.$refs.table.clearSelection()
      })
    },
    search() {
      const nextQuery = { ...this.query }
      this.appliedQuery = nextQuery
      this.page = 1
      this.selected = []
      if (this.matchesScheduledEmployeeName(nextQuery.name)) {
        this.$message.warning('该员工已有排班，请重新选择')
      }
      this.$nextTick(() => {
        if (this.$refs.table) this.$refs.table.clearSelection()
      })
    },
    matchesScheduledEmployeeName(value) {
      const name = String(value || '').trim()
      return !!name && this.allRows.some((row) => (
        row.name.includes(name) && !this.isEmployeeSelectable(row)
      ))
    },
    isEmployeeSelectable(row) {
      if (!row || !row.erp) return false
      return !this.existingEmployeeKeySet.has(`erp:${String(row.erp).toLowerCase()}`)
        && !this.existingEmployeeKeySet.has(`name:${String(row.name || '').trim()}`)
    },
    employeeRowClassName({ row }) {
      return this.isEmployeeSelectable(row) ? '' : 'is-existing-employee'
    },
    onSelectionChange(rows) {
      this.selected = rows.filter((row) => this.isEmployeeSelectable(row))
    },
    close() {
      this.innerVisible = false
    },
    goToConfiguration() {
      const selectableRows = this.selected.filter((row) => this.isEmployeeSelectable(row))
      if (selectableRows.length !== this.selected.length) {
        this.$message.warning('已在排班表中的员工不可重复添加')
      }
      if (!selectableRows.length) {
        this.$message.warning('请先选择员工')
        return
      }
      this.selected = selectableRows
      this.configurationRows = selectableRows.map((row) => ({
        ...row,
        scheduleType: 'shift',
        scheduleId: '',
        cycleDays: 7,
        restDays: 1,
        startDate: '2026-09-01',
        pickerVisible: false,
        editDayIndex: null,
        dayEditorVisible: false,
        dayEditorAnchorLeft: 0,
        dayOverrides: {},
      }))
      this.step = 'configure'
    },
    backToSelection() {
      this.step = 'select'
      this.$nextTick(() => {
        if (!this.$refs.table) return
        this.configurationRows.forEach((configured) => {
          const row = this.pagedRows.find((item) => item.erp === configured.erp)
          if (row) this.$refs.table.toggleRowSelection(row, true)
        })
      })
    },
    onScheduleTypeChange(row) {
      this.$set(row, 'scheduleId', '')
      this.$set(row, 'pickerVisible', false)
      this.$set(row, 'editDayIndex', null)
      this.$set(row, 'dayEditorVisible', false)
      this.$set(row, 'dayOverrides', {})
    },
    scheduleOptions(row) {
      return row.scheduleType === 'rotation' ? this.rotationOptions : sortShiftsByFamily(this.shiftOptions)
    },
    scheduleOptionLabel(row, item) {
      if (row.scheduleType === 'rotation') return `${item.name}（${item.cycleDays || 7}天周期）`
      return `${item.name} ${item.time || ''}`.trim()
    },
    schedulePreview(row) {
      const item = this.scheduleOptions(row).find((option) => option.id === row.scheduleId)
      if (!item) return '待选择'
      return row.scheduleType === 'rotation'
        ? `${item.name} · ${item.cycleDays || 7}天周期`
        : `${item.name} · ${item.time || '--'}`
    },
    selectedSchedule(row) {
      return this.scheduleOptions(row).find((item) => item.id === row.scheduleId) || {}
    },
    scheduleCardName(row, item = {}) {
      return item.name || (row.scheduleType === 'rotation' ? '轮班规则' : '班次')
    },
    scheduleCardTime(row, item = {}) {
      return row.scheduleType === 'rotation' ? `${item.cycleDays || row.cycleDays || 7}天周期` : (item.time || '--')
    },
    scheduleChipStyle(row, item = {}) {
      if (row.scheduleType === 'rotation') {
        return { background: '#EDF2FF', color: '#3C6EF0', borderColor: '#C8D7FB' }
      }
      const style = resolveShiftChipStyle(item)
      return { ...style, '--shift-selected-border': style.color === '#FFFFFF' ? style.background : style.color }
    },
    selectSchedule(row, item) {
      this.$set(row, 'scheduleId', item.id)
      if (row.scheduleType === 'rotation' && item.cycleDays) this.$set(row, 'cycleDays', Number(item.cycleDays))
      const pattern = row.scheduleType === 'rotation' ? (item.dayShifts || []) : []
      if (pattern.length) this.$set(row, 'restDays', pattern.filter((id) => id === 'REST' || id === '休').length)
      this.normalizeRestDays(row)
      this.$set(row, 'pickerVisible', false)
      this.$set(row, 'editDayIndex', null)
      this.$set(row, 'dayEditorVisible', false)
      this.$set(row, 'dayOverrides', {})
    },
    normalizeCycleDays(row) {
      const value = Math.max(1, Math.min(31, Math.trunc(Number(row.cycleDays) || 1)))
      this.$set(row, 'cycleDays', value)
      this.normalizeRestDays(row)
    },
    normalizeRestDays(row) {
      const max = Math.max(0, Number(row.cycleDays || 1) - 1)
      const value = Math.max(0, Math.min(max, Math.trunc(Number(row.restDays) || 0)))
      this.$set(row, 'restDays', value)
    },
    previewShiftStyle(shift = {}) {
      return resolveShiftChipStyle(shift)
    },
    previewDays(row) {
      const cycleDays = Math.max(1, Math.min(31, Number(row.cycleDays) || 7))
      const restDays = Math.max(0, Math.min(cycleDays - 1, Number(row.restDays) || 0))
      const selected = this.selectedSchedule(row)
      const rotationPattern = row.scheduleType === 'rotation' ? (selected.dayShifts || []) : []
      const startParts = String(row.startDate || '2026-09-01').split('-').map(Number)
      const start = new Date(startParts[0] || 2026, (startParts[1] || 9) - 1, startParts[2] || 1)
      const week = ['日', '一', '二', '三', '四', '五', '六']
      const cyclePattern = Array.from({ length: cycleDays }, (_, cycleIndex) => {
        if (rotationPattern.length) return rotationPattern[cycleIndex % rotationPattern.length]
        return cycleIndex >= cycleDays - restDays ? 'REST' : row.scheduleId
      })
      return Array.from({ length: 30 }, (_, index) => {
        const date = new Date(start)
        date.setDate(start.getDate() + index)
        const generatedShiftId = cyclePattern[index % cyclePattern.length]
        const shiftId = Object.prototype.hasOwnProperty.call(row.dayOverrides || {}, index)
          ? row.dayOverrides[index]
          : generatedShiftId
        const isRest = shiftId === 'REST' || shiftId === '休'
        const shift = this.shiftOptions.find((item) => item.id === shiftId) || selected
        return {
          index,
          label: `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`,
          week: week[date.getDay()],
          isRest,
          shift,
          shiftId,
          isOverridden: Object.prototype.hasOwnProperty.call(row.dayOverrides || {}, index),
        }
      })
    },
    editingDay(row) {
      return this.previewDays(row).find((day) => day.index === row.editDayIndex) || {}
    },
    openDayEditor(row, day, event) {
      const preview = event.currentTarget.closest('.zn-add-employee-period-preview')
      const scroller = event.currentTarget.closest('.zn-add-employee-period-preview__scroll')
      const targetRect = event.currentTarget.getBoundingClientRect()
      const previewRect = preview ? preview.getBoundingClientRect() : targetRect
      const visibleLeft = targetRect.left - previewRect.left + targetRect.width / 2
      const maxLeft = Math.max(0, (scroller ? scroller.clientWidth : previewRect.width) - 16)
      this.$set(row, 'dayEditorAnchorLeft', Math.max(0, Math.min(maxLeft, visibleLeft)))
      this.$set(row, 'editDayIndex', day.index)
      this.$set(row, 'dayEditorVisible', true)
    },
    isDayEditSelected(row, item) {
      const shiftId = this.editingDay(row).shiftId
      return item.id === 'REST' ? shiftId === 'REST' || shiftId === '休' : shiftId === item.id
    },
    applyDayOverride(row, item) {
      if (!row.dayOverrides) this.$set(row, 'dayOverrides', {})
      this.$set(row.dayOverrides, row.editDayIndex, item.id)
      this.$set(row, 'editDayIndex', null)
      this.$set(row, 'dayEditorVisible', false)
    },
    confirm() {
      if (!this.configurationComplete) {
        this.$message.warning('请为全部员工选择班次或轮班')
        return
      }
      const duplicatedRows = this.configurationRows.filter((row) => !this.isEmployeeSelectable(row))
      if (duplicatedRows.length) {
        this.$message.warning(`${duplicatedRows.map((row) => row.name).join('、')}已在排班表中，不可重复添加`)
        return
      }
      this.$emit('confirm', this.configurationRows.map((row) => ({ ...row })))
      this.innerVisible = false
    },
  },
}
</script>

<style lang="scss" src="../styles/scheduling/add-employee-config.scss"></style>
