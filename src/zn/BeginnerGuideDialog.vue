<template>
  <el-dialog
    title="新手引导"
    :visible.sync="innerVisible"
    width="960px"
    append-to-body
    :close-on-click-modal="false"
    custom-class="zn-guide-dialog"
    @closed="$emit('closed')"
  >
    <div class="zn-guide-dialog__body">
      <nav class="zn-guide-nav">
        <button
          v-for="step in steps"
          :key="step.id"
          type="button"
          class="zn-guide-nav__item"
          :class="{ 'is-active': activeStepId === step.id }"
          @click="activeStepId = step.id"
        >{{ step.title }}</button>
      </nav>
      <div class="zn-guide-content">
        <h3 class="zn-guide-content__heading">{{ activeStep.heading }}</h3>
        <p class="zn-guide-content__text">{{ activeStep.content }}</p>
        <div class="zn-guide-preview" aria-hidden="true">
          <div class="zn-guide-preview__mock">
            <div class="zn-guide-preview__bar">
              <span
                v-for="field in previewFields"
                :key="field"
                class="zn-guide-preview__field"
                :class="{ 'is-highlight': field === activeStep.heading }"
              >{{ field }}</span>
            </div>
            <div class="zn-guide-preview__grid"></div>
          </div>
        </div>
      </div>
    </div>
  </el-dialog>
</template>

<script>
import { BEGINNER_GUIDE_STEPS } from './mock'

export default {
  name: 'BeginnerGuideDialog',
  props: {
    visible: { type: Boolean, default: false },
  },
  data() {
    return {
      innerVisible: this.visible,
      steps: BEGINNER_GUIDE_STEPS,
      activeStepId: BEGINNER_GUIDE_STEPS[0].id,
      previewFields: ['部门', '考勤组', '排班时间'],
    }
  },
  computed: {
    activeStep() {
      return this.steps.find((step) => step.id === this.activeStepId) || this.steps[0]
    },
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
