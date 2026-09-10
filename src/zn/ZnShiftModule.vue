<template>
  <div class="zn-shift-module">
    <div class="schedule-overview">
      <div class="schedule-workspace">
      <section class="overview-query-card">
        <div class="overview-query-grid zn-query-grid is-single-row">
          <div class="query-item">
            <label><span class="required">*</span> 排班部门</label>
            <el-select
              v-model="department"
              filterable
              placeholder="请选择排班部门"
              popper-class="overseas-select-popper"
              @change="onDepartmentChange"
            >
              <el-option label="通州片区 · 北京亦庄智配中心站" value="tz-yz" />
              <el-option label="华北职能后线 · 一组" value="hb-zn-01" />
            </el-select>
          </div>
          <div class="query-item">
            <label><span class="required">*</span> 考勤组</label>
            <el-select v-model="attendanceGroup" filterable placeholder="请选择考勤组" popper-class="overseas-select-popper">
              <el-option label="默认组" value="default" />
              <el-option label="华北职能后线一组（ZN）" value="zn-001" />
            </el-select>
          </div>
          <div class="query-item">
            <label>排班月份</label>
            <el-date-picker
              v-model="scheduleMonth"
              type="month"
              class="overseas-query-date"
              popper-class="overseas-date-popper"
              placeholder="选择月份"
              format="yyyy年MM月"
              value-format="yyyy-MM"
              style="width: 100%"
            />
          </div>
          <div class="overview-query-actions">
            <el-button @click="resetQuery">重置</el-button>
            <el-button type="primary" @click="queryScheduleContext">查询</el-button>
          </div>
        </div>
      </section>

      <section class="overview-content-card">
        <div class="overview-tabs-row">
          <div class="overview-tabs">
            <button
              type="button"
              class="overview-tab"
              :class="{ 'is-active': contentTab === 'table' }"
              @click="contentTab = 'table'"
            >
              排班表
            </button>
            <button
              type="button"
              class="overview-tab"
              :class="{ 'is-active': contentTab === 'statistics' }"
              @click="contentTab = 'statistics'"
            >
              排班统计
            </button>
          </div>
          <div class="overview-toolbar-right zn-toolbar-smart">
            <div
              class="btn-smart-schedule-wrap"
              @mouseenter="onSmartEnter"
              @mouseleave="onSmartLeave"
            >
              <el-tooltip
                :value="smartTipVisible"
                :manual="true"
                effect="dark"
                placement="top"
                popper-class="lui-pc-tooltip"
                content="智能排班功能已上线，一键排班更便捷哦～"
              >
                <el-button type="primary" class="btn-smart-schedule" @click="onSmartScheduleClick">
                  <img
                    class="btn-smart-schedule__icon"
                    src="/assets/smart-schedule/ai-icon-data2.png"
                    alt=""
                    width="16"
                    height="16"
                  />
                  <span class="btn-smart-schedule__label">智能排班</span>
                </el-button>
              </el-tooltip>
            </div>
            <label class="zn-auto-switch">
              <span>自动</span>
              <el-switch v-model="autoEnabled" active-color="#8958F7" @change="onAutoChange" />
            </label>
            <el-tooltip content="新手引导" placement="top" popper-class="lui-pc-tooltip">
              <button
                type="button"
                class="overview-icon-btn"
                aria-label="新手引导"
                @click="openOperationHelp('guide')"
              >
                <img
                  class="overview-toolbar-icon"
                  :src="assetUrl('lui-icon-help.svg')"
                  alt=""
                  width="16"
                  height="16"
                >
              </button>
            </el-tooltip>
            <el-tooltip content="导出" placement="top" popper-class="lui-pc-tooltip">
              <button
                type="button"
                class="overview-icon-btn"
                aria-label="导出"
                @click="notify('排班表已导出')"
              >
                <img
                  class="overview-toolbar-icon"
                  :src="assetUrl('lui-icon-export.svg')"
                  alt=""
                  width="16"
                  height="16"
                >
              </button>
            </el-tooltip>
          </div>
        </div>

        <div v-if="contentTab === 'table'" class="overview-toolbar">
          <div class="overview-toolbar-left">
            <el-button @click="openTemporaryShiftPicker($event)">修改临时排班</el-button>
            <el-button @click="addEmployeeVisible = true">添加人员</el-button>
            <el-button @click="openShiftEditor">添加班次</el-button>
            <el-button @click="openRotationEditor">添加轮班</el-button>
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
          <div class="overview-toolbar-right">
            <el-popover
              v-model="filterPopoverVisible"
              placement="bottom-end"
              trigger="click"
              popper-class="zn-schedule-filter-popper"
              :visible-arrow="false"
              @show="onFilterPopoverShow"
            >
              <div class="zn-schedule-filter">
                <div class="zn-schedule-filter__group">
                  <el-checkbox v-model="filterDraft.onlyUnscheduled">仅看未排班</el-checkbox>
                </div>
                <div class="zn-schedule-filter__group">
                  <div class="zn-schedule-filter__title">人员状态</div>
                  <el-checkbox-group v-model="filterDraft.staffStatus">
                    <el-checkbox label="normal">未异动</el-checkbox>
                    <el-checkbox label="changed">已异动（含离职）</el-checkbox>
                  </el-checkbox-group>
                </div>
                <div class="zn-schedule-filter__group">
                  <div class="zn-schedule-filter__title">用工性质</div>
                  <el-checkbox-group v-model="filterDraft.empType">
                    <el-checkbox label="A">A-全日制劳动合同工</el-checkbox>
                    <el-checkbox label="I">I-非全日制劳动合同工</el-checkbox>
                  </el-checkbox-group>
                </div>
                <div class="zn-schedule-filter__group">
                  <div class="zn-schedule-filter__title">岗位</div>
                  <el-checkbox-group v-model="filterDraft.position">
                    <el-checkbox label="sorter">分拣员岗</el-checkbox>
                  </el-checkbox-group>
                </div>
                <div class="zn-schedule-filter__footer">
                  <el-button type="text" @click="cancelFilterDraft">取消</el-button>
                  <el-button type="primary" @click="applyFilterDraft">确定筛选</el-button>
                </div>
              </div>
              <button
                slot="reference"
                type="button"
                class="overview-icon-btn zn-schedule-filter-icon"
                :class="{ 'is-active': hasActiveScheduleFilter || filterPopoverVisible }"
                aria-label="筛选"
                title="筛选"
              >
                <img
                  class="overview-toolbar-icon"
                  :src="assetUrl('lui-icon-screen.svg')"
                  alt=""
                  width="16"
                  height="16"
                >
              </button>
            </el-popover>
            <el-radio-group v-model="viewDensity" class="overview-density-switch">
              <el-radio-button label="compact">精简</el-radio-button>
              <el-radio-button label="normal">常规</el-radio-button>
            </el-radio-group>
            <el-button type="primary" class="overview-save-btn" :data-dirty="hasUnsavedBoardChanges" @click="saveBoardChanges">保存</el-button>
          </div>
        </div>

        <template v-if="contentTab === 'table'">
        <div v-if="legendExpanded" class="overview-legend-block is-expanded">
          <div class="overview-legend-row">
            <div class="legend">
              <strong>班次</strong>
              <span
                v-for="shift in legendShifts"
                :key="shift.id"
                class="legend-chip legend-chip--shift"
                :class="{ 'is-rest': shift.isRest }"
                :style="legendChipStyle(shift)"
                :title="`${shift.name} ${formatShiftRange(shift.time)}（双击编辑班次）`"
                @dblclick.stop="editLegendShift(shift)"
              >
                <b>{{ shift.name }}</b>
                <small>{{ formatShiftRange(shift.time) }}</small>
              </span>
            </div>
          </div>
          <div
            v-if="rotations.length"
            class="overview-legend-row overview-legend-row--rotation"
          >
            <div class="legend">
              <strong>轮班</strong>
              <span
                v-for="shift in rotations"
                :key="shift.id"
                class="legend-chip legend-chip--rotation"
                :class="{ 'is-rest': shift.isRest }"
                :style="rotationLegendStyle(shift)"
                :title="`${shift.name} ${formatShiftRange(shift.time)}（双击编辑轮班）`"
                @dblclick.stop="editLegendRotation(shift)"
              >
                <b>{{ shift.name.length > 5 ? `${shift.name.slice(0, 5)}...` : shift.name }}</b>
                <small>{{ formatShiftRange(shift.time) }}</small>
              </span>
            </div>
          </div>
        </div>

        <div
          ref="scheduleMatrix"
          class="overview-matrix"
          :class="`density-${viewDensity}`"
          :style="scheduleMatrixStyle"
        >
          <table>
            <thead>
              <tr>
                <th class="overview-person-col">
                  <div class="overview-person-header">
                    <el-input
                      class="overview-search"
                      v-model="keyword"
                      clearable
                      prefix-icon="el-icon-search"
                      placeholder="搜索人员"
                    />
                  </div>
                </th>
                <th class="overview-rest-col" aria-label="排休时间"><el-tooltip content="排休时间" placement="top" popper-class="lui-pc-tooltip"><i class="el-icon-time"></i></el-tooltip></th>
                <th
                  v-for="date in dates"
                  :key="date.fullKey || date.key"
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
              <tr v-if="filteredRows.length === 0" class="zn-schedule-empty-row"><td :colspan="dates.length + 2" class="zn-schedule-empty-cell">
                <div class="zn-schedule-empty-state" role="status"><div class="zn-schedule-empty-state__illustration" aria-hidden="true">
                  <img class="zn-schedule-empty-state__shadow" :src="assetUrl('empty-state/empty-shadow.svg')" alt="" width="50" height="16" />
                  <img class="zn-schedule-empty-state__doc" :src="assetUrl('empty-state/empty-doc.svg')" alt="" width="36" height="30" />
                </div><p>还没有相关内容</p></div>
              </td></tr>
              <tr v-for="row in filteredRows" :key="row.id">
                <td class="overview-person-cell">
                  <div>
                    <div class="overview-person-name"><strong>{{ row.name }}</strong><button v-if="personException(row)" type="button" class="overview-person-exception" :aria-label="`查看${row.name}异常`" @click.stop="openPersonException(row)"><i class="el-icon-warning" aria-hidden="true"></i></button></div>
                    <small>{{ row.code }}</small>
                  </div>
                </td>
                <td class="overview-rest-cell">{{ restCount(row) }}</td>
                <td
                  v-for="date in dates"
                  :key="`${row.id}-${date.fullKey || date.key}`"
                  class="overview-shift-cell"
                  :class="{
                    'is-weekend': date.isWeekend,
                    'is-past': date.isPast,
                    'is-picker-anchor': isPickerAnchor(row, date.key),
                  }"
                >
                  <button
                    v-if="shiftOf(row, date.key) !== '休' || viewDensity === 'normal'"
                    type="button"
                    class="overview-shift-chip"
                    :class="{
                      'is-compact': viewDensity === 'compact',
                      'is-regular': viewDensity === 'normal',
                      'is-wide': viewDensity === 'compact' && compactPrefix(shiftOf(row, date.key)).length > 1,
                    }"
                    :style="chipStyle(shiftOf(row, date.key), isPickerAnchor(row, date.key))" :title="`${displayFullName(shiftOf(row, date.key))} ${displayTime(shiftOf(row, date.key))}`"
                    @dblclick.stop.prevent="openBoardShiftPicker(row, date.key, $event)"
                  >
                    <template v-if="viewDensity === 'compact'">
                      <b>{{ compactPrefix(shiftOf(row, date.key)) }}</b>
                      <small>{{ compactIndex(shiftOf(row, date.key)) }}</small>
                    </template>
                    <template v-else>
                      <b>{{ displayFullName(shiftOf(row, date.key)) }}</b>
                      <small>{{ displayTime(shiftOf(row, date.key)) }}</small>
                    </template>
                  </button>
                  <span
                    v-else
                    class="rest-cell"
                    :style="restCellStyle(isPickerAnchor(row, date.key))"
                    @dblclick.stop.prevent="openBoardShiftPicker(row, date.key, $event)"
                  >休</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="overview-footer">
          <span>共{{ filteredRows.length }}条记录</span>
        </div>
        </template>

        <ScheduleStatisticsPanel
          v-else
          :dates="statisticsDates"
          :rows="statisticsRows"
        />
      </section>
      </div>
    </div>

    <OperationHelpDialog
      :visible.sync="operationHelpVisible"
      :initial-tab="operationHelpTab"
    />

    <AddShiftDrawer :visible.sync="shiftEditorVisible" :department-label="departmentLabel" :attendance-group-label="attendanceGroupLabel" :shifts="shifts" :edit-shift="activeLegendShift" @confirm="onAddShiftConfirm" @save-edit="saveLegendShift" @delete="deleteLegendShift" />
    <AddEmployeeDrawer
      :visible.sync="addEmployeeVisible"
      :department-label="departmentLabel"
      :shift-options="legendShifts"
      :rotation-options="rotations" :existing-employees="boardRows"
      @confirm="onAddEmployeeConfirm"
    />
    <AddRotationDrawer :visible.sync="rotationEditorVisible" :department-label="departmentLabel" :attendance-group-label="attendanceGroupLabel" :shift-options="legendShifts" :edit-rotation="activeLegendRotation" @confirm="onAddRotationConfirm" @save-edit="saveLegendRotation" @delete="deleteLegendRotation" />
    <PersonExceptionDialog :visible.sync="exceptionDialogVisible" :employee="exceptionEmployee" />

    <!-- 新人加入提示（LUI PC3.0 无标题弹窗） -->
    <el-dialog
      :visible.sync="newcomerTipVisible"
      width="440px"
      append-to-body
      :close-on-click-modal="false"
      :show-close="true"
      custom-class="zn-newcomer-tip-dialog"
      @opened="onNewcomerTipOpened"
      @closed="onCenteredDialogClosed"
    >
      <div class="zn-newcomer-tip">
        <div class="zn-newcomer-tip__main">
          <img
            class="zn-newcomer-tip__icon"
            src="/assets/lui/icon-hint-solid.svg"
            alt=""
            width="16"
            height="16"
          />
          <p class="zn-newcomer-tip__title">有新人加入考勤组，请及时配置其排班哦～</p>
        </div>
        <p class="zn-newcomer-tip__desc">系统已为新人生成排班表，可根据实际情况手动进行调整。</p>
      </div>
      <span slot="footer" class="zn-newcomer-tip__footer">
        <el-button class="zn-newcomer-tip__btn-secondary" @click="newcomerTipVisible = false">稍后处理</el-button>
        <el-button type="primary" @click="openNewcomerConfig">去查看</el-button>
      </span>
    </el-dialog>

    <!-- 智能排班配置弹窗（全员 / 仅新人） -->
    <el-dialog
      :visible.sync="configDialogVisible"
      width="1100px"
      append-to-body
      :close-on-click-modal="false"
      custom-class="zn-cycle-dialog"
      @opened="onCycleDialogOpened"
      @closed="onCycleDialogClosed"
    >
      <span slot="title" class="zn-cycle-dialog__title">
        智能排班
        <el-tooltip
          effect="dark"
          placement="bottom"
          popper-class="lui-pc-tooltip"
          content="系统根据历史排班记录生成一个月排班，可逐人修改循环周期、复制配置或双击班次调整。"
        >
          <span class="zn-cycle-dialog__help-btn" tabindex="0" role="button" aria-label="帮助说明">
            <i class="el-icon-help zn-cycle-dialog__help-icon" aria-hidden="true"></i>
          </span>
        </el-tooltip>
      </span>

      <div class="zn-cycle-dialog__head" :class="{ 'has-rule-toast': !!publishRuleToast }">
        <div class="zn-cycle-dialog__head-row">
          <div class="zn-cycle-dialog__head-left">
            <span class="head-label">排班时间</span>
            <el-date-picker
              v-model="configStartDate"
              type="date"
              class="overseas-query-date zn-cycle-month-picker"
              popper-class="overseas-date-popper"
              placeholder="选择开始日期"
              format="yyyy年MM月dd日"
              value-format="yyyy-MM-dd"
              @change="clearPublishViolations"
            />
          </div>
        </div>
        <div class="zn-cycle-dialog__head-meta">
          <div class="zn-cycle-dialog__head-meta-left">
            <div class="zn-cycle-rule-toast-slot" :class="{ 'is-active': !!publishRuleToast }">
              <div v-show="publishRuleToast" class="zn-cycle-rule-toast" role="alert">
                <img class="zn-cycle-rule-toast__icon" src="/assets/lui/icon-hint-solid.svg" alt="" width="16" height="16" />
                <span>{{ publishRuleToast }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="zn-cycle-matrix-wrap" :class="{ 'is-horizontal-scroll': cycleDayHeaders.length > 10 }">
        <div
          class="overview-matrix density-compact zn-cycle-matrix"
          :class="{ 'is-cycle-scroll': cycleDayHeaders.length > 10 }"
          :style="cycleMatrixStyle"
        >
          <table>
            <colgroup>
              <col class="zn-cycle-col-person" />
              <col class="zn-cycle-col-rest" />
              <col class="zn-cycle-col-period" />
              <col v-for="day in cycleDayHeaders" :key="`col-${day.key}`" class="zn-cycle-col-day" />
              <col class="zn-cycle-col-operation" />
            </colgroup>
            <thead>
              <tr>
                <th class="overview-person-col">
                  <div class="overview-person-header">
                    <span class="zn-cycle-matrix__person-label">人员</span>
                  </div>
                </th>
                <th class="overview-rest-col" aria-label="排休时间"><el-tooltip content="排休时间" placement="top" popper-class="lui-pc-tooltip"><i class="el-icon-time"></i></el-tooltip></th>
                <th class="overview-period-col">循环周期</th>
                <th
                  v-for="day in cycleDayHeaders"
                  :key="day.key"
                  class="overview-date-col"
                  :class="{ 'is-today': day.isToday, 'is-weekend': day.isWeekend }"
                >
                  <div class="zn-cycle-date-head">
                    <strong class="zn-cycle-date-head__date">{{ day.label }}</strong>
                    <span class="zn-cycle-date-head__week">
                      <template v-if="!day.isToday">{{ day.weekShort }}</template>
                      <em v-if="day.isToday" class="today-tag">今</em>
                    </span>
                  </div>
                </th>
                <th class="overview-operation-col">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(item, index) in editingConfigs"
                :key="item.id"
                :class="{ 'is-rule-error-row': isCycleRowError(index) }"
              >
                <td class="overview-person-cell">
                  <div>
                    <strong>
                      {{ item.name }}
                      <el-tag v-if="item.isNew" class="zn-person-new-tag">新增</el-tag>
                    </strong>
                    <small>{{ item.code }}</small>
                  </div>
                </td>
                <td class="overview-rest-cell">{{ configRestCount(item) }}</td>
                <td class="overview-period-cell">
                  <div class="zn-cycle-period-inline" :class="{ 'is-error': !!validateCycleDays(item.cycleDays) }">
                    <el-input
                      v-model="item.cycleDays"
                      class="zn-cycle-period-inline__input"
                      inputmode="numeric"
                      maxlength="2"
                      aria-label="循环周期天数"
                      @input="normalizeInlineCycleDays(item, $event)"
                      @change="commitInlineCycleDays(item)"
                      @blur="commitInlineCycleDays(item)"
                      @keyup.enter.native="$event.target.blur()"
                    />
                    <span class="zn-cycle-period-inline__unit">天</span>
                  </div>
                </td>
                <td
                  v-for="(shift, dayIdx) in visibleSchedulePattern(item)"
                  :key="`${item.id}-${dayIdx}`"
                  class="overview-shift-cell"
                  :class="{
                    'is-picker-anchor': isCyclePickerAnchor(index, dayIdx),
                    'is-range-selected': isCycleRangeSelected(index, dayIdx),
                    'is-weekend': cycleDayHeaders[dayIdx] && cycleDayHeaders[dayIdx].isWeekend,
                  }"
                  @mousedown.left.prevent="startCycleRangeSelect(index, dayIdx, $event)"
                  @mouseenter="extendCycleRangeSelect(index, dayIdx)"
                >
                  <button
                    v-if="shift !== '休'"
                    type="button"
                    class="overview-shift-chip is-compact"
                    :class="{ 'is-wide': compactPrefix(shift).length > 1 }"
                    :style="chipStyle(shift, isCyclePickerAnchor(index, dayIdx))" :title="`${displayFullName(shift)} ${displayTime(shift)}`"
                    @dblclick.stop.prevent="openCycleShiftPicker(index, dayIdx, $event)"
                  >
                    <b>{{ compactPrefix(shift) }}</b>
                    <small>{{ compactIndex(shift) }}</small>
                  </button>
                  <span
                    v-else
                    class="rest-cell"
                    :style="restCellStyle(isCyclePickerAnchor(index, dayIdx))"
                    @dblclick.stop.prevent="openCycleShiftPicker(index, dayIdx, $event)"
                  >休</span>
                </td>
                <td class="overview-operation-cell">
                  <el-button type="text" class="zn-cycle-copy-link" @click="openCopySchedule(item)">复制</el-button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <span slot="footer" class="zn-cycle-dialog__footer">
        <el-button @click="configDialogVisible = false">取消</el-button>
        <el-button @click="stashConfig">暂存</el-button>
        <el-button type="primary" @click="publishScheduleConfig">发布排班</el-button>
      </span>
    </el-dialog>

    <el-dialog
      :visible.sync="copyScheduleVisible"
      width="440px"
      append-to-body
      :modal="true"
      :close-on-click-modal="false"
      custom-class="zn-copy-schedule-dialog"
    >
      <span slot="title">复制排班</span>
      <div class="zn-copy-schedule-dialog__body">
        <p class="zn-copy-schedule-dialog__tip">{{ copyScheduleTip }}</p>
        <div class="zn-copy-schedule-dialog__form-row">
          <label>{{ copyScheduleSelectLabel }}</label>
          <el-select
            v-model="copySchedulePeerId"
            filterable
            popper-class="overseas-select-popper"
            :placeholder="copyScheduleSelectPlaceholder"
          >
            <el-option
              v-for="person in copyScheduleCandidates"
              :key="person.id"
              :label="`${person.name}（${person.code}）`"
              :value="person.id"
            />
          </el-select>
        </div>
      </div>
      <span slot="footer" class="zn-copy-schedule-dialog__footer">
        <el-button class="zn-copy-schedule-dialog__cancel" @click="copyScheduleVisible = false">取消</el-button>
        <el-button type="primary" :disabled="!copySchedulePeerId" @click="confirmCopySchedule">确定</el-button>
      </span>
    </el-dialog>

    <!-- 双击班表色块：班次选择弹窗（图2） -->
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
        <button
          v-if="!(shiftPickerTarget && shiftPickerTarget.fromToolbar)" type="button"
          role="tab"
          class="shift-picker-tab"
          :class="{ 'is-active': shiftPickerTab === 'day' }"
          @click="selectShiftPickerTab('day')"
        >按班次排</button>
        <button
          v-if="!(shiftPickerTarget && shiftPickerTarget.fromToolbar)" type="button"
          role="tab"
          class="shift-picker-tab"
          :class="{ 'is-active': shiftPickerTab === 'cycle' }"
          @click="selectShiftPickerTab('cycle')"
        >按轮班排</button>
        <button
          v-if="shiftPickerTarget && shiftPickerTarget.type === 'board'"
          type="button"
          role="tab"
          class="shift-picker-tab"
          :class="{ 'is-active': shiftPickerTab === 'temporary' }"
          @click="selectShiftPickerTab('temporary')"
        >修改临时排班</button>
      </div>
      <div class="shift-picker-body">
        <el-input
          v-if="shiftPickerTab === 'day'"
          v-model="shiftPickerKeyword"
          clearable
          prefix-icon="el-icon-search"
          placeholder="模糊搜索班次"
        />
        <div v-if="shiftPickerTab === 'day'" class="shift-picker-grid">
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
            <span
              class="shift-picker-chip"
              :class="{ 'is-rest': shift.isRest, 'is-empty': shift.isEmpty }"
              :style="pickerChipStyle(shift)" :title="`${shift.name} ${formatShiftRange(shift.time)}`"
            >
              <b>{{ shift.name }}</b>
              <small>{{ formatShiftRange(shift.time) }}</small>
            </span>
          </label>
        </div>
        <div v-else-if="shiftPickerTab === 'cycle'" class="shift-picker-cycle">
          <el-switch v-model="shiftPickerCycleApplyAll" />
          <span>从当前选中日期开始，应用到当前全部时间范围</span>
        </div>
        <temporary-shift-editor v-else v-model="temporaryShiftForm" :shift-name="temporaryShiftBase.name" :people="boardRows" :dates="dates"
          :selected-person-id="shiftPickerTarget && shiftPickerTarget.row ? shiftPickerTarget.row.id : ''"
          :show-person-filter="Boolean(shiftPickerTarget && shiftPickerTarget.fromToolbar)" @target-change="onTemporaryTargetChange" />
      </div>
      <span slot="footer" class="shift-picker-footer">
        <el-button @click="shiftPickerVisible = false">取消</el-button>
        <el-button v-if="shiftPickerTab === 'day'" @click="clearPickerShifts">清空</el-button>
        <el-button v-else-if="shiftPickerTab === 'cycle'" @click="clearCyclePicker">清空</el-button>
        <el-button type="primary" @click="saveShiftPicker">{{ shiftPickerTab === 'temporary' ? '确定' : '保存' }}</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import ShellIcon from '../components/shell/ShellIcon.vue'
