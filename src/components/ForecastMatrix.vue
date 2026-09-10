<template>
  <section class="forecast-matrix" aria-label="T+3 到 T+10 出勤工时与人数">
    <div class="matrix-frame">
      <div class="matrix-scroll">
      <table class="forecast-table">
        <thead>
          <tr>
            <th class="group-col">环节</th>
            <th v-for="date in displayDates" :key="date.key" class="date-col">
              <strong>{{ date.label }}</strong><span>{{ date.week }}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(row, rowIndex) in rows"
            :key="row.id"
            :class="{
              'forecast-row-volume': rowIndex === 0,
              'forecast-row-efficiency': rowIndex === 1,
              'forecast-editable-row': row.kind === 'editable',
              'is-editing': editingRowId === row.id,
              'is-active': activeRowId === row.id,
            }"
            @mouseenter="beginRowEdit(row)"
            @mouseleave="endRowEdit(row)"
          >
            <th>{{ row.label }}</th>
            <td v-for="date in displayDates" :key="date.key" class="value-cell">
              <template v-if="row.kind === 'readonly'">
                <span v-if="hasDisplayValue(row.values[date.key])" class="metric-value">
                  <b>{{ row.values[date.key] }}</b><small v-if="row.unit">{{ row.unit }}</small>
                </span>
                <span v-else class="empty-value">--</span>
              </template>
              <template v-else>
                <span
                  v-if="shouldShowEmptyPlaceholder(row, date)"
                  class="editable-empty"
                  @click="activateCell(row, date)"
                >
                  <span class="empty-value">--</span>
                </span>
                <span
                  v-else
                  class="editable-value"
                  :class="{ 'is-limit-error': hasLimitError(row, date) }"
                >
                  <el-input-number
                    :ref="'peopleInput-' + row.id + '-' + date.key"
                    :value="editableValue(row.values[date.key])"
                    :min="0"
                    :max="9999"
                    :controls="false"
                    :precision="0"
                    :class="{ 'is-limit-error': hasLimitError(row, date) }"
                    size="small"
                    @focus="activateCell(row, date)"
                    @click.native="activateCell(row, date)"
                    @blur="commitTarget(row, date, $event)"
                    @input="updateTarget(row, date.key, $event)"
                    @input.native="validateTargetInput(row, date, $event)"
                    @change="updateTarget(row, date.key, $event)"
                  />
                  <small>{{ row.unit }}</small>
                  <em v-if="hasLimitError(row, date)" class="field-error">请输入1-9999的整数</em>
                </span>
              </template>
            </td>
          </tr>
        </tbody>
      </table>
      </div>
    </div>
  </section>
</template>

<script>
export default {
  name: 'ForecastMatrix',
  props: {
    dates: { type: Array, required: true },
    rows: { type: Array, required: true },
  },
  data() {
    return {
      editingRowId: null,
      activeRowId: null,
      activeCellKey: null,
      limitErrors: {},
    }
  },
  computed: {
    displayDates() {
      return this.dates.slice(1)
    },
  },
  mounted() {
    document.addEventListener('click', this.handleDocumentClick)
  },
  beforeDestroy() {
    document.removeEventListener('click', this.handleDocumentClick)
  },
  methods: {
    cellKey(rowId, dateKey) {
      return `${rowId}-${dateKey}`
    },
    hasDisplayValue(value) {
      if (value === null || value === undefined || value === '') return false
      const num = Number(value)
      if (Number.isFinite(num) && num === 0) return false
      return true
    },
    shouldShowEmptyPlaceholder(row, date) {
      if (this.hasLimitError(row, date)) return false
      if (this.activeCellKey === this.cellKey(row.id, date.key)) return false
      return !this.hasDisplayValue(row.values[date.key])
    },
    editableValue(value) {
      if (value === null || value === undefined || value === '' || Number(value) === 0) return undefined
      return value
    },
    errorKey(rowId, dateKey) {
      return this.cellKey(rowId, dateKey)
    },
    hasLimitError(row, date) {
      return Boolean(this.limitErrors[this.errorKey(row.id, date.key)])
    },
    setLimitError(rowId, dateKey, hasError) {
      const key = this.errorKey(rowId, dateKey)
      if (hasError) {
        this.$set(this.limitErrors, key, true)
        return
      }
      this.$delete(this.limitErrors, key)
    },
    parsePeopleCount(raw) {
      const text = String(raw == null ? '' : raw).trim()
      // 无数据 / 0：视为空，展示 --，不报错
      if (text === '' || text === '0') return { ok: true, value: 0, empty: true }
      if (!/^\d+$/.test(text)) return { ok: false, reason: 'invalid' }
      const value = Number(text)
      if (!Number.isFinite(value) || value < 1 || value > 9999) return { ok: false, reason: 'range' }
      return { ok: true, value }
    },
    updateTarget(row, dateKey, value) {
      if (value === null || value === undefined || value === '' || Number(value) === 0) {
        this.setLimitError(row.id, dateKey, false)
        this.$emit('target-change', { rowId: row.id, dateKey, value: 0 })
        return
      }
      const parsed = this.parsePeopleCount(value)
      this.setLimitError(row.id, dateKey, !parsed.ok)
      if (!parsed.ok) return
      this.$emit('target-change', { rowId: row.id, dateKey, value: parsed.value })
    },
    validateTargetInput(row, date, event) {
      const rawValue = event && event.target ? event.target.value : ''
      const parsed = this.parsePeopleCount(rawValue)
      this.setLimitError(row.id, date.key, !parsed.ok)
    },
    commitTarget(row, date, event) {
      const rawValue = event && event.target ? event.target.value : ''
      const parsed = this.parsePeopleCount(rawValue)
      this.setLimitError(row.id, date.key, !parsed.ok)
      if (!parsed.ok) return
      this.$emit('target-change', { rowId: row.id, dateKey: date.key, value: parsed.value })
      this.activeCellKey = null
      this.activeRowId = null
    },
    beginRowEdit(row) {
      if (row.kind !== 'editable') return
      this.editingRowId = row.id
    },
    endRowEdit(row) {
      if (row.kind !== 'editable' || this.editingRowId !== row.id) return
      if (this.activeRowId === row.id) return
      this.editingRowId = null
    },
    activateCell(row, date) {
      this.editingRowId = row.id
      this.activeRowId = row.id
      this.activeCellKey = this.cellKey(row.id, date.key)
      this.$nextTick(() => {
        const ref = this.$refs[`peopleInput-${row.id}-${date.key}`]
        const input = Array.isArray(ref) ? ref[0] : ref
        if (input && typeof input.focus === 'function') input.focus()
      })
    },
    handleDocumentClick(event) {
      const editableRow = event.target.closest && event.target.closest('.forecast-editable-row')
      if (editableRow && this.$el.contains(editableRow)) return
      this.editingRowId = null
      this.activeRowId = null
      this.activeCellKey = null
    },
  },
}
</script>

