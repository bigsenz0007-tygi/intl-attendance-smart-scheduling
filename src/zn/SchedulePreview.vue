<template>
  <div class="zn-card preview-page">
    <div class="zn-toolbar">
      <div class="zn-toolbar__left">
        <el-button @click="$emit('back')">返回配置</el-button>
        <h1 class="zn-title">班表预加载结果</h1>
        <p class="zn-sub">
          排班月 {{ scheduleMonth }} · 延续上月 / 继承配置 · 规则校验{{
            violations.length ? '未通过' : '通过'
          }}
        </p>
      </div>
      <div class="zn-toolbar__right">
        <el-button @click="$emit('revalidate')">重新校验</el-button>
        <el-button type="primary" :disabled="violations.length > 0" @click="$emit('publish')">
          发布
        </el-button>
      </div>
    </div>

    <div v-if="violations.length" class="zn-alert-list">
      <el-alert
        v-for="(v, idx) in violations"
        :key="idx"
        :title="`【${v.rule}】${v.message}`"
        type="error"
        show-icon
        :closable="false"
      />
      <p class="zn-sub fix-hint">存在违规时禁止发布，请在下方班表中手动微调班次后重新校验。</p>
    </div>
    <el-alert
      v-else
      title="规则校验通过：部门出勤 / 特殊人员 / 出勤安全 / 部门出勤计划均满足"
      type="success"
      show-icon
      :closable="false"
      class="ok-alert"
    />

    <div class="matrix-wrap">
      <table class="matrix">
        <thead>
          <tr>
            <th class="sticky-col">姓名</th>
            <th
              v-for="d in dates"
              :key="d.key"
              class="date-col"
            >
              <div>{{ d.label }}</div>
              <div class="week">{{ d.week }}</div>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, rIdx) in localRows" :key="row.empId">
            <td class="sticky-col name-cell">
              {{ row.name }}
              <el-tag v-if="row.isSpecial" size="mini">特</el-tag>
              <el-tag v-if="row.isNew" size="mini" type="warning">新</el-tag>
            </td>
            <td v-for="(cell, cIdx) in row.cells" :key="cIdx">
              <el-select
                v-if="!cell.empty"
                :value="cell.shift"
                size="mini"
                class="cell-select"
                popper-class="overseas-select-popper"
                @change="(val) => changeCell(rIdx, cIdx, val)"
              >
                <el-option
                  v-for="opt in shiftOptions"
                  :key="opt.value"
                  :label="opt.label"
                  :value="opt.value"
                />
              </el-select>
              <span v-else class="empty-cell">排空</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="zn-footer-actions">
      <el-button @click="$emit('back')">返回修改配置</el-button>
      <el-button type="primary" :disabled="violations.length > 0" @click="$emit('publish')">
        发布班表
      </el-button>
    </div>
  </div>
</template>

<script>
import { PREVIEW_DATES, SHIFT_OPTIONS } from './mock'

export default {
  name: 'SchedulePreview',
  props: {
    rows: { type: Array, required: true },
    violations: { type: Array, default: () => [] },
    scheduleMonth: { type: String, required: true },
  },
  data() {
    return {
      dates: PREVIEW_DATES,
      shiftOptions: SHIFT_OPTIONS,
      localRows: [],
    }
  },
  watch: {
    rows: {
      immediate: true,
      deep: true,
      handler(val) {
        this.localRows = val.map((r) => ({
          ...r,
          cells: r.cells.map((c) => ({ ...c })),
        }))
      },
    },
  },
  methods: {
    changeCell(rIdx, cIdx, val) {
      this.$set(this.localRows[rIdx].cells, cIdx, { shift: val, empty: false })
      this.$emit(
        'tweak',
        this.localRows.map((r) => ({
          ...r,
          cells: r.cells.map((c) => ({ ...c })),
        })),
      )
    },
  },
}
</script>

<style lang="scss" scoped>
.ok-alert,
.fix-hint {
  margin-bottom: 16px;
}

.matrix-wrap {
  box-sizing: border-box;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  overflow: auto;
  max-height: min(60vh, 560px);
  overscroll-behavior: contain;
  touch-action: pan-x pan-y;
  border: 1px solid #f1f2f4;
  border-radius: 8px;
  background: #fff;
  isolation: isolate;
}

.matrix {
  width: 100%;
  min-width: max-content;
  border-collapse: separate;
  border-spacing: 0;
  background: #fff;
  font-size: 12px;
}

.matrix th,
.matrix td {
  border-bottom: 1px solid #f1f2f4;
  border-right: 1px solid #f1f2f4;
  padding: 8px;
  text-align: center;
  vertical-align: middle;
  min-width: 96px;
}

.matrix tr > :last-child { border-right: 0; }
.matrix tbody tr:last-child > td { border-bottom: 0; }

.matrix th {
  background: #f5f5f6;
  color: #525765;
  font-weight: 600;
}

.matrix thead th {
  position: sticky;
  top: 0;
  z-index: 3;
  background: #f5f5f6;
}

.sticky-col {
  position: sticky;
  left: 0;
  z-index: 1;
  background: #fff;
  background-clip: padding-box;
  box-shadow: 1px 0 0 #f1f2f4;
  min-width: 120px !important;
  text-align: left !important;
}

thead .sticky-col {
  background: #f5f5f6;
  z-index: 4;
}

.name-cell {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #23252b;
}

.week {
  color: #868d9f;
  font-weight: 400;
}

.cell-select {
  width: 100%;
}

.empty-cell {
  color: #babec7;
}
</style>