import ScheduleStatisticsPanel from './ScheduleStatisticsPanel.vue'
import OperationHelpDialog from './OperationHelpDialog.vue'
import AddShiftDrawer from './AddShiftDrawer.vue'
import AddRotationDrawer from './AddRotationDrawer.vue'
import AddEmployeeDrawer from './AddEmployeeDrawer.vue'
import TemporaryShiftEditor from '../components/TemporaryShiftEditor.vue'
import PersonExceptionDialog from './PersonExceptionDialog.vue'
import shiftLegendEditing from '../mixins/shiftLegendEditing'
import shiftPickerRules from '../mixins/shiftPickerRules'
import {
  ZN_SHIFTS,
  ZN_STATISTICS_ROWS,
  PROTOTYPE_TODAY,
  DEFAULT_CYCLE_CONFIGS,
  cloneCycleConfigs,
  createBoardRows,
  applyConfigsToBoard,
  applyNewcomerConfigsToBoard,
  validateCycleConfigs,
  formatConsecutiveRuleToast,
  syncPatternLength,
  resizePatternLoop,
  shiftById,
  formatShiftRange,
  buildScheduleRangeDates,
  buildCalendarMonthDates,
} from './mock'
import { assetUrl } from '../utils/assetUrl'
import { resolveShiftChipStyle, compactShiftParts, formatShiftTimeRange, sortShiftsByFamily, nextShiftLevel, validateShiftLevel, familyLabelOf, decorateShift } from '../utils/shiftPalette'
import { mergeScopedShifts } from '../utils/scopedShiftStore'
function datesForScheduleMonth(monthStr) {
  return buildCalendarMonthDates(monthStr || '2026-09', PROTOTYPE_TODAY)
}

function startDateForScheduleMonth(monthStr) {
  const [year, month] = String(monthStr || '2026-09').split('-')
  return `${year}-${month}-21`
}

function resizeCyclePatternWithRest(pattern, targetDays) {
  const source = (pattern || []).filter((value) => value !== undefined && value !== null && value !== '')
  const rawDays = Number(targetDays)
  const days = Number.isFinite(rawDays) ? Math.max(0, Math.trunc(rawDays)) : 7
  if (days === 0) return []
  if (!source.length) return Array.from({ length: days }, () => '休')

  const restIndexes = source.reduce((indexes, value, index) => {
    if (value === '休' || value === 'REST') indexes.push(index)
    return indexes
  }, [])
  if (!restIndexes.length) return resizePatternLoop(source, days)

  const workPattern = source.filter((value) => value !== '休' && value !== 'REST')
  if (!workPattern.length) return Array.from({ length: days }, () => '休')

  const result = resizePatternLoop(workPattern, days)
  restIndexes.forEach((index) => {
    const mappedIndex = Math.min(days - 1, Math.max(0, Math.round(((index + 1) / source.length) * days) - 1))
    result[mappedIndex] = '休'
  })
  return result
}

const EMPTY_SHIFT_OPTION = Object.freeze({
  id: 'EMPTY',
  name: '空',
  short: '空',
  time: '00:00-23:59',
  isEmpty: true,
})

const BOARD_DRAFT_STORAGE_KEY = 'attendance-zn-board-v1'

function normalizeCycleDayCount(value, fallback = 7) {
  const rawDays = Number(value)
  if (!Number.isFinite(rawDays)) return fallback
  return Math.max(0, Math.min(31, Math.trunc(rawDays)))
}

