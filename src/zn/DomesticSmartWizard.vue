<template>
  <div class="domestic-smart-wizard">
    <section class="wizard-card">
      <section class="overview-query-card domestic-smart-header-card">
        <div class="arrow-steps domestic-smart-arrow-steps" role="list" aria-label="国内智能排班流程">
          <div
            v-for="(step, index) in workflowSteps"
            :key="step.title"
            class="arrow-step"
            :class="{
              'is-active': index === activeStep,
              'is-complete': index < activeStep,
              'is-pending': index > activeStep,
              'is-start': index === 0,
              'is-end': index === workflowSteps.length - 1,
            }"
            role="listitem"
            :aria-current="index === activeStep ? 'step' : null"
          >
            <span class="arrow-step__skin" aria-hidden="true">
              <i class="arrow-step__cap arrow-step__cap--l"></i>
              <i class="arrow-step__body"></i>
              <i class="arrow-step__cap arrow-step__cap--r"></i>
            </span>
            <span class="arrow-step__num" aria-hidden="true">{{ index + 1 }}</span>
            <span class="arrow-step__label">
              <img class="arrow-step__icon" :src="stepStateIcon(index)" alt="" />
              <strong>{{ step.title }}</strong>
            </span>
          </div>
        </div>

      </section>

      <section v-if="activeStep === 0" class="wizard-panel domestic-smart-step-one">
        <div class="schedule-overview">
          <div class="schedule-workspace">
            <section class="overview-content-card domestic-smart-content-card">
              <div class="overview-tabs-row">
                <div class="overview-tabs">
                  <button
                    type="button"
                    class="overview-tab"
                    :class="{ 'is-active': planTab === 'monthly' }"
                    @click="planTab = 'monthly'"
                  >月度固定</button>
                  <button
                    type="button"
                    class="overview-tab"
                    :class="{ 'is-active': planTab === 'cycle' }"
                    @click="planTab = 'cycle'"
                  >周期轮换</button>
                </div>
                <div v-if="planTab === 'monthly'" class="overview-toolbar-right domestic-smart-legend">
                  <span class="domestic-smart-legend__title">用工类型说明</span>
                  <span
                    v-for="item in empTypeLegend"
                    :key="item.label"
                    class="domestic-smart-legend__item"
                  >
                    <i class="domestic-smart-legend__dot" :style="{ background: item.color }"></i>{{ item.label }}
                  </span>
                  <el-button class="domestic-smart-shift-edit-btn" @click="confirmShiftVisible = true">修改班次</el-button>
                </div>
                <div v-else class="overview-toolbar-right">
                  <el-button class="domestic-smart-shift-edit-btn" @click="confirmShiftVisible = true">修改班次</el-button>
                  <el-button icon="el-icon-user" @click="openCycleAddPerson">添加人员</el-button>
                </div>
              </div>

              <!-- 月度固定：展示已排人的班次，以及从“修改班次”同步的新班次 -->
              <div
                v-if="planTab === 'monthly'"
                class="overview-matrix density-compact domestic-smart-matrix"
              >
                <table>
                  <thead>
                    <tr>
                      <th class="domestic-smart-type-col">用工类型</th>
                      <th class="domestic-smart-shift-col">班次</th>
                      <th class="domestic-smart-emp-col">员工</th>
                      <th
                        v-for="date in stepOneDates"
                        :key="date.key"
                        class="overview-date-col"
                      >
                        <div class="overview-date-head-stack">
                          <strong>{{ date.label }}</strong>
                          <span>{{ date.weekShort }}</span>
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-if="!visibleHeadcountRows.length">
                      <td :colspan="3 + stepOneDates.length" class="domestic-smart-empty-cell">
                        暂无已排人员班次，请点击「添加人员」配置
                      </td>
                    </tr>
                    <tr
                      v-for="(item, index) in visibleHeadcountRows"
                      :key="item.sourceIndex"
                    >
                      <td
                        v-if="empTypeRowSpan(index)"
                        class="domestic-smart-type-col"
                        :rowspan="empTypeRowSpan(index)"
                      >{{ item.row.empType }}</td>
                      <td class="domestic-smart-shift-col">
                        <span
                          class="legend-chip domestic-smart-shift-chip"
                          :class="{ 'is-rest': item.row.isRest }"
                          :style="legendChipStyle(item.row)" :title="`${item.row.name} ${formatShiftChipTime(item.row.time)}`"
                        >
                          <b>{{ item.row.name }}</b>
                          <small>{{ formatShiftChipTime(item.row.time) }}</small>
                        </span>
                      </td>
                      <td class="domestic-smart-emp-col">
                        <div class="domestic-smart-emp-list">
                          <template v-if="employeesForRow(item.row).length">
                            <span
                              v-for="emp in visibleEmployees(item.row)"
                              :key="emp.name"
                              class="domestic-smart-emp-tag"
                              :style="empTagStyle(emp.empType || item.row.empType)"
                            >
                              {{ emp.name }}<i class="el-icon-close" @click.stop="removeEmployee(item.row, emp.name)"></i>
                            </span>
                            <el-tooltip
                              v-if="hiddenEmployeeCount(item.row) > 0"
                              :content="allEmployeeNames(item.row)"
                              placement="top"
                              popper-class="lui-pc-tooltip"
                            >
                              <span
                                class="domestic-smart-emp-more"
                                :style="empTagStyle(item.row.empType)"
                              >+{{ hiddenEmployeeCount(item.row) }}</span>
                            </el-tooltip>
                          </template>
                          <el-button
                            type="primary"
                            icon="el-icon-plus"
                            class="domestic-smart-emp-add"
                            @click="openAddPerson(item.sourceIndex)"
                          >添加</el-button>
                        </div>
                      </td>
                      <td
                        v-for="(count, dayIdx) in item.row.counts"
                        :key="`${item.sourceIndex}-${dayIdx}`"
                        class="domestic-smart-count-cell"
                      >
                        <el-input
                          v-model.number="item.row.counts[dayIdx]"
                          class="domestic-smart-count-input"
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <!-- 周期轮换：时段定宽可横滑；操作列 sticky 右侧固定 -->
              <div
                v-else
                class="overview-matrix density-compact domestic-smart-cycle-matrix"
              >
                <div class="domestic-smart-cycle-scroll">
                  <table :style="cycleTableStyle">
                    <thead>
                      <tr>
                        <th class="domestic-smart-cycle-person-col">人员</th>
                        <th
                          v-for="segIdx in cycleSegmentCount"
                          :key="`h-${segIdx}`"
                          class="domestic-smart-cycle-seg-col"
                        >第{{ segIdx }}段</th>
                        <th class="domestic-smart-cycle-action-col">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-if="!cycleRows.length">
                        <td :colspan="cycleSegmentCount + 2" class="domestic-smart-empty-cell">
                          暂无周期轮换人员，请点击右上角「添加人员」
                        </td>
                      </tr>
                      <tr v-for="(row, rowIdx) in cycleRows" :key="row.id">
                        <td class="domestic-smart-cycle-person-cell">
                          <div class="domestic-smart-cycle-person">
                            <strong>{{ row.name }}</strong>
                            <small>({{ row.code }})</small>
                          </div>
                        </td>
                        <td
                          v-for="segIdx in cycleSegmentCount"
                          :key="`${row.id}-${segIdx}`"
                          class="domestic-smart-cycle-seg-cell"
                        >
                          <div
                            v-if="row.segments[segIdx - 1]"
                            class="domestic-smart-cycle-seg"
                          >
                            <el-date-picker
                              v-model="row.segments[segIdx - 1].range"
                              type="daterange"
                              range-separator="-"
                              start-placeholder="开始"
                              end-placeholder="结束"
                              value-format="yyyy-MM-dd"
                              format="yyyy-MM-dd"
                              class="domestic-smart-cycle-range"
                              popper-class="domestic-smart-range-popper"
                              :picker-options="cycleRangePickerOptions(row, segIdx - 1)"
                              :clearable="false"
                              @change="validateCycleRange(row, segIdx - 1)"
                            />
                            <div
                              class="domestic-smart-cycle-seg__row"
                              :class="{ 'has-empty-shift': !row.segments[segIdx - 1].shift }"
                            >
                              <div
                                class="domestic-smart-cycle-shift-card"
                                :class="{ 'is-empty': !row.segments[segIdx - 1].shift }"
                                :style="cycleShiftStyle(row.segments[segIdx - 1].shift)" :title="row.segments[segIdx - 1].shift ? `${findShift(row.segments[segIdx - 1].shift).name} ${formatShiftRange(findShift(row.segments[segIdx - 1].shift).time)}` : ''"
                              >
                                <div v-if="row.segments[segIdx - 1].shift" class="domestic-smart-cycle-shift-card__label" aria-hidden="true">
                                  <strong>{{ findShift(row.segments[segIdx - 1].shift).name }}</strong>
                                  <span>{{ formatShiftRange(findShift(row.segments[segIdx - 1].shift).time) }}</span>
                                </div>
                                <span v-else class="domestic-smart-cycle-shift-card__placeholder" aria-hidden="true">＋选择</span>
                                <el-select
                                  v-model="row.segments[segIdx - 1].shift"
                                  class="domestic-smart-cycle-shift"
                                  placeholder="请选择"
                                  popper-class="overseas-select-popper domestic-smart-cycle-popper"
                                >
                                  <el-option
                                    v-for="opt in cycleShiftOptions"
                                    :key="opt.value"
                                    :label="opt.label"
                                    :value="opt.value"
                                  >
                                    <span class="domestic-smart-cycle-option-check" aria-hidden="true">
                                      <i class="el-icon-check"></i>
                                    </span>
                                    <div class="zn-rotation-option-card" :style="cycleShiftStyle(opt.value)" :title="`${findShift(opt.value).name} ${formatShiftRange(findShift(opt.value).time)}`">
                                      <strong>{{ findShift(opt.value).name }}</strong>
                                      <span>{{ formatShiftRange(findShift(opt.value).time) }}</span>
                                    </div>
                                  </el-option>
                                </el-select>
                              </div>
                              <el-tooltip content="删除本时段" placement="top" popper-class="lui-pc-tooltip">
                                <button
                                  type="button"
                                  class="domestic-smart-cycle-icon is-seg-remove"
                                  @click="removeCycleSegment(row, segIdx - 1)"
                                >
                                  <span
                                    class="domestic-smart-cycle-icon__glyph"
                                    :style="luiIconMask('lui-icon-delete.svg')"
                                    aria-hidden="true"
                                  />
                                </button>
                              </el-tooltip>
                            </div>
                          </div>
                          <button
                            v-else
                            type="button"
                            class="domestic-smart-cycle-seg-placeholder"
                            @click="addCycleSegment(row)"
                          >+ 添加时段</button>
                        </td>
                        <td class="domestic-smart-cycle-action-cell">
                          <div class="domestic-smart-cycle-ops">
                            <button
                              type="button"
                              class="domestic-smart-cycle-ops__link"
                              @click="addCycleSegment(row)"
                            >添加时段</button>
                            <button
                              type="button"
                              class="domestic-smart-cycle-ops__link"
                              @click="copyCycleRow(rowIdx)"
                            >复制</button>
                            <button
                              type="button"
                              class="domestic-smart-cycle-ops__link"
                              @click="removeCycleRow(rowIdx)"
                            >删除</button>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <footer class="flow-actions wizard-flow-actions">
                <el-tooltip content="编辑表格数据将实时影响指标统计 >" placement="top" popper-class="lui-pc-tooltip">
                  <el-button @click="metricMonitorVisible = true">
                    指标监控<i class="el-icon-question domestic-smart-metric__q" aria-hidden="true"></i>
                  </el-button>
                </el-tooltip>
                <el-button @click="$emit('cancel')">取消</el-button>
                <el-button type="primary" @click="activeStep = 1">下一步</el-button>
              </footer>
            </section>
          </div>
        </div>
      </section>

      <section v-else class="wizard-panel domestic-smart-step-two">
        <div class="schedule-overview">
          <div class="schedule-workspace">
            <section class="overview-content-card domestic-smart-content-card">
              <div class="overview-legend-block" :class="{ 'is-expanded': legendExpanded }">
                <div class="overview-legend-row">
                  <div class="legend domestic-smart-legend">
                    <strong>班次</strong>
                    <div
                      class="domestic-smart-legend__chips"
                      :class="{ 'is-collapsed': !legendExpanded }"
                    >
                      <span
                        v-for="shift in legendShifts"
                        :key="shift.id"
                        class="legend-chip"
                        :class="{ 'is-rest': shift.isRest }"
                        :style="legendChipStyle(shift)" :title="`${shift.name} ${formatShiftChipTime(shift.time)}`"
                      >
                        <b>{{ shift.name }}</b>
                        <small>{{ formatShiftChipTime(shift.time) }}</small>
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    class="overview-legend-expand"
                    :class="{ 'is-expanded': legendExpanded }"
                    @click="legendExpanded = !legendExpanded"
                  >
                    {{ legendExpanded ? '收起' : '展开' }}
                    <shell-icon :name="legendExpanded ? 'chevronUp' : 'chevronDown'" size="sm" />
                  </button>
                </div>
              </div>

              <div class="overview-matrix density-compact domestic-smart-board">
                <div class="domestic-smart-board-scroll">
                  <table>
                  <thead>
                    <tr>
                      <th class="overview-person-col">
                        <div class="overview-person-header">
                          <el-input
                            v-model="keyword"
                            clearable
                            prefix-icon="el-icon-search"
                            placeholder="搜索人员"
                            class="overview-search"
                          />
                        </div>
                      </th>
                      <th class="overview-rest-col" aria-label="排休">排休</th>
                      <th
                        v-for="date in dates"
                        :key="date.key"
                        class="overview-date-col"
                        :class="{
                          'is-today': date.isToday,
                          'is-weekend': date.isWeekend,
                          'is-past': date.isPast,
                        }"
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
                    <tr v-for="row in filteredRows" :key="row.id">
                      <td class="overview-person-cell">
                        <div>
                          <strong>{{ row.name }}</strong>
                          <small>{{ row.code }}</small>
                        </div>
                      </td>
                      <td class="overview-rest-cell">{{ restCount(row) }}</td>
                      <td
                        v-for="date in dates"
                        :key="date.key"
                        class="overview-shift-cell"
                        :class="{
                          'is-past': date.isPast,
                          'is-weekend': date.isWeekend,
                          'is-picker-anchor': isPickerAnchor(row, date.key),
                        }"
                      >
                        <el-tooltip
                          v-if="shiftOf(row, date.key) !== '休'"
                          :content="`${findShift(shiftOf(row, date.key)).name} ${formatShiftRange(findShift(shiftOf(row, date.key)).time)}`"
                          :disabled="!legendChipNeedsTooltip(findShift(shiftOf(row, date.key)))"
                          effect="dark"
                          placement="top"
                          popper-class="lui-pc-tooltip zn-shift-card-tooltip"
                          :open-delay="150"
                        >
                          <button
                            type="button"
                            class="overview-shift-chip is-compact"
                            :class="{ 'is-wide': compactPrefix(shiftOf(row, date.key)).length > 1 }"
                            :style="chipStyle(shiftOf(row, date.key), isPickerAnchor(row, date.key))"
                            :title="legendChipNeedsTooltip(findShift(shiftOf(row, date.key))) ? null : `${findShift(shiftOf(row, date.key)).name} ${formatShiftRange(findShift(shiftOf(row, date.key)).time)}`"
                            @dblclick.stop.prevent="openBoardShiftPicker(row, date.key, $event)"
                          >
                            <b>{{ compactPrefix(shiftOf(row, date.key)) }}</b>
                            <small>{{ compactIndex(shiftOf(row, date.key)) }}</small>
                          </button>
                        </el-tooltip>
                        <span
                          v-else
                          class="rest-cell"
                          :style="restCellStyle(isPickerAnchor(row, date.key))"
                          title="休息 00:00-23:59"
                          @dblclick.stop.prevent="openBoardShiftPicker(row, date.key, $event)"
                        >休</span>
                      </td>
                    </tr>
                  </tbody>
                  </table>
                </div>
              </div>

              <footer class="flow-actions wizard-flow-actions">
                <el-button @click="$emit('cancel')">取消</el-button>
                <el-button @click="activeStep -= 1">上一步</el-button>
                <el-button type="primary" icon="el-icon-s-promotion" @click="publish">发布排班表</el-button>
              </footer>
            </section>
          </div>
        </div>
      </section>
    </section>

    <ConfirmShiftDialog
      :visible.sync="confirmShiftVisible"
      :shift-rows="confirmShiftRows"
      :existing-shifts="shifts"
      :department-label="departmentLabel"
      :attendance-group-label="attendanceGroupLabel"
      @confirm="onConfirmShifts"
    />
    <MetricMonitorDialog :visible.sync="metricMonitorVisible" />
    <AddPersonDialog
      :visible.sync="addPersonVisible"
      :people="assignablePeople"
      :disabled-keys="existingPersonKeys"
      @confirm="onAddPerson"
    />
    <el-dialog
      :custom-class="shiftPickerDialogClass"
      :visible.sync="shiftPickerVisible"
      :modal="false"
      :close-on-click-modal="false"
      :destroy-on-close="false"
      append-to-body
      width="500px"
      top="0"
      @opened="onShiftPickerOpened"
      @closed="resetShiftPicker"
    >
      <div slot="title" class="shift-picker-tabs" role="tablist">
        <button type="button" role="tab" class="shift-picker-tab is-active">按班次排</button>
      </div>
      <div class="shift-picker-body">
        <el-input
          v-model="shiftPickerKeyword"
          clearable
          prefix-icon="el-icon-search"
          placeholder="模糊搜索班次"
        />
        <div class="shift-picker-grid">
          <label
            v-for="shift in filteredPickerShifts"
            :key="shift.id"
            class="shift-picker-option"
            :class="{ 'is-selected': selectedPickerShiftIds.includes(shift.id) }"
          >
            <el-checkbox
              :value="selectedPickerShiftIds.includes(shift.id)"
              @change="togglePickerShift(shift.id, $event)"
            />
            <el-tooltip
              :content="`${shift.name} ${formatShiftRange(shift.time)}`"
              :disabled="!legendChipNeedsTooltip(shift)"
              effect="dark"
              placement="top"
              popper-class="lui-pc-tooltip zn-shift-card-tooltip"
              :open-delay="150"
            >
              <span
                class="shift-picker-chip"
                :class="{ 'is-rest': shift.isRest, 'is-empty': shift.isEmpty }"
                :style="pickerChipStyle(shift)"
              >
                <b>{{ shift.name }}</b>
                <small>{{ formatShiftRange(shift.time) }}</small>
              </span>
            </el-tooltip>
          </label>
        </div>
      </div>
      <span slot="footer" class="shift-picker-footer">
        <el-button @click="shiftPickerVisible = false">取消</el-button>
        <el-button @click="clearPickerShifts">清空</el-button>
        <el-button type="primary" @click="saveShiftPicker">保存</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import { assetUrl } from '../utils/assetUrl'
