<template>
  <el-drawer
    :title="drawerTitle"
    :visible.sync="innerVisible"
    direction="rtl"
    :size="1000"
    append-to-body
    :wrapper-closable="true"
    custom-class="zn-form-drawer zn-add-shift-drawer"
  >
    <div class="zn-form-drawer__body">
      <el-form
        :model="form"
        label-position="right"
        label-width="110px"
        class="zn-form-drawer__form"
        @submit.native.prevent
      >
        <div class="zn-form-drawer__grid zn-form-drawer__grid--3">
          <el-form-item label="班次名称" required>
            <div class="zn-shift-name-field">
              <el-select v-model="form.family" class="zn-shift-name-field__family" placeholder="请选择" popper-class="overseas-select-popper">
                <el-option label="早班" value="morning" />
                <el-option label="中班" value="midday" />
                <el-option label="晚班" value="night" />
                <el-option label="休息" value="rest" />
              </el-select>
              <el-input
                v-if="form.family !== 'rest'"
                v-model="form.level"
                class="zn-shift-name-field__level"
              />
            </div>
          </el-form-item>
          <el-form-item label="班次类型" required>
            <el-select v-model="form.shiftType" placeholder="请选择" popper-class="overseas-select-popper">
              <el-option label="固定班次" value="fixed" />
              <el-option label="跳班班次" value="jump" />
              <el-option label="弹性班次" value="flex" disabled />
            </el-select>
          </el-form-item>
          <el-form-item v-if="form.shiftType === 'jump'" label="跳跃次数" required>
            <el-select v-model="form.jumpCount" placeholder="请选择" popper-class="overseas-select-popper">
              <el-option
                v-for="count in 2"
                :key="count"
                :label="`${count}次`"
                :value="count"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="班次颜色" required>
            <el-popover
              v-model="colorPickerOpen"
              placement="bottom-start"
              trigger="click"
              popper-class="zn-shift-color-popper"
              :disabled="form.family === 'rest'"
            >
              <div class="zn-shift-color-swatches">
                <button
                  v-for="item in colorOptions"
                  :key="`${item.family}-${item.level}`"
                  type="button"
                  class="zn-shift-color-swatch"
                  :class="{
                    'is-active': form.color === item.background,
                    'is-used': item.used,
                  }"
                  :style="{ background: item.background }"
                  :title="colorSwatchTitle(item)"
                  @click="selectColor(item)"
                >
                  <img
                    v-if="item.used"
                    class="zn-shift-color-swatch__used"
                    :src="prohibitIcon"
                    alt=""
                    width="12"
                    height="12"
                  >
                </button>
              </div>
              <button
                slot="reference"
                type="button"
                class="zn-shift-color-trigger"
                :class="{ 'is-rest': form.family === 'rest', 'is-open': colorPickerOpen }"
                :disabled="form.family === 'rest'"
              >
                <span class="zn-shift-color-trigger__chip" :style="{ background: form.color }" />
              </button>
            </el-popover>
          </el-form-item>
          <el-form-item label="是否跨夜" required>
            <el-select v-model="form.crossNight" placeholder="请选择" popper-class="overseas-select-popper">
              <el-option label="否" value="no" />
              <el-option label="是" value="yes" />
            </el-select>
          </el-form-item>
        </div>

        <div class="zn-form-drawer__section">
          <div class="zn-form-drawer__section-title">班次时间设置</div>
          <el-alert
            class="zn-form-drawer__alert"
            type="warning"
            show-icon
            :closable="false"
          >
            <span slot="title">
              京东集团-京东物流及下级部门上班最大边界为2小时，下班最大边界为3小时，如有疑问可咨询
              <button type="button" class="zn-shift-alert-contact" @click="contactSupport">
                wangsushan<i class="el-icon-chat-dot-round" aria-hidden="true"></i>
              </button>
            </span>
          </el-alert>
          <div class="zn-form-drawer__grid zn-form-drawer__grid--3 zn-add-shift-summary-grid">
            <el-form-item label="班次总时长">
              <el-input :value="String(totalHours)" disabled />
            </el-form-item>
            <el-form-item label="夜班类型预估">
              <el-input :value="nightTypeEstimate" disabled />
            </el-form-item>
          </div>

          <div class="zn-add-shift-time-table">
            <table>
              <thead>
                <tr>
                  <th>时段</th>
                  <th>上班边界</th>
                  <th>上班打卡边界</th>
                  <th>上下班时间</th>
                  <th>下班边界</th>
                  <th>下班打卡边界</th>
                  <th>时长</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(segment, segmentIndex) in form.segments" :key="segment.id">
                  <td><strong>第{{ segmentIndex + 1 }}时段</strong></td>
                  <td>
                    <el-select v-model="segment.startBound" popper-class="overseas-select-popper">
                      <el-option v-for="value in ['0.5', '1', '1.5', '2']" :key="`start-${value}`" :label="value" :value="value" />
                    </el-select>
                  </td>
                  <td>{{ startPunchBoundFor(segment) }}</td>
                  <td>
                    <el-time-picker
                      :value="[segment.startTime, segment.endTime]"
                      is-range
                      value-format="HH:mm"
                      format="HH:mm"
                      :clearable="false"
                      range-separator="至"
                      start-placeholder="上班时间"
                      end-placeholder="下班时间"
                      popper-class="shift-picker-control-popper temporary-shift-time-popper"
                      class="zn-add-shift-time-range"
                      @input="updateSegmentTimeRange(segmentIndex, $event)"
                    />
                  </td>
                  <td>
                    <el-select v-model="segment.endBound" popper-class="overseas-select-popper">
                      <el-option v-for="value in ['0.5', '1', '1.5', '2', '3']" :key="`end-${value}`" :label="value" :value="value" />
                    </el-select>
                  </td>
                  <td>{{ endPunchBoundFor(segment) }}</td>
                  <td><span class="zn-add-shift-duration">{{ segmentHours(segment) }}h</span></td>
                </tr>
              </tbody>
            </table>
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
import { assetUrl } from '../utils/assetUrl'
import {
  SHIFT_REST_VISUAL,
  nextShiftLevel,
  familyLabelOf,
  shiftFamilyOf,
  shiftColorOptions,
  resolveFamilyColor,
  configuredShiftLevels,
  inferShiftIndex,
} from '../utils/shiftPalette'