export default {
  name: 'ZnShiftModule',
  components: { ShellIcon, ScheduleStatisticsPanel, OperationHelpDialog, AddShiftDrawer, AddRotationDrawer, AddEmployeeDrawer, TemporaryShiftEditor, PersonExceptionDialog },
  mixins: [shiftLegendEditing, shiftPickerRules],
  props: {
    initialContext: { type: Object, default: () => ({}) },
  },
  data() {
    return {
      department: this.initialContext.department || 'tz-yz',
      attendanceGroup: this.initialContext.attendanceGroup || 'default',
      scheduleMonth: this.initialContext.scheduleMonth || '2026-09',
      contentTab: 'table',
      operationHelpVisible: false,
      operationHelpTab: 'guide',
      statisticsRows: ZN_STATISTICS_ROWS,
      configStartDate: startDateForScheduleMonth(this.initialContext.scheduleMonth || '2026-09'),
      autoEnabled: true,
      onlyUnscheduled: false,
      filterPopoverVisible: false,
      filterDraft: {
        onlyUnscheduled: false,
        staffStatus: ['normal', 'changed'],
        empType: ['A', 'I'],
        position: ['sorter'],
      },
      filterApplied: {
        onlyUnscheduled: false,
        staffStatus: ['normal', 'changed'],
        empType: ['A', 'I'],
        position: ['sorter'],
      },
      viewDensity: 'compact',
      keyword: '',
      legendExpanded: false,
      shiftEditorVisible: false,
      rotationEditorVisible: false,
      addEmployeeVisible: false,
      shiftEditorFamily: 'morning',
      shiftEditorTime: '08:00-12:00',
      shiftEditorPendingLevel: null,
      shiftEditorType: 'fixed',
      shiftEditorCrossNight: 'no',
      shiftEditorJumpCount: null,
      shiftEditorSegments: [],
      shifts: sortShiftsByFamily(mergeScopedShifts(ZN_SHIFTS, this.initialContext)),
      rotations: [],
      dates: datesForScheduleMonth(this.initialContext.scheduleMonth || '2026-09'),
      cycleConfigs: cloneCycleConfigs(DEFAULT_CYCLE_CONFIGS),
      boardRows: createBoardRows(
        DEFAULT_CYCLE_CONFIGS,
        datesForScheduleMonth(this.initialContext.scheduleMonth || '2026-09'),
      ),
      editingConfigs: [],
      configDialogVisible: false,
      configMode: 'all', // all | newcomers
      configViolations: [],
      publishRuleToast: '',
      publishViolationMap: {},
      cycleDraft: null,
      CYCLE_DAYS_MIN: 0,
      CYCLE_DAYS_MAX: 31,
      cycleEditorId: null,
      cycleEditorDays: 7,
      cycleEditorError: '',
      copyScheduleVisible: false,
      copyScheduleRowId: null,
      copySchedulePeerId: null,
      copyScheduleMode: 'source-to-target',
      shiftPickerVisible: false,
      shiftPickerTab: 'day',
      shiftPickerKeyword: '',
      selectedPickerShiftIds: [],
      shiftPickerTarget: null,
      shiftPickerAnchorEl: null,
      shiftPickerReady: false,
      shiftPickerCycleApplyAll: false,
      cycleRangeSelection: null,
      cycleRangeDragging: false,
      cycleRangeAnchorEl: null,
      shiftPickerScrollLockY: 0,
      temporaryShiftForm: {
        date: '',
        crossNight: '否',
        boundaryHours: 1, startBoundaryHours: 1, endBoundaryHours: 1,
        startTime: '',
        endTime: '',
      },
      scrollLockDepth: 0,
      newcomerTipVisible: false,
      smartTipVisible: true,
      smartTipHover: false,
      smartTipIntroTimer: null,
      newcomerTipShown: false,
      hasUnsavedBoardChanges: false,
    }
  },
  watch: {
    viewDensity() { this.$nextTick(() => { if (this.$refs.scheduleMatrix) this.$refs.scheduleMatrix.scrollLeft = 0 }) },
    configDialogVisible(visible) {
      this.$emit('smart-dialog-change', visible)
    },
    shiftEditorFamily(value) {
      if (value === 'rest') this.shiftEditorTime = '00:00-23:59'
      else if (value === 'morning') this.shiftEditorTime = '08:00-12:00'
      else if (value === 'midday') this.shiftEditorTime = '12:00-18:00'
      else this.shiftEditorTime = '18:00-23:00'
    },
  },
  computed: {
    /** 职能后线数据量小，智能排班走弹窗；其他国内考勤走整页向导 */
    isBackOfficeZn() {
      return this.department === 'hb-zn-01' || this.attendanceGroup === 'zn-001'
    },
    departmentLabel() {
      const map = {
        'tz-yz': '京东集团-京东物流-运营部-京津北',
        'hb-zn-01': '华北职能后线 · 一组',
      }
      return map[this.department] || '京东集团-京东物流-运营部-京津北'
    },
    attendanceGroupLabel() {
      return this.attendanceGroup === 'zn-001'
        ? '华北职能后线一组（ZN）'
        : '落地配细分班组-04-5413353-FJL'
    },
    pendingNewcomers() {
      return this.cycleConfigs.filter((c) => c.isNew && !c.confirmed)
    },
    legendShifts() {
      return sortShiftsByFamily(this.shifts)
    },
    shiftEditorNextLevel() {
      return nextShiftLevel(this.shifts, this.shiftEditorFamily)
    },
    shiftEditorLevelLabel() {
      if (this.shiftEditorFamily === 'rest') return '休息'
      const level = this.shiftEditorNextLevel
      if (level == null) return `${familyLabelOf(this.shiftEditorFamily)}已满 6 次`
      return `${familyLabelOf(this.shiftEditorFamily)}${level}次`
    },
    filteredPickerShifts() {
      const keyword = this.shiftPickerKeyword.trim().toLowerCase()
      const list = this.shifts.filter((shift) => {
        if (!keyword) return true
        return `${shift.name} ${shift.time}`.toLowerCase().includes(keyword)
      })
      return sortShiftsByFamily(list)
    },
    shiftPickerDialogClass() {
      return ['shift-picker-dialog', 'zn-shift-picker-dialog', this.shiftPickerTab === 'day' ? 'is-day' : '', this.shiftPickerTab === 'temporary' ? 'is-temporary' : '', this.shiftPickerTarget && this.shiftPickerTarget.fromToolbar ? 'is-toolbar-temporary' : '', this.shiftPickerReady ? 'is-ready' : ''].filter(Boolean).join(' ')
    },
    temporaryShiftBase() {
      if (!this.shiftPickerTarget || this.shiftPickerTarget.type !== 'board') return { name: '--', time: '' }
      const { row, dateKey } = this.shiftPickerTarget
      if (!row || !dateKey) return { name: '--', time: '' }
      const shiftId = row && row.shifts ? row.shifts[dateKey] : null
      if (shiftId === 'EMPTY') return { name: '空', time: '00:00-23:59', isEmpty: true }
      if (shiftId === '休' || shiftId === 'REST') return { name: '休息', time: '00:00-23:59', isRest: true }
      return this.shifts.find((shift) => shift.id === shiftId) || { name: '--', time: '' }
    },
    filteredRows() {
      const keyword = this.keyword.trim().toLowerCase()
      const filters = this.filterApplied
      return this.boardRows.filter((row) => {
        const matchKw = !keyword || `${row.name} ${row.code}`.toLowerCase().includes(keyword)
        const values = Object.values(row.shifts || {})
        const hasUnscheduled = values.some((value) => !value || value === 'EMPTY')
        const staffStatus = row.staffStatus || (Number(row.id) % 4 === 0 ? 'changed' : 'normal')
        const empType = row.empType || (Number(row.id) % 3 === 0 ? 'I' : 'A')
        const position = row.positionCode || 'sorter'
        return matchKw && (!filters.onlyUnscheduled || hasUnscheduled)
          && filters.staffStatus.includes(staffStatus) && filters.empType.includes(empType) && filters.position.includes(position)
      })
    },
    hasActiveScheduleFilter() {
      return this.onlyUnscheduled
        || this.filterApplied.staffStatus.length < 2
        || this.filterApplied.empType.length < 2
        || this.filterApplied.position.length < 1
    },
    cycleDayHeaders() {
      return buildScheduleRangeDates(this.configStartDate || '2026-09-21', PROTOTYPE_TODAY)
    },
    cycleMatrixStyle() {
      const days = Math.max(1, this.cycleDayHeaders.length)
      const dayCol = 64
      const fixedWidth = 332 // 人员 108 + 排休 48 + 周期 104 + 操作 72
      return {
        '--cycle-days': days,
        '--cycle-day-col-width': `${dayCol}px`,
        '--cycle-table-min-width': `${fixedWidth + days * dayCol}px`,
      }
    },
    copyScheduleCurrentRow() {
      return this.editingConfigs.find((item) => item.id === this.copyScheduleRowId) || null
    },
    copyScheduleCandidates() {
      if (!this.copyScheduleCurrentRow) return []
      if (this.copyScheduleMode === 'template-to-target') {
        return this.cycleConfigs.filter((item) => (
          item.id !== this.copyScheduleCurrentRow.id && (!item.isNew || item.confirmed)
        ))
      }
      return this.editingConfigs.filter((item) => item.id !== this.copyScheduleCurrentRow.id)
    },
    copyScheduleSelectLabel() {
      return this.copyScheduleMode === 'template-to-target' ? '参考人员' : '复制到'
    },
    copyScheduleSelectPlaceholder() {
      return this.copyScheduleMode === 'template-to-target' ? '请选择已有人员' : '请选择目标人员'
    },
    copyScheduleTip() {
      const row = this.copyScheduleCurrentRow
      if (!row) return ''
      return `将「${row.name}」的班次和循环周期复制给另一位人员，目标人员原配置将被覆盖。`
    },
    /** 整月日期列：一屏最多 31 天均分宽度 */
    scheduleMatrixStyle() {
      const days = Math.max(1, (this.dates && this.dates.length) || 31)
      return {
        '--schedule-day-count': days,
      }
    },
    statisticsDates() {
      return this.dates
    },
  },
  mounted() {
    this.reloadScheduleBoard({ silent: true })
    this.restoreSavedBoard()
    window.addEventListener('beforeunload', this.onBeforeUnload)
    this.smartTipIntroTimer = setTimeout(() => {
      this.smartTipIntroTimer = null
      if (!this.smartTipHover) this.smartTipVisible = false
    }, 5000)
    this.$nextTick(() => {
      this.maybeShowNewcomerTip()
    })
  },
  beforeDestroy() {
    window.removeEventListener('beforeunload', this.onBeforeUnload)
    if (this.smartTipIntroTimer) clearTimeout(this.smartTipIntroTimer)
    document.removeEventListener('mousedown', this.onShiftPickerOutside, true)
    document.removeEventListener('mouseup', this.finishCycleRangeSelect, true)
    while (this.scrollLockDepth > 0) {
      this.unlockBackgroundScroll()
    }
    this.clearCenteredDialogWrapper()
  },
  methods: {
    assetUrl,
    formatShiftRange,
    markBoardDirty() {
      this.hasUnsavedBoardChanges = true
    },
    restoreSavedBoard() {
      try {
        const saved = JSON.parse(localStorage.getItem(BOARD_DRAFT_STORAGE_KEY) || 'null')
        if (!saved || saved.scheduleMonth !== this.scheduleMonth) return
        this.boardRows = saved.boardRows || this.boardRows
        this.cycleConfigs = saved.cycleConfigs || this.cycleConfigs
        this.shifts = saved.shifts || this.shifts
      } catch (error) { /* ignore invalid local drafts */ }
    },
    saveBoardChanges() {
      localStorage.setItem(BOARD_DRAFT_STORAGE_KEY, JSON.stringify({ scheduleMonth: this.scheduleMonth, boardRows: this.boardRows, cycleConfigs: this.cycleConfigs, shifts: this.shifts }))
      this.hasUnsavedBoardChanges = false
      this.notify('当前排班修改已保存并生效')
    },
    onBeforeUnload(event) {
      if (!this.hasUnsavedBoardChanges) return
      event.preventDefault()
      event.returnValue = ''
    },
    notify(msg) {
      this.$message.success(msg)
    },
    openShiftEditor() {
      this.editingShiftId = null
      this.shiftEditorVisible = true
    },
    createDefaultFilterState() {
      return {
        onlyUnscheduled: false,
        staffStatus: ['normal', 'changed'],
        empType: ['A', 'I'],
        position: ['sorter'],
      }
    },
    cloneFilterState(source) {
      return {
        onlyUnscheduled: Boolean(source.onlyUnscheduled),
        staffStatus: [...(source.staffStatus || [])],
        empType: [...(source.empType || [])],
        position: [...(source.position || [])],
      }
    },
    onFilterPopoverShow() {
      this.filterDraft = this.cloneFilterState({
        ...this.filterApplied,
        onlyUnscheduled: this.onlyUnscheduled,
      })
    },
    cancelFilterDraft() {
      this.filterPopoverVisible = false
    },
    applyFilterDraft() {
      this.filterApplied = this.cloneFilterState(this.filterDraft)
      this.onlyUnscheduled = Boolean(this.filterDraft.onlyUnscheduled)
      this.filterPopoverVisible = false
      this.notify(this.onlyUnscheduled ? '已筛选仅看未排班人员' : '筛选条件已应用')
    },
    openRotationEditor() {
      this.editingRotationId = null
      this.rotationEditorVisible = true
    },
    onAddShiftConfirm(payload = {}) {
      this.shiftEditorFamily = payload.family || 'morning'
      this.shiftEditorTime = payload.time || '08:00-12:00'
      this.shiftEditorPendingLevel = payload.level || null
      this.shiftEditorType = payload.shiftType || 'fixed'
      this.shiftEditorCrossNight = payload.crossNight || 'no'
      this.shiftEditorJumpCount = payload.jumpCount || null
      this.shiftEditorSegments = payload.segments || []
      this.confirmAddShift()
    },
    onAddRotationConfirm(payload = {}) {
      const id = `ROT-${Date.now()}`
      this.rotations = this.rotations.concat([{
        id,
        name: payload.name,
        cycleDays: payload.cycleDays,
        content: payload.content,
        dayShifts: payload.dayShifts || [],
        isRest: false,
        time: `${payload.cycleDays || 7}天周期`,
      }])
      this.rotationEditorVisible = false
      this.legendExpanded = true
      this.notify(`轮班规则「${payload.name}」已添加`)
    },
    onAddEmployeeConfirm(selected = []) {
      this.addEmployeeVisible = false
      if (!selected.length) return
      const names = selected.map((item) => item.name).filter(Boolean)
      const existingCodes = new Set(this.cycleConfigs.map((item) => item.code))
      let nextId = this.cycleConfigs.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0) + 1
      const newcomers = selected
        .filter((item) => !existingCodes.has(item.erp))
        .map((item) => {
          const rotation = item.scheduleType === 'rotation' ? this.rotations.find((option) => option.id === item.scheduleId) : null
          const shift = item.scheduleType === 'shift' ? this.shifts.find((option) => option.id === item.scheduleId) : null
          const cycleDays = Math.max(1, Math.min(31, Number(item.cycleDays) || Number(rotation && rotation.cycleDays) || 7))
          const restDays = Math.max(0, Math.min(cycleDays - 1, Number(item.restDays) || 0))
          const sourcePattern = rotation ? (rotation.dayShifts || []) : Array.from({ length: cycleDays }, () => (shift && shift.id) || item.scheduleId)
          const pattern = resizePatternLoop(sourcePattern, cycleDays).map((value, index) => (index >= cycleDays - restDays ? 'REST' : value))
          return {
            id: nextId++,
            name: item.name,
            code: item.erp,
            isNew: true,
            confirmed: true,
            cycleType: 'loop',
            cycleDays,
            restDays,
            startDate: item.startDate,
            theme: (shift && (shift.background || shift.light || shift.color)) || '#3C6EF0',
            pattern,
            dayOverrides: { ...(item.dayOverrides || {}) },
          }
        })
      if (newcomers.length) {
        this.cycleConfigs = [...newcomers, ...this.cycleConfigs]
        const newcomerCodes = new Set(newcomers.map((item) => item.code))
        const existingRows = this.boardRows.filter((row) => !newcomerCodes.has(row.code))
        const newcomerRows = applyNewcomerConfigsToBoard(newcomers, this.dates)
        this.boardRows = [...newcomerRows, ...existingRows]
        this.newcomerTipVisible = false
        this.newcomerTipShown = true
      }
      if (!newcomers.length) {
        this.$message.info('所选人员已在排班表中')
        return
      }
      this.notify(`已添加并排班：${names.slice(0, 3).join('、')}${names.length > 3 ? ' 等' : ''}`)
    },
    confirmAddShift() {
      const family = this.shiftEditorFamily
      if (family === 'rest') {
        const check = validateShiftLevel(this.shifts, 'rest', 0)
        if (!check.ok) {
          this.$message.warning(check.message)
          return
        }
        this.shifts = sortShiftsByFamily(this.shifts.concat(decorateShift({
          id: 'REST',
          name: '休息',
          short: '休',
          time: this.shiftEditorTime || '00:00-23:59',
          isRest: true,
          shiftType: this.shiftEditorType,
          crossNight: this.shiftEditorCrossNight,
          segments: this.shiftEditorSegments,
        })))
        this.shiftEditorVisible = false
        this.shiftEditorPendingLevel = null
        this.notify('休息班次已添加')
        return
      }
      const level = this.shiftEditorPendingLevel || this.shiftEditorNextLevel
      const check = validateShiftLevel(this.shifts, family, level)
      if (!check.ok) {
        this.$message.warning(check.message)
        return
      }
      const label = familyLabelOf(family)
      const prefix = family === 'morning' ? 'M' : family === 'night' ? 'W' : 'Z'
      const jumpPrefix = this.shiftEditorType === 'jump' ? '(跳)' : ''
      this.shifts = sortShiftsByFamily(this.shifts.concat(decorateShift({
        id: `${prefix}${level}`,
        name: `${jumpPrefix}${label}${level}次`,
        short: `${jumpPrefix}${label.replace('班', '')}${level}`,
        time: this.shiftEditorTime || '08:00-12:00',
        family,
        level,
        shiftType: this.shiftEditorType,
        crossNight: this.shiftEditorCrossNight,
        jumpCount: this.shiftEditorJumpCount,
        segments: this.shiftEditorSegments,
      })))
      this.shiftEditorVisible = false
      this.shiftEditorPendingLevel = null
      this.notify(`${label}${level}次已添加`)
    },
    openOperationHelp(tab = 'guide') {
      this.operationHelpTab = tab
      this.operationHelpVisible = true
    },
    onSmartEnter() {
      this.smartTipHover = true
      this.smartTipVisible = true
    },
    onSmartLeave() {
      this.smartTipHover = false
      if (!this.smartTipIntroTimer) this.smartTipVisible = false
    },
    onDepartmentChange() {
      const wasBackOffice = this.attendanceGroup === 'zn-001'
      this.attendanceGroup = this.department === 'hb-zn-01' ? 'zn-001' : 'default'
      if (!this.isBackOfficeZn) {
        this.newcomerTipVisible = false
        // 离开职能后线后允许再次切入时重新提示
        this.newcomerTipShown = false
        return
      }
      if (!wasBackOffice) {
        this.newcomerTipShown = false
        this.$nextTick(() => this.maybeShowNewcomerTip())
      }
    },
    resetQuery() {
      this.department = 'tz-yz'
      this.attendanceGroup = 'default'
      this.scheduleMonth = '2026-09'
      this.newcomerTipVisible = false
      this.newcomerTipShown = false
      this.reloadScheduleBoard()
      this.notify('查询条件已重置')
    },
    queryScheduleContext() {
      if (!this.department) return this.$message.warning('请选择排班部门')
      if (!this.attendanceGroup) return this.$message.warning('请选择考勤组')
      if (!this.scheduleMonth) return this.$message.warning('请选择排班月份')
      this.reloadScheduleBoard()
      this.$emit('query-schedule', {
        department: this.department,
        attendanceGroup: this.attendanceGroup,
        processGroup: 'all',
        scheduleMonth: this.scheduleMonth,
        scene: 'domestic',
      })
      const [y, m] = String(this.scheduleMonth).split('-')
      this.notify(`已切换至 ${y}年${Number(m)}月排班表`)
      this.$nextTick(() => this.maybeShowNewcomerTip())
    },
    /** 按筛选项月份刷新整月日期列与班表数据 */
    reloadScheduleBoard(options = {}) {
      const nextDates = datesForScheduleMonth(this.scheduleMonth)
      this.dates = nextDates
      this.boardRows = createBoardRows(this.cycleConfigs, nextDates)
      if (!options.silent) {
        // keep message to caller
      }
    },
    onAutoChange(val) {
      this.$message({
        type: val ? 'success' : 'warning',
        message: val
          ? '已开启自动推送智能排班，每个月12号系统会自动进行排班推送哦～'
          : '已关闭，开启系统会定期推送智能排班哦！',
        showClose: false,
        customClass: 'zn-auto-schedule-message',
      })
    },
    maybeShowNewcomerTip() {
      // 仅：职能后线 + 有新人加入 + 新人尚未排班（未确认）
      if (!this.isBackOfficeZn) {
        this.newcomerTipVisible = false
        return
      }
      if (this.newcomerTipShown) return
      if (!this.pendingNewcomers.length) {
        this.newcomerTipVisible = false
        return
      }
      this.newcomerTipShown = true
      this.newcomerTipVisible = true
    },
    onNewcomerTipOpened() {
      this.tagCenteredDialogWrapper('.zn-newcomer-tip-dialog')
    },
    onCycleDialogOpened() {
      this.tagCenteredDialogWrapper('.zn-cycle-dialog')
      this.lockBackgroundScroll()
    },
    onCycleDialogClosed() {
      this.clearCenteredDialogWrapper()
      if (this.shiftPickerVisible) {
        this.resetShiftPicker()
      }
      this.unlockBackgroundScroll()
      this.onConfigClosed()
    },
    tagCenteredDialogWrapper(selector) {
      this.$nextTick(() => {
        const dialog = document.querySelector(selector)
        const wrapper = dialog && dialog.parentElement
        if (wrapper) wrapper.classList.add('zn-centered-dialog-wrapper')
      })
    },
    onCenteredDialogClosed() {
      this.clearCenteredDialogWrapper()
    },
    clearCenteredDialogWrapper() {
      document.querySelectorAll('.zn-centered-dialog-wrapper').forEach((el) => {
        el.classList.remove('zn-centered-dialog-wrapper')
      })
    },
    legendChipStyle(shift) {
      return resolveShiftChipStyle(shift)
    },
    shiftOf(row, dateKey) {
      const v = row.shifts && row.shifts[dateKey]
      return v == null ? '休' : v
    },
    restCount(row) {
      return this.dates.reduce((sum, d) => sum + (this.shiftOf(row, d.key) === '休' ? 1 : 0), 0)
    },
    compactPrefix(shiftId) {
      if (shiftId === 'EMPTY') return '空'
      const shift = this.resolveZnShiftRecord(shiftId)
      if (shift && Array.isArray(shift.constituentIds)) {
        return shift.constituentIds
          .map((id) => compactShiftParts(this.resolveZnShiftRecord(id)))
          .map((part) => `${part.prefix}${part.index}`)
          .join('/')
      }
      return compactShiftParts(shift).prefix
    },
    compactIndex(shiftId) {
      if (shiftId === 'EMPTY') return ''
      const shift = this.resolveZnShiftRecord(shiftId)
      if (shift && Array.isArray(shift.constituentIds)) return ''
      return compactShiftParts(shift).index
    },
    displayFullName(shiftId) {
      if (shiftId === 'EMPTY') return '空'
      const s = this.resolveZnShiftRecord(shiftId)
      if (!s || s.isRest) return '休息'
      return s.name
    },
    displayTime(shiftId) {
      if (shiftId === 'EMPTY') return '00:00-23:59'
      const s = this.resolveZnShiftRecord(shiftId)
      return s ? formatShiftTimeRange(s.time) : ''
    },
    chipStyle(shiftId, selected = false) {
      if (shiftId === 'EMPTY') {
        return {
          background: '#868d9f',
          color: '#ffffff',
          borderColor: '#868d9f',
          boxShadow: selected ? 'inset 0 0 0 2px #3c6ef0' : 'none',
        }
      }
      const s = this.resolveZnShiftRecord(shiftId)
      // 常规/精简班次块（含休息）统一走班次色板，与图例「休息」一致
      return resolveShiftChipStyle(s || { isRest: true, name: '休息', time: '00:00-23:59' }, selected)
    },
    restCellStyle(selected = false) {
      // 精简态「休」字块：未选中也套休息底色
      const base = resolveShiftChipStyle({ isRest: true })
      if (!selected) return {
        background: base.background,
        color: base.color,
        borderColor: base.borderColor,
      }
      return {
        background: base.background,
        color: base.color,
        borderColor: base.borderColor,
        boxShadow: `inset 0 0 0 2px ${base.color}`,
      }
    },
    onSmartScheduleClick() {
      if (!this.department) return this.$message.warning('请选择部门')
      if (!this.attendanceGroup) return this.$message.warning('请选择考勤组')
      if (this.isBackOfficeZn) {
        this.openSmartConfig()
        return
      }
      this.$emit('open-smart-schedule', {
        department: this.department,
        attendanceGroup: this.attendanceGroup,
        processGroup: 'all',
        scheduleMonth: this.scheduleMonth,
        scene: 'domestic',
      })
    },
    openSmartConfig() {
      if (!this.department) return this.$message.warning('请选择部门')
      if (!this.attendanceGroup) return this.$message.warning('请选择考勤组')
      this.smartTipVisible = false
      this.configMode = 'all'
      this.clearPublishViolations()
      if (this.restoreCycleDraft('all')) {
        this.configDialogVisible = true
        return
      }
      if (this.restoreNewcomerDraftInAll()) {
        this.configDialogVisible = true
        return
      }
      this.configStartDate = startDateForScheduleMonth(this.scheduleMonth)
      this.editingConfigs = cloneCycleConfigs(
        this.cycleConfigs.filter((c) => !c.isNew || c.confirmed),
      ).map((c) => syncPatternLength(c))
      if (!this.editingConfigs.length) {
        this.editingConfigs = cloneCycleConfigs(this.cycleConfigs).map((c) => syncPatternLength(c))
      }
      this.configDialogVisible = true
    },
    openNewcomerConfig() {
      this.newcomerTipVisible = false
      this.configMode = 'newcomers'
      this.clearPublishViolations()
      if (this.restoreCycleDraft('newcomers')) {
        this.configDialogVisible = true
        return
      }
      this.configStartDate = startDateForScheduleMonth(this.scheduleMonth)
      this.editingConfigs = cloneCycleConfigs(this.pendingNewcomers).map((c) => syncPatternLength(c))
      this.configDialogVisible = true
    },
    validateCycleDays(value) {
      const n = Number(value)
      if (!Number.isFinite(n) || n < this.CYCLE_DAYS_MIN) {
        return `循环周期最少${this.CYCLE_DAYS_MIN}天`
      }
      if (n > this.CYCLE_DAYS_MAX) {
        return `循环周期最多${this.CYCLE_DAYS_MAX}天`
      }
      return ''
    },
    validateAllCycleDays() {
      const invalid = this.editingConfigs.find((item) => this.validateCycleDays(item.cycleDays))
      if (!invalid) return true
      this.publishRuleToast = `${invalid.name}：${this.validateCycleDays(invalid.cycleDays)}`
      return false
    },
    cyclePattern(item) {
      const n = normalizeCycleDayCount(item.cycleDays)
      return resizeCyclePatternWithRest(item.pattern || [], n)
    },
    visibleSchedulePattern(item) {
      if (normalizeCycleDayCount(item.cycleDays) === 0) {
        return Array.from({ length: this.cycleDayHeaders.length }, () => 'EMPTY')
      }
      return resizePatternLoop(this.cyclePattern(item), this.cycleDayHeaders.length)
    },
    configRestCount(item) {
      return this.visibleSchedulePattern(item).filter((p) => p === '休' || p === 'REST').length
    },
    beginCycleEdit(item) {
      this.cycleEditorId = item.id
      this.cycleEditorDays = item.cycleDays
      this.cycleEditorError = ''
    },
    onCycleEditorNativeInput(event) {
      const value = Number(event && event.target ? event.target.value : this.cycleEditorDays)
      if (Number.isFinite(value)) this.cycleEditorDays = value
    },
    cancelCycleEdit(item = null) {
      const target = item || this.editingConfigs.find((config) => config.id === this.cycleEditorId)
      if (target) this.$set(target, 'cyclePopoverVisible', false)
      this.cycleEditorId = null
      this.cycleEditorError = ''
    },
    confirmCycleEdit(item) {
      const error = this.validateCycleDays(this.cycleEditorDays)
      if (error) {
        this.cycleEditorError = error
        return
      }
      const cycleDays = Number(this.cycleEditorDays)
      const nextPattern = resizeCyclePatternWithRest(item.pattern || [], cycleDays)
      const index = this.editingConfigs.findIndex((config) => config.id === item.id)
      if (index >= 0) {
        this.$set(this.editingConfigs, index, {
          ...item,
          cyclePopoverVisible: false,
          cycleType: 'loop',
          cycleDays,
          pattern: nextPattern,
        })
      }
      this.cycleEditorId = null
      this.cycleEditorError = ''
      this.clearPublishViolations()
      this.syncCycleEditToBoard(item.id, nextPattern)
      this.$message.success(`已将 ${item.name} 的循环周期调整为 ${cycleDays} 天`)
    },
    normalizeInlineCycleDays(item, value) {
      const normalized = String(value == null ? '' : value).replace(/\D/g, '').slice(0, 2)
      if (normalized !== String(value == null ? '' : value)) {
        this.$set(item, 'cycleDays', normalized)
      }
    },
    commitInlineCycleDays(item) {
      const error = this.validateCycleDays(item && item.cycleDays)
      if (error) {
        this.publishRuleToast = `${item.name}：${error}`
        return
      }
      const cycleDays = Number(item.cycleDays)
      const nextPattern = resizeCyclePatternWithRest(item.pattern || [], cycleDays)
      this.$set(item, 'cycleType', 'loop')
      this.$set(item, 'cycleDays', cycleDays)
      this.$set(item, 'pattern', nextPattern)
      this.clearPublishViolations()
      this.syncCycleEditToBoard(item.id, nextPattern)
    },
    openCopySchedule(item) {
      this.copyScheduleRowId = item.id
      this.copySchedulePeerId = null
      this.copyScheduleMode = 'source-to-target'
      this.copyScheduleVisible = true
    },
    confirmCopySchedule() {
      const current = this.copyScheduleCurrentRow
      if (!current || !this.copySchedulePeerId) return
      const pool = [...this.editingConfigs, ...this.cycleConfigs]
      const peer = pool.find((item) => item.id === this.copySchedulePeerId)
      if (!peer) return
      const source = this.copyScheduleMode === 'template-to-target' ? peer : current
      const target = this.copyScheduleMode === 'template-to-target' ? current : peer
      const index = this.editingConfigs.findIndex((item) => item.id === target.id)
      if (index < 0) return
      const cycleDays = normalizeCycleDayCount(source.cycleDays)
      const nextPattern = resizeCyclePatternWithRest(source.pattern || [], cycleDays)
      this.$set(this.editingConfigs, index, {
        ...this.editingConfigs[index],
        cycleType: 'loop',
        cycleDays,
        pattern: nextPattern,
      })
      this.copyScheduleVisible = false
      this.clearPublishViolations()
      this.syncCycleEditToBoard(target.id, nextPattern)
      this.$message.success(`已将 ${source.name} 的排班复制给 ${target.name}`)
    },
    mergeEditingBack(markConfirmed) {
      const map = {}
      this.editingConfigs.forEach((c) => {
        const cycleDays = normalizeCycleDayCount(c.cycleDays)
        const item = {
          ...c,
          cycleDays,
          pattern: resizeCyclePatternWithRest(c.pattern || [], cycleDays),
        }
        map[c.id] = {
          ...item,
          cycleType: 'loop',
          pattern: [...item.pattern],
          confirmed: markConfirmed ? true : c.confirmed,
          isDraft: false,
        }
      })
      this.cycleConfigs = this.cycleConfigs.map((c) => {
        if (!map[c.id]) return c
        return { ...c, ...map[c.id], pattern: [...map[c.id].pattern] }
      })
      if (markConfirmed && !this.pendingNewcomers.length) {
        this.newcomerTipVisible = false
      }
    },
    stashConfig() {
      if (!this.saveCycleDraft()) return
      this.configDialogVisible = false
      this.$message.success('已保存！点击智能排班可继续编辑排班配置。')
    },
    publishScheduleConfig() {
      if (!this.validateAllCycleDays()) return
      const violations = validateCycleConfigs(this.editingConfigs)
      const consecutive = violations.filter((v) => v.type === 'consecutive')
      if (consecutive.length) {
        this.applyPublishViolations(consecutive)
        this.publishRuleToast = formatConsecutiveRuleToast(consecutive)
        return
      }
      if (violations.length) {
        this.applyPublishViolations(violations)
        const names = [...new Set(violations.map((v) => v.name).filter(Boolean))]
        this.publishRuleToast = names.length
          ? `【配置不符合出勤规则】${names.join('、')}一个周期内至少需安排1个休息日，请修改后再发布。`
          : '【配置不符合出勤规则】不符合排班规范，请修改后再发布。'
        return
      }
      this.clearPublishViolations()
      this.mergeEditingBack(true)
      this.boardRows = applyConfigsToBoard(this.cycleConfigs, this.dates)
      this.cycleDraft = null
      this.configDialogVisible = false
      this.$message.success('排班已发布，已生效')
    },
    saveCycleDraft() {
      if (!this.validateAllCycleDays()) return false
      this.cycleDraft = {
        mode: this.configMode,
        configStartDate: this.configStartDate,
        editingConfigs: cloneCycleConfigs(this.editingConfigs).map((c) => {
          const item = syncPatternLength(c)
          return this.configMode === 'newcomers' && item.isNew
            ? { ...item, isDraft: true }
            : item
        }),
      }
      return true
    },
    restoreNewcomerDraftInAll() {
      const draft = this.cycleDraft
      if (!draft || draft.mode !== 'newcomers') return false

      const draftNewcomers = cloneCycleConfigs(draft.editingConfigs)
        .map((c) => ({ ...syncPatternLength(c), isDraft: true }))
      const draftIds = new Set(draftNewcomers.map((c) => c.id))
      const publishedConfigs = cloneCycleConfigs(
        this.cycleConfigs.filter((c) => (!c.isNew || c.confirmed) && !draftIds.has(c.id)),
      ).map((c) => syncPatternLength(c))

      this.configMode = 'all'
      this.configStartDate = draft.configStartDate || startDateForScheduleMonth(draft.configMonth || this.scheduleMonth)
      this.editingConfigs = [...publishedConfigs, ...draftNewcomers]
      this.clearPublishViolations()
      return true
    },
    restoreCycleDraft(mode) {
      const draft = this.cycleDraft
      if (!draft || draft.mode !== mode) return false
      this.configMode = draft.mode
      this.configStartDate = draft.configStartDate || startDateForScheduleMonth(draft.configMonth || this.scheduleMonth)
      this.editingConfigs = cloneCycleConfigs(draft.editingConfigs).map((c) => syncPatternLength(c))
      this.clearPublishViolations()
      return true
    },
    clearPublishViolations() {
      this.publishRuleToast = ''
      this.publishViolationMap = {}
      this.configViolations = []
    },
    applyPublishViolations(violations) {
      const map = {}
      violations.forEach((v) => {
        if (v.id) {
          map[v.id] = Array.isArray(v.errorDays) && v.errorDays.length
            ? [...v.errorDays]
            : ['row']
        }
      })
      this.publishViolationMap = map
      this.configViolations = violations
    },
    isCycleRowError(empIndex) {
      const item = this.editingConfigs[empIndex]
      if (!item) return false
      const days = this.publishViolationMap[item.id]
      return Array.isArray(days) && days.length > 0
    },
    openBoardShiftPicker(row, dateKey, event) {
      const current = this.shiftOf(row, dateKey)
      const date = this.dates.find((item) => item.key === dateKey)
      this.openShiftPicker({
        type: 'board',
        row,
        dateKey,
        fullDate: (date && date.fullKey) || `${this.scheduleMonth}-${dateKey.slice(3)}`,
      }, current, event)
    },
    openTemporaryShiftPicker(event) {
      this.openShiftPicker({ type: 'board', row: null, dateKey: '', fullDate: '', fromToolbar: true }, '', event)
      this.shiftPickerTab = 'temporary'
      this.temporaryShiftForm = { date: '', segments: [] }
    },
    onTemporaryTargetChange({ personId, date }) {
      const row = this.boardRows.find((item) => String(item.id) === String(personId))
      if (!row || !date) return
      this.shiftPickerTarget = { type: 'board', row, dateKey: date.slice(5), fullDate: date, fromToolbar: true }
      this.initializeTemporaryShiftForm(row.shifts[date.slice(5)], date)
    },
    openCycleShiftPicker(empIndex, dayIdx, event) {
      const item = this.editingConfigs[empIndex]
      const current = this.visibleSchedulePattern(item)[dayIdx]
      this.openShiftPicker({
        type: 'cycle',
        empIndex,
        dayIdx,
        dayIndices: [dayIdx],
      }, current, event)
    },
    startCycleRangeSelect(empIndex, dayIdx, event) {
      if (this.shiftPickerVisible || !event || event.button !== 0) return
      this.cycleRangeDragging = true
      this.cycleRangeAnchorEl = event.currentTarget
      this.cycleRangeSelection = {
        empIndex,
        start: dayIdx,
        end: dayIdx,
        moved: false,
      }
      document.addEventListener('mouseup', this.finishCycleRangeSelect, true)
    },
    extendCycleRangeSelect(empIndex, dayIdx) {
      const range = this.cycleRangeSelection
      if (!this.cycleRangeDragging || !range || range.empIndex !== empIndex) return
      if (range.end !== dayIdx) range.moved = true
      this.$set(range, 'end', dayIdx)
    },
    finishCycleRangeSelect() {
      document.removeEventListener('mouseup', this.finishCycleRangeSelect, true)
      const range = this.cycleRangeSelection
      this.cycleRangeDragging = false
      if (!range || !range.moved) {
        this.cycleRangeSelection = null
        this.cycleRangeAnchorEl = null
        return
      }
      const start = Math.min(range.start, range.end)
      const end = Math.max(range.start, range.end)
      const dayIndices = Array.from({ length: end - start + 1 }, (_, offset) => start + offset)
      const item = this.editingConfigs[range.empIndex]
      const current = this.visibleSchedulePattern(item)[start]
      const anchor = this.cycleRangeAnchorEl
      this.openShiftPicker({
        type: 'cycle',
        empIndex: range.empIndex,
        dayIdx: start,
        dayIndices,
      }, current, { currentTarget: anchor })
      this.cycleRangeAnchorEl = null
    },
    isCycleRangeSelected(empIndex, dayIdx) {
      const range = this.cycleRangeSelection
      if (!range || range.empIndex !== empIndex) return false
      const start = Math.min(range.start, range.end)
      const end = Math.max(range.start, range.end)
      return dayIdx >= start && dayIdx <= end
    },
    openShiftPicker(target, current, event) {
      const mapped = current === '休' ? 'REST' : current
      const currentShift = this.resolveZnShiftRecord(mapped)
      const anchor = event && event.currentTarget ? event.currentTarget : null
      this.shiftPickerReady = false
      this.shiftPickerTarget = target
      this.shiftPickerAnchorEl = anchor
      this.shiftPickerTab = 'day'
      this.shiftPickerKeyword = ''
      this.shiftPickerCycleApplyAll = false
      this.selectedPickerShiftIds = currentShift && Array.isArray(currentShift.constituentIds)
        ? [...currentShift.constituentIds]
        : (mapped ? [mapped] : [])
      if (target.type === 'board' && target.row) this.initializeTemporaryShiftForm(current, target.fullDate)
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
        && this.shiftPickerTarget.type === 'board'
        && this.shiftPickerTarget.row && this.shiftPickerTarget.row.id === row.id
        && this.shiftPickerTarget.dateKey === dateKey,
      )
    },
    isCyclePickerAnchor(empIndex, dayIdx) {
      const dayIndices = this.shiftPickerTarget && this.shiftPickerTarget.dayIndices
      return Boolean(
        this.shiftPickerVisible
        && this.shiftPickerTarget
        && this.shiftPickerTarget.type === 'cycle'
        && this.shiftPickerTarget.empIndex === empIndex
        && (Array.isArray(dayIndices) ? dayIndices.includes(dayIdx) : this.shiftPickerTarget.dayIdx === dayIdx),
      )
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
      const dialog = document.querySelector('.zn-shift-picker-dialog')
      const target = event.target
      if (target && target.closest && target.closest('.shift-picker-control-popper')) return
      if (target && target.closest && target.closest('.shift-picker-dialog')) return
      if (dialog && dialog.contains(target)) return
      if (this.shiftPickerAnchorEl && this.shiftPickerAnchorEl.contains(target)) return
      this.shiftPickerVisible = false
    },
    clearCyclePicker() {
      this.shiftPickerCycleApplyAll = false
    },
    selectShiftPickerTab(tab) {
      this.shiftPickerTab = tab
      if (tab === 'temporary' && this.shiftPickerTarget && this.shiftPickerTarget.type === 'board' && this.shiftPickerTarget.row) {
        const { row, dateKey, fullDate } = this.shiftPickerTarget
        this.initializeTemporaryShiftForm(row.shifts[dateKey], fullDate)
      }
    },
    initializeTemporaryShiftForm(shiftId, date) {
      const shift = shiftId === 'EMPTY' ? EMPTY_SHIFT_OPTION : this.resolveZnShiftRecord(shiftId)
      const segments = String((shift && shift.time) || '09:00-18:00').split('/').map((part) => {
        const [startTime = '09:00', endTime = '18:00'] = part.trim().split('-')
        return {
          crossNight: endTime <= startTime ? '是' : '否', boundaryHours: 1, startBoundaryHours: 1, endBoundaryHours: 1,
          startTime, endTime,
        }
      })
      this.temporaryShiftForm = { date, segments, ...segments[0] }
    },
    saveTemporaryShift() {
      if (!this.shiftPickerTarget || this.shiftPickerTarget.type !== 'board' || !this.shiftPickerTarget.row) return false
      const { row, dateKey: sourceDateKey } = this.shiftPickerTarget
      const { date } = this.temporaryShiftForm
      const segments = Array.isArray(this.temporaryShiftForm.segments) && this.temporaryShiftForm.segments.length ? this.temporaryShiftForm.segments : [this.temporaryShiftForm]
      if (!date || segments.some((segment) => !segment.startTime || !segment.endTime)) {
        this.showShiftPickerMessage('warning', '请完整填写班次日期和上下班时间')
        return false
      }
      const sourceShiftId = row.shifts[sourceDateKey]
      const base = sourceShiftId === 'EMPTY'
        ? EMPTY_SHIFT_OPTION
        : this.resolveZnShiftRecord(sourceShiftId)
      const targetDateKey = date.slice(5)
      const id = `TEMP-${row.id}-${date.replace(/-/g, '')}-${Date.now()}`
      const temporaryShift = decorateShift({
        ...base,
        id,
        name: base.isRest || base.isEmpty ? '临时班次' : base.name,
        time: segments.map((segment) => `${segment.startTime}-${segment.endTime}`).join(' / '),
        isRest: false,
        isEmpty: false,
        temporary: true,
      })
      this.shifts = this.shifts.concat([temporaryShift])
      this.$set(row.shifts, targetDateKey, id)
      this.markBoardDirty()
      this.shiftPickerVisible = false
      this.showShiftPickerMessage('success', `已临时修改 ${row.name} ${date} 的上下班时间`)
      return true
    },
    resetShiftPicker() {
      document.removeEventListener('mousedown', this.onShiftPickerOutside, true)
      this.unlockBackgroundScroll()
      this.shiftPickerReady = false
      this.shiftPickerTarget = null
      this.shiftPickerAnchorEl = null
      this.shiftPickerKeyword = ''
      this.selectedPickerShiftIds = []
      this.shiftPickerTab = 'day'
      this.shiftPickerCycleApplyAll = false
      this.cycleRangeSelection = null
      this.cycleRangeDragging = false
      this.cycleRangeAnchorEl = null
      document.documentElement.style.removeProperty('--shift-picker-left')
      document.documentElement.style.removeProperty('--shift-picker-top')
      const wrapper = document.querySelector('.shift-picker-wrapper')
      if (wrapper) {
        wrapper.classList.remove('shift-picker-wrapper')
        wrapper.style.pointerEvents = ''
      }
    },
    saveShiftPicker() {
      if (!this.shiftPickerTarget) {
        this.shiftPickerVisible = false
        return
      }
      if (this.shiftPickerTab === 'temporary') {
        this.saveTemporaryShift()
        return
      }
      const stored = this.resolvePickerShiftValue()
      if (!stored) {
        this.showShiftPickerMessage('warning', '请至少选择1个班次')
        return
      }
      const label = this.shiftLabel(stored)
      if (this.shiftPickerTab === 'cycle') {
        if (this.shiftPickerCycleApplyAll) {
          if (this.shiftPickerTarget.type === 'board') {
            const { row, dateKey } = this.shiftPickerTarget
            const startIndex = this.dates.findIndex((date) => date.key === dateKey)
            this.dates.slice(Math.max(0, startIndex)).forEach((date) => {
              this.$set(row.shifts, date.key, stored)
              this.syncBoardShiftToCycle(row, date.key, stored)
            })
            this.markBoardDirty()
          } else {
            const { empIndex, dayIdx } = this.shiftPickerTarget
            const item = this.editingConfigs[empIndex]
            const cycleDays = normalizeCycleDayCount(item.cycleDays)
            const dayIndices = Array.from(
              { length: Math.max(0, cycleDays - dayIdx) },
              (_, offset) => dayIdx + offset,
            )
            this.shiftPickerTarget = { ...this.shiftPickerTarget, dayIndices }
            this.applyPickerShiftToTarget(stored)
          }
        } else {
          this.applyPickerShiftToTarget(stored)
        }
        this.shiftPickerVisible = false
        this.showShiftPickerMessage('success', this.shiftPickerCycleApplyAll
          ? `已从当前日期起应用班次 ${label}`
          : '已保留当前日期的排班')
        return
      }
      if (this.shiftPickerTarget.type === 'board') {
        const { row } = this.shiftPickerTarget
        this.applyPickerShiftToTarget(stored)
        this.shiftPickerVisible = false
        this.showShiftPickerMessage('success', `已将 ${row.name} 的班次更新为 ${label}`)
        return
      }
      this.applyPickerShiftToTarget(stored)
      this.shiftPickerVisible = false
      const updatedShift = this.resolveZnShiftRecord(stored)
      const updatedLabel = updatedShift && !updatedShift.isRest ? `${updatedShift.name} ${this.formatShiftRange(updatedShift.time)}` : label
      this.showShiftPickerMessage('success', `已调整为${updatedLabel}`)
    },
    applyPickerShiftToTarget(shiftId) {
      if (!this.shiftPickerTarget) return
      const stored = shiftId ? this.resolvePickerShiftStored(shiftId) : '休'
      if (this.shiftPickerTarget.type === 'board') {
        const { row, dateKey } = this.shiftPickerTarget
        this.$set(row.shifts, dateKey, stored)
        this.syncBoardShiftToCycle(row, dateKey, stored)
        this.markBoardDirty()
        return
      }
      const { empIndex, dayIdx, dayIndices = [dayIdx] } = this.shiftPickerTarget
      const item = this.editingConfigs[empIndex]
      const nextPattern = dayIndices.reduce(
        (pattern, selectedDayIdx) => this.buildCyclePatternWithEdit({ ...item, pattern }, selectedDayIdx, stored),
        [...(item.pattern || [])],
      )
      this.$set(this.editingConfigs, empIndex, {
        ...item,
        pattern: nextPattern,
      })
      this.cycleConfigs = this.cycleConfigs.map((cfg) => (
        cfg.id === item.id
          ? { ...cfg, pattern: [...nextPattern], cycleDays: normalizeCycleDayCount(item.cycleDays) }
          : cfg
      ))
      this.syncCycleEditToBoard(item.id, nextPattern)
      this.clearPublishViolations()
    },
    resolvePickerShiftStored(shiftId) {
      if (shiftId === 'EMPTY') return 'EMPTY'
      const shift = this.resolveZnShiftRecord(shiftId)
      return shift && shift.isRest ? '休' : shiftId
    },
    buildCyclePatternWithEdit(item, dayIdx, stored) {
      const n = normalizeCycleDayCount(item.cycleDays)
      if (n === 0) return []
      const pattern = resizePatternLoop([...(item.pattern || [])], n)
      pattern[dayIdx % n] = stored
      return [...pattern]
    },
    syncBoardShiftToCycle(row, dateKey, stored) {
      const dateIdx = this.dates.findIndex((d) => d.key === dateKey)
      if (dateIdx < 0) return
      const offset = 2
      const patchConfig = (cfg) => {
        if (cfg.id !== row.id) return cfg
        const n = normalizeCycleDayCount(cfg.cycleDays)
        if (n === 0) return cfg
        const patternIdx = (dateIdx + offset) % n
        const pattern = resizePatternLoop([...(cfg.pattern || [])], n)
        pattern[patternIdx] = stored
        return { ...cfg, pattern: [...pattern] }
      }
      if (this.configDialogVisible) {
        this.editingConfigs = this.editingConfigs.map(patchConfig)
      }
      this.cycleConfigs = this.cycleConfigs.map(patchConfig)
    },
    syncCycleEditToBoard(empId, pattern) {
      const boardRow = this.boardRows.find((row) => row.id === empId)
      const cfg = this.editingConfigs.find((c) => c.id === empId)
        || this.cycleConfigs.find((c) => c.id === empId)
      if (!boardRow || !cfg) return
      const cycleDays = normalizeCycleDayCount(cfg.cycleDays, pattern.length)
      const [nextRow] = applyConfigsToBoard([{
        ...cfg,
        cycleType: 'loop',
        cycleDays,
        pattern,
      }], this.dates)
      if (!nextRow) return
      this.$set(boardRow, 'shifts', { ...nextRow.shifts })
    },
    shiftLabel(stored) {
      if (stored === 'EMPTY') return '空'
      if (stored === '休') return '休息'
      const shift = this.resolveZnShiftRecord(stored)
      return shift && !shift.isRest ? shift.name : stored
    },
    resolveZnShiftRecord(shiftId) {
      if (shiftId === '休' || shiftId === 'REST') {
        return this.shifts.find((shift) => shift.isRest || shift.id === 'REST') || shiftById(shiftId)
      }
      return this.shifts.find((shift) => shift.id === shiftId) || shiftById(shiftId)
    },
    pickerChipStyle(shift) {
      if (shift && shift.isEmpty) {
        return { background: '#868d9f', color: '#ffffff', borderColor: '#868d9f' }
      }
      const style = resolveShiftChipStyle(shift)
      return { ...style, '--shift-selected-border': style.color === '#FFFFFF' ? style.background : style.color }
    },
    darkenHex(hex, amount = 0.08) {
      if (!hex || typeof hex !== 'string') return '#525765'
      let h = hex.replace('#', '').trim()
      if (h.length === 3) h = h.split('').map((c) => c + c).join('')
      if (h.length !== 6 || Number.isNaN(parseInt(h, 16))) return hex
      const num = parseInt(h, 16)
      const channel = (shift) => Math.max(0, Math.round(((num >> shift) & 255) * (1 - amount)))
      const r = channel(16)
      const g = channel(8)
      const b = channel(0)
      return `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`
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
      if (rect.right + anchorGap + dialogWidth <= window.innerWidth - viewportPadding) {
        left = rect.right + anchorGap
      } else if (rect.left - anchorGap - dialogWidth >= viewportPadding) {
        left = rect.left - anchorGap - dialogWidth
      } else {
        left = rect.left + ((rect.width - dialogWidth) / 2)
      }
      left = Math.min(maxLeft, Math.max(viewportPadding, left))
      const top = Math.min(maxTop, Math.max(viewportPadding, rect.top))
      return { left: Math.round(left), top: Math.round(top) }
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
        document.querySelectorAll('.schedule-scroll, .overview-matrix:not(.zn-cycle-matrix)').forEach((el) => {
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
      const target = event.target
      if (target && target.closest && (
        target.closest('.shift-picker-dialog')
        || target.closest('.zn-cycle-dialog')
        || target.closest('.zn-newcomer-tip-dialog')
      )) return
      event.preventDefault()
    },
    onConfigClosed() {
      this.cancelCycleEdit()
      this.copyScheduleVisible = false
      this.copyScheduleRowId = null
      this.copySchedulePeerId = null
      this.editingConfigs = []
    },
  },
}
</script>