import {
  decorateShift,
  resolveShiftChipStyle,
  resolveShiftSelectedBorder,
  compactShiftParts,
  sortShiftsByFamily,
} from '../utils/shiftPalette'
import { loadScopedShifts, mergeScopedShifts, upsertScopedShift } from '../utils/scopedShiftStore'
import ShellIcon from '../components/shell/ShellIcon.vue'
import ConfirmShiftDialog from './ConfirmShiftDialog.vue'
import MetricMonitorDialog from './MetricMonitorDialog.vue'
import AddPersonDialog from './AddPersonDialog.vue'
import shiftPickerRules from '../mixins/shiftPickerRules'
import {
  ZN_SHIFTS,
  buildMonthDates,
  DOMESTIC_SMART_HEADCOUNT_ROWS,
  DOMESTIC_CYCLE_ROWS,
  DOMESTIC_CYCLE_SHIFT_OPTIONS,
  DOMESTIC_ASSIGNABLE_PEOPLE,
  DOMESTIC_SMART_BOARD_CONFIGS,
  createBoardRows,
  createCycleSegments,
  createEmptyCycleSegment,
  formatShiftRange,
  formatShiftChipTime,
} from './mock'

const BOARD_DATES = buildMonthDates('2026-08-21', 31).map((date) => ({
  ...date,
  isToday: date.key === '09-04',
  isPast: date.fullKey < '2026-09-04',
}))

