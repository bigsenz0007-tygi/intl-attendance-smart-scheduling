<template>
  <div class="smart-schedule-page" :class="{ 'is-overview': viewMode === 'overview' }">
    <ScheduleOverview
      v-if="viewMode === 'overview'"
      :dates="displayDates"
      :shifts="shifts"
      :schedule-rows="scheduleRows"
      :picker-open="shiftPickerVisible"
      :picker-anchor="shiftPickerTarget"
      @start-scheduling="startOver"
      @replace-shift="openShiftPicker"
    />

    <template v-else>
    <section class="wizard-card">
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
              <img class="arrow-step__icon" :src="stepStateIcon(index)" alt="" />
              <strong>{{ step.title }}</strong>
            </span>
          </div>
        </div>
      </div>

      <!-- 步骤1：确认出勤工时/人数 -->
      <section v-if="activeStep === 0" class="wizard-panel step-two">
        <div class="selection-summary">
          <span class="summary-item"><span class="summary-label">排班部门：</span><strong>{{ selectedDepartmentLabel }}</strong></span>
          <span class="summary-item"><span class="summary-label">环节组：</span><strong>{{ selectedProcessLabel }}</strong></span>
        </div>
        <ForecastMatrix :dates="dates" :rows="visibleForecastRows" @target-change="onTargetChange" />
      </section>

      <!-- 步骤2：确认出勤班表 -->
      <section v-else class="wizard-panel step-three">
        <div class="selection-summary">
          <span class="summary-item"><span class="summary-label">排班部门：</span><strong>{{ selectedDepartmentLabel }}</strong></span>
          <span class="summary-item"><span class="summary-label">环节组：</span><strong>{{ selectedProcessLabel }}</strong></span>
        </div>
        <div class="scheduling-list-adapter">
          <div class="schedule-scroll">
            <table class="schedule-table">
              <thead>
                <tr>
                  <th class="person-col">
                    <div class="schedule-person-header">
                      <div class="schedule-search" :class="{ 'is-empty': isScheduleSearchEmpty }">
                        <el-input
                          ref="scheduleSearchInput"
                          v-model="scheduleKeyword"
                          clearable
                          prefix-icon="el-icon-search"
                          placeholder="搜索人员"
                          @focus="scheduleSearchFocused = true"
                          @blur="scheduleSearchFocused = false"
                        />
                      </div>
                    </div>
                  </th>
                  <th v-for="date in displayDates" :key="date.key">
                    <strong>{{ date.label }}</strong><span>{{ date.week }}</span>
                  </th>
                </tr>
              </thead>
              <tbody class="schedule-summary-body">
                <tr>
                  <th>实排工时/推荐工时</th>
                  <td v-for="date in displayDates" :key="'hours-' + date.key">
                    <button type="button" class="daily-compare" @click="hoursDetailVisible = true">
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
                      type="button"
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
        </div>
      </section>
    </section>

    <footer class="flow-actions wizard-flow-actions">
      <el-button @click="cancelWizard">取消</el-button>
      <el-button v-if="activeStep > 0" @click="previousStep">上一步</el-button>
      <el-button v-if="activeStep === 0" type="primary" @click="nextStep">下一步</el-button>
      <el-button v-else type="primary" icon="el-icon-s-promotion" @click="publishSchedule">发布班表</el-button>
    </footer>
    </template>

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
        <button type="button" role="tab" class="shift-picker-tab" :class="{ 'is-active': shiftPickerTab === 'day' }" @click="shiftPickerTab = 'day'">按天排班</button>
        <button type="button" role="tab" class="shift-picker-tab" :class="{ 'is-active': shiftPickerTab === 'cycle' }" @click="shiftPickerTab = 'cycle'">周期排班</button>
      </div>
      <div class="shift-picker-body">
        <el-input v-model="shiftPickerKeyword" clearable prefix-icon="el-icon-search" placeholder="模糊搜索班次" />
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
            <span class="shift-picker-chip" :style="pickerChipStyle(shift)">
              <b>{{ shift.name }}</b>
              <small>{{ formatShiftRange(shift.time) }}</small>
            </span>
          </label>
        </div>
        <div v-else class="shift-picker-cycle-empty">周期排班为原型占位，当前请使用「按天排班」更换班次。</div>
      </div>
      <div slot="footer" class="shift-picker-footer">
        <el-button @click="shiftPickerVisible = false">取消</el-button>
        <el-button type="primary" @click="saveShiftPicker">保存</el-button>
      </div>
    </el-dialog>

    <el-dialog title="工时明细" class="hours-detail-dialog detail-dialog" :visible.sync="hoursDetailVisible" :close-on-click-modal="false" :destroy-on-close="true" width="960px">
      <div class="hours-detail-grid">
        <div v-for="date in displayDates" :key="date.key" class="hours-detail-column">
          <header>
            <strong>{{ date.label }}</strong>
            <span>({{ dailyHoursActual[dateMetricIndex(date)] }}/{{ dailyHoursRecommended[dateMetricIndex(date)] }})</span>
          </header>
          <div>
            <p v-for="person in detailPeople" :key="person.name">{{ person.name }}｜{{ person.hours }}h</p>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script>