<style lang="scss" scoped>
.zn-query-grid.is-single-row { grid-template-columns: repeat(4, minmax(0, 1fr)); }
@media (min-width: 1200px) and (max-width: 1920px) { .zn-query-grid.is-single-row { grid-template-columns: repeat(3, minmax(0, 1fr)); } .zn-query-grid.is-single-row .overview-query-actions { grid-column: 3; grid-row: 2; } }
@media (min-width: 720px) and (max-width: 1199px) { .zn-query-grid.is-single-row { grid-template-columns: repeat(2, minmax(0, 1fr)); } .zn-query-grid.is-single-row .overview-query-actions { grid-column: 2; grid-row: 2; } }
@media (max-width: 719px) { .zn-query-grid.is-single-row { grid-template-columns: minmax(0, 1fr); } .zn-query-grid.is-single-row .overview-query-actions { grid-column: 1; grid-row: auto; } }

.zn-auto-switch {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 32px;
  color: #525765;
  font-size: 14px;
  line-height: 32px;
  white-space: nowrap;
}

.zn-shift-module .overview-toolbar {
  align-items: center;
  overflow: visible;
}

.zn-shift-module .schedule-overview,
.zn-shift-module .schedule-workspace {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}

.zn-shift-module .overview-query-card,
.zn-shift-module .overview-tabs-row,
.zn-shift-module .overview-toolbar,
.zn-shift-module .overview-footer {
  flex: 0 0 auto;
}

