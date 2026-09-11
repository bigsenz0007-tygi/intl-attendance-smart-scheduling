import { decorateShift, sortShiftsByFamily } from '../utils/shiftPalette'

/** 国内职能后线（ZN）排班倒班 · Mock */

export const ZN_SHIFTS = [
  decorateShift({ id: 'M1', name: '早班1次', short: '早1', time: '08:00-12:00' }),
  decorateShift({ id: 'M2', name: '早班2次', short: '早2', time: '06:00-14:00' }),
  decorateShift({ id: 'M3', name: '早班3次', short: '早3', time: '05:00-13:00' }),
  decorateShift({ id: 'M4', name: '早班4次', short: '早4', time: '05:30-17:00' }),
  decorateShift({ id: 'Z1', name: '中班1次', short: '中1', time: '08:00-20:00' }),
  decorateShift({ id: 'Z2', name: '中班2次', short: '中2', time: '09:00-18:00' }),
  decorateShift({ id: 'Z3', name: '中班3次', short: '中3', time: '09:00-21:00' }),
  decorateShift({ id: 'Z4', name: '中班4次', short: '中4', time: '07:00-19:00' }),
  decorateShift({ id: 'W1', name: '晚班1次', short: '晚1', time: '10:00-22:00' }),
  decorateShift({ id: 'W2', name: '晚班2次', short: '晚2', time: '08:30-19:00' }),
  decorateShift({ id: 'W3', name: '晚班3次', short: '晚3', time: '09:00-20:00' }),
  decorateShift({ id: 'REST', name: '休息', short: '休', time: '00:00-23:59', isRest: true }),
]

/** 弹窗内班次下拉（对齐图1文案） */
export const CYCLE_SHIFT_OPTIONS = ZN_SHIFTS.map((shift) => ({
  value: shift.isRest ? '休' : shift.id,
  label: shift.isRest ? '休息' : shift.name,
  color: shift.color,
  bg: shift.background,
  filled: Number(shift.level) >= 4,
}))

export const ROTATION_TAGS = [
  '早班', '晚班', '中班', '休息', '5休2', '年假', '调休', '育儿假', '出差', '培训',
]

const WEEK = ['日', '一', '二', '三', '四', '五', '六']

export function buildMonthDates(startStr = '2026-08-21', days = 21) {
  const [y, m, d] = startStr.split('-').map(Number)
  const start = new Date(y, m - 1, d)
  return Array.from({ length: days }, (_, i) => {
    const date = new Date(start)
    date.setDate(start.getDate() + i)
    const mm = String(date.getMonth() + 1).padStart(2, '0')
    const dd = String(date.getDate()).padStart(2, '0')
    const weekIdx = date.getDay()
    const key = `${mm}-${dd}`
    return {
      key,
      fullKey: `${date.getFullYear()}-${mm}-${dd}`,
      label: `${mm}/${dd}`,
      weekShort: WEEK[weekIdx],
      isToday: key === '08-21',
      isWeekend: weekIdx === 0 || weekIdx === 6,
    }
  })
}

/**
 * 按排班月份生成整月日期列（28–31 天），与筛选月份对齐。
 * @param {string} monthStr yyyy-MM
 * @param {string} todayFullKey yyyy-MM-dd 原型「今天」
 */
export function buildCalendarMonthDates(monthStr = '2026-09', todayFullKey = '2026-09-07') {
  const [y, m] = String(monthStr || '2026-09').split('-').map(Number)
  if (!y || !m) return buildCalendarMonthDates('2026-09', todayFullKey)
  const daysInMonth = new Date(y, m, 0).getDate()
  return Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1
    const date = new Date(y, m - 1, day)
    const mm = String(m).padStart(2, '0')
    const dd = String(day).padStart(2, '0')
    const weekIdx = date.getDay()
    const key = `${mm}-${dd}`
    const fullKey = `${y}-${mm}-${dd}`
    return {
      key,
      fullKey,
      label: `${mm}/${dd}`,
      weekShort: WEEK[weekIdx],
      isToday: fullKey === todayFullKey,
      isPast: fullKey < todayFullKey,
      isWeekend: weekIdx === 0 || weekIdx === 6,
    }
  })
}

