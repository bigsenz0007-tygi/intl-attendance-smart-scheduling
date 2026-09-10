<template>
  <div class="overseas-schedule-root" :class="{ 'is-wizard-mode': isWizardLayout, 'is-page-fullscreen': pageFullscreen }">
  <Index class="overseas-schedule-app" :header="true" :aside="true" :content="true">
    <header class="topbar">
      <div class="brand">
        <div class="brand-logo-group">
          <img class="brand-logo-mark brand-logo-combined" :src="brandLogo" alt="京东物流" width="120" height="20">
        </div>
        <strong class="brand-title">考勤管理</strong>
      </div>
      <div class="topbar-actions">
        <div class="topbar-tools">
          <button type="button" class="topbar-tool" title="帮助中心" aria-label="帮助中心">
            <shell-icon name="help" />
          </button>
          <button type="button" class="topbar-tool" title="上线公告" aria-label="上线公告">
            <shell-icon name="notice" />
          </button>
          <button type="button" class="topbar-tool" title="权限刷新" aria-label="权限刷新">
            <shell-icon name="refresh" />
          </button>
        </div>
        <div class="topbar-user">
          <span class="avatar">AM</span>
          <span class="topbar-user__name">Amy Miller</span>
          <shell-icon class="topbar-user__arrow" name="arrowDown" />
        </div>
      </div>
    </header>

    <AppSidebar
      v-show="!pageFullscreen"
      :view-mode="sidebarViewMode"
      @navigate="onShellNavigate"
    />

    <main class="workspace" :class="{ 'is-wizard': isWizardLayout }">
      <AppQuickMenuTabs
        :active-title="currentPageTitle"
        :show-fullscreen="isScheduleView || isWizardLayout"
        :fullscreen="pageFullscreen"
        @toggle-fullscreen="togglePageFullscreen"
        @refresh="refreshCurrentPage"
      />

      <ZnShiftModule
        v-if="viewMode === 'schedule-domestic'"
        ref="znShiftModule"
        :initial-context="domesticScheduleContext"
        @query-schedule="handleDomesticScheduleQuery"
        @open-smart-schedule="openDomesticSmartSchedule"
      />

      <ScheduleOverview
        v-else-if="viewMode === 'schedule-intl'"
        :dates="displayDates"
        :shifts="shifts"
        :scheduleRows="scheduleRows"
        :picker-open="shiftPickerVisible"
        :picker-anchor="shiftPickerTarget"
        :initial-context="intlScheduleContext"
        @start-scheduling="openIntlSmartSchedule"
        @query-schedule="handleIntlScheduleQuery"
        @replace-shift="openShiftPicker"
        @open-auto-config="autoDialogVisible = true"
      />

      <DomesticSmartWizard
        v-else-if="viewMode === 'smart-domestic'"
        :initial-context="domesticScheduleContext"
        @cancel="openScheduleDomestic"
        @published="openScheduleDomestic"
      />

      <section v-else-if="viewMode === 'smart-intl'" class="wizard-card">
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
                        <shell-icon name="chevronRight" size="sm" />
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
                        :style="shiftStyle(row.shifts[date.key], isPickerAnchor(row, date.key))" :title="`${shiftName(row.shifts[date.key])} ${formatShiftRange(shiftFullTime(row.shifts[date.key]))}`"
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
        v-if="isWizardView"
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
      width="500px"
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
          @click="selectShiftPickerTab('day')"
        >按班次排</button>
        <button
          type="button"
          role="tab"
          class="shift-picker-tab"
          :class="{ 'is-active': shiftPickerTab === 'cycle' }"
          @click="selectShiftPickerTab('cycle')"
        >按轮班排</button>
        <button
          type="button"
          role="tab"
          class="shift-picker-tab"
          :class="{ 'is-active': shiftPickerTab === 'temporary' }"
          @click="selectShiftPickerTab('temporary')"
        >修改临时排班</button>
      </div>
      <div class="shift-picker-body">
        <el-input
          v-if="shiftPickerTab === 'day'"
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
              :class="{ 'is-rest': shift.isRest }"
              :style="pickerChipStyle(shift)" :title="`${shift.name} ${formatShiftRange(shift.time)}`"
            >
              <b>{{ shift.name }}</b>
              <small>{{ formatShiftRange(shift.time) }}</small>
            </span>
          </label>
        </div>
        <div v-else-if="shiftPickerTab === 'cycle'" class="shift-picker-cycle">
          <el-switch v-model="shiftPickerCycleApplyAll" />
          <span>从当前选中日期开始，应用到当前全部时间范围</span>
        </div>
        <temporary-shift-editor
          v-else
          v-model="temporaryShiftForm"
          :shift-name="temporaryShiftBase.name"
        />
      </div>
      <span slot="footer" class="shift-picker-footer">
        <el-button @click="shiftPickerVisible = false">取消</el-button>
        <el-button v-if="shiftPickerTab === 'day'" @click="clearPickerShifts">清空</el-button>
        <el-button v-else-if="shiftPickerTab === 'cycle'" @click="clearCyclePicker">清空</el-button>
        <el-button type="primary" @click="saveShiftPicker">{{ shiftPickerTab === 'temporary' ? '确定' : '保存' }}</el-button>
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
      <el-table :data="peopleDetailRows" border :max-height="360" class="people-detail-table">
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
import TemporaryShiftEditor from './components/TemporaryShiftEditor.vue'
import ZnShiftModule from './zn/ZnShiftModule.vue'
import DomesticSmartWizard from './zn/DomesticSmartWizard.vue'
import AppSidebar from './components/shell/AppSidebar.vue'
import AppQuickMenuTabs from './components/shell/AppQuickMenuTabs.vue'
import ShellIcon from './components/shell/ShellIcon.vue'
import { assetUrl } from './utils/assetUrl'
import { dates, forecastRows, shifts, scheduleRows } from './data/mock'
import pageFullscreen from './mixins/workspaceFullscreen'
import { resolveShiftChipStyle, decorateShift } from './utils/shiftPalette'

