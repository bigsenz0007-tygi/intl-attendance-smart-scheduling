<template>
  <div class="schedule-overview">
    <div class="schedule-workspace">
    <section class="overview-query-card">
      <div
        class="overview-query-grid"
        :class="{
          'is-single-row': !queryCollapsible || !queryExpanded,
          'is-expanded': queryCollapsible && queryExpanded,
        }"
      >
        <div class="query-item">
          <label><span class="required">*</span> 排班部门</label>
          <el-select
            v-model="department"
            filterable
            placeholder="请选择排班部门"
            popper-class="overseas-select-popper"
            @change="onDepartmentChange"
          >
            <el-option label="欧洲区 · 荷兰一号仓" value="nl-01"></el-option>
            <el-option label="欧洲区 · 德国法兰克福仓" value="de-fra"></el-option>
          </el-select>
        </div>
        <div class="query-item">
          <label><span class="required">*</span> 考勤组</label>
          <el-select
            v-model="attendanceGroup"
            filterable
            placeholder="请选择考勤组"
            popper-class="overseas-select-popper"
          >
            <el-option label="全部" value="all"></el-option>
            <el-option label="一线作业组" value="frontline"></el-option>
            <el-option label="管理组" value="manage"></el-option>
            <el-option label="支持组" value="support"></el-option>
          </el-select>
        </div>
        <div v-if="scheduleScene === 'international'" class="query-item">
          <label><span class="required">*</span> 排班分类</label>
          <el-select
            v-model="scheduleCategory"
            placeholder="请选择排班分类"
            popper-class="overseas-select-popper"
          >
            <el-option label="排班倒班" value="schedule"></el-option>
            <el-option label="智能排班" value="smart"></el-option>
          </el-select>
        </div>
        <div
          v-if="scheduleScene === 'international' && queryExpanded"
          class="query-item"
        >
          <label><span class="required">*</span> 环节组</label>
          <el-select
            v-model="processGroup"
            filterable
            placeholder="请选择环节组"
            popper-class="overseas-select-popper"
          >
            <el-option label="全部" value="all"></el-option>
            <el-option label="入库" value="inbound"></el-option>
            <el-option label="在库" value="inventory"></el-option>
            <el-option label="出库" value="outbound"></el-option>
            <el-option label="逆退" value="reverse"></el-option>
            <el-option label="异常" value="exception"></el-option>
            <el-option label="5S" value="5s"></el-option>
            <el-option label="保安" value="security"></el-option>
            <el-option label="线下业务" value="offline"></el-option>
            <el-option label="常规" value="regular"></el-option>
          </el-select>
        </div>
        <div v-if="!queryCollapsible || queryExpanded" class="query-item">
          <label>排班周期</label>
          <el-date-picker
            class="overview-range-picker"
            v-model="scheduleRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="yyyy-MM-dd"
            unlink-panels
          ></el-date-picker>
        </div>
        <div class="overview-query-actions">
          <el-button @click="resetQuery">重置</el-button>
          <el-button type="primary" @click="querySchedule">查询</el-button>
          <el-button
            v-if="queryCollapsible"
            type="text"
            class="overview-query-expand"
            @click="queryExpanded = !queryExpanded"
          >
            {{ queryExpanded ? '收起' : '展开' }}
            <i :class="queryExpanded ? 'el-icon-arrow-up' : 'el-icon-arrow-down'"></i>
          </el-button>
        </div>
      </div>
    </section>

    <section class="overview-content-card">
      <div class="overview-tabs-row">
        <div class="overview-tabs">
          <button type="button" class="overview-tab is-active">排班表</button>
          <button type="button" class="overview-tab" @click="notify('已切换至排班统计')">排班统计</button>
        </div>
        <div class="overview-toolbar-right">
          <el-radio-group v-model="viewDensity" class="overview-density-switch">
            <el-radio-button label="compact">精简</el-radio-button>
            <el-radio-button label="normal">常规</el-radio-button>
          </el-radio-group>
          <el-tooltip content="新手引导" placement="top" popper-class="lui-pc-tooltip">
            <button
              type="button"
              class="overview-icon-btn"
              aria-label="新手引导"
              @click="openOperationHelp('guide')"
            >
              <img
                class="overview-toolbar-icon"
                :src="assetUrl('lui-icon-help.svg')"
                alt=""
                width="16"
                height="16"
              >
            </button>
          </el-tooltip>
          <el-tooltip content="保存" placement="top" popper-class="lui-pc-tooltip">
            <button
              type="button"
              class="overview-icon-btn"
              aria-label="保存"
              @click="notify('排班调整已保存')"
            >
              <img
                class="overview-toolbar-icon"
                :src="assetUrl('lui-icon-save.svg')"
                alt=""
                width="16"
                height="16"
              >
            </button>
          </el-tooltip>
          <el-tooltip content="导出" placement="top" popper-class="lui-pc-tooltip">
            <button
              type="button"
              class="overview-icon-btn"
              aria-label="导出"
              @click="notify('排班表已导出')"
            >
              <img
                class="overview-toolbar-icon"
                :src="assetUrl('lui-icon-export.svg')"
                alt=""
                width="16"
                height="16"
              >
            </button>
          </el-tooltip>
        </div>
      </div>

      <div class="overview-toolbar">
        <div class="overview-toolbar-left">
          <div
            class="btn-smart-schedule-wrap"
            @mouseenter="onSmartScheduleEnter"
            @mouseleave="onSmartScheduleLeave"
          >
            <el-tooltip
              :value="smartTipVisible"
              :manual="true"
              effect="dark"
              placement="top"
              popper-class="lui-pc-tooltip"
            >
              <div slot="content">💡手工排班费时费力？<br>点击【智能排班】，轻松高效生成最优班次</div>
              <el-button
                type="primary"
                class="btn-smart-schedule"
                @click="startSmartScheduling"
              >
                <img
                  class="btn-smart-schedule__icon"
                  :src="assetUrl('smart-schedule/ai-icon-data2.png')"
                  alt=""
                  width="16"
                  height="16"
                />
                <span class="btn-smart-schedule__label">智能排班</span>
              </el-button>
            </el-tooltip>
          </div>
          <el-button @click="notify('已打开人员选择')">添加人员</el-button>
          <el-popover
            v-model="filterPopoverVisible"
            placement="bottom-start"
            trigger="click"
            popper-class="zn-schedule-filter-popper"
            :visible-arrow="false"
            @show="onFilterPopoverShow"
          >
            <div class="zn-schedule-filter">
              <div class="zn-schedule-filter__group">
                <el-checkbox v-model="filterDraft.onlyUnscheduled">仅看未排班</el-checkbox>
              </div>
              <div class="zn-schedule-filter__group">
                <div class="zn-schedule-filter__title">人员状态</div>
                <el-checkbox-group v-model="filterDraft.staffStatus">
                  <el-checkbox label="normal">未异动</el-checkbox>
                  <el-checkbox label="changed">已异动（含离职）</el-checkbox>
                </el-checkbox-group>
              </div>
              <div class="zn-schedule-filter__group">
                <div class="zn-schedule-filter__title">用工性质</div>
                <el-checkbox-group v-model="filterDraft.empType">
                  <el-checkbox label="A">A-全日制劳动合同工</el-checkbox>
                  <el-checkbox label="I">I-非全日制劳动合同工</el-checkbox>
                </el-checkbox-group>
              </div>
              <div class="zn-schedule-filter__group">
                <div class="zn-schedule-filter__title">岗位</div>
                <el-checkbox-group v-model="filterDraft.position">
                  <el-checkbox label="sorter">分拣员岗</el-checkbox>
                </el-checkbox-group>
              </div>
              <div class="zn-schedule-filter__footer">
                <el-button type="text" @click="cancelFilterDraft">取消</el-button>
                <el-button type="primary" @click="applyFilterDraft">确定筛选</el-button>
              </div>
            </div>
            <el-button
              slot="reference"
              type="text"
              icon="el-icon-filter"
              class="zn-schedule-filter-trigger"
              :class="{ 'is-active': hasActiveScheduleFilter }"
            >筛选</el-button>
          </el-popover>
        </div>
        <div class="overview-toolbar-legend">
          <el-button @click="notify('已打开班次新增入口')">添加班次</el-button>
          <el-button @click="notify('已打开轮班新增入口')">添加轮班</el-button>
          <button
            type="button"
            class="overview-legend-expand"
            :class="{ 'is-expanded': legendExpanded }"
            @click="legendExpanded = !legendExpanded"
          >
            {{ legendExpanded ? '收起' : '展开' }}
            <shell-icon :name="legendExpanded ? 'chevronUp' : 'chevronDown'" size="sm" />
          </button>
        </div>
      </div>

      <div v-if="legendExpanded" class="overview-legend-block is-expanded">
        <div class="overview-legend-row">
          <div class="legend">
            <strong>班次</strong>
            <span
              v-for="shift in legendShifts"
              :key="shift.id"
              class="legend-chip"
              :class="{ 'is-rest': shift.isRest }"
              :style="legendChipStyle(shift)" :title="`${shift.name} ${formatShiftRange(shift.time)}`"
            >
              <b>{{ shift.name }}</b>
              <small>{{ formatShiftRange(shift.time) }}</small>
            </span>
          </div>
        </div>
        <div
          v-if="legendRotations.length"
          class="overview-legend-row overview-legend-row--rotation"
        >
          <div class="legend">
            <strong>轮班</strong>
            <span
              v-for="shift in legendRotations"
              :key="shift.id"
              class="legend-chip"
              :class="{ 'is-rest': shift.isRest }"
              :style="legendChipStyle(shift)" :title="`${shift.name} ${formatShiftRange(shift.time)}`"
            >
              <b>{{ shift.name }}</b>
              <small>{{ formatShiftRange(shift.time) }}</small>
            </span>
          </div>
        </div>
      </div>

      <div class="overview-matrix" :class="`density-${viewDensity}`">
        <table :style="overviewTableStyle">
          <thead>
            <tr>
              <th class="overview-person-col">
                <div class="overview-person-header">
                  <el-input
                    class="overview-search"
                    v-model="keyword"
                    clearable
                    prefix-icon="el-icon-search"
                    placeholder="搜索人员"
                  />
                </div>
              </th>
              <th class="overview-rest-col" aria-label="排休时间">
                <el-tooltip content="排休时间" placement="top" popper-class="lui-pc-tooltip"><i class="el-icon-time"></i></el-tooltip>
              </th>
              <th
                v-for="date in overviewDates"
                :key="date.key"
                class="overview-date-col"
                :class="{ 'is-today': date.isToday, 'is-weekend': date.isWeekend }"
              >
                <div class="overview-date-head-stack">
                  <strong>{{ date.label }}</strong>
                  <span>
                    <template v-if="!date.isToday">{{ date.weekShort }}</template>
                    <em v-if="date.isToday" class="today-tag">今</em>
                  </span>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="filteredRows.length === 0">
              <td :colspan="overviewDates.length + 2" class="overview-empty-cell">
                <div class="search-empty-state">
                  <div class="search-empty-illus" aria-hidden="true">
                    <img class="search-empty-shadow" :src="assetUrl('empty-state/empty-shadow.svg')" alt="" width="50" height="16" />
                    <img class="search-empty-doc" :src="assetUrl('empty-state/empty-doc.svg')" alt="" width="36" height="30" />
                  </div>
                  <p>暂无搜索结果</p>
                </div>
              </td>
            </tr>
            <tr v-for="row in filteredRows" :key="row.id">
              <td class="overview-person-cell">
                <div>
                  <strong>{{ row.name }}</strong>
                  <small>{{ row.code }}</small>
                </div>
              </td>
              <td class="overview-rest-cell">{{ restCount(row) }}</td>
              <td
                v-for="date in overviewDates"
                :key="date.key"
                class="overview-shift-cell"
                :class="{ 'is-weekend': date.isWeekend }"
              >
                <button
                  v-if="shiftOf(row, date.key) !== '休'"
                  class="overview-shift-chip"
                  :class="{
                    'is-picker-active': isPickerAnchor(row, date.key),
                    'is-compact': viewDensity === 'compact',
                    'is-regular': viewDensity === 'normal',
                    'is-wide': viewDensity === 'compact' && compactPrefix(shiftOf(row, date.key)).length > 1,
                  }"
                  :style="shiftStyle(shiftOf(row, date.key), isPickerAnchor(row, date.key))" :title="`${shiftName(shiftOf(row, date.key))} ${formatShiftRange(shiftFullTime(shiftOf(row, date.key)))}`"
                  @dblclick.stop.prevent="openReplace(row, date, $event)"
                >
                  <template v-if="viewDensity === 'compact'">
                    <b>{{ compactPrefix(shiftOf(row, date.key)) }}</b>
                    <small>{{ compactIndex(shiftOf(row, date.key)) }}</small>
                  </template>
                  <template v-else>
                    <b>{{ shiftName(shiftOf(row, date.key)) }}</b>
                    <small>{{ formatShiftRange(shiftFullTime(shiftOf(row, date.key))) }}</small>
                  </template>
                </button>
                <span
                  v-else
                  class="rest-cell"
                  :class="{
                    'is-picker-active': isPickerAnchor(row, date.key),
                    'is-regular': viewDensity === 'normal',
                  }"
                  :style="restCellStyle(isPickerAnchor(row, date.key))"
                  @dblclick.stop.prevent="openReplace(row, date, $event)"
                >{{ viewDensity === 'compact' ? '休' : '休息' }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="overview-footer">
        <span>共{{ filteredRows.length }}条记录</span>
      </div>
    </section>
    </div>
    <OperationHelpDialog
      :visible.sync="operationHelpVisible"
      :initial-tab="operationHelpTab"
    />
  </div>
</template>

<script>
import { assetUrl } from '../utils/assetUrl'
import ShellIcon from './shell/ShellIcon.vue'
import OperationHelpDialog from '../zn/OperationHelpDialog.vue'
import { resolveShiftChipStyle, compactShiftParts, formatShiftTimeRange, sortShiftsByFamily } from '../utils/shiftPalette'

const WEEK_FULL = ['日', '一', '二', '三', '四', '五', '六']
const TODAY_KEY = '07-23'

function enrichWeekDates(dates = []) {
  return dates.map((item) => {
    const [mm, dd] = String(item.key || '').split('-')
    const fullDate = item.fullDate ? String(item.fullDate).split('-').map(Number) : []
    const d = fullDate.length === 3
      ? new Date(fullDate[0], fullDate[1] - 1, fullDate[2])
      : new Date(2026, Number(mm) - 1, Number(dd) || 1)
    const weekIdx = Number.isNaN(d.getTime()) ? 0 : d.getDay()
    const weekShort = WEEK_FULL[weekIdx]
    return {
      key: item.key,
      label: item.label || `${mm}/${dd}`,
      week: item.week || `周${weekShort}`,
      weekShort,
      isToday: item.key === TODAY_KEY,
      isWeekend: weekIdx === 0 || weekIdx === 6,
    }
  })
}

function buildRangeDates(range = []) {
  if (!Array.isArray(range) || range.length !== 2 || !range[0] || !range[1]) return []
  const parseDate = (value) => {
    const parts = String(value).split('-').map(Number)
    if (parts.length !== 3 || parts.some((part) => !Number.isFinite(part))) return null
    return new Date(parts[0], parts[1] - 1, parts[2])
  }
  const start = parseDate(range[0])
  const end = parseDate(range[1])
  if (!start || !end || start > end) return []

  const result = []
  const cursor = new Date(start)
  while (cursor <= end && result.length < 366) {
    const year = cursor.getFullYear()
    const month = String(cursor.getMonth() + 1).padStart(2, '0')
    const day = String(cursor.getDate()).padStart(2, '0')
    result.push({
      key: `${month}-${day}`,
      fullDate: `${year}-${month}-${day}`,
      label: `${month}/${day}`,
    })
    cursor.setDate(cursor.getDate() + 1)
  }
  return enrichWeekDates(result)
}

export default {
  name: 'ScheduleOverview',
  components: { ShellIcon, OperationHelpDialog },
  props: {
    dates: { type: Array, required: true },
    shifts: { type: Array, required: true },
    scheduleRows: { type: Array, required: true },
    pickerOpen: { type: Boolean, default: false },
    pickerAnchor: { type: Object, default: null },
    initialContext: { type: Object, default: () => ({}) },
  },
  data() {
    return {
      department: this.initialContext.department || 'nl-01',
      attendanceGroup: this.initialContext.attendanceGroup || 'all',
      scheduleCategory: 'schedule',
      processGroup: this.initialContext.processGroup || 'all',
      scheduleMonth: this.initialContext.scheduleMonth || '2026-07',
      scheduleRange: Array.isArray(this.initialContext.scheduleRange)
        ? [...this.initialContext.scheduleRange]
        : ['2026-07-01', '2026-07-31'],
      onlyUnscheduled: false,
      filterPopoverVisible: false,
      filterDraft: {
        onlyUnscheduled: false,
        staffStatus: ['normal', 'changed'],
        empType: ['A', 'I'],
        position: ['sorter'],
      },
      filterApplied: {
        onlyUnscheduled: false,
        staffStatus: ['normal', 'changed'],
        empType: ['A', 'I'],
        position: ['sorter'],
      },
      viewDensity: 'compact',
      keyword: '',
      operationHelpVisible: false,
      operationHelpTab: 'guide',
      legendExpanded: false,
      queryExpanded: false,
      rotations: [],
      smartTipVisible: true,
      smartTipHover: false,
      smartTipIntroTimer: null,
    }
  },
  mounted() {
    this.startSmartTipIntro()
  },
  beforeDestroy() {
    this.clearSmartTipIntro()
  },
  computed: {
    overviewDates() {
      const rangeDates = buildRangeDates(this.scheduleRange)
      return rangeDates.length ? rangeDates : enrichWeekDates(this.dates)
    },
    overviewTableStyle() {
      const fixedColumnsWidth = 200
      const colWidth = this.viewDensity === 'normal' ? 96 : 48
      const dayColumnsWidth = this.overviewDates.length * colWidth
      return { minWidth: `${Math.max(960, fixedColumnsWidth + dayColumnsWidth)}px` }
    },
    scheduleScene() {
      return 'international'
    },
    queryCollapsible() {
      return this.scheduleScene === 'international'
    },
    legendShifts() {
      return sortShiftsByFamily(this.shifts)
    },
    legendRotations() {
      return this.rotations
    },
    filteredRows() {
      const keyword = this.keyword.trim().toLowerCase()
      const filters = this.filterApplied
      return this.scheduleRows.filter((row) => {
        const matchesKeyword = !keyword || `${row.name} ${row.code}`.toLowerCase().includes(keyword)
        const values = Object.values(row.shifts || {})
        const hasUnscheduled = values.some((value) => !value || value === 'EMPTY')
        const staffStatus = row.staffStatus || (Number(row.id) % 4 === 0 ? 'changed' : 'normal')
        const empType = row.empType || (row.type === '正式员工' ? 'A' : 'I')
        const position = row.positionCode || 'sorter'
        return matchesKeyword && (!filters.onlyUnscheduled || hasUnscheduled)
          && filters.staffStatus.includes(staffStatus) && filters.empType.includes(empType) && filters.position.includes(position)
      })
    },
    hasActiveScheduleFilter() {
      return this.onlyUnscheduled
        || this.filterApplied.staffStatus.length < 2
        || this.filterApplied.empType.length < 2
        || this.filterApplied.position.length < 1
    },
  },
  methods: {
    assetUrl,
    notify(message) { this.$message.success(message) },
    openOperationHelp(tab = 'guide') {
      this.operationHelpTab = tab
      this.operationHelpVisible = true
    },
    startSmartTipIntro() {
      this.clearSmartTipIntro()
      this.smartTipVisible = true
      this.smartTipIntroTimer = setTimeout(() => {
        this.smartTipIntroTimer = null
        if (!this.smartTipHover) this.smartTipVisible = false
      }, 5000)
    },
    clearSmartTipIntro() {
      if (this.smartTipIntroTimer) {
        clearTimeout(this.smartTipIntroTimer)
        this.smartTipIntroTimer = null
      }
    },
    onSmartScheduleEnter() {
      this.smartTipHover = true
      this.smartTipVisible = true
    },
    onSmartScheduleLeave() {
      this.smartTipHover = false
      if (!this.smartTipIntroTimer) this.smartTipVisible = false
    },
    onFilterPopoverShow() {
      this.filterDraft = {
        onlyUnscheduled: Boolean(this.onlyUnscheduled),
        staffStatus: [...(this.filterApplied.staffStatus || [])],
        empType: [...(this.filterApplied.empType || [])],
        position: [...(this.filterApplied.position || [])],
      }
    },
    cancelFilterDraft() {
      this.filterPopoverVisible = false
    },
    applyFilterDraft() {
      this.filterApplied = {
        onlyUnscheduled: Boolean(this.filterDraft.onlyUnscheduled),
        staffStatus: [...(this.filterDraft.staffStatus || [])],
        empType: [...(this.filterDraft.empType || [])],
        position: [...(this.filterDraft.position || [])],
      }
      this.onlyUnscheduled = Boolean(this.filterDraft.onlyUnscheduled)
      this.filterPopoverVisible = false
      this.notify(this.onlyUnscheduled ? '已筛选仅看未排班人员' : '筛选条件已应用')
    },
    onDepartmentChange() {
      this.attendanceGroup = 'all'
      this.processGroup = 'all'
    },
    startSmartScheduling() {
      if (!this.department) return this.$message.warning('请选择排班部门')
      if (!this.attendanceGroup) return this.$message.warning('请选择考勤组')
      if (!this.processGroup) return this.$message.warning('请选择环节组')
      if (!Array.isArray(this.scheduleRange) || this.scheduleRange.length !== 2) {
        return this.$message.warning('请选择排班周期')
      }
      this.$emit('start-scheduling', {
        department: this.department,
        attendanceGroup: this.attendanceGroup,
        scheduleCategory: this.scheduleCategory,
        processGroup: this.processGroup,
        scheduleRange: [...this.scheduleRange],
        scene: 'international',
      })
    },
    resetQuery() {
      this.department = ''
      this.attendanceGroup = ''
      this.scheduleCategory = 'schedule'
      this.processGroup = ''
      this.scheduleMonth = '2026-07'
      this.scheduleRange = ['2026-07-01', '2026-07-31']
      this.keyword = ''
      this.onlyUnscheduled = false
      this.filterApplied = {
        onlyUnscheduled: false,
        staffStatus: ['normal', 'changed'],
        empType: ['A', 'I'],
        position: ['sorter'],
      }
      this.filterDraft = {
        onlyUnscheduled: false,
        staffStatus: ['normal', 'changed'],
        empType: ['A', 'I'],
        position: ['sorter'],
      }
      this.notify('查询条件已清空')
    },
    querySchedule() {
      if (!this.department) return this.$message.warning('请选择排班部门')
      if (!this.attendanceGroup) return this.$message.warning('请选择考勤组')
      if (!this.processGroup) return this.$message.warning('请选择环节组')
      if (!Array.isArray(this.scheduleRange) || this.scheduleRange.length !== 2) {
        return this.$message.warning('请选择排班周期')
      }
      this.$emit('query-schedule', {
        department: this.department,
        attendanceGroup: this.attendanceGroup,
        scheduleCategory: this.scheduleCategory,
        processGroup: this.processGroup,
        scheduleRange: [...this.scheduleRange],
        scene: 'international',
      })
      this.notify('排班倒班已刷新')
    },
    scheduleFilterPayload() {
      if (this.scheduleScene === 'functional-backline') {
        return { scheduleMonth: this.scheduleMonth }
      }
      return {
        scheduleRange: Array.isArray(this.scheduleRange) ? [...this.scheduleRange] : [],
      }
    },
    legendChipStyle(shift) {
      return resolveShiftChipStyle(shift)
    },
    shiftOf(row, dateKey) {
      if (row.shifts && row.shifts[dateKey] != null) return row.shifts[dateKey]
      const sourceDates = this.dates.filter((date) => row.shifts && row.shifts[date.key] != null)
      const targetIndex = this.overviewDates.findIndex((date) => date.key === dateKey)
      if (sourceDates.length && targetIndex >= 0) {
        return row.shifts[sourceDates[targetIndex % sourceDates.length].key]
      }
      return '休'
    },
    restCount(row) {
      return this.overviewDates.reduce((sum, date) => sum + (this.shiftOf(row, date.key) === '休' ? 1 : 0), 0)
    },
    compactPrefix(shiftId) {
      return compactShiftParts(this.resolveShiftRecord(shiftId)).prefix
    },
    compactIndex(shiftId) {
      return compactShiftParts(this.resolveShiftRecord(shiftId)).index
    },
    formatShiftRange(time) {
      return formatShiftTimeRange(time)
    },
    shiftStyle(shiftId, selected = false) {
      const shift = this.shifts.find((item) => item.id === shiftId)
      if (!shift || shift.isRest) return this.restCellStyle(selected)
      return resolveShiftChipStyle(shift, selected)
    },
    restCellStyle(selected = false) {
      if (!selected) return {}
      const stroke = this.darkenHex('#A8AEB8', 0.08)
      return { borderColor: stroke, boxShadow: `inset 0 0 0 1px ${stroke}` }
    },
    darkenHex(hex, amount = 0.08) {
      if (!hex || typeof hex !== 'string') return '#525765'
      let h = hex.replace('#', '').trim()
      if (h.length === 3) h = h.split('').map((c) => c + c).join('')
      if (h.length !== 6 || Number.isNaN(parseInt(h, 16))) return hex
      const num = parseInt(h, 16)
      const channel = (shift) => Math.max(0, Math.round(((num >> shift) & 255) * (1 - amount)))
      const r = channel(16)
      const g = channel(8)
      const b = channel(0)
      return `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`
    },
    shiftName(shiftId) {
      const shift = this.resolveShiftRecord(shiftId)
      if (!shift || shift.isRest) return '休息'
      return shift.name || ''
    },
    shiftFullTime(shiftId) {
      const shift = this.resolveShiftRecord(shiftId)
      return shift ? shift.time : ''
    },
    resolveShiftRecord(shiftId) {
      if (shiftId === '休' || shiftId === 'REST') {
        return this.shifts.find((item) => item.isRest || item.id === 'REST') || { id: 'REST', name: '休息', time: '00:00-23:59', isRest: true }
      }
      return this.shifts.find((item) => item.id === shiftId) || { id: shiftId, name: '', time: '' }
    },
    isPickerAnchor(row, dateKey) {
      return Boolean(
        this.pickerOpen
        && this.pickerAnchor
        && this.pickerAnchor.row
        && this.pickerAnchor.row.id === row.id
        && this.pickerAnchor.dateKey === dateKey,
      )
    },
    openReplace(row, date, event) {
      const shift = this.shiftOf(row, date.key)
      if (row.shifts[date.key] == null) this.$set(row.shifts, date.key, shift)
      this.$emit('replace-shift', row, date, event)
    },
  },
}
</script>
