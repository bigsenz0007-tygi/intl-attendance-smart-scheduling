<template>
  <el-dialog
    title="业务监控指标"
    :visible.sync="innerVisible"
    width="1080px"
    append-to-body
    :close-on-click-modal="false"
    custom-class="zn-metric-monitor-dialog"
  >
    <el-table
      :data="rows"
      border
      :max-height="480"
      class="zn-metric-monitor-table"
      header-cell-class-name="zn-metric-monitor-table__th"
    >
      <el-table-column
        prop="name"
        label="指标名称"
        min-width="140"
        fixed
        class-name="zn-metric-monitor-table__name"
      />
      <el-table-column
        v-for="date in dateColumns"
        :key="date"
        :prop="date"
        :label="date"
        min-width="88"
        align="center"
      >
        <template slot-scope="{ row }">
          {{ row.values[date] }}
        </template>
      </el-table-column>
    </el-table>
  </el-dialog>
</template>

<script>
function createDateColumns() {
  return [
    '09/05', '09/06', '09/07', '09/08', '09/09', '09/10', '09/11', '09/12',
    '09/13', '09/14', '09/15', '09/16', '09/17', '09/18', '09/19',
  ]
}

function createDefaultRows(dates) {
  const rate = {}
  const empty = {}
  dates.forEach((date) => {
    rate[date] = '82.35 %'
    empty[date] = '--'
  })
  return [
    { name: '正式工出勤率', values: rate },
    { name: '业务量(单位：万)', values: { ...empty } },
    { name: '全量人效', values: { ...empty } },
  ]
}

export default {
  name: 'MetricMonitorDialog',
  props: {
    visible: { type: Boolean, default: false },
  },
  data() {
    const dateColumns = createDateColumns()
    return {
      dateColumns,
      rows: createDefaultRows(dateColumns),
    }
  },
  computed: {
    innerVisible: {
      get() {
        return this.visible
      },
      set(val) {
        this.$emit('update:visible', val)
      },
    },
  },
}
</script>

<style lang="scss">
.zn-metric-monitor-dialog.el-dialog {
  border-radius: 8px;
}

.zn-metric-monitor-dialog .el-dialog__header {
  margin: 0;
  padding: 16px 24px;
  border-bottom: 1px solid #eaeaea;
}

.zn-metric-monitor-dialog .el-dialog__title {
  color: #23252b;
  font-size: 16px;
  font-weight: 500;
  line-height: 24px;
}

.zn-metric-monitor-dialog .el-dialog__headerbtn {
  top: 16px;
  right: 20px;
}

.zn-metric-monitor-dialog .el-dialog__body {
  padding: 16px 24px 24px;
}

.zn-metric-monitor-table {
  width: 100%;
}

.zn-metric-monitor-table .zn-metric-monitor-table__th {
  color: #525765;
  background: #f5f5f6;
  font-weight: 500;
}

.zn-metric-monitor-table .el-table__cell {
  padding: 10px 0;
  color: #23252b;
  font-size: 14px;
  line-height: 22px;
}

.zn-metric-monitor-table .zn-metric-monitor-table__name {
  color: #23252b;
}
</style>
