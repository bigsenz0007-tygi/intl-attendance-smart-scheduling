<template>
  <el-dialog
    :visible.sync="innerVisible"
    width="960px"
    append-to-body
    :close-on-click-modal="false"
    custom-class="zn-operation-help-dialog"
  >
    <el-tabs v-model="activeTab" class="zn-operation-help-tabs">
      <el-tab-pane label="新手引导" name="guide">
        <div class="zn-help-split">
          <nav class="zn-help-split__nav">
            <button
              v-for="step in guideSteps"
              :key="step.id"
              type="button"
              class="zn-help-split__nav-item"
              :class="{ 'is-active': activeGuideId === step.id }"
              @click="activeGuideId = step.id"
            >{{ step.title }}</button>
          </nav>
          <div class="zn-help-split__main">
            <p class="zn-help-split__desc">{{ activeGuide.content }}</p>
            <div class="zn-help-guide-preview" :class="`is-${activeGuide.preview}`" aria-hidden="true">
              <div v-if="activeGuide.preview === 'query'" class="zn-help-guide-preview__toolbar">
                <span
                  v-for="field in queryPreviewFields"
                  :key="field"
                  class="zn-help-guide-preview__field"
                  :class="{ 'is-mark': field === '部门' }"
                >{{ field }}</span>
              </div>
              <div v-else-if="activeGuide.preview === 'shift'" class="zn-help-guide-preview__shift">
                <div class="zn-help-guide-preview__shift-bar">
                  <span class="zn-help-guide-preview__add is-mark">+ 添加</span>
                  <i class="zn-help-guide-preview__arrow"></i>
                  <em class="zn-help-guide-preview__tip">添加班次入口</em>
                </div>
                <div class="zn-help-guide-preview__chips">
                  <span v-for="chip in shiftPreviewChips" :key="chip" class="zn-help-guide-preview__chip">{{ chip }}</span>
                </div>
              </div>
              <div v-else class="zn-help-guide-preview__grid"></div>
            </div>
          </div>
        </div>
      </el-tab-pane>

      <el-tab-pane label="出勤要求" name="attendance">
        <div class="zn-help-split">
          <nav class="zn-help-split__nav">
            <button
              type="button"
              class="zn-help-split__nav-item"
              :class="{ 'is-active': attendanceSide === 'days' }"
              @click="attendanceSide = 'days'"
            >出勤天数</button>
            <button
              type="button"
              class="zn-help-split__nav-item"
              :class="{ 'is-active': attendanceSide === 'headcount' }"
              @click="attendanceSide = 'headcount'"
            >出勤人数</button>
          </nav>
          <div class="zn-help-split__main">
            <div class="zn-help-folder">
              <div class="zn-help-folder__tabs">
                <button
                  v-for="month in monthTabs"
                  :key="month"
                  type="button"
                  class="zn-help-folder__tab"
                  :class="{ 'is-active': activeMonth === month }"
                  @click="activeMonth = month"
                >{{ month }}</button>
              </div>
              <div v-if="attendanceSide === 'days'" class="zn-help-folder__body">
                <p
                  v-for="rule in dayRules"
                  :key="rule.type"
                  class="zn-help-rule"
                >
                  <strong class="zn-help-rule__type">{{ rule.type }}</strong>
                  最大出勤天数 <em class="zn-help-rule__num">{{ rule.maxWork }}</em> 天，
                  最大休息天数 <em class="zn-help-rule__num">{{ rule.maxRest }}</em> 天，
                  如有疑问可咨询
                  <button type="button" class="zn-help-rule__contact">{{ rule.contact }}</button>
                  <i class="el-icon-chat-dot-round zn-help-rule__chat"></i>
                </p>
              </div>
              <div v-else class="zn-help-folder__body">
                <p
                  v-for="(item, index) in visibleHeadcountRules"
                  :key="`${item.date}-${index}`"
                  class="zn-help-rule"
                >
                  <strong class="zn-help-rule__type">{{ item.type }}</strong>
                  {{ item.date }} 最大出勤人数 <em class="zn-help-rule__num">{{ item.max }}</em> 人
                </p>
              </div>
            </div>
          </div>
        </div>
      </el-tab-pane>

      <el-tab-pane label="快捷键" name="shortcuts">
        <div class="zn-operation-shortcuts-table">
          <table>
            <colgroup>
              <col class="zn-operation-shortcuts-table__key-col" />
              <col />
              <col class="zn-operation-shortcuts-table__key-col" />
              <col />
            </colgroup>
            <thead>
              <tr>
                <th>快捷键</th>
                <th>功能说明</th>
                <th>快捷键</th>
                <th>功能说明</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, index) in shortcutRows" :key="index">
                <td>{{ row.left.keys }}</td>
                <td>{{ row.left.desc }}</td>
                <td>{{ row.right ? row.right.keys : '' }}</td>
                <td>{{ row.right ? row.right.desc : '' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </el-tab-pane>
    </el-tabs>
  </el-dialog>
</template>

<script>
import {
  ATTENDANCE_DAY_RULES,
  ATTENDANCE_HEADCOUNT_RULES,
  BEGINNER_GUIDE_STEPS,
  OPERATION_SHORTCUTS,
} from './mock'
import { assetUrl } from '../utils/assetUrl'

export default {
  name: 'OperationHelpDialog',
  props: {
    visible: { type: Boolean, default: false },
    initialTab: {
      type: String,
      default: 'guide',
      validator: (value) => ['shortcuts', 'attendance', 'guide'].includes(value),
    },
  },
  data() {
    return {
      innerVisible: this.visible,
      activeTab: this.initialTab,
      activeGuideId: BEGINNER_GUIDE_STEPS[0].id,
      attendanceSide: 'days',
      activeMonth: '2026-08',
      monthTabs: ['2026-08', '2026-09'],
      dayRules: ATTENDANCE_DAY_RULES,
      headcountRules: ATTENDANCE_HEADCOUNT_RULES,
      guideSteps: BEGINNER_GUIDE_STEPS,
      shortcuts: OPERATION_SHORTCUTS,
      queryPreviewFields: ['部门', '考勤组', '排班时间'],
      shiftPreviewChips: ['早班1次', '中班1次', '晚班1次', '休息'],
    }
  },
  computed: {
    activeGuide() {
      return this.guideSteps.find((step) => step.id === this.activeGuideId) || this.guideSteps[0]
    },
    visibleHeadcountRules() {
      return this.headcountRules.filter((item) => String(item.date).startsWith(this.activeMonth))
    },
    shortcutRows() {
      const rows = []
      for (let index = 0; index < this.shortcuts.length; index += 2) {
        rows.push({ left: this.shortcuts[index], right: this.shortcuts[index + 1] || null })
      }
      return rows
    },
  },
  methods: {
    assetUrl,
  },
  watch: {
    visible(value) {
      this.innerVisible = value
      if (value) {
        this.activeTab = this.initialTab
        this.activeGuideId = this.guideSteps[0].id
        this.attendanceSide = 'days'
      }
    },
    innerVisible(value) {
      this.$emit('update:visible', value)
    },
    initialTab(value) {
      if (this.innerVisible) this.activeTab = value
    },
  },
}
</script>