.zn-shift-module .overview-content-card {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

/* 整月排班：精简一屏均分日期列；常规按排班块内容自适应，可横向滚动 */
.zn-shift-module .overview-matrix {
  --schedule-fixed-width: 200px;
  flex: 1 1 auto;
  min-height: 0;
  overflow-x: auto;
  overflow-y: auto;
}

.zn-shift-module .overview-matrix .overview-person-col,
.zn-shift-module .overview-matrix .overview-person-cell {
  width: 148px;
  min-width: 148px;
  max-width: 148px;
  padding-left: 8px;
  padding-right: 8px;
  text-align: left;
  box-sizing: border-box;
}

.zn-shift-module .overview-matrix .overview-person-cell > div {
  margin: 0;
  text-align: left;
}

/* 搜索框：列内左右各 8px（由 th padding），自身 width 100% 铺满 */
.zn-shift-module .overview-matrix th.overview-person-col .overview-person-header {
  display: block;
  width: 100%;
  box-sizing: border-box;
  justify-content: flex-start;
}

.zn-shift-module .overview-matrix th.overview-person-col .overview-search,
.zn-shift-module .overview-matrix th.overview-person-col .overview-search.el-input {
  display: block;
  box-sizing: border-box;
  width: 100% !important;
  flex: none;
  max-width: 100%;
}

.zn-shift-module .overview-matrix th.overview-person-col .overview-search .el-input__inner,
.zn-shift-module .overview-matrix:not(.zn-cycle-matrix) th.overview-person-col .overview-search .el-input__inner {
  box-sizing: border-box;
  width: 100% !important;
  min-width: 0 !important;
  max-width: 100%;
  height: 32px;
  line-height: 30px;
}

.zn-shift-module .overview-matrix th.overview-person-col .overview-search .el-input__prefix,
.zn-shift-module .overview-matrix th.overview-person-col .overview-search .el-input__suffix {
  display: flex;
  height: 100%;
  align-items: center;
  justify-content: center;
  transform: translateY(1px);
}

.zn-shift-module .overview-matrix th.overview-person-col .overview-search .el-input__prefix {
  left: 10px;
}

.zn-shift-module .overview-matrix th.overview-person-col .overview-search .el-input__prefix .el-input__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 32px;
  margin: 0;
  color: #868d9f;
  font-size: 14px;
  line-height: 32px;
}

