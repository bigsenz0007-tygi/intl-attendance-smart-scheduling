<template>
  <el-dialog
    title="出勤要求"
    :visible.sync="innerVisible"
    width="720px"
    append-to-body
    :close-on-click-modal="false"
    custom-class="zn-attendance-dialog"
    @closed="$emit('closed')"
  >
    <div class="zn-attendance-dialog__body">
      <nav class="zn-attendance-nav">
        <button
          type="button"
          class="zn-attendance-nav__item"
          :class="{ 'is-active': sideTab === 'days' }"
          @click="sideTab = 'days'"
        >出勤天数</button>
        <button
          type="button"
          class="zn-attendance-nav__item"
          :class="{ 'is-active': sideTab === 'headcount' }"
          @click="sideTab = 'headcount'"
        >出勤人数</button>
      </nav>
      <div class="zn-attendance-content">
        <div class="zn-attendance-month-tabs">
          <button
            v-for="month in monthTabs"
            :key="month"
            type="button"
            class="zn-attendance-month-tab"
            :class="{ 'is-active': activeMonth === month }"
            @click="activeMonth = month"
          >{{ month }}</button>
        </div>
        <div v-if="sideTab === 'days'" class="zn-attendance-card">
          <p
            v-for="rule in dayRules"
            :key="rule.type"
            class="zn-attendance-rule"
          >
            {{ rule.type }} 最大出勤天数 <em class="zn-attendance-num">{{ rule.maxWork }}</em> 天，
            最大休息天数 <em class="zn-attendance-num">{{ rule.maxRest }}</em> 天，
            如有疑问可咨询
            <button type="button" class="zn-attendance-contact">{{ rule.contact }}</button>
            <i class="el-icon-chat-dot-round zn-attendance-chat"></i>
          </p>
        </div>
        <div v-else class="zn-attendance-list">
          <div
            v-for="(item, index) in headcountRules"
            :key="`${item.date}-${index}`"
            class="zn-attendance-list__row"
          >
            <span class="zn-attendance-list__date">{{ item.date }}</span>
            <span class="zn-attendance-list__type">{{ item.type }}</span>
            <span class="zn-attendance-list__label">最大出勤人数</span>
            <span class="zn-attendance-num">{{ item.max }}</span>
            <span>人</span>
          </div>
        </div>
      </div>
    </div>
  </el-dialog>
</template>

<script>
import { ATTENDANCE_DAY_RULES, ATTENDANCE_HEADCOUNT_RULES } from './mock'

export default {
  name: 'AttendanceRequirementDialog',
  props: {
    visible: { type: Boolean, default: false },
  },
  data() {
    return {
      innerVisible: this.visible,
      sideTab: 'days',
      activeMonth: '2026-08',
      monthTabs: ['2026-08', '2026-09', '2026-10'],
      dayRules: ATTENDANCE_DAY_RULES,
      headcountRules: ATTENDANCE_HEADCOUNT_RULES,
    }
  },
  watch: {
    visible(val) {
      this.innerVisible = val
    },
    innerVisible(val) {
      this.$emit('update:visible', val)
    },
  },
}
</script>
