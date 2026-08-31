<template>
  <Index class="overseas-schedule-app schedule-monitor-app" :header="true" :aside="true" :content="true">
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
          :class="{ active: item.active }"
        >
          <i :class="item.icon"></i><span>{{ item.label }}</span><i v-if="item.expand" class="el-icon-arrow-down nav-arrow"></i>
        </div>
      </div>
      <div class="sidebar-foot"><i class="el-icon-s-fold"></i><span>收起菜单</span></div>
    </aside>

    <main class="workspace">
      <div class="page-tabs">
        <span class="page-tab-home">首页</span>
        <span class="page-tab-active">排班监控中心 <i class="el-icon-close"></i></span>
      </div>

      <section class="monitor-page">
        <!-- 查询区：仅部门 + 时间，重置/查询靠右 -->
        <section class="monitor-filter" :class="{ 'is-error': filterError }">
          <div class="monitor-query-grid">
            <div class="monitor-query-item">
              <label class="monitor-query-label">
                <span class="required">*</span>
                <span>部门</span>
              </label>
              <el-select
                v-model="department"
                filterable
                placeholder="请选择部门"
                popper-class="overseas-select-popper"
                :class="{ 'is-limit-error': filterError && !department }"
              >
                <el-option
                  v-for="opt in departmentOptions"
                  :key="opt.value"
                  :label="opt.label"
                  :value="opt.value"
                />
              </el-select>
            </div>
            <div class="monitor-query-item">
              <label class="monitor-query-label">
                <span class="required">*</span>
                <span>时间范围</span>
                <el-tooltip content="按日统计所选时间范围内的排班效能指标" placement="top">
                  <i class="el-icon-question monitor-help-icon"></i>
                </el-tooltip>
              </label>
              <el-date-picker
                v-model="dateRange"
                type="daterange"
                range-separator="-"
                start-placeholder="起始日期"
                end-placeholder="结束日期"
                value-format="yyyy-MM-dd"
                :class="{ 'is-limit-error': filterError && (!dateRange || dateRange.length < 2) }"
              />
            </div>
            <div class="monitor-query-actions">
              <el-button @click="onReset">重置</el-button>
              <el-button type="primary" class="monitor-query-btn" @click="onQuery">查询</el-button>
            </div>
          </div>
        </section>

        <section class="monitor-block">
          <div class="monitor-block__head">
            <img
              class="monitor-block__icon"
              :src="assetUrl('monitor/icon-section-efficiency.png')"
              alt=""
              width="20"
              height="20"
            >
            <h2>智能排班效能监控</h2>
          </div>

          <div class="kpi-grid">
            <article v-for="item in kpiMetrics" :key="item.key" class="kpi-card">
              <div class="kpi-card__body">
                <span class="kpi-card__label">{{ item.label }}</span>
                <div class="kpi-card__metric">
                  <strong class="kpi-card__value">{{ formatNumber(item.displayValue) }}</strong>
                  <span class="kpi-card__unit">{{ item.unit }}</span>
                </div>
                <div class="kpi-card__trends">
                  <div class="kpi-card__trend" :class="trendTone(item.yoy.direction)">
                    <span class="kpi-card__trend-label">同比</span>
                    <span class="kpi-card__trend-value">{{ formatTrend(item.yoy.value) }}</span>
                    <img
                      class="kpi-card__trend-icon"
                      :src="trendIcon(item.yoy.direction)"
                      alt=""
                      width="12"
                      height="9"
                    >
                  </div>
                  <div class="kpi-card__trend" :class="trendTone(item.mom.direction)">
                    <span class="kpi-card__trend-label">环比</span>
                    <span class="kpi-card__trend-value">{{ formatTrend(item.mom.value) }}</span>
                    <img
                      class="kpi-card__trend-icon"
                      :src="trendIcon(item.mom.direction)"
                      alt=""
                      width="12"
                      height="9"
                    >
                  </div>
                </div>
              </div>
              <img class="kpi-card__watermark" :src="item.icon" alt="" width="48" height="48">
            </article>
          </div>

          <div class="trend-grid">
            <TrendChart
              v-for="chart in trendCharts"
              :key="chart.key"
              :title="chart.title"
              :color="chart.color"
              :labels="trendLabels"
              :points="chart.points"
            />
          </div>
        </section>

        <section class="monitor-block monitor-block--table">
          <div class="monitor-block__head monitor-block__head--row">
            <div class="monitor-block__title">
              <img
                class="monitor-block__icon"
                :src="assetUrl('monitor/icon-section-adjustment.png')"
                alt=""
                width="20"
                height="20"
              >
              <h2>数据调整分析</h2>
            </div>
            <el-button type="primary" class="monitor-export-btn" icon="el-icon-download" @click="onExport">导出结果</el-button>
          </div>

          <div class="monitor-table-wrap">
            <table class="monitor-table">
              <thead>
                <tr>
                  <th>日期</th>
                  <th>用工性质</th>
                  <th>算法推荐工时</th>
                  <th>实际出勤工时</th>
                  <th>偏差工时</th>
                  <th>准确率</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, idx) in pagedRows" :key="row.date + row.employmentType + idx">
                  <td class="font-num">{{ row.date }}</td>
                  <td class="font-text">{{ row.employmentType }}</td>
                  <td class="hours-cell font-num">{{ row.recommended }}<span class="hours-unit">h</span></td>
                  <td class="hours-cell font-num">{{ row.actual }}<span class="hours-unit">h</span></td>
                  <td class="hours-cell font-num" :class="deviationClass(row.deviation)">
                    {{ formatDeviation(row.deviation) }}<span class="hours-unit">h</span>
                  </td>
                  <td class="font-num">{{ formatPercent(row.accuracy) }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="monitor-pagination">
            <el-pagination
              background
              layout="total, prev, pager, next, sizes, jumper"
              :current-page.sync="currentPage"
              :page-size.sync="pageSize"
              :page-sizes="[10, 20, 50, 100]"
              :total="totalRecords"
              @size-change="onPageSizeChange"
              @current-change="onPageChange"
            />
          </div>
        </section>
      </section>
    </main>
  </Index>
</template>

<script>
import jdlMark from '../assets/jdl-mark.svg'
import { assetUrl } from '../utils/assetUrl'
import TrendChart from './components/TrendChart.vue'
import {
  departmentOptions,
  kpiMetrics,
  buildMonitorByRange,
  DEFAULT_DATE_RANGE,
  PAGE_SIZE,
} from './mock'

const TREND_UP = assetUrl('monitor/trend-up.svg')
const TREND_DOWN = assetUrl('monitor/trend-down.svg')
const KPI_COUNT_DURATION = 900

function easeOutCubic(t) {
  return 1 - (1 - t) ** 3
}

export default {
  name: 'ScheduleMonitorApp',
  components: { TrendChart },
  data() {
    const [start, end] = DEFAULT_DATE_RANGE
    const series = buildMonitorByRange(start, end)
    return {
      jdlMark,
      departmentOptions,
      kpiMetrics: kpiMetrics.map((item) => ({
        ...item,
        displayValue: 0,
      })),
      trendCharts: series.trendCharts,
      trendLabels: series.trendLabels,
      adjustmentRows: series.adjustmentRows,
      totalRecords: series.totalRecords,
      pageSize: PAGE_SIZE,
      currentPage: 1,
      department: 'all',
      dateRange: [...DEFAULT_DATE_RANGE],
      filterError: false,
      _kpiAnimFrame: null,
      navItems: [
        { label: '首页', icon: 'el-icon-house' },
        { label: '用户管理', icon: 'el-icon-user', expand: true },
        { label: '考勤组管理', icon: 'el-icon-s-custom' },
        { label: '基础配置', icon: 'el-icon-setting', expand: true },
        { label: '排班管理', icon: 'el-icon-date', expand: true },
        { label: '排班总览', icon: 'el-icon-s-grid' },
        { label: '新建排班', icon: 'el-icon-magic-stick' },
        { label: '排班监控', icon: 'el-icon-data-line', active: true },
        { label: '异常管理', icon: 'el-icon-warning-outline' },
        { label: '报表管理', icon: 'el-icon-document' },
        { label: '我的流程', icon: 'el-icon-tickets' },
        { label: '数据看板', icon: 'el-icon-data-analysis', expand: true },
      ],
    }
  },
  computed: {
    totalPages() {
      return Math.max(1, Math.ceil(this.totalRecords / this.pageSize))
    },
    pagedRows() {
      return this.adjustmentRows
    },
  },
  mounted() {
    this.animateKpiNumbers()
  },
  beforeDestroy() {
    this.cancelKpiAnimation()
  },
  methods: {
    assetUrl,
    cancelKpiAnimation() {
      if (this._kpiAnimFrame != null) {
        cancelAnimationFrame(this._kpiAnimFrame)
        this._kpiAnimFrame = null
      }
    },
    animateKpiNumbers() {
      this.cancelKpiAnimation()
      const targets = this.kpiMetrics.map((item) => Number(item.value) || 0)
      this.kpiMetrics.forEach((item) => {
        item.displayValue = 0
      })
      const start = performance.now()
      const tick = (now) => {
        const progress = Math.min(1, (now - start) / KPI_COUNT_DURATION)
        const eased = easeOutCubic(progress)
        this.kpiMetrics.forEach((item, index) => {
          item.displayValue = targets[index] * eased
        })
        if (progress < 1) {
          this._kpiAnimFrame = requestAnimationFrame(tick)
        } else {
          this.kpiMetrics.forEach((item, index) => {
            item.displayValue = targets[index]
          })
          this._kpiAnimFrame = null
        }
      }
      this._kpiAnimFrame = requestAnimationFrame(tick)
    },
    formatNumber(v) {
      const n = Number(v)
      if (Number.isNaN(n)) return '--'
      return Number.isInteger(n) ? String(n) : n.toFixed(1)
    },
    formatPercent(v) {
      const n = Number(v)
      if (Number.isNaN(n)) return '--'
      return `${n.toFixed(1)}%`
    },
    formatTrend(v) {
      return `${Number(v).toFixed(1)}%`
    },
    formatDeviation(v) {
      if (v > 0) return `+${v}`
      return String(v)
    },
    deviationClass(v) {
      if (v > 0) return 'is-positive'
      if (v < 0) return 'is-negative'
      return 'is-zero'
    },
    trendTone(direction) {
      return direction === 'up' ? 'is-up' : 'is-down'
    },
    trendIcon(direction) {
      return direction === 'up' ? TREND_UP : TREND_DOWN
    },
    refreshByDateRange() {
      if (!Array.isArray(this.dateRange) || this.dateRange.length !== 2) return
      const [start, end] = this.dateRange
      const series = buildMonitorByRange(start, end)
      this.trendLabels = series.trendLabels
      this.trendCharts = series.trendCharts
      this.adjustmentRows = series.adjustmentRows
      this.totalRecords = series.totalRecords
    },
    onReset() {
      this.department = 'all'
      this.dateRange = [...DEFAULT_DATE_RANGE]
      this.filterError = false
      this.currentPage = 1
      this.refreshByDateRange()
      this.animateKpiNumbers()
    },
    onQuery() {
      const okDept = Boolean(this.department)
      const okDate = Array.isArray(this.dateRange) && this.dateRange.length === 2
      this.filterError = !(okDept && okDate)
      if (this.filterError) {
        this.$message.error('请完善查询条件')
        return
      }
      this.currentPage = 1
      this.refreshByDateRange()
      this.animateKpiNumbers()
      this.$message.success('查询成功（原型演示）')
    },
    onExport() {
      this.$message.success('已触发导出（原型演示）')
    },
    onPageSizeChange() {
      this.currentPage = 1
    },
    onPageChange(page) {
      this.currentPage = page
    },
  },
}
</script>
