<template>
  <div class="zn-statistics-panel">
    <div class="overview-matrix density-compact zn-statistics-matrix">
      <table>
        <thead>
          <tr>
            <th class="zn-stat-index-col">序号</th>
            <th class="zn-stat-shift-col">班次</th>
            <th
              v-for="date in dates"
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
          <tr v-for="(row, index) in rows" :key="row.id">
            <td class="zn-stat-index-col">{{ index + 1 }}</td>
            <td class="zn-stat-shift-col">
              <span
                class="legend-chip zn-stat-shift-tag"
                :class="{ 'is-rest': row.isRest }"
                :style="shiftTagStyle(row)" :title="`${displayShiftName(row)} ${displayShiftTime(row)}`"
              >
                <b>{{ displayShiftName(row) }}</b>
                <small>{{ displayShiftTime(row) }}</small>
              </span>
            </td>
            <td
              v-for="(date, dayIdx) in dates"
              :key="`${row.id}-${date.key}`"
              class="zn-stat-count-cell"
              :class="{ 'is-weekend': date.isWeekend }"
            >{{ countOf(row, dayIdx) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
import { formatShiftTimeRange, resolveShiftChipStyle } from '../utils/shiftPalette'

export default {
  name: 'ScheduleStatisticsPanel',
  props: {
    dates: { type: Array, required: true },
    rows: { type: Array, required: true },
  },
  methods: {
    countOf(row, dayIdx) {
      const counts = row.counts || []
      return dayIdx < counts.length ? counts[dayIdx] : 0
    },
    displayShiftName(row) {
      if (row.isRest) return '休息'
      return row.name
    },
    displayShiftTime(row) {
      if (row.isRest) return formatShiftTimeRange(row.time || '00:00-23:59')
      return formatShiftTimeRange(row.time)
    },
    shiftTagStyle(row) {
      return resolveShiftChipStyle({
        name: row.name,
        time: row.isRest ? (row.time || '00:00-23:59') : row.time,
        isRest: !!row.isRest,
        id: row.isRest ? 'REST' : row.id,
      })
    },
  },
}
</script>

<style scoped>
.zn-statistics-panel { display: flex; flex: 1 1 auto; min-height: 0; overflow: hidden; }
.zn-statistics-matrix { flex: 1 1 auto; min-height: 0; overflow: auto; }
</style>