<style scoped>
.forecast-matrix {
  display: flex;
  flex: 0 1 auto;
  flex-direction: column;
  min-height: 0;
  max-height: 100%;
  height: auto;
  color: #525765;
  background: transparent;
  font-family: "PingFang SC", "Microsoft YaHei", sans-serif;
}
.matrix-frame {
  display: flex;
  flex: 0 1 auto;
  flex-direction: column;
  min-height: 0;
  max-height: 100%;
  height: fit-content;
  overflow: hidden;
  border: 1px solid #f1f2f4;
  border-radius: 8px;
  background: #fff;
}
.matrix-scroll {
  flex: 0 1 auto;
  min-height: 0;
  max-height: 100%;
  overflow: auto;
  overscroll-behavior: contain;
  border: 0;
  border-radius: 0;
  background: #fff;
}
.forecast-table { width: 100%; min-width: 0; border-collapse: separate; border-spacing: 0; table-layout: fixed; color: #525765; font-size: 14px; font-weight: 400; line-height: 20px; }
.forecast-table th, .forecast-table td { height: 48px; padding: 8px 12px; border-right: 1px solid #f1f2f4; border-bottom: 1px solid #f1f2f4; text-align: center; vertical-align: middle; box-sizing: border-box; }
.forecast-table tr:last-child th, .forecast-table tr:last-child td { border-bottom: 0; }
.forecast-table th:last-child, .forecast-table td:last-child { border-right: 0; }
.forecast-table thead th {
  position: sticky;
  top: 0;
  z-index: 10;
  height: 48px;
  padding: 8px 12px;
  color: #525765;
  border-bottom: 1px solid #f1f2f4;
  /* 必须实色：半透明会让下方「单量」数字透进表头叠字 */
  background: #f5f5f6;
  box-shadow: none;
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  vertical-align: middle;
}
.forecast-table thead th.group-col {
  z-index: 11;
  background: #f5f5f6;
}
.forecast-table thead th.date-col {
  padding: 8px 12px;
  background: #f5f5f6;
}
.forecast-table thead th.date-col strong,
.forecast-table thead th.date-col span {
  display: block;
  margin: 0;
  line-height: 20px;
}
.forecast-table thead th.date-col span {
  margin-top: 2px;
}
.forecast-table tbody tr:first-child th,
.forecast-table tbody tr:first-child td {
  border-top: 1px solid #f1f2f4;
  box-shadow: none;
}
.forecast-table tbody th { color: #525765; background: #fff; font-size: 14px; font-weight: 400; line-height: 20px; text-align: center; }
.forecast-table tbody tr.forecast-row-volume th,
.forecast-table tbody tr.forecast-row-volume td,
.forecast-table tbody tr.forecast-row-efficiency th,
.forecast-table tbody tr.forecast-row-efficiency td {
  background: rgba(60, 110, 240, 0.05);
}
.forecast-table tbody tr.forecast-editable-row th,
.forecast-table tbody tr.forecast-editable-row td {
  transition: background-color .16s ease;
}
.forecast-table tbody tr.forecast-editable-row:hover th,
.forecast-table tbody tr.forecast-editable-row:hover td,
.forecast-table tbody tr.forecast-editable-row.is-editing th,
.forecast-table tbody tr.forecast-editable-row.is-editing td {
  background: #f5f5f6;
}
.forecast-table tbody tr.forecast-editable-row.is-active th,
.forecast-table tbody tr.forecast-editable-row.is-active td {
  background: rgba(60, 110, 240, .1);
}
.group-col { width: 96px; text-align: center; }
.date-col strong, .date-col span { display: block; color: #525765; font-size: 14px; line-height: 20px; }
.date-col strong { font-weight: 500; }
.date-col span { margin-top: 2px; font-weight: 400; }
.value-cell { text-align: center; }

.metric-value {
  display: inline-flex;
  align-items: baseline;
  justify-content: center;
  gap: 2px;
  color: #23252b;
  font-size: 14px;
  font-weight: 400;
  font-variant-numeric: tabular-nums;
  line-height: 20px;
}
.metric-value b { color: #23252b; font-weight: 400; font-variant-numeric: tabular-nums; }
.metric-value small { color: #525765; font-size: 14px; font-weight: 400; line-height: 20px; }

.editable-value {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 2px;
  min-width: 72px;
}
.editable-empty {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 2px;
  min-width: 72px;
  min-height: 28px;
  cursor: pointer;
}
.editable-empty small {
  color: #525765;
  font-size: 14px;
  line-height: 20px;
}
.editable-value .el-input-number { width: 64px; }
.editable-value small { color: #525765; font-size: 14px; font-weight: 400; line-height: 20px; }
.editable-value .field-error {
  position: absolute;
  top: calc(100% + 2px);
  left: 50%;
  z-index: 2;
  color: #fc3737;
  font-size: 12px;
  font-style: normal;
  line-height: 18px;
  white-space: nowrap;
  transform: translateX(-50%);
  pointer-events: none;
}
.editable-value ::v-deep .el-input__inner {
  height: 28px;
  padding: 0 8px;
  color: #23252b;
  border-color: transparent !important;
  border-radius: 8px;
  background: transparent;
  box-shadow: none !important;
  font-size: 14px;
  font-weight: 400;
  line-height: 20px;
  text-align: center;
}
.forecast-table tbody tr.forecast-editable-row:hover .editable-value:not(.is-limit-error) ::v-deep .el-input__inner,
.forecast-table tbody tr.forecast-editable-row.is-editing:not(.is-active) .editable-value:not(.is-limit-error) ::v-deep .el-input__inner {
  border-color: #f1f2f4 !important;
  border-radius: 8px;
  background: #fff;
  box-shadow: none !important;
}
.forecast-table tbody tr.forecast-editable-row.is-active .editable-value:not(.is-limit-error) ::v-deep .el-input__inner,
.forecast-table tbody tr.forecast-editable-row.is-active .editable-value:not(.is-limit-error) ::v-deep .el-input__inner:focus {
  border-color: #3c6ef0 !important;
  border-radius: 8px;
  box-shadow: 0 0 0 3px rgba(60, 110, 240, .1) !important;
}
.forecast-table tbody tr.forecast-editable-row .editable-value.is-limit-error ::v-deep .el-input__inner,
.forecast-table tbody tr.forecast-editable-row .editable-value.is-limit-error ::v-deep .el-input__inner:focus,
.forecast-table tbody tr.forecast-editable-row:hover .editable-value.is-limit-error ::v-deep .el-input__inner,
.forecast-table tbody tr.forecast-editable-row.is-editing .editable-value.is-limit-error ::v-deep .el-input__inner,
.forecast-table tbody tr.forecast-editable-row.is-active .editable-value.is-limit-error ::v-deep .el-input__inner,
.forecast-table tbody tr.forecast-editable-row.is-active .editable-value.is-limit-error ::v-deep .el-input__inner:focus,
.editable-value.is-limit-error ::v-deep .el-input__inner,
.editable-value.is-limit-error ::v-deep .el-input__inner:focus,
.editable-value .is-limit-error ::v-deep .el-input__inner,
.editable-value .is-limit-error ::v-deep .el-input__inner:focus {
  border-color: #fc3737 !important;
  border-radius: 8px;
  background: #fff !important;
  box-shadow: 0 0 0 3px rgba(252, 55, 55, .12) !important;
}
.empty-value { color: #babec7; }
</style>
