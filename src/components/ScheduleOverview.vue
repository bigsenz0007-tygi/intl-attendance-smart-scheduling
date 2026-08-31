<template>
  <div class="schedule-overview">
    <section class="overview-query-card">
      <div class="overview-query-grid">
        <div class="query-item">
          <label><span class="required">*</span> 排班部门</label>
          <el-select
            v-model="department"
            filterable
            placeholder="请选择排班部门"
            popper-class="overseas-select-popper"
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
        <div class="query-item">
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
        <div class="query-item">
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
        </div>
      </div>
    </section>

    <section class="overview-content-card">
      <div class="overview-tabs-row">
        <div class="overview-tabs">
          <button type="button" class="overview-tab is-active">排班表</button>
          <button type="button" class="overview-tab" @click="notify('已切换至排班统计')">排班统计</button>
        </div>
        <div class="overview-tab-links">
          <el-button type="text" @click="notify('已打开出勤要求')">查看出勤要求</el-button>
          <el-button type="text" @click="notify('已打开新手引导')">查看新手引导</el-button>
        </div>
      </div>

      <div class="overview-legend-block" :class="{ 'is-expanded': legendExpanded }">
        <div class="overview-legend-row">
          <div class="legend">
            <strong>班次</strong>
            <el-button class="legend-add-btn" icon="el-icon-plus" @click="notify('已打开班次新增入口')">添加</el-button>
            <span
              v-for="shift in legendShifts"
              :key="shift.id"
              class="legend-chip"
              :class="{ 'is-outlined': shift.outlined, 'is-rest': shift.isRest }"
              :style="legendChipStyle(shift)"
            >{{ shift.name }} {{ formatShiftRange(shift.time) }}</span>
          </div>
          <button
            type="button"
            class="overview-legend-expand"
            @click="legendExpanded = !legendExpanded"
          >
            {{ legendExpanded ? '收起' : '展开' }}
            <i :class="legendExpanded ? 'el-icon-arrow-up' : 'el-icon-arrow-down'"></i>
          </button>
        </div>
        <div v-if="legendExpanded" class="overview-legend-row overview-legend-row--rotation">
          <div class="legend">
            <strong>轮班</strong>
            <el-button class="legend-add-btn" icon="el-icon-plus" @click="notify('已打开轮班新增入口')">添加</el-button>
          </div>
        </div>
      </div>

      <div class="overview-toolbar">
        <div class="overview-toolbar-left">
          <div
            class="btn-smart-schedule-wrap"
            @mouseenter="onSmartScheduleEnter"
            @mouseleave="onSmartScheduleLeave"
          >
            <div
              v-show="smartTipVisible"
              class="btn-smart-schedule-tip"
              role="tooltip"
            >
              <div class="btn-smart-schedule-tip__body">
                <p>💡手工排班费时费力？</p>
                <p>点击【智能排班】，轻松高效生成最优班次</p>
              </div>
              <i class="btn-smart-schedule-tip__arrow" aria-hidden="true"></i>
            </div>
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
          </div>
          <el-button @click="notify('已进入临时修改模式')">临时修改排班</el-button>
          <el-button @click="notify('已复制当前排班')">复制排班</el-button>
          <el-button @click="notify('已打开排班轨迹')">轨迹排班</el-button>
          <el-button @click="notify('已打开人员选择')">添加人员</el-button>
          <el-checkbox v-model="onlyUnscheduled">仅看未排班</el-checkbox>
          <el-button type="text" icon="el-icon-s-operation" @click="notify('已展开筛选')">筛选</el-button>
        </div>
        <div class="overview-toolbar-right">
          <el-radio-group v-model="viewDensity">
            <el-radio-button label="compact">简洁</el-radio-button>
            <el-radio-button label="normal">常规</el-radio-button>
          </el-radio-group>
          <el-button @click="notify('排班表已导出')">导出</el-button>
          <el-button type="primary" @click="notify('排班调整已保存')">保存</el-button>
          <el-button class="overview-icon-btn" icon="el-icon-notebook-2" @click="notify('已打开快捷键说明')"></el-button>
          <el-button class="overview-icon-btn" icon="el-icon-full-screen" @click="notify('已进入全屏')"></el-button>
        </div>
      </div>

      <div class="overview-matrix" :class="`density-${viewDensity}`">
        <table>
          <thead>
            <tr>
              <th class="overview-check-col">
                <el-checkbox
                  :value="isAllSelected"
                  :indeterminate="isPartialSelected"
                  @change="toggleSelectAll"
                />
              </th>
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
              <th class="overview-rest-col" title="排休天数">
                <i class="el-icon-time"></i>
              </th>
              <th
                v-for="date in overviewDates"
                :key="date.key"
                class="overview-date-col"
                :class="{ 'is-today': date.isToday, 'is-weekend': date.isWeekend }"
              >
                <strong>{{ date.label }}</strong>
                <span>
                  {{ date.weekShort }}
                  <em v-if="date.isToday" class="today-tag">今</em>
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="filteredRows.length === 0">
              <td :colspan="overviewDates.length + 3" class="overview-empty-cell">
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
              <td class="overview-check-cell">
                <el-checkbox
                  :value="selectedIds.includes(row.id)"
                  @change="toggleRow(row.id, $event)"
                />
              </td>
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
                  }"
                  :style="shiftStyle(shiftOf(row, date.key), isPickerAnchor(row, date.key))"
                  @dblclick.stop.prevent="openReplace(row, date, $event)"
                >
                  <b>{{ displayShiftName(shiftOf(row, date.key)) }}</b>
                  <small v-if="viewDensity !== 'compact'">{{ formatShiftRange(shiftFullTime(shiftOf(row, date.key))) }}</small>
                </button>
                <span
                  v-else
                  class="rest-cell"
                  :class="{ 'is-picker-active': isPickerAnchor(row, date.key) }"
                  :style="restCellStyle(isPickerAnchor(row, date.key))"
                  @dblclick.stop.prevent="openReplace(row, date, $event)"
                >休</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="overview-footer">
        <span>选中{{ selectedIds.length }}条 共{{ filteredRows.length }}条记录</span>
      </div>
    </section>
  </div>
