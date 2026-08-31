/** 排班监控中心 mock — PRD 5.3 指标 + Figma 看板交互样式 */

import { assetUrl } from '../utils/assetUrl'

export const regionOptions = [
  { label: '全部洲际', value: 'all' },
  { label: '欧洲', value: 'eu' },
  { label: '美洲', value: 'na' },
  { label: '亚太', value: 'apac' },
]

export const departmentOptions = [
  { label: '全集团所有部门', value: 'all' },
  { label: '欧洲区 · 荷兰一号仓', value: 'nl-01' },
  { label: '欧洲区 · 德国法兰克福仓', value: 'de-fra' },
]

export const kpiMetrics = [
  {
    key: 'usage',
    label: '智能排班使用率',
    value: 88.5,
    unit: '%',
    icon: assetUrl('monitor/icon-usage.svg'),
    yoy: { value: 3.2, direction: 'up' },
    mom: { value: 1.5, direction: 'up' },
  },
  {
    key: 'shift',
    label: '推荐班次采纳率',
    value: 92.3,
    unit: '%',
    icon: assetUrl('monitor/icon-shift.svg'),
    yoy: { value: 2.1, direction: 'up' },
    mom: { value: 0.8, direction: 'down' },
  },
  {
    key: 'headcount',
    label: '推荐人数采纳率',
    value: 85.7,
    unit: '%',
    icon: assetUrl('monitor/icon-headcount.svg'),
    yoy: { value: 4.6, direction: 'down' },
    mom: { value: 1.2, direction: 'up' },
  },
  {
    key: 'result',
    label: '推荐结果采纳率',
    value: 79.4,
    unit: '%',
    icon: assetUrl('monitor/icon-result.svg'),
    yoy: { value: 1.8, direction: 'up' },
    mom: { value: 2.4, direction: 'up' },
  },
]

const TREND_SERIES_DEFS = [
  { key: 'usage', title: '使用率趋势', color: '#3C6EF0', base: 78, amp: 16 },
  { key: 'headcount', title: '人数采纳趋势', color: '#3DB87A', base: 82, amp: 14 },
  { key: 'result', title: '结果采纳趋势', color: '#FF7700', base: 72, amp: 15 },
]

const EMPLOYMENT_TYPES = [
  'A-全日制劳动合同工',
  'P-劳务外包',
  'O-临时工',
  'N-实习生',
]

const MAX_TREND_POINTS = 7

function parseYmd(str) {
  const [y, m, d] = String(str).split('-').map(Number)
  return new Date(y, m - 1, d)
}

function formatYmd(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function formatMd(date) {
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${m}-${d}`
}

function listDays(startStr, endStr) {
  const start = parseYmd(startStr)
  const end = parseYmd(endStr)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) {
    return [parseYmd(startStr || '2023-10-01')]
  }
  const days = []
  const cur = new Date(start.getTime())
  while (cur <= end) {
    days.push(new Date(cur.getTime()))
    cur.setDate(cur.getDate() + 1)
  }
  return days
}

/** 均匀抽样，始终包含起止日，保证横轴覆盖筛选周期 */
function sampleDays(days, maxPoints = MAX_TREND_POINTS) {
  if (days.length <= maxPoints) return days.slice()
  const sampled = []
  for (let i = 0; i < maxPoints; i += 1) {
    const idx = Math.round((i * (days.length - 1)) / (maxPoints - 1))
    sampled.push(days[idx])
  }
  return sampled
}

function createSeededRandom(seedText) {
  let seed = 0
  const text = String(seedText)
  for (let i = 0; i < text.length; i += 1) {
    seed = (seed * 31 + text.charCodeAt(i)) >>> 0
  }
  let s = seed % 2147483647
  if (s <= 0) s += 2147483646
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

function buildRow(date, employmentType, recommended, actual) {
  const deviation = actual - recommended
  const accuracy = recommended === 0
    ? 0
    : Number(((1 - Math.abs(deviation) / recommended) * 100).toFixed(1))
  return { date, employmentType, recommended, actual, deviation, accuracy }
}

/** 按筛选起止日期生成趋势图与表格，时间周期与查询条件一致 */
export function buildMonitorByRange(startStr, endStr) {
  const days = listDays(startStr, endStr)
  const ticks = sampleDays(days, MAX_TREND_POINTS)
  const rand = createSeededRandom(`${startStr}|${endStr}`)

  const trendLabels = ticks.map(formatMd)
  const trendCharts = TREND_SERIES_DEFS.map((def) => ({
    key: def.key,
    title: def.title,
    color: def.color,
    points: ticks.map((_, i) => {
      const wave = Math.sin(i * 0.9) * 5
      const noise = (rand() - 0.5) * def.amp
      const value = def.base + wave + noise
      return Math.round(Math.max(42, Math.min(97, value)) * 10) / 10
    }),
  }))

  const tableDays = days.slice(-5).reverse()
  const adjustmentRows = []
  tableDays.forEach((day, di) => {
    const typeA = EMPLOYMENT_TYPES[di % EMPLOYMENT_TYPES.length]
    const typeB = EMPLOYMENT_TYPES[(di + 1) % EMPLOYMENT_TYPES.length]
    ;[typeA, typeB].forEach((employmentType) => {
      const recommended = 70 + Math.round(rand() * 70)
      const actual = recommended + Math.round((rand() - 0.42) * 36)
      adjustmentRows.push(buildRow(formatYmd(day), employmentType, recommended, actual))
    })
  })

  return {
    trendLabels,
    trendCharts,
    adjustmentRows,
    totalRecords: Math.max(adjustmentRows.length, days.length * 2),
  }
}

export const DEFAULT_DATE_RANGE = ['2023-10-01', '2023-10-31']

const initialSeries = buildMonitorByRange(DEFAULT_DATE_RANGE[0], DEFAULT_DATE_RANGE[1])
export const trendCharts = initialSeries.trendCharts
export const trendLabels = initialSeries.trendLabels
export const adjustmentRows = initialSeries.adjustmentRows
export const TOTAL_RECORDS = initialSeries.totalRecords
export const PAGE_SIZE = 10