/** 原型固定「今天」，便于演示历史整月 / 当月今日 */
export const PROTOTYPE_TODAY = '2026-09-07'

export const ZN_DATES = buildCalendarMonthDates('2026-09', PROTOTYPE_TODAY)

/** 智能排班弹窗：从所选起始日排到下月同日前一天（完整一个月） */
export function buildScheduleRangeDates(startStr = '2026-09-21', todayFullKey = null) {
  const parts = String(startStr || '2026-09-21').split('-').map(Number)
  const [y, m, d] = parts
  const start = y && m && d ? new Date(y, m - 1, d) : new Date(2026, 8, 21)
  const nextMonthLastDay = new Date(start.getFullYear(), start.getMonth() + 2, 0).getDate()
  const end = new Date(
    start.getFullYear(),
    start.getMonth() + 1,
    Math.min(start.getDate(), nextMonthLastDay),
  )
  const n = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000))
  return Array.from({ length: n }, (_, i) => {
    const date = new Date(start)
    date.setDate(start.getDate() + i)
    const mm = String(date.getMonth() + 1).padStart(2, '0')
    const dd = String(date.getDate()).padStart(2, '0')
    const weekIdx = date.getDay()
    const fullKey = `${date.getFullYear()}-${mm}-${dd}`
    return {
      key: fullKey,
      fullKey,
      label: `${mm}/${dd}`,
      weekShort: WEEK[weekIdx],
      isToday: todayFullKey ? fullKey === todayFullKey : false,
      isWeekend: weekIdx === 0 || weekIdx === 6,
    }
  })
}

/** 上六休一：前 6 天出勤 + 第 7 天休息 */
export function buildSixOnePattern(workShift) {
  return [workShift, workShift, workShift, workShift, workShift, workShift, '休']
}

/** 系统推荐默认配置：默认 7 天循环、上六休一 */
export const DEFAULT_CYCLE_CONFIGS = [
  {
    id: 1,
    name: '李红伟',
    code: 'lihongwei59',
    isNew: false,
    cycleType: 'loop',
    cycleDays: 7,
    theme: '#C5AC8D',
    pattern: buildSixOnePattern('W2'),
  },
  {
    id: 2,
    name: '王洪爽',
    code: 'wanghongshuang',
    isNew: false,
    cycleType: 'loop',
    cycleDays: 7,
    theme: '#3C6EF0',
    pattern: [...Array(15).fill('Z4'), '休'],
  },
  {
    id: 3,
    name: '杨铭浩',
    code: 'yangminghao',
    isNew: false,
    cycleType: 'loop',
    cycleDays: 7,
    theme: '#44CEBF',
    pattern: [...Array(15).fill('Z3'), '休'],
  },
  {
    id: 4,
    name: '袁兆涛',
    code: 'yuanzhaotao',
    isNew: false,
    cycleType: 'loop',
    cycleDays: 7,
    theme: '#0F766E',
    pattern: [...Array(15).fill('W3'), '休'],
  },
  {
    id: 5,
    name: '陈立新',
    code: 'chenlixin22',
    isNew: false,
    cycleType: 'loop',
    cycleDays: 7,
    theme: '#E85D75',
    pattern: buildSixOnePattern('Z1'),
  },
  {
    id: 6,
    name: '赵敏',
    code: 'zhaomin08',
    isNew: false,
    cycleType: 'loop',
    cycleDays: 7,
    theme: '#0F766E',
    pattern: buildSixOnePattern('W3'),
  },
  {
    id: 7,
    name: '刘洋',
    code: 'liuyang21',
    isNew: false,
    cycleType: 'loop',
    cycleDays: 7,
    theme: '#5B8DEF',
    pattern: buildSixOnePattern('Z3'),
  },
  {
    id: 8,
    name: '周敏',
    code: 'zhoumin18',
    isNew: false,
    cycleType: 'loop',
    cycleDays: 7,
    theme: '#8B919A',
    pattern: buildSixOnePattern('M4'),
  },
  /** 新员工：未确认配置；仅在「职能后线」场景下触发新人提示弹窗 */
  {
    id: 9,
    name: '赵新入',
    code: 'zhaoxinru01',
    isNew: true,
    confirmed: false,
    cycleType: 'loop',
    cycleDays: 7,
    theme: '#3C6EF0',
    pattern: buildSixOnePattern('Z4'),
  },
]

