<template>
  <el-drawer
    title="修改班次"
    :visible.sync="innerVisible"
    direction="rtl"
    :size="1000"
    append-to-body
    :wrapper-closable="false"
    custom-class="zn-form-drawer zn-confirm-shift-dialog zn-confirm-shift-drawer"
    @open="resetRows"
  >
    <div class="zn-confirm-shift-dialog__body">
      <div class="zn-confirm-shift-dialog__toolbar">
        <div class="zn-confirm-shift-dialog__tip">
          <i class="el-icon-info" aria-hidden="true"></i>
          <span>请确认推荐班次，或按需添加临时班次</span>
        </div>
        <el-button type="primary" icon="el-icon-plus" @click="openCreatePanel">新增班次</el-button>
      </div>

      <section v-if="createPanelVisible" class="zn-confirm-shift-create" aria-label="新增班次">
        <div class="zn-confirm-shift-create__head">
          <div class="zn-form-drawer__section-title zn-confirm-shift-section-title">新增班次</div>
          <button type="button" class="zn-confirm-shift-create__close" aria-label="收起新增班次" @click="closeCreatePanel">
            <i class="el-icon-close" aria-hidden="true"></i>
          </button>
        </div>
        <el-form :model="newShiftForm" label-position="right" label-width="110px" class="zn-form-drawer__form zn-confirm-shift-create__form" @submit.native.prevent>
          <div class="zn-form-drawer__grid">
            <el-form-item label="部门" required>
              <el-input :value="departmentLabel" disabled />
            </el-form-item>
            <el-form-item label="考勤组">
              <el-input :value="attendanceGroupLabel" disabled />
            </el-form-item>
            <el-form-item label="班次名称" required>
              <div class="zn-shift-name-field">
                <el-select v-model="newShiftForm.family" class="zn-shift-name-field__family" placeholder="请选择" popper-class="overseas-select-popper" @change="onNewFamilyChange">
                  <el-option label="早班" value="morning" />
                  <el-option label="中班" value="midday" />
                  <el-option label="晚班" value="night" />
                  <el-option label="休息" value="rest" />
                </el-select>
                <el-input v-if="newShiftForm.family !== 'rest'" v-model.trim="newShiftForm.level" class="zn-shift-name-field__level" maxlength="2" />
              </div>
            </el-form-item>
            <el-form-item label="班次类型" required>
              <el-select v-model="newShiftForm.shiftType" placeholder="请选择" popper-class="overseas-select-popper" @change="onNewTypeChange">
                <el-option label="固定班次" value="fixed" />
                <el-option label="跳班班次" value="jump" />
                <el-option label="弹性班次" value="flex" disabled />
              </el-select>
            </el-form-item>
            <el-form-item v-if="newShiftForm.shiftType === 'jump'" label="跳跃次数" required>
              <el-select v-model="newShiftForm.jumpCount" placeholder="请选择" popper-class="overseas-select-popper" @change="syncNewJumpSegments">
                <el-option v-for="count in 2" :key="count" :label="`${count}次`" :value="count" />
              </el-select>
            </el-form-item>
            <el-form-item label="班次颜色" required>
              <el-popover
                v-model="colorPickerOpen"
                placement="bottom-start"
                trigger="click"
                popper-class="zn-shift-color-popper"
                :disabled="newShiftForm.family === 'rest'"
              >
                <div class="zn-shift-color-swatches">
                  <button
                    v-for="item in newShiftColorOptions"
                    :key="`${item.family}-${item.level}`"
                    type="button"
                    class="zn-shift-color-swatch"
                    :class="{ 'is-active': newShiftForm.color === item.background, 'is-used': item.used }"
                    :style="{ background: item.background }"
                    :title="newShiftColorSwatchTitle(item)"
                    @click="selectNewShiftColor(item)"
                  >
                    <img v-if="item.used" class="zn-shift-color-swatch__used" :src="prohibitIcon" alt="" width="12" height="12">
                  </button>
                </div>
                <button
                  slot="reference"
                  type="button"
                  class="zn-shift-color-trigger"
                  :class="{ 'is-rest': newShiftForm.family === 'rest', 'is-open': colorPickerOpen }"
                  :disabled="newShiftForm.family === 'rest'"
                >
                  <span class="zn-shift-color-trigger__chip" :style="{ background: newShiftForm.color }" />
                </button>
              </el-popover>
            </el-form-item>
            <el-form-item label="是否跨夜" required>
              <el-select v-model="newShiftForm.crossNight" placeholder="请选择" popper-class="overseas-select-popper">
                <el-option label="否" value="no" />
                <el-option label="是" value="yes" />
              </el-select>
            </el-form-item>
          </div>

          <div class="zn-form-drawer__section">
            <div class="zn-form-drawer__section-title">班次时间设置</div>
            <el-alert class="zn-form-drawer__alert" type="warning" show-icon :closable="false">
              <span slot="title">
                京东集团-京东物流及下级部门上班最大边界为2小时，下班最大边界为3小时，如有疑问可咨询
                <button type="button" class="zn-shift-alert-contact" @click="contactSupport">
                  wangsushan<i class="el-icon-chat-dot-round" aria-hidden="true"></i>
                </button>
              </span>
            </el-alert>
            <div class="zn-form-drawer__grid">
              <el-form-item label="班次总时长">
                <el-input :value="String(newShiftTotalHours)" disabled />
              </el-form-item>
              <el-form-item label="夜班类型预估">
                <el-input :value="newShiftNightType" disabled />
              </el-form-item>
            </div>
            <div class="zn-confirm-shift-create__segments">
              <div v-for="(segment, index) in newShiftForm.segments" :key="segment.id" class="zn-confirm-shift-create__segment">
                <strong class="zn-confirm-shift-create__segment-title">第{{ index + 1 }}时段</strong>
                <div class="zn-confirm-shift-detail">
                  <div class="zn-confirm-shift-detail__field is-boundary">
                    <span class="zn-confirm-shift-detail__label">上班边界</span>
                    <div class="zn-confirm-shift-detail__control">
                      <el-select v-model="segment.startBound" class="zn-confirm-shift-detail__num" popper-class="overseas-select-popper">
                        <el-option v-for="value in startBoundaryOptions" :key="`start-${value}`" :label="value" :value="value" />
                      </el-select>
                      <span class="zn-confirm-shift-detail__unit">小时</span>
                    </div>
                  </div>
                  <div class="zn-confirm-shift-detail__field is-time">
                    <span class="zn-confirm-shift-detail__label">上下班时间</span>
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
                      class="zn-confirm-shift-detail__time-range"
                      @input="updateNewShiftTimeRange(index, $event)"
                    />
                  </div>
                  <div class="zn-confirm-shift-detail__field is-boundary">
                    <span class="zn-confirm-shift-detail__label">下班边界</span>
                    <div class="zn-confirm-shift-detail__control">
                      <el-select v-model="segment.endBound" class="zn-confirm-shift-detail__num" popper-class="overseas-select-popper">
                        <el-option v-for="value in endBoundaryOptions" :key="`end-${value}`" :label="value" :value="value" />
                      </el-select>
                      <span class="zn-confirm-shift-detail__unit">小时</span>
                    </div>
                  </div>
                </div>
                <el-tag class="zn-shift-slot__badge" size="small" color="#EFE8FF">{{ newShiftSegmentHours(segment) }}h</el-tag>
              </div>
            </div>
          </div>
        </el-form>
        <div class="zn-confirm-shift-create__actions">
          <el-button @click="closeCreatePanel">取消新增</el-button>
          <el-button type="primary" @click="appendNewShift">添加到表格</el-button>
        </div>
      </section>

      <div class="zn-form-drawer__section-title zn-confirm-shift-section-title zn-confirm-shift-section-title--current">当前班次</div>
      <div class="zn-confirm-shift-table-shell">
      <el-table
        :data="rows"
        row-key="id"
        border
        :max-height="confirmTableMaxHeight"
        class="zn-confirm-shift-table"
        header-cell-class-name="zn-confirm-shift-table__th"
      >
      <el-table-column label="班次名称" min-width="126">
        <template slot-scope="{ row }">
          <el-input
            v-if="row.isNew"
            v-model.trim="row.name"
            maxlength="20"
            placeholder="请输入班次名称"
            class="zn-confirm-shift-name-input"
          />
          <span v-else>{{ row.name }}</span>
        </template>
      </el-table-column>
      <el-table-column label="班次颜色" width="80" align="center">
        <template slot-scope="{ row }">
          <button
            v-if="row.isNew"
            type="button"
            class="zn-shift-color-trigger zn-confirm-shift-row-color-trigger"
            :class="{ 'is-open': activeRowColorId === row.id }"
            aria-label="修改班次颜色"
            @click.stop="openRowColorPicker(row, $event)"
          >
            <span class="zn-shift-color-trigger__chip" :style="{ background: row.color }" />
          </button>
          <span v-else class="zn-confirm-shift-color-dot" :style="{ background: rowShiftBackground(row) }" />
        </template>
      </el-table-column>
      <el-table-column label="班次类型" width="120">
        <template slot-scope="{ row }">
          <el-select
            v-if="row.isNew"
            :key="`type-${row.id}`"
            v-model="row.shiftType"
            class="zn-confirm-shift-type-select"
            popper-class="overseas-select-popper"
            @change="handleTypeChange(row)"
          >
            <el-option label="固定班次" value="fixed" />
            <el-option label="跳班班次" value="jump" />
          </el-select>
          <el-tag
            v-else
            :key="`tag-${row.id}`"
            size="small"
            :class="row.shiftType === 'jump' ? 'is-jump' : 'is-fixed'"
            :type="row.shiftType === 'jump' ? 'warning' : 'info'"
            effect="plain"
          >{{ row.shiftType === 'jump' ? '跳班班次' : '固定班次' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="跨夜" width="88" align="center">
        <template slot-scope="{ row }">
          <el-select
            v-if="row.isNew"
            v-model="row.crossNight"
            class="zn-confirm-shift-night-select"
            popper-class="overseas-select-popper"
          >
            <el-option label="是" :value="true" />
            <el-option label="否" :value="false" />
          </el-select>
          <span v-else class="zn-confirm-shift-overnight">
            {{ row.crossNight ? '是' : '否' }}
          </span>
        </template>
      </el-table-column>
      <el-table-column label="班次详情" min-width="640">
        <template slot-scope="{ row }">
          <div v-if="row.shiftType === 'jump'" class="zn-confirm-shift-segments">
            <div
              v-for="(segment, segmentIndex) in row.segments"
              :key="segment.id || segmentIndex"
              class="zn-confirm-shift-segments__item"
            >
              <strong class="zn-confirm-shift-segments__label">第{{ segmentIndex + 1 }}段</strong>
              <div class="zn-confirm-shift-detail">
                <div class="zn-confirm-shift-detail__field is-boundary">
                  <span class="zn-confirm-shift-detail__label">上班边界</span>
                  <div class="zn-confirm-shift-detail__control">
                    <el-input v-model="segment.startBound" class="zn-confirm-shift-detail__num" />
                    <span class="zn-confirm-shift-detail__unit">小时</span>
                  </div>
                </div>
                <div class="zn-confirm-shift-detail__field is-time">
                  <span class="zn-confirm-shift-detail__label">上下班时间</span>
                  <el-time-picker
                    :value="[segment.startTime, segment.endTime]"
                    is-range
                    value-format="HH:mm:ss"
                    format="HH:mm"
                    :clearable="false"
                    range-separator="至"
                    popper-class="shift-picker-control-popper temporary-shift-time-popper"
                    class="zn-confirm-shift-detail__time-range"
                    @input="updateRowTimeRange(row, $event, segmentIndex)"
                  />
                </div>
                <div class="zn-confirm-shift-detail__field is-boundary">
                  <span class="zn-confirm-shift-detail__label">下班边界</span>
                  <div class="zn-confirm-shift-detail__control">
                    <el-input v-model="segment.endBound" class="zn-confirm-shift-detail__num" />
                    <span class="zn-confirm-shift-detail__unit">小时</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="zn-confirm-shift-detail">
            <div class="zn-confirm-shift-detail__field is-boundary">
              <span class="zn-confirm-shift-detail__label">上班边界</span>
              <div class="zn-confirm-shift-detail__control">
                <el-input v-model="row.startBound" class="zn-confirm-shift-detail__num" />
                <span class="zn-confirm-shift-detail__unit">小时</span>
              </div>
            </div>
            <div class="zn-confirm-shift-detail__field is-time">
              <span class="zn-confirm-shift-detail__label">上下班时间</span>
              <el-time-picker
                :value="[row.startTime, row.endTime]"
                is-range
                value-format="HH:mm:ss"
                format="HH:mm"
                :clearable="false"
                range-separator="至"
                popper-class="shift-picker-control-popper temporary-shift-time-popper"
                class="zn-confirm-shift-detail__time-range"
                @input="updateRowTimeRange(row, $event)"
              />
            </div>
            <div class="zn-confirm-shift-detail__field is-boundary">
              <span class="zn-confirm-shift-detail__label">下班边界</span>
              <div class="zn-confirm-shift-detail__control">
                <el-input v-model="row.endBound" class="zn-confirm-shift-detail__num" />
                <span class="zn-confirm-shift-detail__unit">小时</span>
              </div>
            </div>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="source" label="班次来源" min-width="80" />
      <el-table-column prop="creator" label="创建人ERP" min-width="110" />
      <el-table-column label="操作" width="100" align="left" header-align="left">
        <template slot-scope="{ row }">
          <button
            v-if="row.isNew"
            type="button"
            class="zn-confirm-shift-delete"
            @click="removeRow(row)"
          >
            <span
              class="zn-confirm-shift-delete__icon"
              :style="luiIconMask('lui-icon-delete.svg')"
              aria-hidden="true"
            />
            <span>删除</span>
          </button>
          <el-switch
            v-else
            :value="row.action === 'use'"
            class="zn-confirm-shift-action-switch"
            active-color="#3C6EF0"
            inactive-color="#D9D9D9"
            aria-label="使用班次"
            @change="setRowUse(row, $event)"
          />
        </template>
      </el-table-column>
      </el-table>
      </div>
      <div
        v-if="activeRowColor"
        class="zn-confirm-shift-row-color-panel"
        :style="rowColorPanelStyle"
        @click.stop
      >
        <div class="zn-shift-color-swatches">
          <button
            v-for="item in rowColorOptions(activeRowColor)"
            :key="`${activeRowColor.id}-${item.family}-${item.level}`"
            type="button"
            class="zn-shift-color-swatch"
            :class="{ 'is-active': activeRowColor.color === item.background, 'is-used': item.used }"
            :style="{ background: item.background }"
            :title="rowColorSwatchTitle(item)"
            @click="selectRowColor(activeRowColor, item)"
          >
            <img v-if="item.used" class="zn-shift-color-swatch__used" :src="prohibitIcon" alt="" width="12" height="12">
          </button>
        </div>
      </div>
    </div>

    <div class="zn-confirm-shift-dialog__footer">
      <el-button @click="cancel">取消</el-button>
      <el-button type="primary" @click="confirm">确定</el-button>
    </div>
  </el-drawer>
</template>

<script>
import { assetUrl } from '../utils/assetUrl'
import {
  configuredShiftLevels,
  familyLabelOf,
  resolveFamilyColor,
  shiftColorOptions,
  shiftFamilyOf,
} from '../utils/shiftPalette'

function createSegment(startTime = '09:00:00', endTime = '18:00:00') {
  return {
    id: `segment-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    startBound: '0.5',
    startTime,
    endTime,
    endBound: '0.5',
  }
}

function createDefaultShiftForm() {
  return {
    family: 'morning',
    level: '1',
    shiftType: 'fixed',
    jumpCount: '',
    color: resolveFamilyColor('morning', 1),
    crossNight: 'no',
    segments: [createSegment('08:00', '18:00')],
  }
}

function clockMinutes(value) {
  const [hour, minute] = String(value || '').split(':').map(Number)
  return (Number(hour) || 0) * 60 + (Number(minute) || 0)
}

function formatHhmm(totalMinutes) {
  const day = ((totalMinutes % (24 * 60)) + 24 * 60) % (24 * 60)
  const hour = Math.floor(day / 60)
  const minute = day % 60
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

function withSeconds(value) {
  const text = String(value || '')
  return /^\d{2}:\d{2}$/.test(text) ? `${text}:00` : text
}

function normalizeColor(value) {
  return String(value || '').trim().toUpperCase()
}

function segmentTimeSignature(segments) {
  return (segments || [])
    .map((segment) => `${withSeconds(segment.startTime)}-${withSeconds(segment.endTime)}`)
    .join('|')
}

function cloneRows(rows) {
  return (rows || []).map((row) => ({
    ...row,
    isNew: Boolean(row.isNew),
    colorPickerOpen: false,
    segments: (row.segments || []).map((segment) => ({ ...segment })),
  }))
}

export default {
  name: 'ConfirmShiftDialog',
  props: {
    visible: { type: Boolean, default: false },
    shiftRows: { type: Array, default: () => [] },
    existingShifts: { type: Array, default: () => [] },
    departmentLabel: { type: String, default: '' },
    attendanceGroupLabel: { type: String, default: '' },
  },
  data() {
    return {
      rows: [],
      temporaryIndex: 0,
      createPanelVisible: false,
      newShiftForm: createDefaultShiftForm(),
      colorPickerOpen: false,
      activeRowColorId: null,
      rowColorPanelPosition: { top: 0, left: 0 },
      prohibitIcon: assetUrl('lui-icon-prohibit.svg'),
      startBoundaryOptions: ['0.5', '1', '1.5', '2'],
      endBoundaryOptions: ['0.5', '1', '1.5', '2', '3'],
    }
  },
  computed: {
    confirmTableMaxHeight() {
      const viewportHeight = typeof window === 'undefined' ? 900 : window.innerHeight
      return Math.max(240, Math.min(560, viewportHeight - 250))
    },
    innerVisible: {
      get() {
        return this.visible
      },
      set(val) {
        this.$emit('update:visible', val)
      },
    },
    newShiftName() {
      if (this.newShiftForm.family === 'rest') return '休息'
      return `${this.newShiftForm.shiftType === 'jump' ? '(跳)' : ''}${familyLabelOf(this.newShiftForm.family)}${Number(this.newShiftForm.level) || 1}次`
    },
    validationRows() {
      const rows = new Map()
      ;[...(this.existingShifts || []), ...(this.rows || [])].forEach((row) => {
        rows.set(row.id || row.name, row)
      })
      return Array.from(rows.values())
    },
    newShiftTotalHours() {
      if (this.newShiftForm.family === 'rest') return '0'
      const segments = this.newShiftForm.segments || []
      if (!segments.length) return '0'
      const start = clockMinutes(segments[0].startTime)
      let end = clockMinutes(segments[segments.length - 1].endTime)
      if (end <= start) end += 24 * 60
      const hours = Math.round(((end - start) / 60) * 10) / 10
      return Number.isInteger(hours) ? String(hours) : hours.toFixed(1)
    },
    newShiftNightType() {
      return this.newShiftForm.crossNight === 'yes' ? '跨夜班次' : '无'
    },
    newShiftUsedLevels() {
      if (this.newShiftForm.family === 'rest') {
        return this.rows.some((row) => shiftFamilyOf(row) === 'rest') ? [0] : []
      }
      return configuredShiftLevels(this.validationRows, this.newShiftForm.family)
    },
    newShiftUsedColors() {
      return new Set(this.validationRows.map((row) => normalizeColor(this.rowShiftBackground(row))).filter(Boolean))
    },
    newShiftColorOptions() {
      const usedSet = new Set(this.newShiftUsedLevels)
      return shiftColorOptions(this.newShiftForm.family).map((item) => ({
        ...item,
        used: usedSet.has(item.level) || this.newShiftUsedColors.has(normalizeColor(item.background)),
      }))
    },
    activeRowColor() {
      return this.rows.find((row) => row.id === this.activeRowColorId) || null
    },
    rowColorPanelStyle() {
      return {
        top: `${this.rowColorPanelPosition.top}px`,
        left: `${this.rowColorPanelPosition.left}px`,
      }
    },
  },
  watch: {
    shiftRows: {
      deep: true,
      handler() {
        if (this.innerVisible) this.resetRows()
      },
    },
  },
  methods: {
    luiIconMask(file) {
      const url = `url("${assetUrl(file)}")`
      return {
        WebkitMaskImage: url,
        maskImage: url,
      }
    },
    rowShiftBackground(row) {
      if (!row) return ''
      return row.background
        || row.light
        || row.color
        || resolveFamilyColor(shiftFamilyOf(row), Number(row.level) || 1)
    },
    rowTimeSignature(row) {
      if (!row) return ''
      const segments = row.shiftType === 'jump' && row.segments && row.segments.length
        ? row.segments
        : [{ startTime: row.startTime, endTime: row.endTime }]
      return segmentTimeSignature(segments)
    },
    resetRows() {
      this.rows = cloneRows(this.shiftRows)
      this.temporaryIndex = 0
      this.createPanelVisible = false
      this.newShiftForm = createDefaultShiftForm()
      this.colorPickerOpen = false
      this.activeRowColorId = null
    },
    nextLevelFor(family) {
      const prefix = familyLabelOf(family)
      const levels = this.validationRows
        .filter((row) => String(row.name || '').replace(/^\(跳\)/, '').startsWith(prefix))
        .map((row) => Number(String(row.name || '').match(/(\d+)次/)?.[1]))
        .filter(Number.isFinite)
      return levels.length ? Math.max(...levels) + 1 : 1
    },
    openCreatePanel() {
      const form = createDefaultShiftForm()
      form.level = String(this.nextLevelFor('morning'))
      const usedColors = new Set(this.validationRows.map((row) => normalizeColor(this.rowShiftBackground(row))))
      const recommended = shiftColorOptions('morning')
        .find((item) => !usedColors.has(normalizeColor(item.background)))
      form.color = recommended ? recommended.background : resolveFamilyColor('morning', Number(form.level))
      const segment = form.segments[0]
      this.temporaryIndex += 1
      this.rows.unshift({
        id: `TEMP-${Date.now()}-${this.temporaryIndex}`,
        name: `早班${form.level}次`,
        family: 'morning',
        level: Number(form.level),
        color: form.color,
        shiftType: 'fixed',
        crossNight: false,
        startBound: segment.startBound,
        startTime: withSeconds(segment.startTime),
        endTime: withSeconds(segment.endTime),
        endBound: segment.endBound,
        source: '临时',
        creator: 'zhouxingzi1',
        action: 'use',
        colorPickerOpen: false,
        segments: [],
        isNew: true,
      })
      this.$nextTick(() => {
        const table = this.$el && this.$el.querySelector('.el-table__body-wrapper')
        if (table) table.scrollTop = 0
      })
    },
    closeCreatePanel() {
      this.createPanelVisible = false
      this.colorPickerOpen = false
    },
    onNewFamilyChange(family) {
      const level = this.nextLevelFor(family)
      this.newShiftForm.level = family === 'rest' ? '' : String(level)
      const usedColors = new Set(this.validationRows.map((row) => normalizeColor(this.rowShiftBackground(row))))
      const recommended = shiftColorOptions(family)
        .find((item) => !usedColors.has(normalizeColor(item.background)))
      this.newShiftForm.color = recommended ? recommended.background : resolveFamilyColor(family, level)
      this.newShiftForm.shiftType = 'fixed'
      this.newShiftForm.jumpCount = ''
      this.newShiftForm.crossNight = 'no'
      this.colorPickerOpen = false
      const ranges = {
        morning: ['08:00', '18:00'],
        midday: ['13:00', '18:00'],
        night: ['20:00', '05:00'],
        rest: ['00:00', '23:59'],
      }
      const range = ranges[family] || ranges.morning
      this.newShiftForm.segments = [createSegment(range[0], range[1])]
      this.newShiftForm.crossNight = clockMinutes(range[1]) <= clockMinutes(range[0]) ? 'yes' : 'no'
    },
    onNewTypeChange(type) {
      if (type === 'jump') {
        this.newShiftForm.jumpCount = 1
        this.syncNewJumpSegments(1, true)
      } else {
        this.onNewFamilyChange(this.newShiftForm.family)
      }
    },
    syncNewJumpSegments(count, reset = false) {
      const jumpCount = Math.max(1, Math.min(2, Number(count) || 1))
      const targetLength = jumpCount + 1
      const defaults = [
        ['08:00', '12:00'],
        ['13:00', '18:00'],
        ['19:00', '21:00'],
      ]
      const current = reset ? [] : (this.newShiftForm.segments || [])
      const segments = Array.from({ length: targetLength }, (_, index) => (
        current[index] || createSegment(defaults[index][0], defaults[index][1])
      ))
      this.$set(this.newShiftForm, 'jumpCount', jumpCount)
      this.$set(this.newShiftForm, 'segments', segments)
    },
    newShiftSegmentHours(segment) {
      const start = clockMinutes(segment.startTime)
      let end = clockMinutes(segment.endTime)
      if (end <= start) end += 24 * 60
      const hours = Math.max(0, Math.round(((end - start) / 60) * 10) / 10)
      return Number.isInteger(hours) ? hours : hours.toFixed(1)
    },
    updateNewShiftTimeRange(index, value) {
      if (!Array.isArray(value) || value.length !== 2) return
      const segment = this.newShiftForm.segments[index]
      if (!segment) return
      this.$set(segment, 'startTime', value[0])
      this.$set(segment, 'endTime', value[1])
      this.newShiftForm.crossNight = clockMinutes(value[1]) <= clockMinutes(value[0]) ? 'yes' : 'no'
    },
    newShiftStartPunchBound(segment) {
      return formatHhmm(clockMinutes(segment.startTime) - (Number(segment.startBound) || 0) * 60)
    },
    newShiftEndPunchBound(segment) {
      return formatHhmm(clockMinutes(segment.endTime) + (Number(segment.endBound) || 0) * 60)
    },
    newShiftColorSwatchTitle(item) {
      if (item.family === 'rest') return item.used ? '休息（已使用）' : '休息'
      const label = `${familyLabelOf(item.family)}${item.level}次`
      return item.used ? `${label}（已使用）` : label
    },
    selectNewShiftColor(item) {
      if (item.used) {
        const label = item.family === 'rest' ? '休息' : `${familyLabelOf(item.family)}${item.level}次`
        this.$message.warning(`${label}颜色已使用`)
        return
      }
      this.newShiftForm.color = item.background
      if (item.family !== 'rest' && item.level > 0) this.newShiftForm.level = String(item.level)
      this.colorPickerOpen = false
    },
    contactSupport() {
      this.$message.info('已打开 wangsushan 咨询会话')
    },
    appendNewShift() {
      const level = Number(this.newShiftForm.level)
      if (this.newShiftForm.family !== 'rest' && (!Number.isInteger(level) || level < 1)) {
        this.$message.warning('请输入有效的班次序号')
        return
      }
      if (this.validationRows.some((row) => row.name === this.newShiftName)) {
        this.$message.warning('班次名称不能重复')
        return
      }
      if (this.newShiftForm.shiftType === 'jump' && !this.newShiftForm.jumpCount) {
        this.$message.warning('请选择跳跃次数')
        return
      }
      if (this.newShiftForm.shiftType === 'jump') this.syncNewJumpSegments(this.newShiftForm.jumpCount)
      const segments = (this.newShiftForm.segments || []).map((segment) => ({
        ...segment,
        startTime: withSeconds(segment.startTime),
        endTime: withSeconds(segment.endTime),
      }))
      if (!segments.length || segments.some((segment) => !segment.startTime || !segment.endTime)) {
        this.$message.warning('请完整填写班次时间')
        return
      }
      const timeSignature = segmentTimeSignature(segments)
      if (this.validationRows.some((row) => this.rowTimeSignature(row) === timeSignature)) {
        this.$message.warning('班次时间不能与已有班次重复')
        return
      }
      const selectedColor = normalizeColor(this.newShiftForm.color)
      if (this.validationRows.some((row) => normalizeColor(this.rowShiftBackground(row)) === selectedColor)) {
        this.$message.warning('班次颜色不能与已有班次重复')
        return
      }
      this.temporaryIndex += 1
      this.rows.unshift({
        id: `TEMP-${Date.now()}-${this.temporaryIndex}`,
        name: this.newShiftName,
        family: this.newShiftForm.family,
        level: level || 0,
        color: this.newShiftForm.color,
        shiftType: this.newShiftForm.shiftType,
        jumpCount: this.newShiftForm.jumpCount || null,
        crossNight: this.newShiftForm.crossNight === 'yes',
        startBound: segments[0].startBound,
        startTime: segments[0].startTime,
        endTime: segments[0].endTime,
        endBound: segments[0].endBound,
        source: '临时',
        creator: 'zhouxingzi1',
        action: 'use',
        colorPickerOpen: false,
        segments: this.newShiftForm.shiftType === 'jump' ? segments : [],
        isNew: true,
      })
      this.createPanelVisible = false
      this.$message.success(`${this.newShiftName}已添加到班次表`)
      this.$nextTick(() => {
        const table = this.$el && this.$el.querySelector('.el-table__body-wrapper')
        if (table) table.scrollTop = 0
      })
    },
    handleTypeChange(row) {
      if (row.shiftType === 'jump' && (!row.segments || !row.segments.length)) {
        this.$set(row, 'jumpCount', 1)
        this.$set(row, 'segments', [
          createSegment('09:00:00', '12:00:00'),
          createSegment('13:00:00', '18:00:00'),
        ])
      } else if (row.shiftType !== 'jump') {
        this.$set(row, 'jumpCount', null)
      }
    },
    updateRowTimeRange(row, value, segmentIndex = null) {
      if (!Array.isArray(value) || value.length !== 2) return
      if (segmentIndex !== null && row.segments && row.segments[segmentIndex]) {
        this.$set(row.segments[segmentIndex], 'startTime', value[0])
        this.$set(row.segments[segmentIndex], 'endTime', value[1])
      } else {
        this.$set(row, 'startTime', value[0])
        this.$set(row, 'endTime', value[1])
      }
      this.$set(row, 'crossNight', clockMinutes(value[1]) <= clockMinutes(value[0]))
    },
    rowColorOptions(row) {
      const used = new Set(this.rows
        .filter((item) => item !== row)
        .map((item) => normalizeColor(this.rowShiftBackground(item))))
      return shiftColorOptions(shiftFamilyOf(row)).map((item) => ({
        ...item,
        used: used.has(normalizeColor(item.background)),
      }))
    },
    rowColorSwatchTitle(item) {
      const label = `${familyLabelOf(item.family)}${item.level}次`
      return item.used ? `${label}（已使用）` : label
    },
    openRowColorPicker(row, event) {
      if (this.activeRowColorId === row.id) {
        this.activeRowColorId = null
        return
      }
      const rect = event.currentTarget.getBoundingClientRect()
      const panelWidth = 264
      this.rowColorPanelPosition = {
        top: Math.min(window.innerHeight - 96, rect.bottom + 8),
        left: Math.max(16, Math.min(window.innerWidth - panelWidth - 16, rect.left)),
      }
      this.activeRowColorId = row.id
    },
    selectRowColor(row, item) {
      if (item.used) {
        this.$message.warning(`${familyLabelOf(item.family)}${item.level}次颜色已使用`)
        return
      }
      this.$set(row, 'color', item.background)
      this.$set(row, 'colorPickerOpen', false)
      this.activeRowColorId = null
    },
    removeRow(row) {
      const index = this.rows.indexOf(row)
      if (index >= 0) this.rows.splice(index, 1)
      if (this.activeRowColorId === row.id) this.activeRowColorId = null
    },
    setRowUse(row, enabled) {
      this.$set(row, 'action', enabled ? 'use' : 'skip')
    },
    cancel() {
      this.innerVisible = false
    },
    confirm() {
      const unnamed = this.rows.find((row) => row.isNew && !String(row.name || '').trim())
      if (unnamed) {
        this.$message.warning('请输入新增班次名称')
        return
      }
      const names = this.rows.map((row) => String(row.name || '').trim()).filter(Boolean)
      if (new Set(names).size !== names.length) {
        this.$message.warning('班次名称不能重复')
        return
      }
      const newRows = this.rows.filter((row) => row.isNew)
      const duplicateTime = newRows.some((row) => this.rows.some((candidate) => (
        candidate !== row && this.rowTimeSignature(candidate) === this.rowTimeSignature(row)
      )))
      if (duplicateTime) {
        this.$message.warning('新增班次时间不能与已有班次重复')
        return
      }
      const duplicateColor = newRows.some((row) => this.rows.some((candidate) => (
        candidate !== row
        && normalizeColor(this.rowShiftBackground(candidate)) === normalizeColor(this.rowShiftBackground(row))
      )))
      if (duplicateColor) {
        this.$message.warning('新增班次颜色不能与已有班次重复')
        return
      }
      const confirmed = cloneRows(this.rows).map((row) => ({ ...row, isNew: false }))
      this.$emit('confirm', confirmed)
      this.innerVisible = false
    },
  },
}
</script>

<style lang="scss">
.zn-form-drawer.zn-confirm-shift-drawer.el-drawer.rtl {
  --zn-confirm-control-border: #d9d9d9;
  --zn-confirm-control-border-hover: rgba(60, 110, 240, 0.35);
  --zn-confirm-control-border-active: #3c6ef0;
  --zn-confirm-control-focus-ring: 0 0 0 3px rgba(60, 110, 240, 0.15);

  display: flex;
  flex-direction: column;
  width: min(1000px, calc(100vw - 32px)) !important;
  min-width: 0;
  max-width: 1000px;
  overflow: hidden;
}
.zn-confirm-shift-drawer .el-drawer__header {
  flex: 0 0 auto;
  margin: 0;
  padding: 16px 24px;
  border-bottom: 1px solid #eaeaea;
}
.zn-confirm-shift-drawer .el-drawer__header > span {
  color: #23252b;
  font-size: 16px;
  font-weight: 500;
  line-height: 24px;
}
.zn-confirm-shift-drawer .el-drawer__close-btn { color: #868d9f; font-size: 18px; }
.zn-confirm-shift-drawer .el-drawer__body {
  display: flex;
  min-height: 0;
  flex: 1 1 auto;
  flex-direction: column;
  overflow: hidden;
}
.zn-confirm-shift-dialog__body {
  display: flex;
  min-height: 0;
  flex: 1 1 auto;
  flex-direction: column;
  padding: 16px 24px;
  overflow: auto;
}
.zn-confirm-shift-dialog__footer {
  display: flex;
  flex: 0 0 auto;
  justify-content: flex-end;
  padding: 12px 24px 16px;
  border-top: 1px solid #eaeaea;
}
.zn-confirm-shift-dialog__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}
.zn-confirm-shift-dialog__tip {
  display: flex;
  flex: 1 1 auto;
  align-items: center;
  gap: 8px;
  min-width: 0;
  box-sizing: border-box;
  height: 32px;
  max-height: 32px;
  padding: 0 16px;
  border-radius: 8px;
  background: #edf2ff;
  color: #525765;
  font-size: 14px;
  line-height: 22px;
}
.zn-confirm-shift-dialog__tip .el-icon-info {
  flex-shrink: 0;
  color: #3c6ef0;
  font-size: 16px;
}
.zn-confirm-shift-dialog__toolbar .el-button {
  flex-shrink: 0;
  box-sizing: border-box;
  height: 32px;
  max-height: 32px;
  padding-top: 0;
  padding-bottom: 0;
  border-radius: 8px;
  line-height: 30px;
}
.zn-confirm-shift-row-color-panel {
  position: fixed;
  z-index: 4000;
  box-sizing: border-box;
  width: 264px;
  padding: 12px;
  border: 1px solid #e4e5e9;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 4px 16px rgba(35, 37, 43, .16);
}
.zn-confirm-shift-table-shell {
  min-height: 0;
  flex: 0 0 auto;
  overflow: hidden;
  border: 1px solid #e4e5e9;
  border-radius: 8px;
}
.zn-confirm-shift-table {
  width: 100%;
  border: 0;
  border-radius: 0;
  overflow: hidden;
}
.zn-confirm-shift-table.el-table--border::after,
.zn-confirm-shift-table.el-table--group::after,
.zn-confirm-shift-table::before { display: none; }
.zn-confirm-shift-table .el-table__body-wrapper {
  overflow: auto !important;
}
.zn-confirm-shift-table .zn-confirm-shift-table__th {
  color: #525765;
  background: #f5f5f6;
  font-weight: 500;
}
.zn-confirm-shift-table .el-table__cell {
  padding: 12px 0;
  color: #23252b;
  font-size: 14px;
  vertical-align: middle;
}
.zn-confirm-shift-table .el-tag {
  height: 24px;
  padding: 0 8px;
  border-radius: 8px;
  line-height: 22px;
}
.zn-confirm-shift-table .el-tag.is-fixed {
  color: #3c6ef0;
  border-color: #c8d7fb;
  background: #edf2ff;
}
.zn-confirm-shift-table .el-tag.is-jump {
  color: #ff7700;
  border-color: #ffd9b3;
  background: #fff7e8;
}
.zn-confirm-shift-overnight {
  display: inline;
  color: #525765;
  font-size: 14px;
  font-weight: 400;
  line-height: 22px;
}
.zn-confirm-shift-detail {
  display: grid;
  grid-template-columns: 116px 220px 116px;
  align-items: end;
  gap: 24px;
  min-width: 0;
  white-space: nowrap;
}
.zn-confirm-shift-detail__field {
  display: flex;
  min-width: 0;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
}
.zn-confirm-shift-detail__field.is-time { width: 220px; }
.zn-confirm-shift-detail__control {
  display: flex;
  width: 100%;
  align-items: center;
  gap: 8px;
}
.zn-confirm-shift-detail__label,
.zn-confirm-shift-detail__unit {
  flex-shrink: 0;
  color: #525765;
  font-size: 14px;
  line-height: 22px;
  white-space: nowrap;
}
.zn-confirm-shift-detail__label { color: #868d9f; font-size: 12px; line-height: 18px; }
.zn-confirm-shift-detail__unit { color: #525765; font-size: 14px; line-height: 32px; }
.zn-confirm-shift-detail__num { width: 80px; }
.zn-confirm-shift-detail__num .el-input__inner {
  height: 32px;
  padding: 0 8px;
  border-radius: 8px;
  text-align: center;
  line-height: 32px;
}
.zn-confirm-shift-table .zn-confirm-shift-detail {
  grid-template-columns: 144px 300px 144px;
  align-items: center;
  gap: 16px;
}
.zn-confirm-shift-table .zn-confirm-shift-detail__field {
  width: auto;
  flex-direction: row;
  align-items: center;
  gap: 8px;
}
.zn-confirm-shift-table .zn-confirm-shift-detail__field.is-time {
  width: auto;
}
.zn-confirm-shift-table .zn-confirm-shift-detail__label {
  color: #525765;
  font-size: 14px;
  line-height: 32px;
}
.zn-confirm-shift-table .zn-confirm-shift-detail__control {
  position: relative;
  flex: 0 0 80px;
  width: 80px;
  gap: 0;
}
.zn-confirm-shift-table .zn-confirm-shift-detail__num .el-input__inner {
  padding-right: 30px;
  padding-left: 8px;
  text-align: left;
}
.zn-confirm-shift-table .zn-confirm-shift-detail__unit {
  position: absolute;
  top: 0;
  right: 8px;
  pointer-events: none;
}
.zn-confirm-shift-detail__time {
  flex: 0 0 100px;
  width: 100px;
}
.zn-confirm-shift-detail__time .el-input__inner {
  height: 32px;
  padding: 0 28px 0 8px;
  border-radius: 8px;
  line-height: 32px;
}
.zn-confirm-shift-detail__time-range.el-date-editor--timerange {
  flex: 0 0 32px;
  width: 220px;
  height: 32px;
  padding: 0 8px;
  border-radius: 8px;
  line-height: 30px;
}
.zn-confirm-shift-detail__time-range .el-range-input {
  width: 72px;
  font-size: 14px;
}
.zn-confirm-shift-detail__time-range .el-range-separator {
  width: 24px;
  padding: 0;
  color: #525765;
  line-height: 30px;
}
.zn-confirm-shift-detail__time-range.el-date-editor.is-disabled {
  border-color: #e4e5e9;
  background: #f5f5f6;
}
.zn-confirm-shift-detail__time-range.el-date-editor.is-disabled .el-range-input {
  background: transparent !important;
  color: #868d9f;
  -webkit-text-fill-color: #868d9f;
}
.zn-confirm-shift-detail__time-range.el-date-editor.is-disabled .el-range-separator,
.zn-confirm-shift-detail__time-range.el-date-editor.is-disabled .el-range__icon {
  background: transparent;
  color: #868d9f;
}
.zn-confirm-shift-row-color-trigger {
  width: 32px;
  height: 32px;
  padding: 4px;
  border-radius: 8px;
}
.zn-confirm-shift-color-dot {
  display: inline-block;
  width: 24px;
  height: 24px;
  border: 1px solid rgba(35, 37, 43, .08);
  border-radius: 8px;
  vertical-align: middle;
}
.zn-confirm-shift-name-input .el-input__inner,
.zn-confirm-shift-type-select .el-input__inner,
.zn-confirm-shift-night-select .el-input__inner {
  height: 32px;
  padding-right: 32px;
  border: 1px solid var(--zn-confirm-control-border, #d9d9d9);
  border-radius: 8px;
  line-height: 32px;
  transition: border-color 0.16s ease, box-shadow 0.16s ease;
}
.zn-confirm-shift-type-select { width: 100%; }
.zn-confirm-shift-night-select { width: 100%; }
.zn-confirm-shift-type-select .el-input__suffix,
.zn-confirm-shift-night-select .el-input__suffix {
  display: flex;
  align-items: center;
  right: 8px;
  height: 100%;
}
.zn-confirm-shift-type-select .el-input__suffix-inner,
.zn-confirm-shift-night-select .el-input__suffix-inner {
  display: inline-flex;
  align-items: center;
  height: 100%;
}
.zn-confirm-shift-type-select .el-select__caret,
.zn-confirm-shift-night-select .el-select__caret {
  display: inline-block;
  width: 14px;
  height: 14px;
  color: #868d9f;
  font-size: 14px;
  line-height: 14px;
}
.zn-confirm-shift-name-input:hover .el-input__inner,
.zn-confirm-shift-type-select:hover .el-input__inner,
.zn-confirm-shift-night-select:hover .el-input__inner {
  border-color: var(--zn-confirm-control-border-hover, rgba(60, 110, 240, 0.35));
}
.zn-confirm-shift-name-input.is-focus .el-input__inner,
.zn-confirm-shift-name-input .el-input__inner:focus,
.zn-confirm-shift-type-select .el-input.is-focus .el-input__inner,
.zn-confirm-shift-night-select .el-input.is-focus .el-input__inner,
.zn-confirm-shift-type-select .el-input__inner:focus,
.zn-confirm-shift-night-select .el-input__inner:focus {
  border-color: var(--zn-confirm-control-border-active, #3c6ef0) !important;
  box-shadow: var(--zn-confirm-control-focus-ring, 0 0 0 3px rgba(60, 110, 240, 0.15));
}
.zn-confirm-shift-type-select:hover .el-select__caret,
.zn-confirm-shift-night-select:hover .el-select__caret { color: #525765; }
.zn-confirm-shift-segments {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}
.zn-confirm-shift-segments__item {
  display: flex;
  align-items: center;
  gap: 16px;
  min-width: 0;
  padding: 8px 12px;
  border: 1px solid #eaeaea;
  border-radius: 8px;
  background: #fff;
  overflow-x: auto;
}
.zn-confirm-shift-segments__label {
  flex: 0 0 48px;
  color: #23252b;
  font-size: 14px;
  font-weight: 500;
  line-height: 22px;
}
.zn-confirm-shift-action-switch {
  display: inline-flex;
  align-items: center;
  height: 20px;
  vertical-align: middle;
}
.zn-confirm-shift-action-switch .el-switch__core {
  width: 40px !important;
  height: 20px;
  border: 0;
  border-radius: 10px;
}
.zn-confirm-shift-action-switch .el-switch__core::after {
  top: 2px;
  left: 2px;
  width: 16px;
  height: 16px;
}
.zn-confirm-shift-action-switch.is-checked .el-switch__core::after {
  margin-left: -18px;
}
.zn-confirm-shift-delete {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin: 0;
  padding: 0;
  border: 0;
  outline: none;
  background: transparent;
  color: #3c6ef0;
  font-size: 14px;
  line-height: 22px;
  cursor: pointer;
}
.zn-confirm-shift-delete__icon {
  display: block;
  width: 16px;
  height: 16px;
  flex: 0 0 16px;
  background-color: #3c6ef0;
  -webkit-mask-repeat: no-repeat;
  -webkit-mask-position: center;
  -webkit-mask-size: contain;
  mask-repeat: no-repeat;
  mask-position: center;
  mask-size: contain;
}
.zn-confirm-shift-delete:hover,
.zn-confirm-shift-delete:focus { color: #2f5ad8; }
.zn-confirm-shift-delete:hover .zn-confirm-shift-delete__icon,
.zn-confirm-shift-delete:focus .zn-confirm-shift-delete__icon { background-color: #2f5ad8; }
.zn-confirm-shift-dialog__footer .el-button {
  min-width: 88px;
  min-height: 32px;
  border-radius: 8px;
}

.zn-confirm-shift-create {
  flex: 0 0 auto;
  margin-bottom: 16px;
  padding: 16px;
  border: 1px solid #e4e5e9;
  border-radius: 8px;
  background: #fafafb;
}
.zn-confirm-shift-create__head,
.zn-confirm-shift-create__actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.zn-confirm-shift-create__head { margin-bottom: 16px; }
.zn-confirm-shift-create__head .zn-confirm-shift-section-title { margin-bottom: 0; }
.zn-confirm-shift-create .zn-form-drawer__section-title,
.zn-confirm-shift-section-title {
  font-size: 16px;
  line-height: 24px;
}
.zn-confirm-shift-section-title--current {
  flex: 0 0 auto;
  margin-bottom: 12px;
}
.zn-confirm-shift-dialog__body > .zn-confirm-shift-section-title--current {
  font-size: 16px;
  line-height: 24px;
}
.zn-confirm-shift-create__close {
  display: inline-flex;
  width: 24px;
  height: 24px;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 0;
  background: transparent;
  color: #868d9f;
  cursor: pointer;
}
.zn-confirm-shift-create__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  column-gap: 24px;
}
.zn-confirm-shift-create__grid .el-form-item { margin-bottom: 16px; }
.zn-confirm-shift-create__form .zn-form-drawer__grid { row-gap: 16px; }
.zn-confirm-shift-create__grid .el-select,
.zn-confirm-shift-create__grid .el-input { width: 100%; }
.zn-confirm-shift-create__grid .el-input__inner,
.zn-confirm-shift-create__section .el-input__inner {
  height: 32px;
  border-radius: 8px;
  font-size: 14px;
  line-height: 32px;
}
.zn-confirm-shift-create__name { display: flex; gap: 8px; }
.zn-confirm-shift-create__name .el-select { flex: 1 1 auto; }
.zn-confirm-shift-create__name > .el-input { width: 64px; flex: 0 0 64px; }
.zn-confirm-shift-create__section {
  padding-top: 12px;
  border-top: 1px solid #eaeaea;
}
.zn-confirm-shift-create__section-title {
  margin-bottom: 12px;
  padding-left: 8px;
  border-left: 3px solid #3c6ef0;
  color: #23252b;
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
}
.zn-confirm-shift-create__summary {
  display: grid;
  grid-template-columns: 88px minmax(0, 1fr) 112px minmax(0, 1fr);
  gap: 8px;
  align-items: center;
  margin-bottom: 12px;
  color: #525765;
  font-size: 14px;
}
.zn-confirm-shift-create__summary strong {
  min-height: 32px;
  padding: 5px 10px;
  border-radius: 8px;
  background: #f5f5f6;
  box-sizing: border-box;
  font-weight: 400;
  line-height: 22px;
}
.zn-confirm-shift-create__segments {
  overflow: hidden;
  border: 1px solid #e4e5e9;
  border-radius: 8px;
  background: #fff;
}
.zn-confirm-shift-create__segment {
  display: flex;
  align-items: center;
  gap: 16px;
  min-width: 0;
  min-height: 56px;
  padding: 8px 16px;
  border: 0;
  border-bottom: 1px solid #e4e5e9;
  background: #fff;
  box-sizing: border-box;
}
.zn-confirm-shift-create__segment:last-child { border-bottom: 0; }
.zn-confirm-shift-create__segment-title {
  flex: 0 0 64px;
  color: #23252b;
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
}
.zn-confirm-shift-create__segment .zn-confirm-shift-detail { flex: 1 1 auto; }
.zn-confirm-shift-create__segment .zn-shift-slot__badge { flex: 0 0 auto; }
.zn-confirm-shift-create__actions {
  justify-content: flex-end;
  gap: 8px;
  margin-top: 16px;
}
.zn-confirm-shift-create__actions .el-button { margin-left: 0; }
</style>