</template>

<script>
import { assetUrl } from '../utils/assetUrl'

const WEEK_FULL = ['日', '一', '二', '三', '四', '五', '六']
const TODAY_KEY = '07-23'

function enrichWeekDates(dates = []) {
  return dates.map((item) => {
    const [mm, dd] = String(item.key || '').split('-')
    const d = new Date(2026, Number(mm) - 1, Number(dd) || 1)
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

export default {
  name: 'ScheduleOverview',
  props: {
    dates: { type: Array, required: true },
    shifts: { type: Array, required: true },
    scheduleRows: { type: Array, required: true },
    pickerOpen: { type: Boolean, default: false },
    pickerAnchor: { type: Object, default: null },
  },
  data() {
    return {
      department: 'nl-01',
      attendanceGroup: 'all',
      processGroup: 'all',
      scheduleRange: ['2026-07-18', '2026-07-24'],
      onlyUnscheduled: false,
      viewDensity: 'compact',
      keyword: '',
      selectedIds: [],
      legendExpanded: false,
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
      return enrichWeekDates(this.dates)
    },
    legendShifts() {
      return this.shifts
    },
    filteredRows() {
      const keyword = this.keyword.trim().toLowerCase()
      return this.scheduleRows.filter((row) => {
        const matchesKeyword = !keyword || `${row.name} ${row.code}`.toLowerCase().includes(keyword)
        const hasUnscheduled = this.overviewDates.some((date) => this.shiftOf(row, date.key) === '休')
        return matchesKeyword && (!this.onlyUnscheduled || hasUnscheduled)
      })
    },
    isAllSelected() {
      return this.filteredRows.length > 0 && this.filteredRows.every((row) => this.selectedIds.includes(row.id))
    },
    isPartialSelected() {
      const count = this.filteredRows.filter((row) => this.selectedIds.includes(row.id)).length
      return count > 0 && count < this.filteredRows.length
    },
  },
  methods: {
    assetUrl,
    notify(message) { this.$message.success(message) },
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
    startSmartScheduling() {
      if (!this.department) return this.$message.warning('请选择排班部门')
      if (!this.processGroup) return this.$message.warning('请选择环节组')
      this.$emit('start-scheduling', {
        department: this.department,
        processGroup: this.processGroup,
      })
    },
    resetQuery() {
      this.department = ''
      this.attendanceGroup = ''
      this.processGroup = ''
      this.scheduleRange = ['2026-07-18', '2026-07-24']
      this.keyword = ''
      this.onlyUnscheduled = false
      this.notify('查询条件已清空')
    },
    querySchedule() {
      if (!this.department) return this.$message.warning('请选择排班部门')
      if (!this.attendanceGroup) return this.$message.warning('请选择考勤组')
      if (!this.processGroup) return this.$message.warning('请选择环节组')
      this.notify('排班总览已更新')
    },
    legendChipStyle(shift) {
      if (shift.isRest) {
        return { background: '#F5F5F6', color: '#525765', borderColor: '#D9D9D9' }
      }
      if (shift.outlined) {
        return { background: shift.light, color: shift.color, borderColor: shift.color }
      }
      return { background: shift.color, color: '#fff', borderColor: shift.color }
    },
    shiftOf(row, dateKey) {
      if (row.shifts && row.shifts[dateKey] != null) return row.shifts[dateKey]
      return '休'
    },
    restCount(row) {
      return this.overviewDates.reduce((sum, date) => sum + (this.shiftOf(row, date.key) === '休' ? 1 : 0), 0)
    },
    shortShiftName(shiftId) {
      const name = this.shiftName(shiftId)
      return String(name || '')
        .replace('早班', '早')
        .replace('中班', '中')
        .replace('晚班', '晚')
        .replace('次', '')
        .replace('(跳)', '')
    },
    displayShiftName(shiftId) {
      return this.viewDensity === 'compact' ? this.shortShiftName(shiftId) : this.shiftName(shiftId)
    },
    toggleSelectAll(checked) {
      this.selectedIds = checked ? this.filteredRows.map((row) => row.id) : []
    },
    toggleRow(id, checked) {
      if (checked) {
        if (!this.selectedIds.includes(id)) this.selectedIds = [...this.selectedIds, id]
        return
      }
      this.selectedIds = this.selectedIds.filter((item) => item !== id)
    },
    shiftStyle(shiftId, selected = false) {
      const shift = this.shifts.find((item) => item.id === shiftId)
      if (!shift || shift.isRest) return this.restCellStyle(selected)
      let style
      if (shift.outlined) {
        style = { background: shift.light, color: shift.color, borderColor: shift.color }
      } else {
        style = { background: shift.color, color: '#fff', borderColor: shift.color }
      }
      if (selected) {
        const stroke = this.darkenHex(shift.color, 0.08)
        style.borderColor = stroke
        style.boxShadow = `inset 0 0 0 1px ${stroke}`
      }
      return style
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
      const shift = this.shifts.find((item) => item.id === shiftId)
      return shift ? shift.name : ''
    },
    formatShiftRange(time) {
      return String(time || '').replace('-', '–')
    },
    shiftFullTime(shiftId) {
      const shift = this.shifts.find((item) => item.id === shiftId)
      return shift ? shift.time : ''
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
      this.$emit('replace-shift', row, date.key, event)
    },
  },
}
</script>