export function cloneCycleConfigs(list = DEFAULT_CYCLE_CONFIGS) {
  return list.map((c) => ({
    ...c,
    pattern: [...c.pattern],
  }))
}

export function cycleShiftMeta(value) {
  return CYCLE_SHIFT_OPTIONS.find((s) => s.value === value) || CYCLE_SHIFT_OPTIONS[0]
}

export const SHIFT_OPTIONS = CYCLE_SHIFT_OPTIONS
export const shiftMeta = cycleShiftMeta
export const NEW_EMP_TIP = '检测到新入职员工尚未确认排班配置，请先确认后再发布。'

export function syncPatternLength(item) {
  const rawDays = Number(item.cycleDays)
  const n = Number.isFinite(rawDays) ? Math.max(0, Math.trunc(rawDays)) : 7
  item.cycleDays = n
  item.pattern = n === 0 ? [] : resizePatternLoop(item.pattern || [], n)
  return item
}

/** 按循环周期扩展/截断班次 pattern：不足则循环补齐，超出则截断 */
export function resizePatternLoop(pattern, targetDays) {
  const source = (pattern || []).filter((p) => p !== undefined && p !== null && p !== '')
  const rawDays = Number(targetDays)
  const n = Number.isFinite(rawDays) ? Math.max(0, Math.trunc(rawDays)) : 7
  if (n === 0) return []
  if (!source.length) return Array.from({ length: n }, () => '休')
  if (n <= source.length) return source.slice(0, n)
  const result = []
  for (let i = 0; i < n; i += 1) {
    result.push(source[i % source.length])
  }
  return result
}

function fillShifts(pattern, dates, offset = 0, startDate = '') {
  const shifts = {}
  if (!pattern.length) {
    dates.forEach((date) => {
      shifts[date.key] = 'EMPTY'
    })
    return shifts
  }
  const len = Math.max(1, pattern.length)
  let scheduledIndex = 0
  dates.forEach((date, i) => {
    if (startDate && date.fullKey < startDate) { shifts[date.key] = 'EMPTY'; return }
    const idx = ((startDate ? scheduledIndex : i) + offset) % len
    shifts[date.key] = pattern[idx]
    scheduledIndex += 1
  })
  return shifts
}

/** 排班表人员：已确认新人 + 老员工；未确认新人不进表或排空 */
export function createBoardRows(configs = DEFAULT_CYCLE_CONFIGS, dates = ZN_DATES) {
  return configs
    .filter((c) => !c.isNew || c.confirmed)
    .map((emp, i) => {
      const shifts = fillShifts(emp.pattern, dates, i % 3)
      return {
        id: emp.id,
        name: emp.name,
        code: emp.code,
        isNew: !!emp.isNew,
        shifts,
        restDays: dates.reduce((n, d) => n + (shifts[d.key] === '休' ? 1 : 0), 0),
      }
    })
}