function shiftMinutes(hhmm) {
  if (!hhmm || typeof hhmm !== 'string') return 0
  const [h, m] = hhmm.split(':').map(Number)
  return (h || 0) * 60 + (m || 0)
}

function formatHhmm(totalMinutes) {
  const day = ((totalMinutes % (24 * 60)) + 24 * 60) % (24 * 60)
  const h = Math.floor(day / 60)
  const m = day % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export default {
  name: 'AddShiftDrawer',
  props: {
    visible: { type: Boolean, default: false },
    departmentLabel: { type: String, default: '' },
    attendanceGroupLabel: { type: String, default: '' },
    shifts: { type: Array, default: () => [] },
    editShift: { type: Object, default: null },
  },
  data() {
    return {
      form: this.createDefaultForm(),
      colorPickerOpen: false,
      prohibitIcon: assetUrl('lui-icon-prohibit.svg'),
      hydratingForm: false,
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
      return Boolean(this.editShift && this.editShift.id)
    },
    drawerTitle() {
      return this.isEditing ? '编辑班次' : '新增班次'
    },
    usedLevels() {
      const source = this.isEditing
        ? this.shifts.filter((shift) => shift.id !== this.editShift.id)
        : this.shifts
      if (this.form.family === 'rest') {
        return source.some((shift) => shiftFamilyOf(shift) === 'rest') ? [0] : []
      }
      return configuredShiftLevels(source, this.form.family)
    },
    colorOptions() {
      const usedSet = new Set(this.usedLevels)
      return shiftColorOptions(this.form.family).map((item) => ({
        ...item,
        used: usedSet.has(item.level),
      }))
    },
    totalHours() {
      if (this.form.family === 'rest') return 0
      const segments = this.form.segments || []
      if (!segments.length) return 0
      let start = shiftMinutes(segments[0].startTime)
      let end = shiftMinutes(segments[segments.length - 1].endTime)
      if (end <= start) end += 24 * 60
      return Math.max(0, Math.round(((end - start) / 60) * 10) / 10)
    },
    nightTypeEstimate() {
      return this.form.crossNight === 'yes' ? '跨夜班次' : '无'
    },
  },
  watch: {
    visible(val) {
      if (val) this.resetForm()
      else this.colorPickerOpen = false
    },
    'form.family'(family) {
      if (this.hydratingForm) return
      const level = nextShiftLevel(this.shifts, family) || 1
      if (family === 'rest') {
        this.form.level = ''
        this.form.shiftType = 'fixed'
        this.form.jumpCount = ''
        this.form.segments = [this.createSegment('00:00', '23:59')]
        this.form.color = SHIFT_REST_VISUAL.background
        this.colorPickerOpen = false
        return
      }
      this.form.level = String(level)
      this.form.color = resolveFamilyColor(family, level)
      this.resetSegmentsForType()
    },
    'form.shiftType'(type) {
      if (this.hydratingForm) return
      if (this.form.family === 'rest') return
      this.form.jumpCount = type === 'jump' ? 1 : ''
      this.resetSegmentsForType(type)
    },
    'form.jumpCount'(count) {
      if (this.hydratingForm || this.form.shiftType !== 'jump') return
      this.syncJumpSegments(count)
    },
    'form.level'(level) {
      if (this.hydratingForm) return
      if (this.form.family === 'rest') return
      const n = Number(level)
      if (!Number.isFinite(n) || n < 1) return
      this.form.color = resolveFamilyColor(this.form.family, n)
    },
  },
  methods: {
    familyLabelOf,
    createSegment(startTime, endTime) {
      return {
        id: `segment-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        startTime,
        endTime,
        startBound: '0.5',
        endBound: '0.5',
      }
    },
    createDefaultForm() {
      return {
        family: 'morning',
        level: '1',
        shiftType: 'fixed',
        jumpCount: '',
        color: resolveFamilyColor('morning', 1),
        crossNight: 'no',
        segments: [this.createSegment('08:00', '18:00')],
      }
    },
    resetSegmentsForType(type = this.form.shiftType) {
      if (type === 'jump') {
        this.syncJumpSegments(this.form.jumpCount || 1, true)
        return
      }
      const ranges = {
        morning: ['08:00', '18:00'],
        midday: ['13:00', '18:00'],
        night: ['20:00', '05:00'],
      }
      const range = ranges[this.form.family] || ranges.morning
      this.form.segments = [this.createSegment(range[0], range[1])]
    },
    syncJumpSegments(count, reset = false) {
      const jumpCount = Math.max(1, Math.min(2, Number(count) || 1))
      const targetLength = jumpCount + 1
      const defaults = [
        ['08:00', '12:00'],
        ['13:00', '18:00'],
        ['19:00', '21:00'],
      ]
      const current = reset ? [] : (this.form.segments || [])
      const segments = Array.from({ length: targetLength }, (_, index) => (
        current[index] || this.createSegment(defaults[index][0], defaults[index][1])
      ))
      this.$set(this.form, 'jumpCount', jumpCount)
      this.$set(this.form, 'segments', segments)
    },
    segmentHours(segment) {
      let start = shiftMinutes(segment.startTime)
      let end = shiftMinutes(segment.endTime)
      if (end <= start) end += 24 * 60
      const value = Math.max(0, Math.round(((end - start) / 60) * 10) / 10)
      return Number.isInteger(value) ? value : value.toFixed(1)
    },
    updateSegmentTimeRange(index, value) {
      if (!Array.isArray(value) || value.length !== 2) return
      const segment = this.form.segments[index]
      if (!segment) return
      this.$set(segment, 'startTime', value[0])
      this.$set(segment, 'endTime', value[1])
      this.form.crossNight = shiftMinutes(value[1]) <= shiftMinutes(value[0]) ? 'yes' : 'no'
    },
    startPunchBoundFor(segment) {
      const start = shiftMinutes(segment.startTime)
      const bound = Number(segment.startBound) || 0
      return formatHhmm(start - bound * 60)
    },
    endPunchBoundFor(segment) {
      const end = shiftMinutes(segment.endTime)
      const bound = Number(segment.endBound) || 0
      return formatHhmm(end + bound * 60)
    },
    resetForm() {
      if (this.isEditing) {
        const shift = this.editShift
        const family = shiftFamilyOf(shift)
        const ranges = String(shift.time || '').split(/\s*\/\s*/).map((part) => part.split('-'))
        const segments = (shift.segments && shift.segments.length)
          ? shift.segments.map((segment) => ({ ...segment, id: segment.id || this.createSegment('', '').id }))
          : ranges.filter((range) => range.length === 2).map((range) => this.createSegment(range[0], range[1]))
        const jumpCount = shift.shiftType === 'jump'
          ? Math.max(1, Math.min(2, Number(shift.jumpCount) || Math.max(1, segments.length - 1)))
          : ''
        const normalizedSegments = jumpCount ? segments.slice(0, jumpCount + 1) : segments.slice(0, 1)
        this.hydratingForm = true
        this.form = {
          family,
          level: family === 'rest' ? '' : String(shift.level || inferShiftIndex(shift.name)),
          shiftType: shift.shiftType || 'fixed',
          jumpCount,
          color: shift.background || shift.light || resolveFamilyColor(family, shift.level || 1),
          crossNight: shift.crossNight || 'no',
          segments: normalizedSegments.length ? normalizedSegments : [this.createSegment('08:00', '18:00')],
        }
        this.colorPickerOpen = false
        this.$nextTick(() => { this.hydratingForm = false })
        return
      }
      const form = this.createDefaultForm()
      const level = nextShiftLevel(this.shifts, 'morning') || 1
      form.level = String(level)
      form.color = resolveFamilyColor('morning', level)
      this.form = form
      this.colorPickerOpen = false
    },
    colorSwatchTitle(item) {
      if (item.family === 'rest') return item.used ? '休息（已使用）' : '休息'
      const label = `${familyLabelOf(item.family)}${item.level}次`
      return item.used ? `${label}（已使用）` : label
    },
    selectColor(item) {
      if (item.used) {
        const name = item.family === 'rest'
          ? '休息'
          : `${familyLabelOf(item.family)}${item.level}次`
        this.$message.warning(`${name}颜色已使用`)
        return
      }
      this.form.color = item.background
      if (item.family !== 'rest' && item.level > 0) {
        this.form.level = String(item.level)
      }
      this.colorPickerOpen = false
    },
    close() {
      this.innerVisible = false
    },
    requestDelete() {
      this.$confirm(`确定删除班次“${this.editShift.name}”吗？`, '提示', {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning',
      }).then(() => this.$emit('delete', this.editShift.id)).catch(() => {})
    },
    contactSupport() {
      this.$message.info('已打开 wangsushan 咨询会话')
    },
    confirm() {
      if (this.form.shiftType === 'jump' && !this.form.jumpCount) {
        this.$message.warning('请选择跳跃次数')
        return
      }
      if (this.form.shiftType === 'jump') this.syncJumpSegments(this.form.jumpCount)
      const segments = (this.form.segments || []).map((segment) => ({ ...segment }))
      if (!segments.length || segments.some((segment) => !segment.startTime || !segment.endTime)) {
        this.$message.warning('请完整填写班次时间')
        return
      }
      this.$emit(this.isEditing ? 'save-edit' : 'confirm', {
        id: this.isEditing ? this.editShift.id : null,
        family: this.form.family,
        level: Number(this.form.level) || nextShiftLevel(this.shifts, this.form.family),
        time: this.form.family === 'rest'
          ? '00:00-23:59'
          : segments.map((segment) => `${segment.startTime}-${segment.endTime}`).join(' / '),
        color: this.form.color,
        shiftType: this.form.shiftType,
        jumpCount: this.form.jumpCount || null,
        crossNight: this.form.crossNight,
        segments,
      })
    },
  },
}
</script>

<style lang="scss">
.zn-add-shift-time-table {
  max-width: 100%;
  overflow: auto;
  overscroll-behavior: contain;
  touch-action: pan-x pan-y;
  border: 1px solid #e4e5e9;
  border-radius: 8px;
  background: #fff;
}
.zn-add-shift-summary-grid { margin-bottom: 16px; }
.zn-add-shift-time-table table { width: 100%; min-width: 822px; border-collapse: separate; border-spacing: 0; table-layout: fixed; }
.zn-add-shift-time-table th,
.zn-add-shift-time-table td {
  height: 56px;
  padding: 8px 12px;
  border-right: 1px solid #e4e5e9;
  border-bottom: 1px solid #e4e5e9;
  box-sizing: border-box;
  color: #525765;
  font-size: 14px;
  font-weight: 400;
  line-height: 22px;
  text-align: left;
}
.zn-add-shift-time-table th { height: 48px; background: #f5f5f6; color: #23252b; font-size: 14px; font-weight: 500; line-height: 22px; }
.zn-add-shift-time-table td strong { font-size: 14px; font-weight: 500; line-height: 22px; }
.zn-add-shift-duration { color: #525765; font-size: 14px; font-weight: 400; line-height: 22px; }
.zn-add-shift-time-table th:last-child,
.zn-add-shift-time-table td:last-child { border-right: 0; }
.zn-add-shift-time-table tbody tr:last-child td { border-bottom: 0; }
.zn-add-shift-time-table th:nth-child(1) { width: 74px; }
.zn-add-shift-time-table th:nth-child(2),
.zn-add-shift-time-table th:nth-child(5) { width: 104px; }
.zn-add-shift-time-table th:nth-child(3),
.zn-add-shift-time-table th:nth-child(6) { width: 116px; }
.zn-add-shift-time-table th:nth-child(4) { width: 220px; }
.zn-add-shift-time-table th:nth-child(7) { width: 70px; }
.zn-add-shift-time-table .el-select { width: 100%; }
.zn-add-shift-time-table .el-input__inner { height: 32px; border-radius: 8px; font-size: 14px; line-height: 32px; }
.zn-add-shift-time-range.el-date-editor--timerange { width: 196px; height: 32px; padding: 0 8px; border-radius: 8px; line-height: 30px; }
.zn-add-shift-time-range .el-range-input { width: 64px; font-size: 14px; }
.zn-add-shift-time-range .el-range-separator { width: 24px; padding: 0; line-height: 30px; }
</style>
