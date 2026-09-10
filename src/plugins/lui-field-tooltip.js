const FIELD_INPUT_SELECTOR = [
  '.query-item .el-input__inner',
  '.overview-query-card .el-input__inner',
  '.zn-query-grid .el-input__inner',
  '.monitor-query-item .el-input__inner',
  '.shift-picker-body .el-input__inner',
  '.overview-search .el-input__inner',
  '.step-three .el-input__inner',
].join(', ')

function disableChildTooltips(vm) {
  if (!vm) return
  if (vm.$options.name === 'ElTooltip') {
    vm.disabled = true
  }
  ;(vm.$children || []).forEach(disableChildTooltips)
}

function stripNativeInputTitles(root) {
  if (!root || !root.querySelectorAll) return
  root.querySelectorAll(FIELD_INPUT_SELECTOR).forEach((el) => {
    el.removeAttribute('title')
  })
}

function guardSelectTooltips(vm) {
  if (vm.$options.name === 'ElSelect') {
    disableChildTooltips(vm)
  }
  stripNativeInputTitles(vm.$el)
}

/** 查询/筛选/常规表单输入：关闭 LUI Select 选中值气泡与原生 title 提示 */
export function installFieldTooltipGuard(Vue) {
  Vue.mixin({
    mounted() {
      this.$nextTick(() => guardSelectTooltips(this))
    },
    updated() {
      this.$nextTick(() => guardSelectTooltips(this))
    },
  })
}
