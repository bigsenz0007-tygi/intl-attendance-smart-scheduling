<template>
  <div class="overseas-schedule-root" :class="{ 'is-wizard-mode': viewMode === 'wizard' }">
  <Index class="overseas-schedule-app" :header="true" :aside="true" :content="true">
    <header class="topbar">
      <div class="brand">
        <div class="brand-logo-group">
          <img class="brand-logo-mark" :src="jdlMark" alt="JDL" width="53" height="24">
          <span class="brand-company">京东物流</span>
        </div>
        <span class="brand-divider"></span>
        <strong class="brand-title">国际考勤</strong>
      </div>
      <div class="topbar-actions">
        <span><i class="el-icon-question"></i>【帮助中心】</span>
        <span><i class="el-icon-chat-dot-round"></i>【上线公告】</span>
        <span><i class="el-icon-refresh"></i>【权限刷新】</span>
        <span class="avatar">AM</span>
        <span>Amy Miller <i class="el-icon-arrow-down"></i></span>
      </div>
    </header>

    <aside class="sidebar">
      <div class="nav-group">
        <div
          v-for="item in navItems"
          :key="item.label"
          class="nav-item"
          :class="{ active: item.mode ? viewMode === item.mode : item.active }"
          @click="handleNav(item)"
        >
          <i :class="item.icon"></i><span>{{ item.label }}</span><i v-if="item.expand" class="el-icon-arrow-down nav-arrow"></i>
        </div>
      </div>
      <div class="sidebar-foot"><i class="el-icon-s-fold"></i><span>收起菜单</span></div>
    </aside>

    <main class="workspace" :class="{ 'is-wizard': viewMode === 'wizard' }">
      <div class="page-tabs">
        <span class="page-tab-home">首页</span>
        <span class="page-tab-active">{{ currentPageTitle }} <i class="el-icon-close"></i></span>
      </div>

      <ScheduleOverview
        v-if="viewMode === 'overview'"
        :dates="displayDates"
        :shifts="shifts"
        :scheduleRows="scheduleRows"
        :picker-open="shiftPickerVisible"
        :picker-anchor="shiftPickerTarget"
        @start-scheduling="startOver"
        @replace-shift="openShiftPicker"
        @open-auto-config="autoDialogVisible = true"
      />

      <section v-else-if="viewMode === 'wizard'" class="wizard-card">
        <div class="arrow-steps-card">
          <div class="arrow-steps" role="list" aria-label="智能排班流程">
            <div
              v-for="(step, index) in workflowSteps"
              :key="step.title"
              class="arrow-step"
              :class="{
                'is-active': index === activeStep,
                'is-complete': index < activeStep,
                'is-pending': index > activeStep,
                'is-start': index === 0,
                'is-end': index === workflowSteps.length - 1,
              }"
              role="listitem"
              :aria-current="index === activeStep ? 'step' : null"
              tabindex="0"
              @click="goToStep(index)"
              @keydown.enter.prevent="goToStep(index)"
            >
              <span class="arrow-step__skin" aria-hidden="true">
                <i class="arrow-step__cap arrow-step__cap--l"></i>
                <i class="arrow-step__body"></i>
                <i class="arrow-step__cap arrow-step__cap--r"></i>
              </span>
              <span class="arrow-step__num" aria-hidden="true">{{ index + 1 }}</span>
              <span class="arrow-step__label">
                <img
                  class="arrow-step__icon"
                  :src="stepStateIcon(index)"
                  alt=""
                />
                <strong>{{ step.title }}</strong>
              </span>
            </div>
          </div>
        </div>

        <section v-if="activeStep === 0" class="wizard-panel step-two">
          <div class="schedule-detail-title">
            <span aria-hidden="true">✦</span>
            <strong>智能排班｜出勤工时/人数详情</strong>
          </div>
          <div class="selection-summary">
            <span class="summary-item"><span class="summary-label">排班部门：</span><strong>{{ selectedDepartmentLabel }}</strong></span>
            <span class="summary-item"><span class="summary-label">环节组：</span><strong>{{ selectedProcessLabel }}</strong></span>
          </div>
          <ForecastMatrix :dates="dates" :rows="visibleForecastRows" @target-change="onTargetChange" />
        </section>

        <section v-else class="wizard-panel step-three">
          <div class="schedule-detail-title">
            <span aria-hidden="true">✦</span>
            <strong>智能排班｜出勤表详情</strong>
          </div>
          <div class="selection-summary">
            <span class="summary-item"><span class="summary-label">排班部门：</span><strong>{{ selectedDepartmentLabel }}</strong></span>
            <span class="summary-item"><span class="summary-label">环节组：</span><strong>{{ selectedProcessLabel }}</strong></span>
          </div>
          <SchedulingList :dates="displayDates" :editable="true">
            <div class="schedule-scroll">
              <table class="schedule-table">
                <thead>
                  <tr>
                    <th class="person-col">
                      <div class="schedule-person-header">
                        <div
                          class="schedule-search"
                          :class="{ 'is-empty': isScheduleSearchEmpty }"
                        >
                          <el-input
                            ref="scheduleSearchInput"
                            v-model="scheduleKeyword"
                            clearable
                            prefix-icon="el-icon-search"
                            placeholder="搜索人员"
                            @focus="scheduleSearchFocused = true"
                            @blur="scheduleSearchFocused = false"
                          ></el-input>
                        </div>
                      </div>
                    </th>
                    <th v-for="date in displayDates" :key="date.key"><strong>{{ date.label }}</strong><span>{{ date.week }}</span></th>
                  </tr>
                </thead>
                <tbody class="schedule-summary-body">
                  <tr>
                    <th>实排工时/推荐工时</th>
                    <td v-for="date in displayDates" :key="'hours-' + date.key">
                      <button class="daily-compare" @click="hoursDetailVisible = true">
                        <span class="compare-ratio">{{ dailyHoursActual[dateMetricIndex(date)] }}/{{ dailyHoursRecommended[dateMetricIndex(date)] }}</span>
                        <em
                          class="compare-diff"
                          :class="{ danger: dailyHoursActual[dateMetricIndex(date)] !== dailyHoursRecommended[dateMetricIndex(date)] }"
                        >
                          <b>{{ signedDiff(dailyHoursActual[dateMetricIndex(date)] - dailyHoursRecommended[dateMetricIndex(date)]) }}</b><small>h</small>
                        </em>
                        <i class="el-icon-arrow-right"></i>
                      </button>
                    </td>
                  </tr>
                  <tr>
                    <th>预测核算工时</th>
                    <td v-for="date in displayDates" :key="'forecast-' + date.key">
                      <span class="daily-forecast">{{ dailyHoursForecast[dateMetricIndex(date)] }}</span>
                    </td>
                  </tr>
                </tbody>
                <tbody>
                  <tr v-if="filteredScheduleRows.length === 0">
                    <td :colspan="displayDates.length + 1" class="schedule-empty-cell">
                      <div class="search-empty-state">
                        <div class="search-empty-illus" aria-hidden="true">
                          <img class="search-empty-shadow" :src="assetUrl('empty-state/empty-shadow.svg')" alt="" width="50" height="16" />
                          <img class="search-empty-doc" :src="assetUrl('empty-state/empty-doc.svg')" alt="" width="36" height="30" />
                        </div>
                        <p>暂无搜索结果</p>
                      </div>
                    </td>
                  </tr>
                  <tr v-for="row in filteredScheduleRows" :key="row.id">
                    <td class="person-cell">
                      <div class="person-info">
                        <strong>{{ row.name }}</strong>
                        <small>{{ row.code }}</small>
                      </div>
                    </td>
                    <td v-for="date in displayDates" :key="date.key" class="shift-cell">
                      <button
                        v-if="row.shifts[date.key] !== '休'"
                        class="shift-chip"
                        :class="{ 'is-picker-active': isPickerAnchor(row, date.key) }"
                        :style="shiftStyle(row.shifts[date.key], isPickerAnchor(row, date.key))"
                        @dblclick.stop.prevent="openShiftPicker(row, date.key, $event)"
                      >
                        <b>{{ shiftName(row.shifts[date.key]) }}</b>
                        <small>{{ formatShiftRange(shiftFullTime(row.shifts[date.key])) }}</small>
                      </button>
                      <span
                        v-else
                        class="rest-cell"
                        :class="{ 'is-picker-active': isPickerAnchor(row, date.key) }"
                        :style="restCellStyle(isPickerAnchor(row, date.key))"
                        @dblclick.stop.prevent="openShiftPicker(row, date.key, $event)"
                      >休</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </SchedulingList>
        </section>
      </section>

      <footer
        v-if="viewMode === 'wizard'"
        class="flow-actions wizard-flow-actions"
      >
        <el-button @click="cancelWizard">取消</el-button>
        <el-button v-if="activeStep > 0" @click="previousStep">上一步</el-button>
        <el-button v-if="activeStep === 0" type="primary" @click="nextStep">下一步</el-button>
        <el-button v-else type="primary" icon="el-icon-s-promotion" @click="publishSchedule">发布班表</el-button>
      </footer>
    </main>

    <el-dialog
      :custom-class="shiftPickerDialogClass"
      :visible.sync="shiftPickerVisible"
      :modal="false"
      :close-on-click-modal="false"
      :destroy-on-close="false"
      append-to-body
      width="640px"
      top="0"
      @opened="onShiftPickerOpened"
      @closed="resetShiftPicker"
    >
      <div slot="title" class="shift-picker-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          class="shift-picker-tab"
          :class="{ 'is-active': shiftPickerTab === 'day' }"
          @click="shiftPickerTab = 'day'"
        >按天排班</button>
        <button
          type="button"
          role="tab"
          class="shift-picker-tab"
          :class="{ 'is-active': shiftPickerTab === 'cycle' }"
          @click="shiftPickerTab = 'cycle'"
        >周期排班</button>
      </div>
      <div class="shift-picker-body">
        <el-input
          v-model="shiftPickerKeyword"
          clearable
          prefix-icon="el-icon-search"
          placeholder="模糊搜索班次"
        />
        <div v-if="shiftPickerTab === 'day'" class="shift-picker-grid">
          <label
            v-for="shift in filteredPickerShifts"
            :key="shift.id"
            class="shift-picker-option"
          >
            <el-checkbox
              :value="selectedPickerShiftIds.includes(shift.id)"
              @change="togglePickerShift(shift.id, $event)"
            />
            <span
              class="shift-picker-chip"
              :class="{
                'is-outlined': shift.outlined,
                'is-rest': shift.isRest,
                'is-selected': selectedPickerShiftIds.includes(shift.id),
              }"
              :style="pickerChipStyle(shift)"
            >
              <b>{{ shift.name }}</b>
              <small>{{ formatShiftRange(shift.time) }}</small>
            </span>
          </label>
        </div>
        <div v-else class="shift-picker-cycle-empty">
          周期排班为原型占位，当前请使用「按天排班」更换班次。
        </div>
      </div>
      <span slot="footer" class="shift-picker-footer">
        <el-button @click="shiftPickerVisible = false">取消</el-button>
        <el-button type="primary" @click="saveShiftPicker">保存</el-button>
      </span>
    </el-dialog>

    <el-dialog title="自动排班配置" :visible.sync="autoDialogVisible" :closeOnClickModal="false" :destroyOnClose="true" width="560px">
      <div class="config-panel">
        <div class="config-row"><div><strong>启用自动排班</strong><p>开启后，每日仓库当地时间 00:00 自动生成未来 7 天排班。</p></div><el-switch v-model="autoSchedule"></el-switch></div>
        <div class="config-row"><div><strong>适用部门</strong><p>欧洲区 · 荷兰一号仓</p></div><el-tag size="small">当前部门</el-tag></div>
        <div class="config-row"><div><strong>异常提醒</strong><p>预测数据缺失或可排人员不足时通知排班负责人。</p></div><el-checkbox v-model="notifyException">站内信</el-checkbox></div>
      </div>
      <span slot="footer"><el-button @click="autoDialogVisible = false">取消</el-button><el-button type="primary" @click="saveAutoConfig">保存配置</el-button></span>
    </el-dialog>

    <el-dialog title="工时明细" class="hours-detail-dialog detail-dialog" :visible.sync="hoursDetailVisible" :closeOnClickModal="false" :destroyOnClose="true" width="960px">
      <div class="hours-detail-grid">
        <div v-for="date in displayDates" :key="date.key" class="hours-detail-column">
          <header><strong>{{ date.label }}</strong><span>({{ dailyHoursActual[dateMetricIndex(date)] }}/{{ dailyHoursRecommended[dateMetricIndex(date)] }})</span></header>
          <div><p v-for="person in detailPeople" :key="person.name">{{ person.name }}｜{{ person.hours }}h</p></div>
        </div>
      </div>
    </el-dialog>

    <el-dialog title="人员明细" class="people-detail-dialog detail-dialog" :visible.sync="peopleDetailVisible" :closeOnClickModal="false" :destroyOnClose="true" width="720px">
      <el-table :data="peopleDetailRows" border class="people-detail-table">
        <el-table-column prop="group" label="环节" min-width="140"></el-table-column>
        <el-table-column prop="recommended" label="推荐人数" min-width="120"></el-table-column>
        <el-table-column prop="actual" label="实排人数" min-width="120"></el-table-column>
        <el-table-column label="差异" min-width="100">
          <template slot-scope="scope">
            <span :class="{ 'danger-text': scope.row.diffValue !== 0 }">{{ scope.row.diffValue === 0 ? '--' : scope.row.diff }}</span>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>
  </Index>
  </div>