/** 国内智能排班 · 第二步发布班表人员（对齐截图） */
export const DOMESTIC_SMART_BOARD_CONFIGS = [
  { id: 1, name: '常彩云', code: 'changcaiyun', pattern: buildSixOnePattern('JM7') },
  { id: 2, name: '陈光辉', code: 'chenguanghui19', pattern: buildSixOnePattern('Z3') },
  { id: 3, name: '陈光培', code: 'chenguangpei3', pattern: buildSixOnePattern('W2') },
  { id: 4, name: '陈红', code: 'chenhong08', pattern: buildSixOnePattern('M3') },
  { id: 5, name: '陈建军', code: 'chenjianjun6', pattern: buildSixOnePattern('Z1') },
  { id: 6, name: '陈立新', code: 'chenlixin22', pattern: buildSixOnePattern('JW2') },
  { id: 7, name: '陈明', code: 'chenming88', pattern: buildSixOnePattern('JZ4') },
  { id: 8, name: '侯文广', code: 'houwenguang', pattern: buildSixOnePattern('M2') },
  { id: 9, name: '黄晓燕', code: 'huangxiaoyan', pattern: buildSixOnePattern('Z2') },
  { id: 10, name: '贾文静', code: 'jiawenjing', pattern: buildSixOnePattern('JM5') },
  { id: 11, name: '李娜', code: 'lina09', pattern: buildSixOnePattern('W1') },
  { id: 12, name: '刘洋', code: 'liuyang21', pattern: buildSixOnePattern('Z3') },
]

/** 按配置滚动生成班表（循环：延续上月 offset=2；自然：offset=0） */
export function applyConfigsToBoard(configs, dates = ZN_DATES) {
  return configs
    .filter((c) => !c.isNew || c.confirmed)
    .map((emp) => {
      const offset = emp.cycleType === 'natural' ? 0 : 2
      const rawDays = Number(emp.cycleDays)
      const cycleDays = Number.isFinite(rawDays) ? Math.max(0, Math.trunc(rawDays)) : 7
      const pattern = cycleDays === 0 ? [] : emp.pattern.slice(0, cycleDays)
      const shifts = fillShifts(pattern, dates, emp.scheduleStartDate ? 0 : offset, emp.scheduleStartDate)
      return {
        id: emp.id,
        name: emp.name,
        code: emp.code,
        isNew: !!emp.isNew,
        shifts,
        restDays: dates.reduce((n, d) => n + (shifts[d.key] === '休' ? 1 : 0), 0),
      }
    })
}

/** 新增员工按开始日期排班，并应用第二步对单日班次的双击修改。 */
export function applyNewcomerConfigsToBoard(configs, dates = ZN_DATES) {
  return applyConfigsToBoard(configs, dates).map((row) => {
    const config = configs.find((item) => item.code === row.code)
    if (!config) return row
    const matchedStart = dates.findIndex((date) => date.fullKey >= config.startDate)
    const startIndex = matchedStart < 0 ? dates.length : matchedStart
    const shifts = {}
    dates.forEach((date, dateIndex) => {
      if (dateIndex < startIndex) {
        shifts[date.key] = 'EMPTY'
        return
      }
      const relativeIndex = dateIndex - startIndex
      const shiftId = config.dayOverrides[relativeIndex] || config.pattern[relativeIndex % config.pattern.length] || 'EMPTY'
      shifts[date.key] = shiftId === 'REST' ? '休' : shiftId
    })
    return { ...row, shifts, restDays: dates.reduce((count, date) => count + (shifts[date.key] === '休' ? 1 : 0), 0) }
  })
}

/** 找出连续出勤超标（> maxAllowed 天）的日索引，用于表格红框 */
export function findConsecutiveViolationDays(pattern, days, cycleType = 'loop', maxAllowed = 14) {
  const p = (pattern || []).slice(0, Math.max(0, days))
  const errorDays = new Set()
  const isWork = (idx) => p[idx] !== '休' && p[idx] !== 'REST' && p[idx] !== 'EMPTY'

  let runStart = 0
  for (let i = 0; i <= p.length; i += 1) {
    if (i === p.length || !isWork(i)) {
      const runLen = i - runStart
      if (runLen > maxAllowed) {
        for (let j = runStart; j < i; j += 1) errorDays.add(j)
      }
      runStart = i + 1
    }
  }

  if (cycleType === 'loop' && p.length && isWork(0) && isWork(p.length - 1)) {
    let head = 0
    let tail = 0
    for (let i = 0; i < p.length; i += 1) {
      if (!isWork(i)) break
      head += 1
    }
    for (let i = p.length - 1; i >= 0; i -= 1) {
      if (!isWork(i)) break
      tail += 1
    }
    if (head + tail > maxAllowed) {
      for (let i = 0; i < head; i += 1) errorDays.add(i)
      for (let i = p.length - tail; i < p.length; i += 1) errorDays.add(i)
    }
  }

  return errorDays
}

