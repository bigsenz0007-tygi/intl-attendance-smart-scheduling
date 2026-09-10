# 排班样式边界

排班倒班和智能排班以 `.overseas-schedule-root` 为页面边界。

- 页面内样式优先放在对应 Vue 组件的 `scoped` 样式中。
- 挂载到 `body` 的 Dialog、Drawer、Popover 必须配置业务 `custom-class`，统一放到 `element-overrides.scss`。
- 禁止在 `page.scss` 新增裸 `.el-*`、`.v-modal`、`body .el-*` 选择器。
- 禁止通过提高选择器层级或连续追加 `!important` 修复冲突；先确认样式归属，再移动到正确边界。
- 构建前会执行 `check:styles`；`page.scss` 与 `ZnShiftModule.vue` 已冻结当前行数基线，只允许缩减。新增功能必须进入独立的 scoped 组件或样式模块。

后续拆分顺序：

1. 将 `ZnShiftModule.vue` 的班表、循环配置、筛选区分别拆成子组件。
2. 将其全局样式按 `board.scss`、`cycle-dialog.scss`、`drawers.scss` 拆分。
3. 将 `page.scss` 中壳层公共样式独立为 `shell.scss`，监控页只加载壳层，不再加载排班业务样式。