</template>

<script>
import ForecastMatrix from './components/ForecastMatrix.vue'
import ScheduleOverview from './components/ScheduleOverview.vue'
import jdlMark from './assets/jdl-mark.svg'
import { assetUrl } from './utils/assetUrl'
import { dates, forecastRows, shifts, scheduleRows } from './data/mock'

const passthrough = (name, className) => ({
  name,
  functional: true,
  render(h, context) { return h('div', { ...context.data, class: [className, context.data.class] }, context.children) },
})

export default {
  name: 'App',
  components: {
    ForecastMatrix,
    ScheduleOverview,
    Index: passthrough('Index', 'prototype-shell'),
    SchedulingList: passthrough('SchedulingList', 'scheduling-list-adapter'),
    UserInfoCellOfScheduleTable: passthrough('UserInfoCellOfScheduleTable', 'user-info-cell-adapter'),
  },
  data() {
    return {
      jdlMark,
      viewMode: 'overview',
      activeStep: 0,
      workflowSteps: [
        {
          title: '确认出勤工时/人数',
          activeIcon: assetUrl('figma-stepper/icon-form.svg'),
          pendingIcon: assetUrl('figma-stepper/icon-document.svg'),
        },
        {
          title: '确认出勤班表',
          activeIcon: assetUrl('figma-stepper/icon-form.svg'),
          pendingIcon: assetUrl('figma-stepper/icon-document.svg'),
        },
      ],
      department: 'nl-01',
      processGroup: 'all',
      processOptions: [
        { label: '全部', value: 'all' },
        { label: '入库', value: 'inbound' },
        { label: '在库', value: 'inventory' },
        { label: '出库', value: 'outbound' },
        { label: '逆退', value: 'reverse' },
        { label: '异常', value: 'exception' },
        { label: '5S', value: '5s' },
        { label: '保安', value: 'security' },
        { label: '线下业务', value: 'offline' },
        { label: '常规', value: 'regular' },
      ],
      dates,
      forecastRows,
      shifts,
      scheduleRows,
      scheduleKeyword: '',
      scheduleSearchFocused: false,
      shiftPickerVisible: false,
      shiftPickerTab: 'day',
      shiftPickerKeyword: '',
      selectedPickerShiftIds: [],
      shiftPickerTarget: null,
      shiftPickerAnchorEl: null,
      shiftPickerReady: false,
      shiftPickerScrollLockY: 0,
      dailyHoursActual: [90, 90, 90, 90, 90, 90, 90, 90],
      dailyHoursRecommended: [100, 100, 100, 100, 100, 100, 100, 100],
      dailyHoursForecast: [92, 92, 92, 92, 92, 92, 92, 92],
      dailyPeopleActual: [5, 5, 5, 5, 5, 5, 5, 5],
      dailyPeopleRecommended: [6, 6, 6, 6, 6, 6, 6, 6],
      detailPeople: [
        { name: '张*', hours: 10 },
        { name: '李*', hours: 8 },
        { name: '王*', hours: 10 },
      ],
      autoDialogVisible: false,
      autoSchedule: true,
      notifyException: true,
      hoursDetailVisible: false,
      peopleDetailVisible: false,
      navItems: [
        { label: '首页', icon: 'el-icon-house' },
        { label: '用户管理', icon: 'el-icon-user', expand: true },
        { label: '考勤组管理', icon: 'el-icon-s-custom' },
        { label: '基础配置', icon: 'el-icon-setting', expand: true },
        { label: '排班管理', icon: 'el-icon-date', expand: true },
        { label: '排班总览', icon: 'el-icon-s-grid', mode: 'overview' },
        { label: '新建排班', icon: 'el-icon-magic-stick', mode: 'wizard' },
        { label: '异常管理', icon: 'el-icon-warning-outline' },
        { label: '报表管理', icon: 'el-icon-document' },
        { label: '我的流程', icon: 'el-icon-tickets' },
        { label: '数据看板', icon: 'el-icon-data-analysis', expand: true },
      ],
      peopleDetailRows: [
        { group: '5S', recommended: '3人', actual: '3人', diff: '0人', diffValue: 0 },
        { group: '保安', recommended: '2人', actual: '2人', diff: '0人', diffValue: 0 },
        { group: '线下业务', recommended: '5人', actual: '5人', diff: '0人', diffValue: 0 },
        { group: '常规', recommended: '6人', actual: '6人', diff: '0人', diffValue: 0 },
      ],
    }
  },
  computed: {
    currentPageTitle() {
      if (this.viewMode === 'overview') return '海外排班总览'
      return '海外智能排班'
    },
    currentPageDescription() {
      return this.viewMode === 'overview'
        ? '查看已发布排班，按部门和环节维护未来 7 天的班次、工时与人员安排。'
        : '基于业务环节预测量、人效和用工成本，为海外仓生成未来 7 天排班建议。'
    },
    displayDates() {
      return this.dates.slice(1)
    },
    selectedDepartmentLabel() {
      return this.department === 'nl-01' ? '欧洲区 · 荷兰一号仓' : this.department === 'de-fra' ? '欧洲区 · 德国法兰克福仓' : ''
    },
    selectedProcessLabel() {
      const item = this.processOptions.find((option) => option.value === this.processGroup)
      return item ? item.label : ''
    },
    isStepOneComplete() {
      return Boolean(this.department && this.processGroup)
    },
    visibleForecastRows() {
      const metricRows = this.forecastRows.filter((row) => row.category === 'metric')
      const processRows = this.forecastRows.filter((row) => row.category === 'process')
      if (this.processGroup === 'all') return [...metricRows, ...processRows]
      return [...metricRows, ...processRows.filter((row) => row.processKey === this.processGroup)]
    },
    isScheduleSearchEmpty() {
      return !this.scheduleSearchFocused && !String(this.scheduleKeyword || '').trim()
    },
    filteredScheduleRows() {
      const keyword = this.scheduleKeyword.trim().toLowerCase()
      return this.scheduleRows.filter((row) => !keyword || `${row.name} ${row.code}`.toLowerCase().includes(keyword))
    },
    filteredPickerShifts() {
      const keyword = this.shiftPickerKeyword.trim().toLowerCase()
      return this.shifts.filter((shift) => {
        if (!keyword) return true
        return `${shift.name} ${shift.time}`.toLowerCase().includes(keyword)
      })
    },
    shiftPickerDialogClass() {
      return this.shiftPickerReady ? 'shift-picker-dialog is-ready' : 'shift-picker-dialog'
    },
  },
  methods: {
    handleNav(item) {
      if (item.mode === 'overview') this.openOverview()
      if (item.mode === 'wizard') this.startOver()
    },
    openOverview() {
      this.viewMode = 'overview'
      window.scrollTo({ top: 0, behavior: 'smooth' })
    },
    startOver(filters = {}) {
      const payload = filters && typeof filters === 'object' && !filters.type ? filters : {}
      this.viewMode = 'wizard'
      this.activeStep = 0
      this.department = payload.department || 'nl-01'
      this.processGroup = payload.processGroup || 'all'
      this.scheduleKeyword = ''
      window.scrollTo({ top: 0, behavior: 'smooth' })
    },
    cancelWizard() { this.openOverview() },
    previousStep() {
      if (this.activeStep > 0) this.activeStep -= 1
      window.scrollTo({ top: 0, behavior: 'smooth' })
    },
    nextStep() {
      if (this.activeStep < this.workflowSteps.length - 1) this.activeStep += 1
      window.scrollTo({ top: 0, behavior: 'smooth' })
    },
    goToStep(index) {
      if (index < 0 || index >= this.workflowSteps.length) return
      this.activeStep = index
    },
    onTargetChange({ rowId, dateKey, value }) {
      const row = this.forecastRows.find((item) => item.id === rowId)
      if (row) this.$set(row.values, dateKey, value)
    },
    signedDiff(value) { return value > 0 ? `+${value}` : String(value) },
    stepStateIcon(index) {
      const step = this.workflowSteps[index]
      if (index < this.activeStep) return assetUrl('figma-stepper/check.svg')
      if (index === this.activeStep) return step.activeIcon
      return step.pendingIcon
    },
    assetUrl,
    focusScheduleSearch() {
      this.scheduleSearchFocused = true
      this.$nextTick(() => {
        const input = this.$refs.scheduleSearchInput
        if (input && typeof input.focus === 'function') input.focus()
      })
    },
    dateMetricIndex(date) { return this.dates.findIndex((item) => item.key === date.key) },
    shiftStyle(shiftId, selected = false) {
      const shift = this.shifts.find((item) => item.id === shiftId)
      if (!shift || shift.isRest) return this.restCellStyle(selected)
      let style
      if (shift.outlined) {
        style = {
          background: shift.light,
          color: shift.color,
          borderColor: shift.color,
        }
      } else {
        style = { background: shift.color, color: '#fff', borderColor: shift.color }
      }
      if (selected) {
        const stroke = this.darkenHex(shift.color, 0.08)
        style.borderColor = stroke
        // inset 避免外描边被单元格 overflow 裁切
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
    shiftTime(shiftId) {
      const shift = this.shifts.find((item) => item.id === shiftId)
      return shift ? shift.time.slice(0, 5) : ''
    },
    shiftEnd(shiftId) {
      const shift = this.shifts.find((item) => item.id === shiftId)
      return shift ? shift.time.slice(6) : ''
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
    pickerChipStyle(shift) {
      const selected = this.selectedPickerShiftIds.includes(shift.id)
      let style
      if (shift.isRest) {
        style = { background: shift.light, color: '#525765', borderColor: '#D9D9D9' }
      } else if (shift.outlined) {
        style = { background: shift.light, color: shift.color, borderColor: shift.color }
      } else {
        style = { background: shift.color, color: '#fff', borderColor: shift.color }
      }
      if (selected) {
        const stroke = this.darkenHex(shift.isRest ? '#A8AEB8' : shift.color, 0.08)
        style.borderColor = stroke
        style.boxShadow = `inset 0 0 0 1px ${stroke}`
      }
      return style
    },
    calcShiftPickerCoords(anchorEl) {
      const gap = 8
      const dw = 640
      const dh = 420
      if (!anchorEl || typeof anchorEl.getBoundingClientRect !== 'function') {
        return {
          left: Math.max(gap, Math.round((window.innerWidth - dw) / 2)),
          top: 120,
        }
      }
      const rect = anchorEl.getBoundingClientRect()
      let left = rect.right + gap
      if (left + dw > window.innerWidth - gap) left = rect.left - dw - gap
      if (left < gap) left = gap
      let top = rect.top
      if (top + dh > window.innerHeight - gap) top = window.innerHeight - dh - gap
      if (top < gap) top = gap
      return { left: Math.round(left), top: Math.round(top) }
    },
    applyShiftPickerCoords(anchorEl, measuredDialog) {
      const gap = 8
      const dialog = measuredDialog || document.querySelector('.shift-picker-dialog')
      const dw = (dialog && dialog.offsetWidth) || 640
      const dh = (dialog && dialog.offsetHeight) || 420
      let coords = this.calcShiftPickerCoords(anchorEl)
      if (anchorEl && typeof anchorEl.getBoundingClientRect === 'function') {
        const rect = anchorEl.getBoundingClientRect()
        let left = rect.right + gap
        if (left + dw > window.innerWidth - gap) left = rect.left - dw - gap
        if (left < gap) left = gap
        let top = rect.top
        if (top + dh > window.innerHeight - gap) top = window.innerHeight - dh - gap
        if (top < gap) top = gap
        coords = { left: Math.round(left), top: Math.round(top) }
      }
      document.documentElement.style.setProperty('--shift-picker-left', `${coords.left}px`)
      document.documentElement.style.setProperty('--shift-picker-top', `${coords.top}px`)
      if (dialog) {
        const wrapper = dialog.parentElement
        if (wrapper) {
          wrapper.classList.add('shift-picker-wrapper')
          wrapper.style.pointerEvents = 'none'
        }
        dialog.style.pointerEvents = 'auto'
        dialog.style.margin = '0'
        dialog.style.transform = 'none'
        dialog.style.left = `${coords.left}px`
        dialog.style.top = `${coords.top}px`
      }
      return coords
    },
    lockBackgroundScroll() {
      this.shiftPickerScrollLockY = window.scrollY || window.pageYOffset || 0
      document.documentElement.classList.add('shift-picker-scroll-lock')
      document.body.classList.add('shift-picker-scroll-lock')
      document.body.style.top = `-${this.shiftPickerScrollLockY}px`
      document.querySelectorAll('.schedule-scroll, .overview-matrix').forEach((el) => {
        el.dataset.lockScrollTop = String(el.scrollTop)
        el.classList.add('is-scroll-locked')
      })
      window.addEventListener('wheel', this.blockBackgroundWheel, { passive: false, capture: true })
      window.addEventListener('touchmove', this.blockBackgroundWheel, { passive: false, capture: true })
    },
    unlockBackgroundScroll() {
      window.removeEventListener('wheel', this.blockBackgroundWheel, { capture: true })
      window.removeEventListener('touchmove', this.blockBackgroundWheel, { capture: true })
      document.documentElement.classList.remove('shift-picker-scroll-lock')
      document.body.classList.remove('shift-picker-scroll-lock')
      document.body.style.top = ''
      window.scrollTo(0, this.shiftPickerScrollLockY || 0)
      document.querySelectorAll('.schedule-scroll.is-scroll-locked, .overview-matrix.is-scroll-locked').forEach((el) => {
        const top = Number(el.dataset.lockScrollTop || 0)
        el.classList.remove('is-scroll-locked')
        el.scrollTop = top
        delete el.dataset.lockScrollTop
      })
    },
    blockBackgroundWheel(event) {
      if (!this.shiftPickerVisible) return
      const dialog = document.querySelector('.shift-picker-dialog')
      if (dialog && dialog.contains(event.target)) return
      event.preventDefault()
    },
    openShiftPicker(row, dateKey, event) {
      const current = row.shifts[dateKey]
      const mapped = current === '休' ? 'REST' : current
      const anchor = event && event.currentTarget ? event.currentTarget : null
      this.shiftPickerReady = false
      this.shiftPickerTarget = { row, dateKey }
      this.shiftPickerAnchorEl = anchor
      this.shiftPickerTab = 'day'
      this.shiftPickerKeyword = ''
      this.selectedPickerShiftIds = mapped ? [mapped] : []
      // 打开前先写入坐标，避免左上角闪一下
      this.applyShiftPickerCoords(anchor)
      this.lockBackgroundScroll()
      this.shiftPickerVisible = true
      document.addEventListener('mousedown', this.onShiftPickerOutside, true)
      this.$nextTick(() => {
        this.applyShiftPickerCoords(this.shiftPickerAnchorEl)
        requestAnimationFrame(() => {
          this.applyShiftPickerCoords(this.shiftPickerAnchorEl)
          this.shiftPickerReady = true
        })
      })
    },
    isPickerAnchor(row, dateKey) {
      return Boolean(
        this.shiftPickerVisible
        && this.shiftPickerTarget
        && this.shiftPickerTarget.row.id === row.id
        && this.shiftPickerTarget.dateKey === dateKey,
      )
    },
    onShiftPickerOpened() {
      this.applyShiftPickerCoords(this.shiftPickerAnchorEl)
      this.$nextTick(() => {
        this.applyShiftPickerCoords(this.shiftPickerAnchorEl)
        this.shiftPickerReady = true
      })
    },
    positionShiftPicker(anchorEl) {
      this.applyShiftPickerCoords(anchorEl)
    },
    onShiftPickerOutside(event) {
      if (!this.shiftPickerVisible) return
      const dialog = document.querySelector('.shift-picker-dialog')
      const target = event.target
      if (dialog && dialog.contains(target)) return
      if (this.shiftPickerAnchorEl && this.shiftPickerAnchorEl.contains(target)) return
      this.shiftPickerVisible = false
    },
    togglePickerShift(shiftId, selected) {
      if (selected) {
        this.selectedPickerShiftIds = [shiftId]
        return
      }
      this.selectedPickerShiftIds = this.selectedPickerShiftIds.filter((id) => id !== shiftId)
    },
    clearPickerShifts() {
      this.selectedPickerShiftIds = []
    },
    resetShiftPicker() {
      document.removeEventListener('mousedown', this.onShiftPickerOutside, true)
      this.unlockBackgroundScroll()
      this.shiftPickerReady = false
      this.shiftPickerTarget = null
      this.shiftPickerAnchorEl = null
      this.shiftPickerKeyword = ''
      this.selectedPickerShiftIds = []
      this.shiftPickerTab = 'day'
      document.documentElement.style.removeProperty('--shift-picker-left')
      document.documentElement.style.removeProperty('--shift-picker-top')
      const wrapper = document.querySelector('.shift-picker-wrapper')
      if (wrapper) {
        wrapper.classList.remove('shift-picker-wrapper')
        wrapper.style.pointerEvents = ''
      }
    },
    saveShiftPicker() {
      if (!this.shiftPickerTarget) {
        this.shiftPickerVisible = false
        return
      }
      const { row, dateKey } = this.shiftPickerTarget
      if (!this.selectedPickerShiftIds.length) {
        this.$set(row.shifts, dateKey, '休')
        this.shiftPickerVisible = false
        this.$message.success(`已将 ${row.name} 的班次清空为休息`)
        return
      }
      const nextId = this.selectedPickerShiftIds[0]
      const shift = this.shifts.find((item) => item.id === nextId)
      const stored = shift && shift.isRest ? '休' : nextId
      this.$set(row.shifts, dateKey, stored)
      this.shiftPickerVisible = false
      this.$message.success(`已将 ${row.name} 的班次替换为 ${shift ? shift.name : stored}`)
    },
    saveAutoConfig() {
      this.autoDialogVisible = false
      this.$message.success('自动排班配置已保存')
    },
    publishSchedule() {
      this.$confirm('发布后将同步至排班总览，确定发布吗？', '发布班表', {
        type: 'warning',
        customClass: 'publish-confirm-box',
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        closeOnClickModal: false,
      })
        .then(() => {
          this.$message.success('班表已发布，已进入排班总览')
          this.openOverview()
        })
        .catch(() => {})
    },
  },
  beforeDestroy() {
    document.removeEventListener('mousedown', this.onShiftPickerOutside, true)
    this.unlockBackgroundScroll()
  },
}
</script>