.zn-shift-module .overview-matrix .overview-rest-col,
.zn-shift-module .overview-matrix .overview-rest-cell {
  width: 52px;
  min-width: 52px;
  max-width: 52px;
}

/* 精简：日期列均分剩余宽度，尽量一屏展示整月 */
.zn-shift-module .overview-matrix.density-compact table {
  width: 100%;
  min-width: 1302px;
  table-layout: fixed;
}

.zn-shift-module .overview-matrix.density-compact .overview-date-col,
.zn-shift-module .overview-matrix.density-compact .overview-shift-cell {
  width: calc((100% - var(--schedule-fixed-width)) / var(--schedule-day-count, 31));
  min-width: 28px;
  max-width: none;
  padding-left: 2px;
  padding-right: 2px;
  box-sizing: border-box;
}

.zn-shift-module .overview-matrix.density-compact th.overview-date-col {
  padding: 6px 1px;
}

.zn-shift-module .overview-matrix.density-compact .overview-shift-chip {
  min-width: 0;
  width: 100%;
  max-width: 100%;
  padding-left: 2px;
  padding-right: 2px;
}

/* 常规：列宽随排班块内容撑开，不限制一屏天数 */
.zn-shift-module .overview-matrix.density-normal table {
  width: max-content;
  min-width: 100%;
  table-layout: auto;
}

.zn-shift-module .overview-matrix.density-normal .overview-date-col,
.zn-shift-module .overview-matrix.density-normal .overview-shift-cell {
  width: auto;
  min-width: 96px;
  max-width: none;
  padding-left: 6px;
  padding-right: 6px;
  box-sizing: border-box;
  white-space: nowrap;
}

.zn-shift-module .overview-matrix.density-normal .overview-shift-chip.is-regular {
  width: auto;
  min-width: 0;
  max-width: none;
  margin: 0 auto;
}

.zn-shift-module .overview-matrix .overview-date-head-stack > strong,
.zn-shift-module .overview-matrix .overview-date-head-stack > span {
  font-size: 12px;
  line-height: 16px;
}

.zn-shift-module .overview-matrix .overview-date-col.is-past {
  color: #a0a6b3;
  background: #f7f8fa;
}

.zn-shift-module .overview-matrix .overview-date-col.is-past .overview-date-head-stack strong,
.zn-shift-module .overview-matrix .overview-date-col.is-past .overview-date-head-stack span {
  color: #a0a6b3;
}

.zn-shift-module .overview-matrix .overview-shift-cell.is-past {
  background: #fafbfc;
}

.zn-shift-module .overview-matrix .overview-shift-cell.is-past .overview-shift-chip,
.zn-shift-module .overview-matrix .overview-shift-cell.is-past .rest-cell {
  opacity: 0.55;
}

.zn-shift-module .overview-tabs-row {
  overflow: visible;
}

.zn-shift-module .overview-tabs {
  gap: 32px;
}

.zn-shift-module .overview-tab {
  display: inline-flex;
  align-items: center;
  color: #868d9f;
  font-size: 14px;
  font-weight: 400;
  line-height: 20px;
  cursor: pointer;
}

.zn-shift-module .overview-tab.is-active {
  color: #23252b;
  font-weight: 500;
  cursor: default;
}

.zn-shift-module .overview-tab.is-active::after {
  display: block;
  background: #3c6ef0;
}

.zn-shift-module .overview-toolbar-left,
.zn-shift-module .overview-toolbar-right,
.zn-shift-module .overview-toolbar-legend {
  align-items: center;
}

.zn-shift-module .zn-toolbar-smart {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 12px;
  margin-left: auto;
  overflow: visible;
}

.zn-shift-module .btn-smart-schedule-wrap {
  overflow: visible;
}

.zn-shift-module .overview-toolbar-left .el-checkbox {
  display: inline-flex;
  align-items: center;
  height: 32px;
  line-height: 32px;
}

.zn-shift-module .overview-toolbar-left .el-checkbox ::v-deep .el-checkbox__label {
  line-height: 32px;
}

.zn-shift-module .overview-toolbar-left .el-button--text {
  display: inline-flex !important;
  align-items: center;
  justify-content: center;
  height: 32px !important;
  padding-top: 0 !important;
  padding-bottom: 0 !important;
}

.zn-shift-module .overview-toolbar-right .overview-density-switch {
  height: 32px;
}

.zn-shift-module .overview-toolbar-right .el-button,
.zn-shift-module .overview-toolbar-right .overview-icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.zn-shift-module .zn-schedule-filter-icon.overview-icon-btn {
  color: #525765;
}

.zn-shift-module .zn-schedule-filter-icon.overview-icon-btn.is-active,
.zn-shift-module .zn-schedule-filter-icon.overview-icon-btn:hover {
  color: #3c6ef0;
}

.zn-shift-module .zn-schedule-filter-icon .overview-toolbar-icon {
  display: block;
  width: 16px;
  height: 16px;
  object-fit: contain;
  flex-shrink: 0;
}

.zn-newcomer-tip {
  padding-bottom: 0;
}

