<template>
  <el-drawer
    :title="drawerTitle"
    :visible.sync="innerVisible"
    direction="rtl"
    :size="1000"
    append-to-body
    :wrapper-closable="true"
    custom-class="zn-form-drawer zn-add-rotation-drawer"
  >
    <div class="zn-form-drawer__body">
      <el-form
        ref="form"
        :model="form"
        label-position="right"
        label-width="110px"
        class="zn-form-drawer__form"
        @submit.native.prevent
      >
        <div class="zn-form-drawer__grid zn-form-drawer__grid--3">
          <el-form-item label="部门" required>
            <el-input :value="departmentLabel" disabled />
          </el-form-item>
          <el-form-item label="考勤组">
            <el-input :value="attendanceGroupLabel" disabled />
          </el-form-item>
          <el-form-item label="规则名称" required>
            <el-input v-model="form.name" placeholder="请输入名称，如作五休二" maxlength="40" />
          </el-form-item>
          <el-form-item label="每个周期天数" required>
            <div class="zn-rotation-days-field">
              <el-input-number
                v-model="form.cycleDays"
                class="zn-rotation-days__input"
                :class="{ 'is-error': cycleDaysError }"
                :min="1"
                :controls="true"
                controls-position="right"
              />
              <span v-if="cycleDaysError" class="zn-rotation-days__error">{{ cycleDaysError }}</span>
            </div>
          </el-form-item>
          <el-form-item label="规则内容">
            <el-input v-model="form.content" placeholder="请输入名称，如连续上6个早班休息一次" />
          </el-form-item>
        </div>

        <div class="zn-rotation-board">
          <div
            v-for="day in visibleCycleDays"
            :key="day"
            class="zn-rotation-board__col"
            :class="{
              'is-row-end': day % 7 === 0,
              'is-last-row': day > Math.floor((visibleCycleDays - 1) / 7) * 7,
            }"
          >
            <div class="zn-rotation-board__head">第{{ day }}天</div>
            <div class="zn-rotation-board__body">
              <el-popover
                placement="bottom-start"
                trigger="manual"
                :value="activePickerDay === day"
                :visible-arrow="false"
                popper-class="zn-rotation-day-popper"
                @input="toggleDayPicker(day, $event)"
              >
                <div class="zn-rotation-day-picker" role="listbox" :aria-label="`选择第${day}天班次`">
                  <button
                    v-for="shift in shiftOptions"
                    :key="shift.id"
                    type="button"
                    class="zn-rotation-day-picker__option"
                    :class="{ 'is-selected': dayShifts[day - 1] === shift.id }"
                    role="option"
                    :aria-selected="dayShifts[day - 1] === shift.id ? 'true' : 'false'"
                    @click.stop="selectDayShift(day, shift.id)"
                  >
                    <span class="zn-rotation-day-picker__check" aria-hidden="true">
                      <i class="el-icon-check"></i>
                    </span>
                    <span class="shift-picker-chip" :style="shiftCardStyle(shift)" :title="`${shift.name} ${shift.time}`">
                      <b>{{ shortShiftName(shift.name) }}</b>
                      <small>{{ shift.time }}</small>
                    </span>
                  </button>
                </div>
                <button
                  slot="reference"
                  type="button"
                  class="zn-rotation-board__trigger"
                  :class="{ 'is-empty': !selectedShift(dayShifts[day - 1]) }"
                  @click.stop="toggleDayPicker(day, activePickerDay !== day)"
                >
                  <span v-if="!selectedShift(dayShifts[day - 1])" class="zn-rotation-board__choose">＋选择</span>
                  <span
                    v-else
                    class="overview-shift-chip is-regular zn-rotation-board__shift-card"
                    :style="shiftCardStyle(selectedShift(dayShifts[day - 1]))"
                    :title="`${selectedShift(dayShifts[day - 1]).name} ${selectedShift(dayShifts[day - 1]).time}`"
                  >
                    <b>{{ shortShiftName(selectedShift(dayShifts[day - 1]).name) }}</b>
                    <small>{{ selectedShift(dayShifts[day - 1]).time }}</small>
                  </span>
                </button>
              </el-popover>
            </div>
          </div>
        </div>
      </el-form>
    </div>

    <div class="zn-form-drawer__footer">
      <div class="zn-form-drawer__footer-actions">
        <el-button @click="close">取消</el-button>
        <el-button v-if="isEditing" class="zn-form-drawer__delete-btn" @click="requestDelete">删除</el-button>
        <el-button type="primary" @click="confirm">{{ isEditing ? '保存' : '确定' }}</el-button>
      </div>
    </div>
  </el-drawer>
