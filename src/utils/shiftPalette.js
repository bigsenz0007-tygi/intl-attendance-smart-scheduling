/** Figma 65:3520 早/中/晚班次色板：每组 6 档，1–3 深色字、4–6 白字 */

export const SHIFT_FAMILY_PALETTE = {
  morning: {
    key: 'morning',
    label: '早班',
    textLight: '#238B54',
    textDark: '#FFFFFF',
    swatches: ['#C9F4DE', '#BCE8D2', '#91DCB4', '#67CD98', '#3BC17A', '#3DA870'],
  },
  midday: {
    key: 'midday',
    label: '中班',
    textLight: '#D16302',
    textDark: '#FFFFFF',
    swatches: ['#FFE7D1', '#FFDAB8', '#FFC99B', '#FFB97C', '#FFA85D', '#FF912D'],
  },
  night: {
    key: 'night',
    label: '晚班',
    textLight: '#4B77E9',
    textDark: '#FFFFFF',
    swatches: ['#E6EDFF', '#D6E2FF', '#C8D7FB', '#9BB5F7', '#7FA0F5', '#638BF3'],
  },
}

export const SHIFT_REST_VISUAL = {
  background: '#F5F5F6',
  color: '#525765',
  borderColor: '#E8E8E8',
}

export const SHIFT_SELECTED_BORDER = {
  morning: '#008E62',
  midday: '#EA7000',
  night: '#3C6EF0',
  rest: '#868D9F',
  rotation: 'rgba(60, 110, 240, 0.5)',
  empty: 'transparent',
}

export const SHIFT_COLOR_SWATCHES = [
  ...SHIFT_FAMILY_PALETTE.morning.swatches.map((background, index) => ({
    family: 'morning',
    level: index + 1,
    background,
  })),
  ...SHIFT_FAMILY_PALETTE.midday.swatches.map((background, index) => ({
    family: 'midday',
    level: index + 1,
    background,
  })),
  ...SHIFT_FAMILY_PALETTE.night.swatches.map((background, index) => ({
    family: 'night',
    level: index + 1,
    background,
  })),
]

export function inferShiftFamily(name = '') {
  const text = String(name)
  if (/休息|休/.test(text) && !/早|中|晚/.test(text)) return 'rest'
  if (text.includes('早')) return 'morning'
  if (text.includes('中')) return 'midday'
  if (text.includes('晚')) return 'night'
  return 'morning'
}

export function inferShiftIndex(name = '', fallback = 1) {
  const text = String(name)
  const labeled = text.match(/(?:早班|中班|晚班|[早晚中])(\d+)/)
  if (labeled) {
    const raw = Number(labeled[1])
    if (Number.isFinite(raw) && raw > 0) return raw
  }
  const matched = text.match(/(\d+)次/)
  if (matched) {
    const raw = Number(matched[1])
    if (Number.isFinite(raw) && raw > 0) return raw
  }
  return fallback
}

export function inferShiftLevel(name = '', fallback = 1) {
  return Math.min(6, inferShiftIndex(name, fallback))
}

const FAMILY_SORT_ORDER = { morning: 0, midday: 1, night: 2, rest: 3 }

export function shiftFamilyOf(shift = {}) {
  if (!shift || shift.isRest || shift.id === 'REST' || shift.id === '休' || shift.family === 'rest') {
    return 'rest'
  }
  return shift.family || inferShiftFamily(shift.name || shift.label || shift.short || '')
}

export function sortShiftsByFamily(shifts = []) {
  return [...shifts].sort((a, b) => {
    const orderA = FAMILY_SORT_ORDER[shiftFamilyOf(a)] ?? 9
    const orderB = FAMILY_SORT_ORDER[shiftFamilyOf(b)] ?? 9
    if (orderA !== orderB) return orderA - orderB
    if (orderA === FAMILY_SORT_ORDER.rest) return 0
    return inferShiftIndex(a.name || a.label || '') - inferShiftIndex(b.name || b.label || '')
  })
}

export function configuredShiftLevels(shifts = [], family = 'morning') {
  if (family === 'rest') return []
  return shifts
    .filter((shift) => shiftFamilyOf(shift) === family)
    .map((shift) => inferShiftIndex(shift.name || shift.label || ''))
    .filter((level) => level >= 1 && level <= 6)
    .sort((a, b) => a - b)
}

export function nextShiftLevel(shifts = [], family = 'morning') {
  if (family === 'rest') return 0
  const levels = configuredShiftLevels(shifts, family)
  for (let level = 1; level <= 6; level += 1) {
    if (!levels.includes(level)) return level
  }
  return null
}

export function familyLabelOf(family = 'morning') {
  if (family === 'rest') return '休息'
  return (SHIFT_FAMILY_PALETTE[family] && SHIFT_FAMILY_PALETTE[family].label) || '早班'
}

/** 按班次族返回可选固定色（早/中/晚各 6 档，休息仅 1 色） */
export function shiftColorOptions(family = 'morning') {
  if (family === 'rest') {
    return [{
      family: 'rest',
      level: 0,
      background: SHIFT_REST_VISUAL.background,
      color: SHIFT_REST_VISUAL.color,
      borderColor: SHIFT_REST_VISUAL.borderColor,
    }]
  }
  const palette = SHIFT_FAMILY_PALETTE[family] || SHIFT_FAMILY_PALETTE.morning
  return palette.swatches.map((background, index) => ({
    family: palette.key,
    level: index + 1,
    background,
    color: index < 3 ? palette.textLight : palette.textDark,
    borderColor: background,
  }))
}