.zn-newcomer-tip__main {
  display: flex;
  align-items: center;
  gap: 8px;
}

.zn-newcomer-tip__icon {
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  object-fit: contain;
}

.zn-newcomer-tip__title {
  flex: 1;
  min-width: 0;
  margin: 0;
  color: #23252b;
  font-size: 14px;
  font-weight: 500;
  line-height: 22px;
}

.zn-newcomer-tip__desc {
  margin: 8px 0 0 24px;
  color: #868d9f;
  font-size: 14px;
  font-weight: 400;
  line-height: 22px;
}

.zn-newcomer-tip__desc strong {
  color: #525765;
  font-weight: 500;
}

.zn-shift-module .overview-shift-cell.is-picker-anchor {
  position: relative;
  z-index: 1;
}

.zn-shift-module .overview-shift-cell.is-picker-anchor .overview-shift-chip,
.zn-shift-module .overview-shift-cell.is-picker-anchor .rest-cell {
  box-shadow: inset 0 0 0 2px #3c6ef0;
}
</style>

<style lang="scss">
/* 筛选浮层挂 body：模块间距 24px，模块内行间距 12px。 */
.zn-schedule-filter-popper.el-popover {
  min-width: 320px;
  padding: 16px;
  border: 1px solid #eaeaea;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(35, 37, 43, 0.1);
}

.zn-schedule-filter {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.zn-schedule-filter__group {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.zn-schedule-filter__title {
  color: #23252b;
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
}

.zn-schedule-filter__group .el-checkbox,
.zn-schedule-filter__group .el-checkbox-group .el-checkbox {
  margin-right: 16px;
  margin-bottom: 0;
  color: #525765;
  font-size: 14px;
  line-height: 20px;
}

.zn-schedule-filter__group .el-checkbox-group {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  column-gap: 16px;
  row-gap: 12px;
  line-height: 20px;
}

.zn-schedule-filter__group .el-checkbox-group .el-checkbox {
  margin-right: 0;
}

.zn-schedule-filter__footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 0;
  padding-top: 0;
}

.zn-schedule-filter__footer .el-button {
  margin-left: 0 !important;
  min-height: 32px;
  border-radius: 8px;
}

/* append-to-body 弹窗：必须用全局样式，scoped 无法稳定命中 */
.zn-cycle-dialog__title {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #23252b;
  font-size: 16px;
  font-weight: 500;
  line-height: 24px;
}

.zn-cycle-days-field {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-wrap: nowrap;
}

.zn-cycle-days-field__error {
  display: flex;
  align-items: center;
  gap: 4px;
  margin: 0;
  width: 174px;
  min-height: 18px;
  padding-left: 64px;
  color: transparent;
  font-size: 12px;
  line-height: 18px;
  white-space: nowrap;
}

.zn-cycle-days-field__error.is-visible {
  color: #fc3737;
}

.zn-cycle-days-field__error-icon {
  display: block;
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  object-fit: contain;
  filter: brightness(0) saturate(100%) invert(31%) sepia(85%) saturate(3418%) hue-rotate(344deg) brightness(104%) contrast(98%);
}

.zn-cycle-days-field.is-error .zn-cycle-days-input.el-input-number.is-controls-right .el-input__inner {
  border-color: #fc3737;
  background: #fff1f0;
  box-shadow: none;
}

.zn-cycle-days-field.is-error .zn-cycle-days-input.el-input-number.is-controls-right .el-input.is-focus .el-input__inner,
.zn-cycle-days-field.is-error .zn-cycle-days-input.el-input-number.is-controls-right .el-input__inner:focus {
  border-color: #fc3737;
  background: #fff1f0;
  box-shadow: none !important;
}

.zn-cycle-dialog__head {
  display: flex;
  flex-direction: column;
  gap: 0;
  margin-bottom: 16px;
  flex-shrink: 0;
}

.zn-cycle-dialog__head-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  align-items: center;
  gap: 24px;
  min-height: 32px;
}

.zn-cycle-dialog__head-meta {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: start;
  gap: 24px;
  min-height: 0;
  margin-top: 0;
}

.zn-cycle-dialog__head:not(.has-rule-toast) .zn-cycle-dialog__head-meta {
  display: none;
}

.zn-cycle-dialog__head.has-rule-toast {
  margin-bottom: 12px;
}

.zn-cycle-dialog__head.has-rule-toast .zn-cycle-dialog__head-meta {
  margin-top: 12px;
}

.zn-cycle-dialog__head.has-rule-toast .zn-cycle-dialog__head-meta-left {
  grid-column: 1 / -1;
}

.zn-cycle-dialog__head.has-rule-toast .zn-cycle-dialog__head-meta-right {
  display: none;
}

.zn-cycle-dialog__head-meta-left {
  min-width: 0;
}

.zn-cycle-rule-toast-slot {
  min-height: 0;
}

.zn-cycle-rule-toast-slot.is-active {
  min-height: 38px;
}

.zn-cycle-dialog__head-meta-right {
  display: flex;
  justify-content: flex-end;
  align-items: flex-start;
  width: 174px;
  min-width: 174px;
}

.zn-cycle-dialog__head-left,
.zn-cycle-dialog__head-right {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-wrap: nowrap;
  min-height: 32px;
}

.zn-cycle-dialog__head-left {
  justify-self: start;
  width: auto;
  min-width: 0;
}

.zn-cycle-dialog__head-right {
  justify-self: end;
  justify-content: flex-end;
}

.zn-cycle-dialog .head-label {
  color: #525765;
  font-size: 14px;
  line-height: 22px;
  white-space: nowrap;
}

.zn-cycle-dialog .unit {
  color: #525765;
  font-size: 14px;
  line-height: 22px;
}

.zn-cycle-month-picker.overseas-query-date.el-date-editor.el-input {
  width: 240px !important;
  min-width: 240px;
  max-width: 240px;
  flex: 0 0 240px;
}

.zn-cycle-rule-toast {
  display: flex;
  align-items: center;
  box-sizing: border-box;
  gap: 8px;
  width: 100%;
  max-width: 100%;
  min-height: 32px;
  padding: 4px 16px;
  border: 1px solid #ffd9b8;
  border-radius: 8px;
  background: rgba(255, 119, 0, 0.1);
  color: #525765;
  font-size: 14px;
  line-height: 22px;
  white-space: nowrap;
}

.zn-cycle-rule-toast__icon {
  flex-shrink: 0;
  margin-top: 0;
  object-fit: contain;
}

.zn-cycle-dialog__alerts {
  display: none;
}

.zn-cycle-matrix-wrap {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  overscroll-behavior: none;
}

.zn-cycle-matrix-wrap.is-horizontal-scroll {
  overflow: hidden;
}

.zn-cycle-matrix.overview-matrix.is-cycle-scroll {
  scrollbar-width: thin;
  scrollbar-color: #b8bdc7 transparent;
}

.zn-cycle-matrix.overview-matrix.is-cycle-scroll::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.zn-cycle-matrix.overview-matrix.is-cycle-scroll::-webkit-scrollbar-track,
.zn-cycle-matrix.overview-matrix.is-cycle-scroll::-webkit-scrollbar-corner {
  background: transparent;
  box-shadow: none;
}

.zn-cycle-matrix.overview-matrix.is-cycle-scroll::-webkit-scrollbar-thumb {
  border: 2px solid transparent;
  border-radius: 999px;
  background: #b8bdc7;
  background-clip: content-box;
  box-shadow: none;
}

.zn-cycle-matrix.overview-matrix {
  width: 100%;
  flex: 0 1 auto;
  min-height: 0;
  max-height: none;
  overflow: auto;
  border: 1px solid #f1f2f4;
  border-radius: 8px;
  background-clip: padding-box;
  overscroll-behavior: none;
}

.zn-cycle-matrix.overview-matrix table {
  table-layout: fixed;
  width: 100%;
  min-width: 0;
  border-collapse: separate;
  border-spacing: 0;
}

.zn-cycle-matrix.overview-matrix.is-cycle-scroll table {
  width: var(--cycle-table-min-width, 824px) !important;
  min-width: var(--cycle-table-min-width, 824px) !important;
}

.zn-cycle-matrix.overview-matrix.is-cycle-scroll {
  width: 100%;
  min-width: 0;
  overflow: auto;
}

.zn-cycle-matrix.overview-matrix .overview-person-col,
.zn-cycle-matrix.overview-matrix th.overview-person-col,
.zn-cycle-matrix.overview-matrix .overview-person-cell {
  width: 108px;
  min-width: 108px;
  max-width: 108px;
  padding-left: 8px;
  padding-right: 8px;
}

.zn-cycle-matrix.overview-matrix .overview-rest-col,
.zn-cycle-matrix.overview-matrix .overview-rest-cell {
  width: 48px;
  min-width: 48px;
  max-width: 48px;
}

.zn-cycle-matrix.overview-matrix .overview-period-col,
.zn-cycle-matrix.overview-matrix .overview-period-cell {
  width: 104px;
  min-width: 104px;
  max-width: 104px;
  padding-right: 8px;
  padding-left: 8px;
  text-align: center;
}

.zn-cycle-matrix.overview-matrix .overview-operation-col,
.zn-cycle-matrix.overview-matrix .overview-operation-cell {
  position: sticky;
  right: 0;
  width: 72px;
  min-width: 72px;
  max-width: 72px;
  text-align: center;
  background: #fff;
  box-shadow: none;
}

.zn-cycle-matrix.overview-matrix thead .overview-operation-col {
  z-index: 3;
  right: 0;
  border-top-right-radius: 8px;
  background: #f5f5f6;
}

.zn-cycle-matrix.overview-matrix tbody .overview-operation-cell {
  z-index: 2;
  right: 0;
}

.zn-cycle-matrix.overview-matrix tbody tr:last-child .overview-operation-cell {
  border-bottom-right-radius: 8px;
}

.zn-cycle-matrix.overview-matrix .overview-date-col,
.zn-cycle-matrix.overview-matrix .overview-shift-cell {
  width: var(--cycle-day-col-width, 88px);
  min-width: var(--cycle-day-col-width, 88px);
  max-width: var(--cycle-day-col-width, 88px);
}

.zn-cycle-matrix.overview-matrix .overview-shift-cell {
  user-select: none;
}

.zn-cycle-matrix.overview-matrix .overview-shift-cell.is-range-selected .overview-shift-chip,
.zn-cycle-matrix.overview-matrix .overview-shift-cell.is-range-selected .rest-cell {
  box-shadow: inset 0 0 0 2px #3c6ef0 !important;
}

.zn-cycle-matrix.overview-matrix .zn-cycle-col-person {
  width: 108px;
}

.zn-cycle-matrix.overview-matrix .zn-cycle-col-rest {
  width: 48px;
}

.zn-cycle-matrix.overview-matrix .zn-cycle-col-period {
  width: 104px;
}

.zn-cycle-matrix.overview-matrix .zn-cycle-col-operation {
  width: 72px;
}

.zn-cycle-matrix.overview-matrix .zn-cycle-col-day {
  width: var(--cycle-day-col-width, 88px);
}

.zn-cycle-matrix.overview-matrix thead th {
  height: 48px;
  padding: 8px 4px;
  color: #525765;
  background: #f5f5f6;
  font-size: 14px;
  font-weight: 500;
}

.zn-cycle-date-head {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0;
  max-width: 100%;
  white-space: nowrap;
}

.zn-cycle-date-head strong,
.zn-cycle-date-head span {
  color: #525765;
  font-size: 12px;
  font-weight: 500;
  line-height: 18px;
}

.zn-cycle-date-head__week {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2px;
  white-space: nowrap;
}

.zn-cycle-matrix.overview-matrix thead th.overview-date-col.is-today .zn-cycle-date-head strong,
.zn-cycle-matrix.overview-matrix thead th.overview-date-col.is-today .zn-cycle-date-head span {
  color: #3c6ef0;
}

.zn-cycle-matrix.overview-matrix tbody tr.is-rule-error-row > td {
  background: #fff1f0 !important;
  position: relative;
  z-index: 4;
}

.zn-cycle-matrix.overview-matrix tbody tr.is-rule-error-row > td::after {
  content: "";
  position: absolute;
  inset: -1px 0;
  z-index: 8;
  border-top: 1px solid #fc3737;
  border-bottom: 1px solid #fc3737;
  pointer-events: none;
}
.zn-cycle-matrix.overview-matrix tbody tr.is-rule-error-row > td:first-child::after { border-left: 1px solid #fc3737; }
.zn-cycle-matrix.overview-matrix tbody tr.is-rule-error-row > td:last-child::after { border-right: 1px solid #fc3737; }

.zn-cycle-matrix.overview-matrix tbody tr.is-rule-error-row:last-child > td:first-child {
  border-bottom-left-radius: 7px;
}

.zn-cycle-matrix.overview-matrix tbody tr.is-rule-error-row:last-child > td:last-child {
  border-bottom-right-radius: 7px;
}

.zn-cycle-matrix.overview-matrix tbody td {
  height: auto;
  color: #525765;
  font-size: 14px;
  line-height: 20px;
  background: #fff;
}

.zn-cycle-matrix .overview-shift-chip.is-compact {
  margin: 0 auto;
}

.zn-cycle-copy-link.el-button {
  height: 32px;
  margin: 0;
  padding: 0 4px;
  color: #3c6ef0;
  font-size: 14px;
  line-height: 22px;
}

.zn-cycle-period-inline {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  width: 100%;
  min-width: 0;
}

.zn-cycle-period-inline__input.el-input {
  width: auto;
  min-width: 0;
  flex: 1 1 auto;
  line-height: 32px;
}

.zn-cycle-period-inline__input.el-input .el-input__inner {
  box-sizing: border-box;
  height: 32px;
  padding: 0 8px;
  border: 1px solid #d9d9d9;
  border-radius: 8px;
  color: #23252b;
  font-size: 14px;
  line-height: 32px;
  text-align: left;
}

.zn-cycle-period-inline__input.el-input .el-input__inner:hover {
  border-color: #d8e2fc;
}

.zn-cycle-period-inline__input.el-input .el-input__inner:focus {
  border-color: #3c6ef0;
  box-shadow: none;
}

.zn-cycle-period-inline__unit {
  flex: 0 0 auto;
  color: #525765;
  font-size: 14px;
  line-height: 22px;
}

.zn-cycle-period-inline.is-error .el-input__inner {
  border-color: #fc3737;
  background: #fff1f0;
}

.zn-cycle-matrix .overview-person-cell > div {
  min-width: 0;
  margin: 0;
  line-height: 1.2;
  text-align: left;
}

.zn-cycle-matrix .overview-person-cell strong {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  max-width: 100%;
  overflow: hidden;
  color: #23252b;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.zn-cycle-matrix .overview-person-cell small {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.zn-cycle-matrix__person-label {
  display: block;
  box-sizing: border-box;
  width: 100%;
  padding: 0;
  color: #525765;
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  text-align: left;
}

.zn-cycle-dialog {
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  min-height: 360px;
  max-height: 640px;
  overflow: visible;
}

.el-dialog__wrapper:has(> .zn-cycle-dialog),
.el-dialog__wrapper:has(> .zn-newcomer-tip-dialog),
.zn-centered-dialog-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: visible;
  padding: 24px 0;
  box-sizing: border-box;
}

.el-dialog__wrapper:has(> .zn-cycle-dialog).dialog-fade-enter-active,
.el-dialog__wrapper:has(> .zn-newcomer-tip-dialog).dialog-fade-enter-active,
.zn-centered-dialog-wrapper.dialog-fade-enter-active {
  animation: zn-centered-wrapper-fade-in 0.3s;
}

.el-dialog__wrapper:has(> .zn-cycle-dialog).dialog-fade-leave-active,
.el-dialog__wrapper:has(> .zn-newcomer-tip-dialog).dialog-fade-leave-active,
.zn-centered-dialog-wrapper.dialog-fade-leave-active {
  animation: zn-centered-wrapper-fade-out 0.3s;
}

@keyframes zn-centered-wrapper-fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes zn-centered-wrapper-fade-out {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}

.zn-cycle-dialog.el-dialog,
.zn-newcomer-tip-dialog.el-dialog {
  margin: 0 !important;
  flex-shrink: 0;
}

.zn-cycle-dialog .el-dialog__header {
  flex-shrink: 0;
  margin: 0;
  padding: 16px 24px;
  overflow: visible;
  border-bottom: 1px solid #eaeaea; /* 弹层分割线，勿用表格描边 #f1f2f4 */
}

.zn-cycle-dialog .el-dialog__headerbtn {
  top: 16px;
  right: 20px;
  width: 20px;
  height: 20px;
  font-size: 18px;
}

.zn-cycle-dialog .el-dialog__headerbtn .el-dialog__close {
  color: #868d9f;
  font-size: 18px;
  line-height: 20px;
}

.zn-cycle-dialog .el-dialog__headerbtn:hover .el-dialog__close {
  color: #525765;
}

.zn-cycle-dialog .el-dialog__body {
  flex: 1;
  min-height: 0;
  padding: 16px 24px;
  overflow: auto;
  display: flex;
  flex-direction: column;
  color: #525765;
  font-size: 14px;
  line-height: 22px;
  -webkit-overflow-scrolling: touch;
}

.zn-cycle-dialog .el-dialog__footer {
  flex-shrink: 0;
  margin: 0;
  padding: 0 !important;
  border-top: 1px solid #eaeaea; /* 弹层分割线，勿用表格描边 #f1f2f4 */
}

.zn-cycle-dialog__footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  box-sizing: border-box;
  width: 100%;
  padding: 12px 24px 16px;
}