</template>

<script>
export default {
  name: 'AddRotationDrawer',
  props: {
    visible: { type: Boolean, default: false },
    departmentLabel: { type: String, default: '' },
    attendanceGroupLabel: { type: String, default: '' },
    shiftOptions: { type: Array, default: () => [] },
    editRotation: { type: Object, default: null },
  },
  data() {
    return {
      form: {
        name: '',
        cycleDays: 7,
        content: '',
      },
      dayShifts: Array.from({ length: 7 }, () => ''),
      cycleDaysError: '',
      activePickerDay: null,
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
    isEditing() {
      return Boolean(this.editRotation && this.editRotation.id)
    },
    drawerTitle() {
      return this.isEditing ? '编辑轮班规则' : '新增轮班规则'
    },
    visibleCycleDays() {
      const days = Math.floor(Number(this.form.cycleDays) || 1)
      return Math.max(1, Math.min(31, days))
    },
  },
  watch: {
    visible(val) {
      if (val) this.resetForm()
    },
    'form.cycleDays'(days) {
      const numericDays = Number(days)
      if (!Number.isFinite(numericDays) || numericDays < 1) {
        this.cycleDaysError = '每个周期天数不能小于1天'
        return
      }
      if (numericDays > 31) {
        this.cycleDaysError = '每个周期天数不能超过31天'
        return
      }
      this.cycleDaysError = ''
      const next = Math.floor(numericDays)
      if (next !== days) {
        this.form.cycleDays = next
        return
      }
      const list = this.dayShifts.slice(0, next)
      while (list.length < next) list.push('')
      this.dayShifts = list
    },
  },
  methods: {
    resetForm() {
      this.activePickerDay = null
      if (this.isEditing) {
        this.form = {
          name: this.editRotation.name || '',
          cycleDays: Number(this.editRotation.cycleDays) || 7,
          content: this.editRotation.content || '',
        }
        this.dayShifts = [...(this.editRotation.dayShifts || [])]
        while (this.dayShifts.length < this.form.cycleDays) this.dayShifts.push('')
        this.dayShifts = this.dayShifts.slice(0, this.form.cycleDays)
        this.cycleDaysError = ''
        return
      }
      this.form = {
        name: '',
        cycleDays: 7,
        content: '',
      }
      this.dayShifts = Array.from({ length: 7 }, () => '')
      this.cycleDaysError = ''
    },
    close() {
      this.innerVisible = false
    },
    shiftCardStyle(shift = {}) {
      const background = shift.background || shift.light || '#e6edff'
      const color = shift.color || shift.textColor || '#3c6ef0'
      return {
        '--shift-selected-border': color === '#FFFFFF' ? background : color,
        background,
        color,
      }
    },
    selectedShift(shiftId) {
      return this.shiftOptions.find((item) => item.id === shiftId) || null
    },
    shortShiftName(name) {
      const text = String(name || '')
      return text.length > 5 ? `${text.slice(0, 5)}...` : text
    },
    toggleDayPicker(day, visible) {
      this.activePickerDay = visible ? day : null
    },
    selectDayShift(day, shiftId) {
      this.activePickerDay = null
      this.$nextTick(() => {
        this.$set(this.dayShifts, day - 1, shiftId)
      })
    },
    requestDelete() {
      this.$confirm(`确定删除轮班规则“${this.form.name}”吗？`, '提示', {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning',
      }).then(() => this.$emit('delete', this.editRotation.id)).catch(() => {})
    },
    confirm() {
      if (!this.form.name.trim()) {
        this.$message.warning('请输入规则名称')
        return
      }
      if (this.cycleDaysError || Number(this.form.cycleDays) > 31) {
        this.cycleDaysError = '每个周期天数不能超过31天'
        return
      }
      const missingDay = this.dayShifts.findIndex((shiftId) => !shiftId)
      if (missingDay >= 0) {
        this.$message.warning(`请选择第${missingDay + 1}天的班次`)
        return
      }
      this.$emit(this.isEditing ? 'save-edit' : 'confirm', {
        id: this.isEditing ? this.editRotation.id : null,
        name: this.form.name.trim(),
        cycleDays: this.form.cycleDays,
        content: this.form.content.trim(),
        dayShifts: this.dayShifts.slice(),
      })
    },
  },
}
</script>