const passthrough = (name, className) => ({
  name,
  functional: true,
  render(h, context) { return h('div', { ...context.data, class: [className, context.data.class] }, context.children) },
})

export default {
  name: 'App',
  mixins: [pageFullscreen],
  components: {
    ForecastMatrix,
    ScheduleOverview,
    TemporaryShiftEditor,
    ZnShiftModule,
    DomesticSmartWizard,
    AppSidebar,
    AppQuickMenuTabs,
    ShellIcon,
    Index: passthrough('Index', 'prototype-shell'),
    SchedulingList: passthrough('SchedulingList', 'scheduling-list-adapter'),
    UserInfoCellOfScheduleTable: passthrough('UserInfoCellOfScheduleTable', 'user-info-cell-adapter'),
  },
  data() {
    return {
      brandLogo: assetUrl('shell/jdl-logo-combined.svg'),
      viewMode: 'schedule-domestic',
      domesticScheduleContext: {
        department: 'tz-yz',
        attendanceGroup: 'default',
        processGroup: 'all',
        scheduleMonth: '2026-09',
        scene: 'domestic',
      },
      intlScheduleContext: {
        department: 'nl-01',
        attendanceGroup: 'all',
        processGroup: 'all',
        scheduleMonth: '2026-07',
        scheduleRange: ['2026-07-01', '2026-07-31'],
        scene: 'international',
      },
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
      shiftPickerCycleApplyAll: false,
      temporaryShiftForm: {
        date: '',
        crossNight: '否',
        boundaryHours: 1,
        startTime: '',
        endTime: '',
      },
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
      peopleDetailRows: [
        { group: '5S', recommended: '3人', actual: '3人', diff: '0人', diffValue: 0 },
        { group: '保安', recommended: '2人', actual: '2人', diff: '0人', diffValue: 0 },
        { group: '线下业务', recommended: '5人', actual: '5人', diff: '0人', diffValue: 0 },
        { group: '常规', recommended: '6人', actual: '6人', diff: '0人', diffValue: 0 },
      ],
    }
  },
  computed: {
    isWizardView() {
      return this.viewMode === 'smart-intl'
    },
    isWizardLayout() {
      return this.viewMode === 'smart-intl' || this.viewMode === 'smart-domestic'
    },
    isScheduleView() {
      return this.viewMode === 'schedule-domestic' || this.viewMode === 'schedule-intl'
    },
    sidebarViewMode() {
      return this.viewMode
    },
    currentPageTitle() {
      const titles = {
        'schedule-domestic': '排班倒班',
        'schedule-intl': '排班倒班（国际）',
        'smart-domestic': '智能排班',
        'smart-intl': '智能排班（国际）',
      }
      return titles[this.viewMode] || '排班倒班'
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
      return [
        'shift-picker-dialog',
        'app-shift-picker-dialog',
        this.shiftPickerReady ? 'is-ready' : '',
      ].filter(Boolean).join(' ')
    },
    temporaryShiftBase() {
      if (!this.shiftPickerTarget) return { name: '--', time: '' }
      const { row, dateKey } = this.shiftPickerTarget
      const shiftId = row && row.shifts ? row.shifts[dateKey] : null
      if (shiftId === '休' || shiftId === 'REST') return { name: '休息', time: '00:00-23:59', isRest: true }
      return this.shifts.find((shift) => shift.id === shiftId) || { name: '--', time: '' }
    },
  },
  watch: {
    isScheduleView(isSchedule) {
      if (!isSchedule) this.exitPageFullscreen()
    },
  },
  methods: {
    async confirmDomesticDraft(message) {
      const mod = this.$refs.znShiftModule
      if (!mod || !mod.hasUnsavedBoardChanges) return true
      try {
        await this.$confirm(message, '提示', { type: 'warning', confirmButtonText: '确定', cancelButtonText: '取消' })
        mod.hasUnsavedBoardChanges = false
        return true
      } catch (error) { return false }
    },
    async refreshCurrentPage() {
      if (!(await this.confirmDomesticDraft('还有排班没有保存，确定刷新吗？'))) return
      window.location.reload()
    },
    async onShellNavigate(mode) {
      if (mode !== this.viewMode && !(await this.confirmDomesticDraft('还有排班没有保存，确定离开吗？'))) return
      if (mode === 'schedule-domestic') this.openScheduleDomestic()
      else if (mode === 'schedule-intl') this.openScheduleIntl()
      else if (mode === 'smart-domestic') this.openDomesticSmartSchedule(this.liveDomesticScheduleContext())
      else if (mode === 'smart-intl') this.openIntlSmartSchedule()
    },
    openScheduleDomestic() {
      this.viewMode = 'schedule-domestic'
      window.scrollTo({ top: 0, behavior: 'smooth' })
    },
    openScheduleIntl() {
      this.viewMode = 'schedule-intl'
      window.scrollTo({ top: 0, behavior: 'smooth' })
    },
    liveDomesticScheduleContext() {
      const mod = this.$refs.znShiftModule
      if (!mod) return {}
      return {
        department: mod.department,
        attendanceGroup: mod.attendanceGroup,
        scheduleMonth: mod.scheduleMonth,
        processGroup: 'all',
      }
    },
    isBackOfficeZnContext(context = {}) {
      return context.department === 'hb-zn-01' || context.attendanceGroup === 'zn-001'
    },
    openDomesticSmartSchedule(context = {}) {
      const merged = {
        ...this.domesticScheduleContext,
        ...context,
        scene: 'domestic',
      }
      this.domesticScheduleContext = merged
      if (this.isBackOfficeZnContext(merged)) {
        this.viewMode = 'schedule-domestic'
        this.$nextTick(() => {
          const mod = this.$refs.znShiftModule
          if (mod && typeof mod.openSmartConfig === 'function') mod.openSmartConfig()
        })
        return
      }
      this.viewMode = 'smart-domestic'
      window.scrollTo({ top: 0, behavior: 'smooth' })
    },
    openIntlSmartSchedule(filters = {}) {
      const payload = filters && typeof filters === 'object' && !filters.type ? filters : {}
      this.intlScheduleContext = {
        ...this.intlScheduleContext,
        ...payload,
        scene: 'international',
      }
      this.viewMode = 'smart-intl'
      this.activeStep = 0
      this.department = payload.department || this.intlScheduleContext.department || 'nl-01'
      this.processGroup = payload.processGroup || this.intlScheduleContext.processGroup || 'all'
      this.scheduleKeyword = ''
      window.scrollTo({ top: 0, behavior: 'smooth' })
    },
    handleDomesticScheduleQuery(context = {}) {
      this.domesticScheduleContext = {
        ...this.domesticScheduleContext,
        ...context,
        scene: 'domestic',
      }
    },
    handleIntlScheduleQuery(context = {}) {
      this.intlScheduleContext = {
        ...this.intlScheduleContext,
        ...context,
        scene: 'international',
      }
    },
    cancelWizard() {
      this.openScheduleIntl()
    },
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
      return resolveShiftChipStyle(shift, selected)
    },
    restCellStyle(selected = false) {
      if (!selected) return {}
      const stroke = this.darkenHex('#A8AEB8', 0.08)
      return { borderColor: stroke, boxShadow: `inset 0 0 0 2px ${stroke}` }
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
      return resolveShiftChipStyle(shift)
    },
    resolvePickerShiftStored(shiftId) {
      if (!shiftId) return '休'
      const shift = this.shifts.find((item) => item.id === shiftId)
      return shift && shift.isRest ? '休' : shiftId
    },
    applyPickerShiftToTarget(shiftId) {
      if (!this.shiftPickerTarget) return
      const { row, dateKey } = this.shiftPickerTarget
      this.$set(row.shifts, dateKey, this.resolvePickerShiftStored(shiftId))
    },
    calcShiftPickerCoords(anchorEl, dialogWidth = 500, dialogHeight = 520) {
      const viewportPadding = 16
      const anchorGap = 12
      const maxLeft = Math.max(viewportPadding, window.innerWidth - dialogWidth - viewportPadding)
      const maxTop = Math.max(viewportPadding, window.innerHeight - dialogHeight - viewportPadding)
      if (!anchorEl || typeof anchorEl.getBoundingClientRect !== 'function') {
        return {
          left: Math.round(Math.min(maxLeft, Math.max(viewportPadding, (window.innerWidth - dialogWidth) / 2))),
          top: Math.round(Math.min(maxTop, Math.max(viewportPadding, 120))),
        }
      }
      const rect = anchorEl.getBoundingClientRect()
      let left
      if (rect.right + anchorGap + dialogWidth <= window.innerWidth - viewportPadding) {
        left = rect.right + anchorGap
      } else if (rect.left - anchorGap - dialogWidth >= viewportPadding) {
        left = rect.left - anchorGap - dialogWidth
      } else {
        left = rect.left + ((rect.width - dialogWidth) / 2)
      }
      left = Math.min(maxLeft, Math.max(viewportPadding, left))
      const top = Math.min(maxTop, Math.max(viewportPadding, rect.top))
      return { left: Math.round(left), top: Math.round(top) }
    },
    applyShiftPickerCoords(anchorEl, measuredDialog) {
      const dialog = measuredDialog || document.querySelector('.app-shift-picker-dialog')
      const dialogWidth = (dialog && dialog.offsetWidth) || Math.min(500, window.innerWidth - 32)
      const dialogHeight = (dialog && dialog.offsetHeight) || 520
      const coords = this.calcShiftPickerCoords(anchorEl, dialogWidth, dialogHeight)
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
      const dialog = document.querySelector('.app-shift-picker-dialog')
      if (dialog && dialog.contains(event.target)) return
      event.preventDefault()
    },
    openShiftPicker(row, dateOrKey, event) {
      const dateKey = typeof dateOrKey === 'object' ? dateOrKey.key : dateOrKey
      const fullDate = typeof dateOrKey === 'object' && dateOrKey.fullDate
        ? dateOrKey.fullDate
        : this.resolveTemporaryShiftDate(dateKey)
      const current = row.shifts[dateKey]
      const mapped = current === '休' ? 'REST' : current
      const anchor = event && event.currentTarget ? event.currentTarget : null
      this.shiftPickerReady = false
      this.shiftPickerTarget = { row, dateKey }
      this.shiftPickerAnchorEl = anchor
      this.shiftPickerTab = 'day'
      this.shiftPickerKeyword = ''
      this.shiftPickerCycleApplyAll = false
      this.selectedPickerShiftIds = mapped ? [mapped] : []
      this.initializeTemporaryShiftForm(current, fullDate)
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
      const dialog = document.querySelector('.app-shift-picker-dialog')
      const target = event.target
      if (target && target.closest && target.closest('.shift-picker-control-popper')) return
      if (dialog && dialog.contains(target)) return
      if (this.shiftPickerAnchorEl && this.shiftPickerAnchorEl.contains(target)) return
      this.shiftPickerVisible = false
    },
    togglePickerShift(shiftId, selected) {
      if (selected) {
        this.selectedPickerShiftIds = [shiftId]
        this.applyPickerShiftToTarget(shiftId)
        return
      }
      this.selectedPickerShiftIds = this.selectedPickerShiftIds.filter((id) => id !== shiftId)
    },
    clearPickerShifts() {
      this.selectedPickerShiftIds = []
      this.applyPickerShiftToTarget(null)
    },
    clearCyclePicker() {
      this.shiftPickerCycleApplyAll = false
    },
    selectShiftPickerTab(tab) {
      this.shiftPickerTab = tab
      if (tab === 'temporary' && this.shiftPickerTarget) {
        const { row, dateKey } = this.shiftPickerTarget
        this.initializeTemporaryShiftForm(row.shifts[dateKey], this.resolveTemporaryShiftDate(dateKey))
      }
      this.$nextTick(() => this.applyShiftPickerCoords(this.shiftPickerAnchorEl))
    },
    resolveTemporaryShiftDate(dateKey) {
      const matched = this.displayDates.find((date) => date.key === dateKey)
      if (matched && matched.fullDate) return matched.fullDate
      const year = String((this.intlScheduleContext.scheduleRange || [])[0] || this.intlScheduleContext.scheduleMonth || '2026').slice(0, 4)
      return `${year}-${dateKey}`
    },
    initializeTemporaryShiftForm(shiftId, date) {
      const shift = shiftId === '休' || shiftId === 'REST'
        ? { time: '00:00-23:59' }
        : this.shifts.find((item) => item.id === shiftId)
      const [startTime = '09:00', endTime = '18:00'] = String((shift && shift.time) || '09:00-18:00').split('-')
      this.temporaryShiftForm = {
        date,
        crossNight: endTime <= startTime ? '是' : '否',
        boundaryHours: 1,
        startTime,
        endTime,
      }
    },
    saveTemporaryShift() {
      if (!this.shiftPickerTarget) return false
      const { row, dateKey: sourceDateKey } = this.shiftPickerTarget
      const { date, startTime, endTime } = this.temporaryShiftForm
      if (!date || !startTime || !endTime) {
        this.$message.warning('请完整填写班次日期和上下班时间')
        return false
      }
      const sourceShiftId = row.shifts[sourceDateKey]
      const base = sourceShiftId === '休' || sourceShiftId === 'REST'
        ? { name: '临时班次' }
        : (this.shifts.find((item) => item.id === sourceShiftId) || { name: '临时班次' })
      const targetDateKey = date.slice(5)
      const id = `TEMP-${row.id}-${date.replace(/-/g, '')}-${Date.now()}`
      const temporaryShift = decorateShift({
        ...base,
        id,
        name: base.isRest ? '临时班次' : base.name,
        time: `${startTime}-${endTime}`,
        isRest: false,
        temporary: true,
      })
      this.shifts = this.shifts.concat([temporaryShift])
      this.$set(row.shifts, targetDateKey, id)
      this.shiftPickerVisible = false
      this.$message.success(`已临时修改 ${row.name} ${date} 的上下班时间`)
      return true
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
      this.shiftPickerCycleApplyAll = false
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
      if (this.shiftPickerTab === 'temporary') {
        this.saveTemporaryShift()
        return
      }
      if (this.shiftPickerTab === 'cycle') {
        const { row, dateKey } = this.shiftPickerTarget
        const nextId = this.selectedPickerShiftIds[0] || null
        const stored = this.resolvePickerShiftStored(nextId)
        if (this.shiftPickerCycleApplyAll) {
          const startIndex = this.displayDates.findIndex((date) => date.key === dateKey)
          this.displayDates.slice(Math.max(0, startIndex)).forEach((date) => {
            this.$set(row.shifts, date.key, stored)
          })
        }
        const label = stored === '休' ? '休息' : this.shiftName(stored)
        this.shiftPickerVisible = false
        this.$message.success(this.shiftPickerCycleApplyAll
          ? `已从当前日期起将 ${row.name} 的班次应用为 ${label}`
          : `已保留 ${row.name} 当前日期的排班`)
        return
      }
      const { row } = this.shiftPickerTarget
      const nextId = this.selectedPickerShiftIds[0] || null
      const stored = this.resolvePickerShiftStored(nextId)
      const label = stored === '休' ? '休息' : this.shiftName(stored)
      this.shiftPickerVisible = false
      this.$message.success(`已将 ${row.name} 的班次替换为 ${label}`)
    },
    saveAutoConfig() {
      this.autoDialogVisible = false
      this.$message.success('自动排班配置已保存')
    },
    publishSchedule() {
      this.$confirm('发布后将同步至排班倒班，确定发布吗？', '发布班表', {
        type: 'warning',
        customClass: 'publish-confirm-box',
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        closeOnClickModal: false,
      })
        .then(() => {
          this.$message.success('班表已发布，已进入排班倒班')
          this.openScheduleIntl()
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