/**
 * 海外智能排班 — 排班总览（智能排班入口气泡）+ 步骤1/2
 * 框架：Vue2 Options API 响应式（data / computed / $set）
 * 样式：以当前确认的 LUI PC3.0 视觉为准；运行时库为 @lui/lui-ui@2.x，通过本模块样式覆盖，不回退 2.0 默认观感
 */
import ForecastMatrix from './components/ForecastMatrix.vue'
import ScheduleOverview from './components/ScheduleOverview.vue'
import { dates, forecastRows, shifts, scheduleRows } from './mock'
import { assetUrl } from '../utils/assetUrl'

export default {
  name: 'SmartSchedule',
  components: { ForecastMatrix, ScheduleOverview },
  props: {
    initialViewMode: {
      type: String,
      default: 'overview',
      validator: (value) => ['overview', 'wizard'].includes(value),
    },
  },
  data() {
    return {
      viewMode: this.initialViewMode,
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
      forecastRows: JSON.parse(JSON.stringify(forecastRows)),
      shifts,
      scheduleRows: JSON.parse(JSON.stringify(scheduleRows)),
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
      detailPeople: [
        { name: '张伟', hours: 10 },
        { name: '李娜', hours: 8 },
        { name: '王芳', hours: 10 },
      ],
      hoursDetailVisible: false,
    }
  },
  computed: {
    displayDates() {
      return this.dates.slice(1)
    },
    selectedDepartmentLabel() {
      if (this.department === 'nl-01') return '欧洲区 · 荷兰一号仓'
      if (this.department === 'de-fra') return '欧洲区 · 德国法兰克福仓'
      return ''
    },
    selectedProcessLabel() {
      const item = this.processOptions.find((option) => option.value === this.processGroup)
      return item ? item.label : ''
    },
    visibleForecastRows() {
      const metricRows = this.forecastRows.filter((row) => row.category === 'metric')
      const processRows = this.forecastRows.filter((row) => row.category === 'process')
      if (this.processGroup === 'all') return [...metricRows, ...processRows]
      return [...metricRows, ...processRows.filter((row) => row.processKey === this.processGroup)]
    },
    isScheduleSearchEmpty() {
      return !String(this.scheduleKeyword || '').trim()
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
      return this.shiftPickerReady
        ? 'shift-picker-dialog intl-shift-picker-dialog is-ready'
        : 'shift-picker-dialog intl-shift-picker-dialog'
    },
  },
  beforeDestroy() {
    document.removeEventListener('mousedown', this.onShiftPickerOutside, true)
    this.unlockBackgroundScroll()
  },
  methods: {
    assetUrl,
    openOverview() {
      if (this.initialViewMode === 'wizard') {
        this.$emit('request-overview')
        return
      }
      this.viewMode = 'overview'
    },
    startOver(filters = {}) {
      const payload = filters && typeof filters === 'object' && !filters.type ? filters : {}
      this.viewMode = 'wizard'
      this.activeStep = 0
      this.department = payload.department || 'nl-01'
      this.processGroup = payload.processGroup || 'all'
      this.scheduleKeyword = ''
    },
    cancelWizard() {
      this.openOverview()
    },
    previousStep() {
      if (this.activeStep > 0) this.activeStep -= 1
    },
    nextStep() {
      if (this.activeStep < this.workflowSteps.length - 1) this.activeStep += 1
    },
    goToStep(index) {
      if (index < 0 || index >= this.workflowSteps.length) return
      this.activeStep = index
    },
    onTargetChange({ rowId, dateKey, value }) {
      const row = this.forecastRows.find((item) => item.id === rowId)
      if (row) this.$set(row.values, dateKey, value)
    },
    signedDiff(value) {
      return value > 0 ? `+${value}` : String(value)
    },
    stepStateIcon(index) {
      const step = this.workflowSteps[index]
      if (index < this.activeStep) return assetUrl('figma-stepper/check.svg')
      if (index === this.activeStep) return step.activeIcon
      return step.pendingIcon
    },
    dateMetricIndex(date) {
      return this.dates.findIndex((item) => item.key === date.key)
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
      style['--shift-hover-border'] = this.darkenHex(shift.color, 0.12)
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
    applyShiftPickerCoords(anchorEl) {
      const gap = 8
      const dialog = document.querySelector('.shift-picker-dialog')
      const dw = (dialog && dialog.offsetWidth) || 640
      const dh = (dialog && dialog.offsetHeight) || 420
      let left = gap
      let top = 120
      if (anchorEl && typeof anchorEl.getBoundingClientRect === 'function') {
        const rect = anchorEl.getBoundingClientRect()
        left = rect.right + gap
        if (left + dw > window.innerWidth - gap) left = rect.left - dw - gap
        if (left < gap) left = gap
        top = rect.top
        if (top + dh > window.innerHeight - gap) top = window.innerHeight - dh - gap
        if (top < gap) top = gap
      }
      left = Math.round(left)
      top = Math.round(top)
      document.documentElement.style.setProperty('--shift-picker-left', `${left}px`)
      document.documentElement.style.setProperty('--shift-picker-top', `${top}px`)
      if (dialog) {
        const wrapper = dialog.parentElement
        if (wrapper) {
          wrapper.classList.add('shift-picker-wrapper')
          wrapper.style.pointerEvents = 'none'
        }
        dialog.style.pointerEvents = 'auto'
        dialog.style.margin = '0'
        dialog.style.transform = 'none'
        dialog.style.left = `${left}px`
        dialog.style.top = `${top}px`
      }
    },
    lockBackgroundScroll() {
      this.shiftPickerScrollLockY = window.scrollY || window.pageYOffset || 0
      document.documentElement.classList.add('shift-picker-scroll-lock')
      document.body.classList.add('shift-picker-scroll-lock')
      document.body.style.top = `-${this.shiftPickerScrollLockY}px`
      document.querySelectorAll('.smart-schedule-page .schedule-scroll').forEach((el) => {
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
      document.querySelectorAll('.smart-schedule-page .schedule-scroll.is-scroll-locked').forEach((el) => {
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
    publishSchedule() {
      this.$confirm('发布后将同步至排班倒班，确定发布吗？', '发布班表', {
        type: 'warning',
        customClass: 'publish-confirm-box',
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        closeOnClickModal: false,
      })
        .then(() => {
          this.$message.success('班表已发布')
        })
        .catch(() => {})
    },
  },
}
</script>

<style lang="scss">
@import './styles/smart-schedule.scss';

/* 页面壳：适配仓库 Layout 内容区，一屏内步骤+底栏 */
.smart-schedule-page {
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  width: 100%;
  height: calc(100vh - 100px);
  min-height: 640px;
  padding: 12px 16px 0;
  overflow: hidden;
  background: #f3f5f8;
}

.smart-schedule-page.is-overview {
  height: auto;
  min-height: calc(100vh - 100px);
  padding-bottom: 16px;
  overflow: visible;
}

.smart-schedule-page .wizard-card {
  display: flex;
  flex: 1 1 0;
  flex-direction: column;
  min-height: 0;
  margin-top: 0;
  overflow: hidden;
  background: transparent;
}

.smart-schedule-page .wizard-card > .wizard-panel.step-two,
.smart-schedule-page .wizard-card > .wizard-panel.step-three {
  display: flex;
  flex: 1 1 0;
  flex-direction: column;
  min-height: 0;
  margin: 0;
  padding: 16px 16px 12px;
  overflow: hidden;
  border-radius: 8px;
  background: #fff;
}

.smart-schedule-page .wizard-flow-actions {
  flex: 0 0 56px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  box-sizing: border-box;
  height: 56px;
  margin: 24px -16px 0;
  padding: 12px 24px;
  border-top: 1px solid #e8e8e8;
  background: #fff;
  box-shadow: 0 -2px 8px rgba(35, 37, 43, 0.08);
}

/* PC3.0 按钮覆盖（相对 LUI 2.0 默认） */
.smart-schedule-page .wizard-flow-actions .el-button {
  height: 32px;
  padding: 0 16px;
  border-radius: 8px;
  font-size: 14px;
  line-height: 30px;
}

.smart-schedule-page .wizard-flow-actions .el-button--primary {
  color: #fff;
  border-color: #3c6ef0;
  background: #3c6ef0;
}

.smart-schedule-page .wizard-flow-actions .el-button--primary:hover,
.smart-schedule-page .wizard-flow-actions .el-button--primary:focus {
  border-color: #3663d8;
  background: #3663d8;
}
</style>