const MAX_CONSECUTIVE_WORK_DAYS = 14

/**
 * 提交校验（排班规范）
 * - 周期天数 0–31（0 表示该人员当前排空）
 * - 周期内至少 1 个休息日
 * - 周期内连续出勤不超过 14 天
 * - 不允许整周期无班次
 */
export function validateCycleConfigs(configs) {
  const violations = []
  configs.forEach((cfg) => {
    const rawDays = Number(cfg.cycleDays)
    const days = Number.isFinite(rawDays) ? Math.max(0, Math.trunc(rawDays)) : -1
    const pattern = (cfg.pattern || []).slice(0, days)
    if (days < 0 || days > 31) {
      violations.push({
        id: cfg.id,
        name: cfg.name,
        rule: '周期天数',
        type: 'cycle-days',
        message: `${cfg.name} 周期天数需在 0–31 天内`,
        errorDays: [],
      })
      return
    }
    if (days === 0) return
    if (!pattern.length || pattern.every((p) => !p)) {
      violations.push({
        id: cfg.id,
        name: cfg.name,
        rule: '班次配置',
        type: 'empty',
        message: `${cfg.name} 尚未配置班次`,
        errorDays: [],
      })
      return
    }
    const restCount = pattern.filter((p) => p === '休' || p === 'REST' || p === 'EMPTY').length
    if (restCount < 1) {
      violations.push({
        id: cfg.id,
        name: cfg.name,
        rule: '部门出勤规则',
        type: 'rest',
        message: `${cfg.name} 一个周期内至少需安排 1 个休息日`,
        errorDays: [],
      })
    }
    let streak = 0
    let maxStreak = 0
    pattern.forEach((p) => {
      if (p !== '休' && p !== 'REST' && p !== 'EMPTY') {
        streak += 1
        maxStreak = Math.max(maxStreak, streak)
      } else {
        streak = 0
      }
    })
    // 循环周期还要看首尾衔接
    if (cfg.cycleType === 'loop' && pattern[0] !== '休' && pattern[pattern.length - 1] !== '休') {
      let head = 0
      let tail = 0
      for (let i = 0; i < pattern.length; i += 1) {
        if (pattern[i] === '休') break
        head += 1
      }
      for (let i = pattern.length - 1; i >= 0; i -= 1) {
        if (pattern[i] === '休') break
        tail += 1
      }
      maxStreak = Math.max(maxStreak, head + tail)
    }
    if (maxStreak > MAX_CONSECUTIVE_WORK_DAYS) {
      violations.push({
        id: cfg.id,
        name: cfg.name,
        rule: '配置不符合出勤规则',
        type: 'consecutive',
        message: `${cfg.name} 连续出勤超过${MAX_CONSECUTIVE_WORK_DAYS}天，不符合出勤要求`,
        errorDays: [...findConsecutiveViolationDays(pattern, days, cfg.cycleType, MAX_CONSECUTIVE_WORK_DAYS)],
      })
    }
  })
  const seen = new Set()
  return violations.filter((v) => {
    const key = `${v.rule}|${v.name}|${v.type}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

/** 发布校验 toast：单人 / 多人合并文案 */
export function formatConsecutiveRuleToast(violations) {
  const list = violations.filter((v) => v.type === 'consecutive')
  if (!list.length) return ''
  const names = list.map((v) => v.name)
  if (names.length === 1) {
    return `【配置不符合出勤规则】${names[0]} 连续出勤超过14天，不符合出勤要求，请修改再后发布。`
  }
  if (names.length === 2) {
    return `【配置不符合出勤规则】${names[0]}、${names[1]}连续出勤超过14天，不符合出勤要求，请修改再后发布。`
  }
  return `【配置不符合出勤规则】${names[0]}、${names[1]}等人连续出勤超过14天，不符合出勤要求，请修改再后发布。`
}

export function shiftById(id) {
  const rest = ZN_SHIFTS.find((s) => s.isRest) || ZN_SHIFTS[0]
  if (id === '休' || id === 'REST') return rest
  return ZN_SHIFTS.find((s) => s.id === id) || rest
}

export function formatShiftRange(time) {
  return String(time || '').replace(/\s*[~～—–]\s*/g, '-')
}

/** 班次 chip 展示用：仅首段时段，宽度固定不因多段超长 */
export function formatShiftChipTime(time) {
  const normalized = formatShiftRange(time).replace(/\s*\/\s*/g, ' / ').trim()
  return normalized.split(/\s*\/\s*/)[0] || ''
}

/** 排班统计 · 班次行（与筛选月份日期列一一对应，按整月天数造数） */
export const ZN_STATISTICS_ROWS = sortShiftsByFamily([
  { id: 'm1', name: '早班1次', time: '08:00-20:00', counts: [0, 1, 0, 0, 2, 1, 0, 0, 1, 2, 0, 0, 1, 0, 2, 0, 1, 0, 1, 0, 0, 2, 1, 0, 0, 1, 2, 0, 0, 1, 0] },
  { id: 'm0', name: '早班2次', time: '13:00-15:00', counts: [0, 0, 1, 0, 0, 0, 2, 1, 0, 0, 1, 0, 0, 0, 2, 0, 1, 0, 0, 1, 0, 0, 0, 2, 1, 0, 0, 1, 0, 0, 0] },
  { id: 'm3', name: '早班3次', time: '07:00-15:00', counts: [1, 0, 0, 1, 0, 0, 1, 0, 2, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 2, 0, 0, 1, 0, 0] },
  { id: 'm4', name: '早班4次', time: '07:30-14:30', counts: [1, 1, 0, 0, 1, 0, 0, 2, 0, 1, 0, 0, 1, 1, 0, 0, 1, 1, 1, 0, 0, 1, 0, 0, 2, 0, 1, 0, 0, 1, 1] },
  { id: 'z1', name: '中班1次', time: '11:00-15:00', counts: [1, 0, 2, 0, 0, 1, 2, 0, 0, 1, 2, 0, 0, 1, 0, 2, 0, 1, 0, 2, 0, 0, 1, 2, 0, 0, 1, 2, 0, 0, 1] },
  { id: 'z2', name: '中班2次', time: '23:00-06:00', counts: [0, 2, 0, 1, 0, 0, 1, 2, 0, 0, 1, 2, 0, 0, 1, 0, 2, 0, 2, 0, 1, 0, 0, 1, 2, 0, 0, 1, 2, 0, 0] },
  { id: 'z3', name: '中班3次', time: '12:00-15:00', counts: [0, 1, 0, 0, 2, 0, 1, 0, 0, 2, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 2, 0, 1, 0, 0, 2, 0, 1, 0, 0] },
  { id: 'w1', name: '晚班1次', time: '18:00-02:00', counts: [0, 1, 0, 2, 0, 0, 1, 0, 0, 1, 0, 2, 0, 0, 1, 0, 0, 0, 1, 0, 2, 0, 0, 1, 0, 0, 1, 0, 2, 0, 0] },
  { id: 'w2', name: '晚班2次', time: '20:00-05:00', counts: [1, 0, 1, 0, 0, 2, 0, 1, 0, 0, 2, 0, 0, 1, 0, 0, 1, 1, 0, 1, 0, 0, 2, 0, 1, 0, 0, 2, 0, 0, 1] },
  { id: 'w3', name: '晚班3次', time: '20:00-05:30', counts: [2, 0, 0, 1, 0, 2, 0, 0, 1, 0, 0, 2, 1, 0, 0, 1, 0, 2, 0, 0, 1, 0, 2, 0, 0, 1, 0, 0, 2, 1, 0] },
  { id: 'REST', name: '休息', time: '00:00-23:59', isRest: true, counts: [20, 0, 1, 2, 0, 0, 4, 1, 2, 0, 0, 1, 0, 2, 0, 1, 0, 20, 0, 1, 2, 0, 0, 4, 1, 2, 0, 0, 1, 0, 2] },
].map((row) => decorateShift({
  ...row,
  label: row.name,
})))

export const ATTENDANCE_DAY_RULES = [
  { type: 'A-全日制劳动合同工', maxWork: 30, maxRest: 4, contact: '夏福松' },
  { type: 'D-普通实习生', maxWork: 30, maxRest: 4, contact: '夏福松' },
]

export const ATTENDANCE_HEADCOUNT_RULES = [
  { date: '2026-08-21', type: 'O-临时工', max: 25 },
  { date: '2026-08-22', type: 'O-临时工', max: 200 },
  { date: '2026-08-23', type: 'O-临时工', max: 200 },
  { date: '2026-09-01', type: 'O-临时工', max: 200 },
  { date: '2026-09-02', type: 'O-临时工', max: 25 },
]

export const BEGINNER_GUIDE_STEPS = [
  {
    id: 'query',
    title: '查询条件',
    heading: '部门',
    content: '权限申请数据资源时选择的部门；默认开通申请部门及以下部门权限，下级部门可通过名称搜索进行查询',
    preview: 'query',
  },
  {
    id: 'shift',
    title: '班次管理',
    heading: '添加班次',
    content: '早、中、晚分别按 1～6 次顺序配置，不能跳号；例如 2、3 次未配置时不能配置 4 次',
    preview: 'shift',
  },
  {
    id: 'rotation',
    title: '倒班排班',
    heading: '倒班排班',
    content: '在排班表中为人员安排班次，支持临时修改、导入导出与智能排班推荐。',
    preview: 'rotation',
  },
]

export const OPERATION_SHORTCUTS = [
  { keys: 'Ctrl+C', desc: '复制' },
  { keys: 'Ctrl+V', desc: '粘贴' },
  { keys: 'Shift+点选', desc: '连续选择' },
  { keys: 'Ctrl+Z', desc: '撤回' },
  { keys: 'Delete', desc: '快捷删除' },
  { keys: 'Backspace', desc: '快捷删除' },
  { keys: 'ESC', desc: '退出全屏' },
  { keys: '上下左右', desc: '切换单元格、获取焦点' },
  { keys: 'Ctrl+S', desc: '实时保存' },
  { keys: 'Ctrl+F', desc: '快捷搜索人员' },
]

/** 国内智能排班 · 步骤一推荐出勤（月度固定）
 * 仅「有人员」的班次在界面展示；班次时间单段展示，避免超长 chip。
 */
export const DOMESTIC_SMART_HEADCOUNT_ROWS = sortShiftsByFamily([
  {
    empType: '非全合同工',
    name: '中班5次',
    time: '13:00-15:00',
    employees: [
      { name: '侯帅庭', empType: '非全合同工', code: 'houshuaiting1' },
    ],
    counts: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  },
  {
    empType: '正式工',
    name: '早班8次',
    time: '08:00-18:00',
    employees: [
      { name: '王芳', empType: '正式工', code: 'wangfang3' },
      { name: '刘强', empType: '正式工', code: 'liuqiang4' },
    ],
    counts: [2, 2, 1, 2, 2, 1, 2, 2, 1, 2, 2, 1, 2, 2, 1, 2],
  },
  {
    empType: 'O-临时工',
    name: '早班1次',
    time: '08:00-12:00',
    employees: [
      { name: '高鑫', empType: 'O-临时工', code: 'gaoxin10' },
    ],
    counts: [0, 0, 0, 1, 0, 0, 2, 0, 0, 0, 1, 0, 0, 0, 0, 0],
  },
  {
    empType: '其他用工',
    name: '中班1次',
    time: '13:00-15:00',
    employees: [
      { name: '孙忠林', empType: '其他用工', code: 'sunzhonglin3' },
    ],
    counts: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  },
  {
    empType: 'Q-日结临时工',
    name: '晚班1次',
    time: '20:00-05:30',
    employees: [
      { name: '李楠', empType: 'Q-日结临时工', code: 'linan11' },
    ],
    counts: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  },
  {
    empType: '正式工',
    name: '早班2次',
    time: '06:00-14:00',
    employees: [],
    counts: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  },
  {
    empType: '正式工',
    name: '晚班4次',
    time: '18:00-02:00',
    employees: [],
    counts: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  },
].map((row) => decorateShift({
  ...row,
  label: row.name,
  shiftLabel: row.name,
})))

/** 周期轮换 · 段班次选项（对齐图2） */
export const DOMESTIC_CYCLE_SHIFT_OPTIONS = [
  {
    value: 'Z5',
    label: '中班5次 13:00~15:00 / 20:00~05:00',
  },
  {
    value: 'M1',
    label: '早班1次 08:00~12:00',
  },
  {
    value: 'Z1',
    label: '中班1次 13:00~15:00',
  },
  {
    value: 'W1',
    label: '晚班1次 20:00~05:30',
  },
  {
    value: 'REST',
    label: '休息',
  },
]

/** 周期轮换默认时段（可增删） */
export function createCycleSegments(shiftValue = 'Z5') {
  return [
    { shift: shiftValue, range: ['2026-08-21', '2026-08-27'] },
    { shift: shiftValue, range: ['2026-08-28', '2026-09-03'] },
    { shift: shiftValue, range: ['2026-09-04', '2026-09-10'] },
    { shift: shiftValue, range: ['2026-09-11', '2026-09-17'] },
  ]
}

export function createEmptyCycleSegment(shiftValue = '') {
  return { shift: shiftValue, range: ['2026-08-21', '2026-08-27'] }
}

/** 周期轮换 · 人员行 */
export const DOMESTIC_CYCLE_ROWS = [
  {
    id: 'c-sun',
    name: '孙忠林',
    code: 'sunzhonglin3',
    empType: '其他用工',
    segments: createCycleSegments('Z5'),
  },
]

/** 智能排班 · 可添加人员池（月度固定 / 周期轮换共用，互斥切换） */
export const DOMESTIC_ASSIGNABLE_PEOPLE = [
  { code: 'houshuaiting1', name: '侯帅庭', empType: '非全合同工' },
  { code: 'sunzhonglin3', name: '孙忠林', empType: '其他用工' },
  { code: 'lixiaomei1', name: '李晓梅', empType: '正式工' },
  { code: 'zhangzhihao2', name: '张志豪', empType: '正式工' },
  { code: 'wangfang3', name: '王芳', empType: '正式工' },
  { code: 'liuqiang4', name: '刘强', empType: '正式工' },
  { code: 'chenchen5', name: '陈晨', empType: '正式工' },
  { code: 'zhaomin6', name: '赵敏', empType: '正式工' },
  { code: 'zhoujie7', name: '周杰', empType: '正式工' },
  { code: 'wuqian8', name: '吴倩', empType: '正式工' },
  { code: 'zhenghao9', name: '郑浩', empType: '正式工' },
  { code: 'gaoxin10', name: '高鑫', empType: 'O-临时工' },
  { code: 'linan11', name: '李楠', empType: 'Q-日结临时工' },
  { code: 'huangwei12', name: '黄伟', empType: '正式工' },
]