/** 取该族指定档位的固定色 */
export function resolveFamilyColor(family = 'morning', level = 1) {
  if (family === 'rest') return SHIFT_REST_VISUAL.background
  const options = shiftColorOptions(family)
  const idx = Math.min(Math.max(Number(level) || 1, 1), options.length) - 1
  return options[idx].background
}

export function validateShiftLevel(shifts = [], family = 'morning', level = 1) {
  if (family === 'rest') {
    const exists = shifts.some((shift) => shiftFamilyOf(shift) === 'rest')
    return exists
      ? { ok: false, message: '休息班次已配置' }
      : { ok: true }
  }
  if (!Number.isFinite(level) || level < 1 || level > 6) {
    return { ok: false, message: '班次需按 1～6 次顺序配置' }
  }
  const levels = configuredShiftLevels(shifts, family)
  if (levels.includes(level)) {
    return { ok: false, message: `${familyLabelOf(family)}${level}次已配置` }
  }
  for (let prev = 1; prev < level; prev += 1) {
    if (!levels.includes(prev)) {
      return {
        ok: false,
        message: `请先配置${familyLabelOf(family)}${prev}次，不能跳号配置`,
      }
    }
  }
  return { ok: true }
}

export function compactShiftLabel(shift = {}) {
  const parts = compactShiftParts(shift)
  if (!parts.index) return parts.prefix
  return `${parts.prefix}${parts.index}`
}

export function compactShiftParts(shift = {}) {
  if (!shift || shift.isRest || shift.id === 'REST' || shift.id === '休') {
    return { prefix: '休', index: '' }
  }
  const name = shift.name || shift.label || shift.short || ''
  const jumped = /[（(]跳[)）]/.test(name)
  const family = inferShiftFamily(name)
  const index = String(inferShiftIndex(name))
  const familyChar = family === 'morning' ? '早' : family === 'night' ? '晚' : '中'
  return {
    prefix: jumped ? `(跳)${familyChar}` : familyChar,
    index,
  }
}

export function formatShiftTimeRange(time = '') {
  return String(time || '')
    .replace(/\s*[~～—–]\s*/g, '-')
    .replace(/(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/g, '$1-$2')
}

export function formatShiftDurationLabel(time = '') {
  const matched = String(time).match(/(\d{1,2}):(\d{2})\s*[-~～—–]\s*(\d{1,2}):(\d{2})/)
  if (!matched) return ''
  let start = Number(matched[1]) * 60 + Number(matched[2])
  let end = Number(matched[3]) * 60 + Number(matched[4])
  if (end <= start) end += 24 * 60
  const hours = (end - start) / 60
  if (!Number.isFinite(hours) || hours <= 0) return ''
  const rounded = Math.round(hours * 10) / 10
  return Number.isInteger(rounded) ? `${rounded}h` : `${rounded.toFixed(1)}h`
}

export function formatRegularShiftCaption(shift = {}) {
  if (!shift || shift.isRest || shift.id === 'REST' || shift.id === '休') {
    const duration = formatShiftDurationLabel(shift && shift.time) || '24h'
    return `休息(${duration})`
  }
  const name = shift.name || shift.label || ''
  const duration = formatShiftDurationLabel(shift.time)
  return duration ? `${name}(${duration})` : name
}

export function resolveShiftVisual(shift = {}) {
  if (!shift || shift.isRest || shift.id === 'REST' || shift.id === '休') {
    return { ...SHIFT_REST_VISUAL, family: 'rest', level: 0 }
  }
  const family = shift.family || inferShiftFamily(shift.name || shift.label || shift.short || '')
  if (family === 'rest') return { ...SHIFT_REST_VISUAL, family: 'rest', level: 0 }
  const palette = SHIFT_FAMILY_PALETTE[family] || SHIFT_FAMILY_PALETTE.morning
  const level = shift.level || inferShiftLevel(shift.name || shift.label || shift.short || '', 1)
  const index = Math.min(6, Math.max(1, level)) - 1
  const background = palette.swatches[index]
  const color = index < 3 ? palette.textLight : palette.textDark
  return {
    family,
    level: index + 1,
    background,
    color,
    borderColor: background,
  }
}

export function resolveShiftSelectedBorder(shift = {}, type = 'shift') {
  if (type === 'rotation') return SHIFT_SELECTED_BORDER.rotation
  if (!shift || shift.isEmpty || shift.id === 'EMPTY' || shift.family === 'empty') return SHIFT_SELECTED_BORDER.empty
  return SHIFT_SELECTED_BORDER[shiftFamilyOf(shift)] || SHIFT_SELECTED_BORDER.morning
}

export function resolveShiftChipStyle(shift = {}, selected = false) {
  const visual = resolveShiftVisual(shift)
  const selectedBorder = resolveShiftSelectedBorder(shift)
  const style = {
    background: visual.background,
    color: visual.color,
    borderColor: visual.borderColor,
    '--shift-selected-border': selectedBorder,
  }
  if (selected) {
    style.border = selectedBorder === 'transparent' ? '1px solid transparent' : `1px solid ${selectedBorder}`
    style.boxShadow = 'none'
    style.outline = 'none'
  }
  return style
}

export function decorateShift(shift = {}) {
  const visual = resolveShiftVisual(shift)
  return {
    ...shift,
    family: visual.family,
    level: visual.level,
    color: visual.color,
    light: visual.background,
    background: visual.background,
    textColor: visual.color,
    outlined: false,
  }
}