.zn-cycle-dialog__footer .el-button {
  min-height: 32px;
  height: 32px;
  padding: 0 16px;
  border-radius: 8px;
  font-size: 14px;
  line-height: 14px;
}

.zn-cycle-dialog__footer .el-button + .el-button {
  margin-left: 0;
}

.zn-cycle-dialog__footer .el-button:not(.el-button--primary):not(.el-button--text) {
  color: #23252b;
  border: 1px solid #f5f5f6;
  background: #f5f5f6;
}

.zn-cycle-dialog__footer .el-button:not(.el-button--primary):not(.el-button--text):not(.is-disabled):hover,
.zn-cycle-dialog__footer .el-button:not(.el-button--primary):not(.el-button--text):not(.is-disabled):focus {
  color: #3c6ef0;
  background: #edf2ff;
}

.zn-cycle-dialog__footer .el-button--primary {
  color: #fff;
  border: 1px solid #3c6ef0;
  background: #3c6ef0;
}

.zn-cycle-dialog__footer .el-button--primary:not(.is-disabled):hover,
.zn-cycle-dialog__footer .el-button--primary:not(.is-disabled):focus {
  color: #fff;
  background: #638bf3;
}

/* PC3.0 数字输入框：居左输入 + 右侧步进（Figma 2135:52153） */
.zn-cycle-dialog .zn-cycle-days-input.el-input-number {
  width: 88px;
  line-height: 32px;
}

.zn-cycle-dialog .zn-cycle-days-input.el-input-number.is-controls-right .el-input__inner {
  box-sizing: border-box;
  height: 32px;
  padding: 0 28px 0 8px;
  border: 1px solid #d9d9d9; /* 表单控件描边；表格才用 #f1f2f4 */
  border-radius: 8px;
  background: #fff;
  color: #23252b;
  font-size: 14px;
  line-height: 32px;
  text-align: left;
  transition: border-color 0.16s ease, box-shadow 0.16s ease;
}

.zn-cycle-dialog .zn-cycle-days-input.el-input-number.is-controls-right .el-input__inner:hover {
  border-color: rgba(60, 110, 240, 0.35);
}

.zn-cycle-dialog .zn-cycle-days-input.el-input-number.is-controls-right .el-input.is-focus .el-input__inner,
.zn-cycle-dialog .zn-cycle-days-input.el-input-number.is-controls-right .el-input__inner:focus {
  border-color: #3c6ef0;
  box-shadow: 0 0 0 3px rgba(60, 110, 240, 0.15);
}

.zn-cycle-dialog .zn-cycle-days-input.el-input-number.is-controls-right .el-input-number__increase,
.zn-cycle-dialog .zn-cycle-days-input.el-input-number.is-controls-right .el-input-number__decrease {
  box-sizing: border-box;
  width: 20px;
  height: 15px;
  line-height: 15px;
  right: 4px;
  background: transparent;
  border: 0;
  color: #525765;
}

.zn-cycle-dialog .zn-cycle-days-input.el-input-number.is-controls-right .el-input-number__increase {
  top: 1px;
  bottom: auto;
  border-radius: 0;
}

.zn-cycle-dialog .zn-cycle-days-input.el-input-number.is-controls-right .el-input-number__decrease {
  top: auto;
  bottom: 1px;
  left: auto;
  border-radius: 0;
}

.zn-cycle-dialog .zn-cycle-days-input.el-input-number.is-controls-right .el-input-number__increase [class*='el-icon'],
.zn-cycle-dialog .zn-cycle-days-input.el-input-number.is-controls-right .el-input-number__decrease [class*='el-icon'] {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 14px;
  font-size: 12px;
  line-height: 1;
  transform: none;
}

.zn-cycle-dialog .zn-cycle-days-input.el-input-number.is-controls-right .el-input-number__increase:hover,
.zn-cycle-dialog .zn-cycle-days-input.el-input-number.is-controls-right .el-input-number__decrease:hover {
  color: #3c6ef0;
}

.zn-cycle-dialog .zn-cycle-days-input.el-input-number.is-controls-right .el-input-number__increase.is-disabled,
.zn-cycle-dialog .zn-cycle-days-input.el-input-number.is-controls-right .el-input-number__decrease.is-disabled {
  color: #babec7;
  cursor: not-allowed;
}

.zn-cycle-dialog .zn-cycle-days-input.el-input-number.is-controls-right .el-input-number__increase.is-disabled:hover,
.zn-cycle-dialog .zn-cycle-days-input.el-input-number.is-controls-right .el-input-number__decrease.is-disabled:hover {
  color: #babec7;
}

.zn-cycle-matrix .overview-shift-cell.is-picker-anchor {
  position: relative;
  z-index: 1;
}

.zn-cycle-matrix .overview-shift-cell.is-picker-anchor .overview-shift-chip,
.zn-cycle-matrix .overview-shift-cell.is-picker-anchor .rest-cell {
  box-shadow: inset 0 0 0 2px #3c6ef0;
}

.zn-newcomer-tip-dialog {
  overflow: hidden;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(35, 37, 43, 0.1);
}

.zn-newcomer-tip-dialog .el-dialog__header {
  box-sizing: border-box;
  height: 0 !important;
  min-height: 0 !important;
  max-height: 0 !important;
  margin: 0;
  padding: 0 !important;
  overflow: visible;
  border-bottom: 0 !important;
}

.zn-newcomer-tip-dialog .el-dialog__title {
  display: none;
}

.zn-newcomer-tip-dialog .el-dialog__headerbtn {
  position: absolute;
  top: 16px;
  right: 20px;
  z-index: 1;
  width: 16px !important;
  min-width: 16px !important;
  max-width: 16px !important;
  height: 16px !important;
  min-height: 16px !important;
  max-height: 16px !important;
  padding: 0;
  line-height: 16px;
}

.zn-newcomer-tip-dialog .el-dialog__headerbtn .el-dialog__close {
  color: #868d9f;
  font-size: 16px;
  line-height: 16px;
}

.zn-newcomer-tip-dialog .el-dialog__headerbtn:hover .el-dialog__close {
  color: #525765;
}

.zn-newcomer-tip-dialog .el-dialog__body {
  box-sizing: border-box;
  padding: 24px 24px 20px !important;
  color: #525765;
  font-size: 14px;
  line-height: 22px;
}

.zn-newcomer-tip-dialog .zn-newcomer-tip__title,
.zn-newcomer-tip-dialog .zn-newcomer-tip__desc,
.zn-newcomer-tip-dialog .el-button,
.zn-newcomer-tip-dialog .el-button span {
  font-size: 14px !important;
  line-height: 22px;
}

.zn-newcomer-tip-dialog .el-dialog__footer {
  box-sizing: border-box;
  height: 56px;
  margin: 0;
  padding: 0 !important;
  border-top: 1px solid #e8e8e8;
}

.zn-newcomer-tip-dialog .zn-newcomer-tip__footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  box-sizing: border-box;
  width: 100%;
  height: 55px;
  padding: 0 24px;
}

.zn-newcomer-tip-dialog .zn-newcomer-tip__footer .el-button + .el-button {
  margin-left: 0;
}

.zn-newcomer-tip-dialog .zn-newcomer-tip__btn-secondary.el-button {
  min-width: 72px;
  height: 32px;
  padding: 0 16px;
  border: 1px solid #f5f5f6;
  border-radius: 8px;
  background: #f5f5f6; /* 次按钮底，勿用表格描边 #f1f2f4 */
  color: #23252b;
  font-size: 14px;
  line-height: 22px;
}

.zn-newcomer-tip-dialog .zn-newcomer-tip__btn-secondary.el-button:hover,
.zn-newcomer-tip-dialog .zn-newcomer-tip__btn-secondary.el-button:focus {
  background: #edf2ff;
  color: #3c6ef0;
}

.zn-newcomer-tip-dialog .el-dialog__footer .el-button--primary {
  min-width: 72px;
  height: 32px;
  padding: 0 16px;
  border: 0;
  border-radius: 8px;
  background: #3c6ef0;
  color: #fff;
  font-size: 14px;
  line-height: 22px;
}

.zn-newcomer-tip-dialog .el-dialog__footer .el-button--primary:hover,
.zn-newcomer-tip-dialog .el-dialog__footer .el-button--primary:focus {
  background: #618df5;
  color: #fff;
}

.zn-cycle-period-popover.el-popover {
  box-sizing: border-box;
  padding: 16px;
  border: 0;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(35, 37, 43, 0.12);
}

.zn-cycle-period-editor {
  display: flex;
  flex-direction: column;
  gap: 12px;
  color: #525765;
  font-size: 14px;
  line-height: 22px;
}

.zn-cycle-period-editor > label {
  color: #23252b;
  font-weight: 500;
}

.zn-cycle-period-editor__field {
  display: flex;
  align-items: center;
  gap: 8px;
}

.zn-cycle-period-editor__field .zn-cycle-days-input.el-input-number {
  width: 144px;
  line-height: 32px;
}

.zn-cycle-period-editor__field .zn-cycle-days-input .el-input__inner {
  box-sizing: border-box;
  height: 32px;
  padding: 0 28px 0 8px;
  border: 1px solid #d9d9d9;
  border-radius: 8px;
  color: #23252b;
  font-size: 14px;
  line-height: 32px;
  text-align: left;
}

.zn-cycle-period-editor__field .zn-cycle-days-input .el-input__inner:focus {
  border-color: #3c6ef0;
  box-shadow: 0 0 0 3px rgba(60, 110, 240, 0.15);
}

.zn-cycle-period-editor__field .zn-cycle-days-input .el-input-number__increase,
.zn-cycle-period-editor__field .zn-cycle-days-input .el-input-number__decrease {
  box-sizing: border-box;
  right: 4px;
  width: 20px;
  height: 15px;
  border: 0;
  background: transparent;
  line-height: 15px;
}

.zn-cycle-period-editor__field .zn-cycle-days-input .el-input-number__increase {
  top: 1px;
  bottom: auto;
}

.zn-cycle-period-editor__field .zn-cycle-days-input .el-input-number__decrease {
  top: auto;
  bottom: 1px;
  left: auto;
}

.zn-cycle-period-editor__field.is-error .el-input__inner {
  border-color: #fc3737;
  background: #fff1f0;
}

.zn-cycle-period-editor__error {
  margin: -8px 0 0;
  color: #fc3737;
  font-size: 12px;
  line-height: 18px;
}

.zn-cycle-period-editor__actions,
.zn-copy-schedule-dialog__footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
}

.zn-cycle-period-editor__actions .el-button + .el-button,
.zn-copy-schedule-dialog__footer .el-button + .el-button {
  margin-left: 0;
}

.zn-copy-schedule-dialog.el-dialog {
  overflow: hidden;
  border-radius: 8px;
}

.zn-copy-schedule-dialog .el-dialog__header {
  box-sizing: border-box;
  min-height: 48px;
  margin: 0;
  padding: 13px 24px;
  border-bottom: 1px solid #eaeaea;
}

.zn-copy-schedule-dialog .el-dialog__title {
  color: #23252b;
  font-size: 16px;
  font-weight: 500;
  line-height: 22px;
}

.zn-copy-schedule-dialog .el-dialog__headerbtn {
  top: 15px;
  right: 20px;
}

.zn-copy-schedule-dialog .el-dialog__body {
  padding: 16px 24px 24px;
}

.zn-copy-schedule-dialog__body {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.zn-copy-schedule-dialog__tip {
  margin: 0;
  color: #525765;
  font-size: 14px;
  line-height: 22px;
}

.zn-copy-schedule-dialog__form-row {
  display: grid;
  grid-template-columns: 64px minmax(0, 1fr);
  align-items: center;
  gap: 12px;
}

.zn-copy-schedule-dialog__form-row > label {
  color: #525765;
  font-size: 14px;
  line-height: 22px;
  text-align: right;
}

.zn-copy-schedule-dialog__form-row .el-select {
  width: 100%;
}

.zn-copy-schedule-dialog__form-row .el-input__inner {
  height: 32px;
  border-radius: 8px;
  line-height: 32px;
}

.zn-copy-schedule-dialog .el-dialog__footer {
  padding: 12px 24px 16px;
  border-top: 1px solid #eaeaea;
}

.zn-copy-schedule-dialog__footer .el-button {
  height: 32px;
  padding: 0 16px;
  border-radius: 8px;
}

.zn-copy-schedule-dialog__footer .zn-copy-schedule-dialog__cancel.el-button {
  border-color: transparent;
  background: #f5f5f6;
  color: #23252b;
}

.zn-copy-schedule-dialog__footer .zn-copy-schedule-dialog__cancel.el-button:hover,
.zn-copy-schedule-dialog__footer .zn-copy-schedule-dialog__cancel.el-button:focus {
  border-color: transparent;
  background: #eaeaea;
  color: #23252b;
}
</style>
