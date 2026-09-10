<template>
  <el-dialog
    title="人员异常详情"
    :visible.sync="innerVisible"
    width="600px"
    append-to-body
    :close-on-click-modal="false"
    custom-class="zn-person-exception-dialog"
  >
    <div v-if="employee" class="zn-person-exception-dialog__content">
      <div class="zn-person-exception-dialog__type">
        <i class="el-icon-warning" aria-hidden="true"></i>
        <strong>{{ employee.exception.type }}</strong>
      </div>
      <p>{{ employee.name }}（{{ employee.code }}） {{ employee.exception.detail }}</p>
    </div>
    <span slot="footer">
      <el-button type="primary" @click="innerVisible = false">我知道了</el-button>
    </span>
  </el-dialog>
</template>

<script>
export default {
  name: 'PersonExceptionDialog',
  props: {
    visible: { type: Boolean, default: false },
    employee: { type: Object, default: null },
  },
  computed: {
    innerVisible: {
      get() { return this.visible },
      set(value) { this.$emit('update:visible', value) },
    },
  },
}
</script>

<style scoped>
.zn-person-exception-dialog__content {
  min-height: 104px;
  color: #525765;
  font-size: 14px;
  line-height: 22px;
}

.zn-person-exception-dialog__type {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  color: #23252b;
}

.zn-person-exception-dialog__type i {
  color: #fa8c16;
  font-size: 16px;
}

.zn-person-exception-dialog__content p {
  margin: 8px 0 0;
}
</style>