const SMART_BOARD_SHIFTS = sortShiftsByFamily([
  ...ZN_SHIFTS.filter((shift) => !shift.isRest),
  decorateShift({ id: 'JM5', name: '(跳)早班5次', short: '早5', time: '06:00-10:00' }),
  decorateShift({ id: 'JM7', name: '(跳)早班7次', short: '早7', time: '08:00-12:00' }),
  decorateShift({ id: 'JZ4', name: '(跳)中班4次', short: '中4', time: '11:00-15:00' }),
  decorateShift({ id: 'JW2', name: '(跳)晚班2次', short: '晚2', time: '20:00-05:00' }),
  ...ZN_SHIFTS.filter((shift) => shift.isRest),
])

export default {
  name: 'DomesticSmartWizard',
  components: {
    ShellIcon,
    ConfirmShiftDialog,
    MetricMonitorDialog,
    AddPersonDialog,
  },
  mixins: [shiftPickerRules],
  props: {
    initialContext: { type: Object, default: () => ({}) },
  },
  data() {
    const scopedShifts = loadScopedShifts(this.initialContext)
    return {
      activeStep: 0,
      planTab: 'monthly',
      scheduleMonth: this.initialContext.scheduleMonth || '2026-09',
      keyword: '',
      confirmShiftVisible: false,
      metricMonitorVisible: false,
      addPersonVisible: false,
      addPersonRowIndex: -1,
      addPersonMode: 'monthly',
      legendExpanded: false,
      /** 复制周期排班配置时暂存，选人后套用 */
      cycleCopySegments: null,
      peoplePool: DOMESTIC_ASSIGNABLE_PEOPLE.map((item) => ({ ...item })),
      shifts: sortShiftsByFamily(mergeScopedShifts(SMART_BOARD_SHIFTS, this.initialContext)),
      dates: BOARD_DATES,
      headcountRows: DOMESTIC_SMART_HEADCOUNT_ROWS.map((row) => ({
        ...row,
        employees: row.employees.map((emp) => ({ ...emp })),
        counts: [...row.counts],
      })),
      cycleRows: DOMESTIC_CYCLE_ROWS.map((row) => ({
        ...row,
        segments: row.segments.map((seg) => ({
          shift: seg.shift,
          range: [...seg.range],
        })),
      })),
      cycleShiftOptions: [
        ...DOMESTIC_CYCLE_SHIFT_OPTIONS,
        ...scopedShifts
          .filter((shift) => (
            !SMART_BOARD_SHIFTS.some((item) => item.id === shift.id || item.name === shift.name)
            && !DOMESTIC_CYCLE_SHIFT_OPTIONS.some((option) => option.value === shift.id)
          ))
          .map((shift) => ({ value: shift.id, label: `${shift.name} ${shift.time}` })),
      ],
      boardRows: createBoardRows(DOMESTIC_SMART_BOARD_CONFIGS, BOARD_DATES),
      workflowSteps: [
        {
          title: '确认出勤人数及班次',
          activeIcon: assetUrl('figma-stepper/icon-form.svg'),
          pendingIcon: assetUrl('figma-stepper/icon-document.svg'),
        },
        {
          title: '发布班表',
          activeIcon: assetUrl('figma-stepper/icon-form.svg'),
          pendingIcon: assetUrl('figma-stepper/icon-document.svg'),
        },
      ],
      empTypeLegend: [
        { label: '正式工', color: '#3C6EF0', background: '#EDF2FF', border: '#C8D7FB' },
        { label: '非全合同工', color: '#12B35D', background: '#E8F8EF', border: '#B8E9C9' },
        { label: '其他用工', color: '#9B6BFF', background: '#F3EDFF', border: '#D9C6FF' },
        { label: 'O-临时工', color: '#FF7700', background: '#FFF7E8', border: '#FFD9B3' },
        { label: 'Q-日结临时工', color: '#FC3737', background: '#FFF0F0', border: '#FFC4C4' },
      ],
      empVisibleLimit: 1,
      shiftPickerVisible: false,
      shiftPickerKeyword: '',
      selectedPickerShiftIds: [],
      shiftPickerTarget: null,
      shiftPickerAnchorEl: null,
      shiftPickerReady: false,
      shiftPickerScrollLockY: 0,
      scrollLockDepth: 0,
    }
  },
  computed: {
    stepOneDates() {
      return this.dates.slice(0, 16)
    },
    legendShifts() {
      return sortShiftsByFamily(this.shifts)
    },
    /** 已配置班次，或用户刚确认新增的班次 */
    visibleHeadcountRows() {
      return this.headcountRows
        .map((row, sourceIndex) => ({ row, sourceIndex }))
        .filter(({ row }) => this.isHeadcountConfigured(row))
    },
    confirmShiftRows() {
      return this.visibleHeadcountRows.map(({ row }) => {
        const range = this.splitShiftTime(row.time)
        const shiftType = row.shiftType || (/跳/.test(row.name || '') ? 'jump' : 'fixed')
        return {
          id: row.id || row.name,
          name: row.name,
          family: row.family,
          level: row.level,
          color: row.background || row.light || '',
          shiftType,
          crossNight: typeof row.crossNight === 'boolean'
            ? row.crossNight
            : this.isCrossNight(range.start, range.end),
          startBound: String(row.startBound || '0.5'),
          startTime: this.normalizeClock(range.start),
          endTime: this.normalizeClock(range.end),
          endBound: String(row.endBound || '0.5'),
          source: row.source || '月度固定',
          creator: row.creator || 'system',
          action: row.action || 'use',
          activeSegment: 0,
          segments: (row.segments || []).map((segment) => ({ ...segment })),
        }
      })
    },
    cycleSegmentCount() {
      const max = this.cycleRows.reduce(
        (n, row) => Math.max(n, (row.segments || []).length),
        0,
      )
      return Math.max(max, 1)
    },
    /** 默认 1～4 段均分剩余宽度；超过 4 段后定宽横向滚动 */
    cycleTableStyle() {
      const personW = 148
      const actionW = 192
      const segW = 280
      const segs = Math.max(this.cycleSegmentCount, 1)
      const contentMin = personW + actionW + segs * segW
      return {
        width: '100%',
        minWidth: `${contentMin}px`,
        '--domestic-cycle-seg-width': segs <= 4
          ? `calc((100% - ${personW + actionW}px) / ${segs})`
          : `${segW}px`,
      }
    },
    assignablePeople() {
      const withPalette = (people) => people.map((person) => ({
        ...person,
        palette: this.empTagStyle(person.empType),
      }))
      if (this.addPersonMode !== 'monthly') return withPalette(this.peoplePool)
      const row = this.headcountRows[this.addPersonRowIndex]
      if (!row) return withPalette(this.peoplePool)
      return withPalette(this.peoplePool.filter((person) => !person.empType || person.empType === row.empType))
    },
    existingPersonKeys() {
      if (this.addPersonMode === 'cycle') {
        return this.cycleRows.reduce((keys, row) => keys.concat(row.code, row.name), []).filter(Boolean)
      }
      const row = this.headcountRows[this.addPersonRowIndex]
      return row
        ? (row.employees || []).reduce((keys, person) => keys.concat(person.code, person.name), []).filter(Boolean)
        : []
    },
    empTypeStyleMap() {
      return this.empTypeLegend.reduce((map, item) => {
        map[item.label] = item
        return map
      }, {})
    },
    departmentLabel() {
      const map = {
        'tz-yz': '分拣运营部-西安接货仓',
        'hb-zn-01': '华北职能后线 · 一组',
      }
      return map[this.initialContext.department] || '分拣运营部-西安接货仓'
    },
    attendanceGroupLabel() {
      return this.initialContext.attendanceGroup === 'zn-001'
        ? '落地配细分班组'
        : '接-小场地作业班组-01-2115693-J-XCDZYQ-J-XCDZYBZ-01'
    },
    attendanceGroupTruncated() {
      return String(this.attendanceGroupLabel || '').length > 20
    },
    attendanceGroupDisplay() {
      const text = String(this.attendanceGroupLabel || '')
      if (text.length <= 20) return text
      return `${text.slice(0, 20)}...`
    },
    filteredRows() {
      const keyword = this.keyword.trim().toLowerCase()
      return this.boardRows.filter((row) => !keyword || `${row.name} ${row.code}`.toLowerCase().includes(keyword))
    },
    filteredPickerShifts() {
      const keyword = this.shiftPickerKeyword.trim().toLowerCase()
      return sortShiftsByFamily(this.shifts.filter((shift) => (
        !keyword || `${shift.name} ${shift.time}`.toLowerCase().includes(keyword)
      )))
    },
    shiftPickerDialogClass() {
      return [
        'shift-picker-dialog',
        'zn-shift-picker-dialog',
        'is-day',
        this.shiftPickerReady ? 'is-ready' : '',
      ].filter(Boolean).join(' ')
    },
  },
  beforeDestroy() {
    document.removeEventListener('mousedown', this.onShiftPickerOutside, true)
    while (this.scrollLockDepth > 0) this.unlockBackgroundScroll()
  },
  methods: {
    assetUrl,
    luiIconMask(file) {
      const url = `url("${assetUrl(file)}")`
      return {
        WebkitMaskImage: url,
        maskImage: url,
      }
    },
    formatShiftRange,
    formatShiftChipTime,
    notify(msg) {
      this.$message.success(msg)
    },
    isHeadcountConfigured(row) {
      if (!row) return false
      return this.employeesForRow(row).length > 0
    },
    personKey(person) {
      return String(person.code || person.name || '').trim()
    },
    samePerson(a, b) {
      if (!a || !b) return false
      const ka = this.personKey(a)
      const kb = this.personKey(b)
      if (ka && kb && ka === kb) return true
      return Boolean(a.name && b.name && a.name === b.name)
    },
    findMonthlyOwner(person) {
      for (let i = 0; i < this.headcountRows.length; i += 1) {
        const row = this.headcountRows[i]
        const hit = (row.employees || []).find((emp) => this.samePerson(emp, person))
        if (hit) return { row, emp: hit, rowIndex: i }
      }
      return null
    },
    findCycleOwner(person) {
      return this.cycleRows.find((row) => this.samePerson(row, person)) || null
    },
    removePersonFromMonthly(person) {
      this.headcountRows.forEach((row) => {
        row.employees = (row.employees || []).filter((emp) => !this.samePerson(emp, person))
      })
    },
    removePersonFromCycle(person) {
      this.cycleRows = this.cycleRows.filter((row) => !this.samePerson(row, person))
    },
    formatSwitchPeople(people) {
      return (people || [])
        .map((person) => person && person.name)
        .filter(Boolean)
        .join('，')
    },
    confirmSwitchMode(people, fromLabel, toLabel) {
      return this.$confirm(
        `${this.formatSwitchPeople(people)} 当前为「${fromLabel}」排班，点击确认切换为「${toLabel}」将从原排班方式中移除；`,
        '切换排班方式',
        {
          type: 'warning',
          confirmButtonText: '确认切换',
          cancelButtonText: '取消',
          customClass: 'domestic-switch-confirm-box',
          closeOnClickModal: false,
        },
      )
    },
    empTypeRowSpan(index) {
      const rows = this.visibleHeadcountRows
      const current = rows[index]
      if (!current) return 0
      if (index > 0 && rows[index - 1].row.empType === current.row.empType) return 0
      let span = 1
      for (let i = index + 1; i < rows.length; i += 1) {
        if (rows[i].row.empType !== current.row.empType) break
        span += 1
      }
      return span
    },
    empTagStyle(empType) {
      const token = this.empTypeStyleMap[empType] || this.empTypeLegend[0]
      return {
        color: token.color,
        background: token.background,
        borderColor: token.border,
      }
    },
    employeesForRow(row) {
      return (row.employees || []).filter((employee) => (
        !employee.empType || employee.empType === row.empType
      ))
    },
    visibleEmployees(row) {
      return this.employeesForRow(row).slice(0, this.empVisibleLimit)
    },
    hiddenEmployeeCount(row) {
      return Math.max(0, this.employeesForRow(row).length - this.empVisibleLimit)
    },
    allEmployeeNames(row) {
      return this.employeesForRow(row).map((emp) => emp.name).filter(Boolean).join('、')
    },
    removeEmployee(row, name) {
      row.employees = row.employees.filter((emp) => emp.name !== name)
    },
    openAddPerson(index) {
      this.addPersonMode = 'monthly'
      this.addPersonRowIndex = index
      this.cycleCopySegments = null
      this.addPersonVisible = true
    },
    openCycleAddPerson() {
      this.addPersonMode = 'cycle'
      this.addPersonRowIndex = -1
      this.cycleCopySegments = null
      this.addPersonVisible = true
    },
    async onAddPerson(selected) {
      if (!selected.length) {
        this.$message.warning('请先选择人员')
        return
      }
      if (this.addPersonMode === 'cycle') {
        await this.addPeopleToCycle(selected)
        return
      }
      await this.addPeopleToMonthly(selected)
    },
    async addPeopleToMonthly(selected) {
      const row = this.headcountRows[this.addPersonRowIndex]
      if (!row) return
      const existing = new Set((row.employees || []).map((emp) => emp.name))
      const candidates = selected.filter((item) => item && item.name && !existing.has(item.name))
      const switching = candidates.filter((item) => this.findCycleOwner(item))
      let allowed = candidates

      if (switching.length) {
        try {
          await this.confirmSwitchMode(switching, '周期轮换', '月度固定')
          switching.forEach((item) => this.removePersonFromCycle(item))
        } catch (e) {
          allowed = candidates.filter((item) => !this.findCycleOwner(item))
        }
      }

      const accepted = []
      allowed.forEach((item) => {
        this.removePersonFromMonthly(item)
        accepted.push({
          name: item.name,
          code: item.code || item.name,
          empType: item.empType || row.empType || '正式工',
        })
        existing.add(item.name)
      })

      if (accepted.length) {
        row.employees = [...(row.employees || []), ...accepted]
        this.planTab = 'monthly'
        this.$message.success(`已添加 ${accepted.length} 人至月度固定`)
      } else if (selected.length) {
        this.$message.info('未添加人员（已取消切换或人员已存在）')
      }
    },
    async addPeopleToCycle(selected) {
      const template = this.cloneCycleSegments(
        this.cycleCopySegments && this.cycleCopySegments.length
          ? this.cycleCopySegments
          : createCycleSegments('Z5'),
      )
      const candidates = selected.filter((item) => (
        item && item.name && !this.cycleRows.some((row) => this.samePerson(row, item))
      ))
      const switching = candidates.filter((item) => this.findMonthlyOwner(item))
      let allowed = candidates

      if (switching.length) {
        try {
          await this.confirmSwitchMode(switching, '月度固定', '周期轮换')
          switching.forEach((item) => this.removePersonFromMonthly(item))
        } catch (e) {
          allowed = candidates.filter((item) => !this.findMonthlyOwner(item))
        }
      }

      const nextRows = []
      allowed.forEach((item) => {
        nextRows.push({
          id: `c-${item.code || item.name}-${Date.now()}-${nextRows.length}`,
          name: item.name,
          code: item.code || item.name,
          empType: item.empType || '正式工',
          segments: this.cloneCycleSegments(template),
        })
      })

      this.cycleCopySegments = null
      if (nextRows.length) {
        this.cycleRows = [...this.cycleRows, ...nextRows]
        this.planTab = 'cycle'
        this.$nextTick(() => {
          this.scrollCycleToEnd()
        })
        this.$message.success(`已添加 ${nextRows.length} 人至周期轮换`)
      } else if (selected.length) {
        this.$message.info('未添加人员（已取消切换或人员已存在）')
      }
    },
    cloneCycleSegments(segments) {
      return (segments || []).map((seg) => ({
        shift: typeof seg.shift === 'string' ? seg.shift : '',
        range: Array.isArray(seg.range) ? [...seg.range] : ['2026-08-21', '2026-08-27'],
      }))
    },
    scrollCycleToEnd() {
      const scroller = this.$el && this.$el.querySelector('.domestic-smart-cycle-scroll')
      if (scroller) scroller.scrollLeft = scroller.scrollWidth
    },
    copyCycleRow(index) {
      const source = this.cycleRows[index]
      if (!source) return
      this.cycleCopySegments = this.cloneCycleSegments(source.segments)
      this.addPersonMode = 'cycle'
      this.addPersonRowIndex = -1
      this.addPersonVisible = true
      this.$message.info('请选择要套用该排班配置的人员')
    },
    removeCycleRow(index) {
      const row = this.cycleRows[index]
      if (!row) return
      this.$confirm(`确认删除人员「${row.name}」的周期轮换排班吗？`, '删除人员', {
        type: 'warning',
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        customClass: 'domestic-switch-confirm-box',
      })
        .then(() => {
          this.cycleRows.splice(index, 1)
          this.$message.success('已删除')
        })
        .catch(() => {})
    },
    addDaysYmd(ymd, days) {
      const parts = String(ymd || '').split('-').map(Number)
      if (parts.length < 3 || parts.some((n) => !n)) return ymd
      const dt = new Date(parts[0], parts[1] - 1, parts[2])
      dt.setDate(dt.getDate() + days)
      const y = dt.getFullYear()
      const m = String(dt.getMonth() + 1).padStart(2, '0')
      const d = String(dt.getDate()).padStart(2, '0')
      return `${y}-${m}-${d}`
    },
    ymdTimestamp(ymd) {
      const parts = String(ymd || '').split('-').map(Number)
      if (parts.length < 3 || parts.some((n) => !n)) return NaN
      return new Date(parts[0], parts[1] - 1, parts[2]).getTime()
    },
    cycleRangesOverlap(left, right) {
      if (!Array.isArray(left) || !Array.isArray(right) || left.length < 2 || right.length < 2) return false
      const leftStart = this.ymdTimestamp(left[0])
      const leftEnd = this.ymdTimestamp(left[1])
      const rightStart = this.ymdTimestamp(right[0])
      const rightEnd = this.ymdTimestamp(right[1])
      if ([leftStart, leftEnd, rightStart, rightEnd].some(Number.isNaN)) return false
      return leftStart <= rightEnd && rightStart <= leftEnd
    },
    cycleRangePickerOptions(row, currentIndex) {
      const occupiedRanges = (row && row.segments ? row.segments : [])
        .filter((segment, index) => index !== currentIndex && Array.isArray(segment.range))
        .map((segment) => segment.range)
      return {
        disabledDate: (date) => {
          const current = date && new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
          return occupiedRanges.some((range) => {
            const start = this.ymdTimestamp(range[0])
            const end = this.ymdTimestamp(range[1])
            return !Number.isNaN(start) && !Number.isNaN(end) && current >= start && current <= end
          })
        },
      }
    },
    validateCycleRange(row, currentIndex) {
      if (!row || !row.segments || !row.segments[currentIndex]) return
      const current = row.segments[currentIndex]
      const overlaps = row.segments.some((segment, index) => (
        index !== currentIndex && this.cycleRangesOverlap(current.range, segment.range)
      ))
      if (!overlaps) return
      this.$set(current, 'range', [])
      this.$message.warning('班次时间不能与其他时段重叠，请重新选择')
    },
    nextCycleRange(row) {
      const ranges = (row && row.segments ? row.segments : [])
        .map((segment) => segment.range)
        .filter((range) => Array.isArray(range) && range[1])
      const latestEnd = ranges.reduce((latest, range) => (
        !latest || this.ymdTimestamp(range[1]) > this.ymdTimestamp(latest) ? range[1] : latest
      ), '')
      const start = this.addDaysYmd(latestEnd || '2026-08-20', 1)
      return [start, this.addDaysYmd(start, 6)]
    },
    addCycleSegment(row) {
      if (!row) return
      if (!Array.isArray(row.segments)) {
        this.$set(row, 'segments', [])
      }
      const next = createEmptyCycleSegment()
      next.range = this.nextCycleRange(row)
      row.segments.push(next)
      this.$nextTick(() => {
        this.scrollCycleToEnd()
      })
    },
    removeCycleSegment(row, segIdx) {
      if (!row || !row.segments || segIdx < 0 || segIdx >= row.segments.length) return
      row.segments.splice(segIdx, 1)
    },
    splitShiftTime(value) {
      const parts = String(value || '').split(/\s*[-~～—–/]\s*/).filter(Boolean)
      return { start: parts[0] || '09:00', end: parts[1] || '18:00' }
    },
    normalizeClock(value) {
      const clock = String(value || '').trim()
      if (/^\d{1,2}:\d{2}:\d{2}$/.test(clock)) return clock
      if (/^\d{1,2}:\d{2}$/.test(clock)) return `${clock}:00`
      return '09:00:00'
    },
    isCrossNight(start, end) {
      const minutes = (clock) => {
        const [hour, minute] = String(clock || '').split(':').map(Number)
        return (Number(hour) || 0) * 60 + (Number(minute) || 0)
      }
      return minutes(end) <= minutes(start)
    },
    confirmedShiftTime(row) {
      if (row.shiftType === 'jump' && row.segments && row.segments.length) {
        return row.segments
          .map((segment) => `${this.normalizeClock(segment.startTime).slice(0, 5)}-${this.normalizeClock(segment.endTime).slice(0, 5)}`)
          .join(' / ')
      }
      return `${this.normalizeClock(row.startTime).slice(0, 5)}-${this.normalizeClock(row.endTime).slice(0, 5)}`
    },
    onConfirmShifts(rows) {
      const confirmed = Array.isArray(rows) ? rows : []
      confirmed.forEach((item) => {
        const time = this.confirmedShiftTime(item)
        const decorated = decorateShift({
          id: item.id,
          name: item.name,
          label: item.name,
          shiftLabel: item.name,
          short: item.name,
          family: item.family,
          level: item.level,
          time,
          shiftType: item.shiftType,
          crossNight: item.crossNight,
          startBound: item.startBound,
          endBound: item.endBound,
          source: item.source,
          creator: item.creator,
          action: item.action,
          segments: (item.segments || []).map((segment) => ({ ...segment })),
        })
        const shiftIndex = this.shifts.findIndex((shift) => shift.id === item.id)
        if (shiftIndex >= 0) this.$set(this.shifts, shiftIndex, decorated)
        else this.shifts.push(decorated)

        const option = { value: decorated.id, label: `${decorated.name} ${decorated.time}` }
        const optionIndex = this.cycleShiftOptions.findIndex((candidate) => candidate.value === decorated.id)
        if (optionIndex >= 0) this.$set(this.cycleShiftOptions, optionIndex, option)
        else this.cycleShiftOptions.push(option)
        if (String(item.id).startsWith('TEMP-') || item.source === '临时') {
          upsertScopedShift(this.initialContext, decorated)
        }

        const headcountIndex = this.headcountRows.findIndex((row) => (
          row.id === item.id || row.name === item.name
        ))
        const shared = {
          ...decorated,
          empType: '正式工',
        }
        if (headcountIndex >= 0) {
          Object.assign(this.headcountRows[headcountIndex], shared)
        } else {
          this.headcountRows.push({
            ...shared,
            employees: [],
            counts: this.stepOneDates.map(() => 0),
          })
        }
      })
      this.shifts = sortShiftsByFamily(this.shifts)
      this.headcountRows = sortShiftsByFamily(this.headcountRows)
      this.planTab = 'monthly'
      this.notify('班次已确认并同步至月度固定')
    },
    stepStateIcon(index) {
      const step = this.workflowSteps[index]
      if (index < this.activeStep) return assetUrl('figma-stepper/check.svg')
      if (index === this.activeStep) return step.activeIcon
      return step.pendingIcon
    },
    legendChipStyle(shift) {
      return resolveShiftChipStyle(shift)
    },
    findShift(shiftId) {
      const rest = this.shifts.find((item) => item.isRest) || this.shifts[0]
      if (shiftId === '休' || shiftId === 'REST') return rest
      const shift = this.shifts.find((item) => item.id === shiftId)
      if (shift) return shift
      const option = this.cycleShiftOptions.find((item) => item.value === shiftId)
      if (!option) return rest
      const timeMatches = String(option.label).match(/\d{1,2}:\d{2}\s*[~～—–-]\s*\d{1,2}:\d{2}/g) || []
      const name = String(option.label).split(/\s+\d{1,2}:\d{2}/)[0]
      return decorateShift({ id: option.value, name, time: timeMatches.join(' / ') })
    },
    shiftOf(row, dateKey) {
      return row.shifts[dateKey] || '休'
    },
    restCount(row) {
      return this.dates.reduce((sum, date) => sum + (this.shiftOf(row, date.key) === '休' ? 1 : 0), 0)
    },
    compactPrefix(shiftId) {
      return compactShiftParts(this.findShift(shiftId)).prefix
    },
    compactIndex(shiftId) {
      return compactShiftParts(this.findShift(shiftId)).index
    },
    chipStyle(shiftId, selected = false) {
      const shift = this.findShift(shiftId)
      if (!shift || shift.isRest) return resolveShiftChipStyle({ isRest: true }, selected)
      return resolveShiftChipStyle(shift, selected)
    },
    restCellStyle(selected = false) {
      return resolveShiftChipStyle({ isRest: true }, selected)
    },
    legendChipNeedsTooltip(shift) {
      return Boolean(
        (shift && shift.shiftType === 'jump')
        || String((shift && shift.name) || '').includes('(跳)')
        || formatShiftRange(shift && shift.time).includes('/'),
      )
    },
    resolveZnShiftRecord(shiftId) {
      return this.findShift(shiftId)
    },
    pickerChipStyle(shift) {
      if (shift && shift.isEmpty) {
        return {
          background: 'transparent',
          color: '#868D9F',
          borderColor: 'transparent',
          '--shift-selected-border': 'transparent',
        }
      }
      const style = resolveShiftChipStyle(shift)
      return { ...style, '--shift-selected-border': resolveShiftSelectedBorder(shift) }
    },
    openBoardShiftPicker(row, dateKey, event) {
      const current = this.shiftOf(row, dateKey)
      const mapped = current === '休' ? 'REST' : current
      const currentShift = this.resolveZnShiftRecord(mapped)
      const anchor = event && event.currentTarget ? event.currentTarget : null
      const date = this.dates.find((item) => item.key === dateKey)
      this.shiftPickerReady = false
      this.shiftPickerTarget = {
        row,
        dateKey,
        fullDate: (date && date.fullKey) || `${this.scheduleMonth}-${dateKey.slice(3)}`,
      }
      this.shiftPickerAnchorEl = anchor
      this.shiftPickerKeyword = ''
      this.selectedPickerShiftIds = currentShift && Array.isArray(currentShift.constituentIds)
        ? [...currentShift.constituentIds]
        : (mapped ? [mapped] : [])
      this.applyShiftPickerCoords(anchor)
      this.lockBackgroundScroll()
      this.shiftPickerVisible = true
      document.addEventListener('mousedown', this.onShiftPickerOutside, true)
      this.$nextTick(() => {
        this.applyShiftPickerCoords(this.shiftPickerAnchorEl)
        requestAnimationFrame(() => {
          this.applyShiftPickerCoords(this.shiftPickerAnchorEl)
          this.shiftPickerReady = true
        })
      })
    },
    isPickerAnchor(row, dateKey) {
      return Boolean(
        this.shiftPickerVisible
        && this.shiftPickerTarget
        && this.shiftPickerTarget.row
        && this.shiftPickerTarget.row.id === row.id
        && this.shiftPickerTarget.dateKey === dateKey,
      )
    },
    calcShiftPickerCoords(anchorEl, dialogWidth = 500, dialogHeight = 520) {
      const viewportPadding = 16
      const anchorGap = 12
      const maxLeft = Math.max(viewportPadding, window.innerWidth - dialogWidth - viewportPadding)
      const maxTop = Math.max(viewportPadding, window.innerHeight - dialogHeight - viewportPadding)
      if (!anchorEl || typeof anchorEl.getBoundingClientRect !== 'function') {
        return {
          left: Math.round(Math.min(maxLeft, Math.max(viewportPadding, (window.innerWidth - dialogWidth) / 2))),
          top: Math.round(Math.min(maxTop, Math.max(viewportPadding, 120))),
        }
      }
      const rect = anchorEl.getBoundingClientRect()
      let left
      if (rect.right + anchorGap + dialogWidth <= window.innerWidth - viewportPadding) left = rect.right + anchorGap
      else if (rect.left - anchorGap - dialogWidth >= viewportPadding) left = rect.left - anchorGap - dialogWidth
      else left = rect.left + ((rect.width - dialogWidth) / 2)
      return {
        left: Math.round(Math.min(maxLeft, Math.max(viewportPadding, left))),
        top: Math.round(Math.min(maxTop, Math.max(viewportPadding, rect.top))),
      }
    },
    applyShiftPickerCoords(anchorEl, measuredDialog) {
      const dialog = measuredDialog || document.querySelector('.zn-shift-picker-dialog')
      const dialogWidth = (dialog && dialog.offsetWidth) || Math.min(500, window.innerWidth - 32)
      const dialogHeight = (dialog && dialog.offsetHeight) || 520
      const coords = this.calcShiftPickerCoords(anchorEl, dialogWidth, dialogHeight)
      document.documentElement.style.setProperty('--shift-picker-left', `${coords.left}px`)
      document.documentElement.style.setProperty('--shift-picker-top', `${coords.top}px`)
      if (dialog) {
        const wrapper = dialog.parentElement
        if (wrapper) {
          wrapper.classList.add('shift-picker-wrapper')
          wrapper.style.pointerEvents = 'none'
        }
        dialog.style.pointerEvents = 'auto'
        dialog.style.margin = '0'
        dialog.style.transform = 'none'
        dialog.style.left = `${coords.left}px`
        dialog.style.top = `${coords.top}px`
      }
      return coords
    },
    lockBackgroundScroll() {
      if (this.scrollLockDepth === 0) {
        this.shiftPickerScrollLockY = window.scrollY || window.pageYOffset || 0
        document.documentElement.classList.add('shift-picker-scroll-lock')
        document.body.classList.add('shift-picker-scroll-lock')
        document.body.style.top = `-${this.shiftPickerScrollLockY}px`
        document.querySelectorAll('.schedule-scroll, .overview-matrix').forEach((el) => {
          el.dataset.lockScrollTop = String(el.scrollTop)
          el.classList.add('is-scroll-locked')
        })
        window.addEventListener('wheel', this.blockBackgroundWheel, { passive: false, capture: true })
        window.addEventListener('touchmove', this.blockBackgroundWheel, { passive: false, capture: true })
      }
      this.scrollLockDepth += 1
    },
    unlockBackgroundScroll() {
      if (this.scrollLockDepth <= 0) return
      this.scrollLockDepth -= 1
      if (this.scrollLockDepth > 0) return
      window.removeEventListener('wheel', this.blockBackgroundWheel, { capture: true })
      window.removeEventListener('touchmove', this.blockBackgroundWheel, { capture: true })
      document.documentElement.classList.remove('shift-picker-scroll-lock')
      document.body.classList.remove('shift-picker-scroll-lock')
      document.body.style.top = ''
      window.scrollTo(0, this.shiftPickerScrollLockY || 0)
      document.querySelectorAll('.schedule-scroll.is-scroll-locked, .overview-matrix.is-scroll-locked').forEach((el) => {
        const top = Number(el.dataset.lockScrollTop || 0)
        el.classList.remove('is-scroll-locked')
        el.scrollTop = top
        delete el.dataset.lockScrollTop
      })
    },
    blockBackgroundWheel(event) {
      if (this.scrollLockDepth <= 0) return
      if (event.target && event.target.closest && event.target.closest('.shift-picker-dialog')) return
      event.preventDefault()
    },
    onShiftPickerOpened() {
      this.applyShiftPickerCoords(this.shiftPickerAnchorEl)
      this.$nextTick(() => {
        this.applyShiftPickerCoords(this.shiftPickerAnchorEl)
        this.shiftPickerReady = true
      })
    },
    onShiftPickerOutside(event) {
      if (!this.shiftPickerVisible) return
      const target = event.target
      const dialog = document.querySelector('.zn-shift-picker-dialog')
      if (target && target.closest && target.closest('.shift-picker-control-popper')) return
      if (target && target.closest && target.closest('.shift-picker-dialog')) return
      if (dialog && dialog.contains(target)) return
      if (this.shiftPickerAnchorEl && this.shiftPickerAnchorEl.contains(target)) return
      this.shiftPickerVisible = false
    },
    applyPickerShiftToTarget(shiftId) {
      if (!this.shiftPickerTarget || !this.shiftPickerTarget.row) return
      this.$set(this.shiftPickerTarget.row.shifts, this.shiftPickerTarget.dateKey, shiftId)
    },
    shiftLabel(shiftId) {
      if (shiftId === '休') return '休息'
      const shift = this.resolveZnShiftRecord(shiftId)
      return shift ? shift.name : shiftId
    },
    saveShiftPicker() {
      if (!this.shiftPickerTarget) {
        this.shiftPickerVisible = false
        return
      }
      const stored = this.resolvePickerShiftValue()
      if (!stored) {
        this.showShiftPickerMessage('warning', '请至少选择1个班次')
        return
      }
      const { row } = this.shiftPickerTarget
      this.applyPickerShiftToTarget(stored)
      this.shiftPickerVisible = false
      this.showShiftPickerMessage('success', `已将 ${row.name} 的班次更新为 ${this.shiftLabel(stored)}`)
    },
    resetShiftPicker() {
      document.removeEventListener('mousedown', this.onShiftPickerOutside, true)
      while (this.scrollLockDepth > 0) this.unlockBackgroundScroll()
      this.shiftPickerReady = false
      this.shiftPickerTarget = null
      this.shiftPickerAnchorEl = null
      this.shiftPickerKeyword = ''
      this.selectedPickerShiftIds = []
      document.documentElement.style.removeProperty('--shift-picker-left')
      document.documentElement.style.removeProperty('--shift-picker-top')
      const wrapper = document.querySelector('.shift-picker-wrapper')
      if (wrapper) {
        wrapper.classList.remove('shift-picker-wrapper')
        wrapper.style.pointerEvents = ''
      }
    },
    cycleShiftStyle(shiftId) {
      if (!shiftId) {
        return {
          '--cycle-shift-bg': 'transparent',
          '--cycle-shift-color': '#3C6EF0',
          '--cycle-shift-border': 'transparent',
          background: 'transparent',
          color: '#3C6EF0',
        }
      }
      const style = resolveShiftChipStyle(this.findShift(shiftId))
      const selectedBorder = resolveShiftSelectedBorder(this.findShift(shiftId))
      return {
        '--cycle-shift-bg': style.background,
        '--cycle-shift-color': style.color,
        '--cycle-shift-border': style.borderColor,
        '--cycle-shift-selected-border': selectedBorder,
        background: style.background,
        color: style.color,
      }
    },
    publish() {
      this.$confirm('确定发布排班表吗？', '发布排班表', {
        type: 'warning',
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        customClass: 'publish-confirm-box',
      })
        .then(() => {
          this.$message.success('排班表已发布')
          this.$emit('published')
        })
        .catch(() => {})
    },
  },
}
</script>
