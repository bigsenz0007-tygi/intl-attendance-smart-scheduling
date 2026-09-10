/** 0629 导航更新 · 系统壳层菜单（非本次排班业务内容） */

export const shellNavTree = [
  { id: 'home', label: '首页', icon: 'home.svg' },
  { id: 'users', label: '用户管理', icon: 'group.svg' },
  { id: 'groups', label: '考勤组管理', icon: 'surface.svg' },
  { id: 'config', label: '基础配置', icon: 'setting.svg' },
  {
    id: 'schedule-mgmt',
    label: '排班管理',
    icon: 'document.svg',
    expandable: true,
    children: [
      { id: 'schedule-domestic', label: '排班倒班', mode: 'schedule-domestic' },
      { id: 'smart-domestic', label: '智能排班', mode: 'smart-domestic' },
      { id: 'schedule-intl', label: '排班倒班（国际）', mode: 'schedule-intl' },
      { id: 'smart-intl', label: '智能排班（国际）', mode: 'smart-intl' },
    ],
  },
  { id: 'exception', label: '异常管理', icon: 'exception.svg' },
  { id: 'report', label: '报表管理', icon: 'feedback.svg' },
  { id: 'my-schedule', label: '我的排班', icon: 'schedule.svg' },
  { id: 'my-flow', label: '我的流程', icon: 'material.svg' },
  { id: 'my-export', label: '我的导出', icon: 'download.svg' },
  {
    id: 'dashboard',
    label: '数据看板',
    icon: 'data4.svg',
    expandable: true,
    children: [
      { id: 'org-monitor', label: '业务机构监控' },
      { id: 'hr-monitor', label: '人资绑定监控' },
      { id: 'arch-monitor', label: '标准架构监控' },
    ],
  },
]

export const shellDecorativeTabs = [
  { id: 'vendor', label: '供应商信息', variant: 'hover', shaped: true },
  { id: 'bid', label: '招投标管理' },
]
