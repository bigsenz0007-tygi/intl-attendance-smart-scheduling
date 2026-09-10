<template>
  <div class="zn-card config-page">
    <div class="zn-toolbar">
      <div class="zn-toolbar__left">
        <el-button @click="$emit('back')">返回</el-button>
        <h1 class="zn-title">系统推荐的默认配置</h1>
        <p class="zn-sub">根据历史数据自动生成班次与周期，可直接使用或编辑后保存</p>
      </div>
    </div>

    <el-form label-width="80px" class="month-form" @submit.native.prevent>
      <el-form-item label="排班时间">
        <el-date-picker
          :value="scheduleMonth"
          type="month"
          placeholder="选择月份"
          format="yyyy年MM月"
          value-format="yyyy-MM"
          style="width: 240px"
          @input="$emit('update:month', $event)"
        />
      </el-form-item>
    </el-form>

    <el-alert
      v-if="hasNewEmp"
      :title="newEmpTip"
      type="warning"
      show-icon
      :closable="false"
      class="new-tip"
    />

    <div class="emp-list">
      <div v-for="(item, index) in localConfigs" :key="item.empId" class="emp-card">
        <div class="emp-card__head">
          <div class="emp-card__name">
            <span>{{ item.name }}</span>
            <el-tag v-if="item.isNew" class="zn-person-new-tag">新增</el-tag>
            <el-tag v-if="item.isSpecial" size="mini">特殊人员</el-tag>
          </div>
          <div class="emp-card__cycle">
            <el-radio-group
              v-model="item.cycleType"
              size="small"
              @change="syncPatternLength(item)"
            >
              <el-radio-button label="loop">循环周期</el-radio-button>
              <el-radio-button label="natural">自然周期</el-radio-button>
            </el-radio-group>
            <el-input-number
              v-model="item.cycleDays"
              :min="1"
              :max="30"
              size="small"
              controls-position="right"
              @change="syncPatternLength(item)"
            />
            <span class="unit">天</span>
            <el-checkbox
              v-if="item.isNew"
              v-model="item.confirmed"
            >
              确认配置
            </el-checkbox>
          </div>
        </div>
        <div class="pattern-row">
          <div
            v-for="(shift, dayIdx) in visiblePattern(item)"
            :key="`${item.empId}-${dayIdx}`"
            class="day-cell"
            :style="cellStyle(shift)"
          >
            <div class="day-cell__label">第{{ dayIdx + 1 }}天</div>
            <el-select
              :value="shift"
              size="mini"
              class="day-cell__select"
              popper-class="overseas-select-popper"
              @change="(val) => setShift(index, dayIdx, val)"
            >
              <el-option
                v-for="opt in shiftOptions"
                :key="opt.value"
                :label="opt.label"
                :value="opt.value"
              />
            </el-select>
          </div>
        </div>
      </div>
    </div>

    <div class="zn-footer-actions">
      <el-button @click="handleSave">保存配置</el-button>
      <el-button type="primary" @click="handleRun">智能排班</el-button>
    </div>
  </div>
</template>

<script>
import { SHIFT_OPTIONS, shiftMeta, NEW_EMP_TIP } from './mock'

export default {
  name: 'ConfigRecommend',
  props: {
    configs: { type: Array, required: true },
    scheduleMonth: { type: String, required: true },
  },
  data() {
    return {
      localConfigs: [],
      shiftOptions: SHIFT_OPTIONS,
      newEmpTip: NEW_EMP_TIP,
    }
  },
  computed: {
    hasNewEmp() {
      return this.localConfigs.some((c) => c.isNew)
    },
  },
  watch: {
    configs: {
      immediate: true,
      deep: true,
      handler(val) {
        this.localConfigs = val.map((c) => ({
          ...c,
          pattern: [...c.pattern],
          confirmed: c.confirmed != null ? c.confirmed : !c.isNew,
        }))
      },
    },
  },
  methods: {
    visiblePattern(item) {
      const n = Math.max(1, item.cycleDays || 7)
      const arr = [...item.pattern]
      while (arr.length < n) arr.push('rest')
      return arr.slice(0, n)
    },
    syncPatternLength(item) {
      const n = Math.max(1, item.cycleDays || 7)
      while (item.pattern.length < n) item.pattern.push('rest')
      if (item.pattern.length > n) item.pattern = item.pattern.slice(0, n)
      this.emitConfigs()
    },
    setShift(empIndex, dayIdx, val) {
      const item = this.localConfigs[empIndex]
      this.$set(item.pattern, dayIdx, val)
      this.emitConfigs()
    },
    cellStyle(shift) {
      const m = shiftMeta(shift)
      return {
        borderColor: m.bg,
        background: m.bg,
        color: m.color,
      }
    },
    emitConfigs() {
      this.$emit(
        'update:configs',
        this.localConfigs.map((c) => ({ ...c, pattern: [...c.pattern] })),
      )
    },
    handleSave() {
      this.emitConfigs()
      this.$emit(
        'save',
        this.localConfigs.map((c) => ({ ...c, pattern: [...c.pattern], confirmed: true })),
      )
    },
    handleRun() {
      this.emitConfigs()
      this.$emit(
        'run',
        this.localConfigs.map((c) => ({ ...c, pattern: [...c.pattern] })),
      )
    },
  },
}
</script>

<style lang="scss" scoped>
.month-form {
  margin-bottom: 8px;
}

.new-tip {
  margin-bottom: 16px;
}

.emp-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.emp-card {
  padding: 16px;
  border: 1px solid #eaeaea;
  border-radius: 8px;
  background: #f5f5f6;
}

.emp-card__head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.emp-card__name {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #23252b;
}

.emp-card__cycle {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.unit {
  color: #525765;
  font-size: 14px;
}

.pattern-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.day-cell {
  width: 112px;
  min-height: 72px;
  padding: 8px;
  border: 1px solid;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex-shrink: 0;
}

.day-cell__label {
  font-size: 12px;
  line-height: 18px;
  opacity: 0.9;
}

.day-cell__select {
  width: 100%;
}
</style>
