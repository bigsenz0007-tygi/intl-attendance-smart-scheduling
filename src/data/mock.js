export const dates = [
  { key: '07-17', week: '周五', label: '07/17' },
  { key: '07-18', week: '周六', label: '07/18' },
  { key: '07-19', week: '周日', label: '07/19' },
  { key: '07-20', week: '周一', label: '07/20' },
  { key: '07-21', week: '周二', label: '07/21' },
  { key: '07-22', week: '周三', label: '07/22' },
  { key: '07-23', week: '周四', label: '07/23' },
  { key: '07-24', week: '周五', label: '07/24' },
]

export const employees = [
  { id: 1, name: '陈育红', code: 'bjcyh110', type: '临时工', group: '入库', skill: '收货/上架', quality: 'A', cost: '€18.5/h' },
  { id: 2, name: '常彩云', code: 'changcaiyun', type: '临时工', group: '入库', skill: '收货/质检', quality: 'A', cost: '€17.8/h' },
  { id: 3, name: '陈光辉', code: 'chenguanghui19', type: '临时工', group: '在库', skill: '补货/盘点', quality: 'B', cost: '€16.2/h' },
  { id: 4, name: '陈光培', code: 'chenguangpei3', type: '临时工', group: '出库', skill: '拣货/复核', quality: 'A', cost: '€19.0/h' },
  { id: 5, name: '陈红', code: 'chenhong08', type: '临时工', group: '出库', skill: '包装/交接', quality: 'A', cost: '€18.2/h' },
  { id: 6, name: '陈建军', code: 'chenjianjun6', type: '正式员工', group: '常规', skill: '现场管理', quality: 'A', cost: '固定薪资' },
  { id: 7, name: '陈立新', code: 'chenlixin22', type: '临时工', group: '逆退', skill: '退件质检', quality: 'B', cost: '€15.8/h' },
  { id: 8, name: '陈明', code: 'chenming88', type: '正式员工', group: '异常', skill: '异常处理', quality: 'A', cost: '固定薪资' },
  { id: 9, name: '侯文广', code: 'houwenguang', type: '临时工', group: '入库', skill: '收货', quality: 'A', cost: '€17.5/h' },
  { id: 10, name: '黄晓燕', code: 'huangxiaoyan', type: '临时工', group: '出库', skill: '拣货', quality: 'A', cost: '€18.0/h' },
  { id: 11, name: '贾文静', code: 'jiawenjing', type: '临时工', group: '在库', skill: '盘点', quality: 'B', cost: '€16.5/h' },
  { id: 12, name: '李娜', code: 'lina09', type: '临时工', group: '出库', skill: '复核', quality: 'A', cost: '€17.2/h' },
  { id: 13, name: '刘洋', code: 'liuyang21', type: '正式员工', group: '常规', skill: '现场管理', quality: 'A', cost: '固定薪资' },
  { id: 14, name: '马超', code: 'machao33', type: '临时工', group: '入库', skill: '上架', quality: 'B', cost: '€16.8/h' },
  { id: 15, name: '宋佳', code: 'songjia15', type: '临时工', group: '逆退', skill: '退件', quality: 'A', cost: '€17.0/h' },
  { id: 16, name: '王芳', code: 'wangfang07', type: '临时工', group: '出库', skill: '包装', quality: 'A', cost: '€18.1/h' },
  { id: 17, name: '赵磊', code: 'zhaolei12', type: '正式员工', group: '异常', skill: '异常处理', quality: 'A', cost: '固定薪资' },
  { id: 18, name: '周敏', code: 'zhoumin18', type: '临时工', group: '在库', skill: '补货', quality: 'B', cost: '€16.0/h' },
]

const rowValues = (items) => dates.reduce((acc, item, index) => ({ ...acc, [item.key]: items[index] }), {})

export const forecastRows = [
  { id: 'order-volume', category: 'metric', label: '单量（万）', metric: '业务算法预测', unit: '', kind: 'readonly', values: rowValues([102, 109, 120, 110, 80, 0, 0, 0]) },
  { id: 'efficiency', category: 'metric', label: '人效', metric: '业务算法预测', unit: '', kind: 'readonly', values: rowValues([78, 89, 80, 75, 67, 36, 46, 50]) },
  { id: 'hour-inbound', category: 'process', processKey: 'inbound', label: '入库', metric: '业务算法推荐工时', unit: 'h', kind: 'readonly', values: rowValues([102, 109, 120, 110, 80, 0, 0, 0]) },
  { id: 'hour-inventory', category: 'process', processKey: 'inventory', label: '在库', metric: '业务算法推荐工时', unit: 'h', kind: 'readonly', values: rowValues([102, 109, 120, 110, 80, 0, 0, 0]) },
  { id: 'hour-outbound', category: 'process', processKey: 'outbound', label: '出库', metric: '业务算法推荐工时', unit: 'h', kind: 'readonly', values: rowValues([78, 89, 80, 75, 67, 36, 46, 50]) },
  { id: 'hour-reverse', category: 'process', processKey: 'reverse', label: '逆退', metric: '业务算法推荐工时', unit: 'h', kind: 'readonly', values: rowValues([47, 45, 34, 44, 45, 25, 16, 20]) },
  { id: 'hour-exception', category: 'process', processKey: 'exception', label: '异常', metric: '业务算法推荐工时', unit: 'h', kind: 'readonly', values: rowValues([67, 65, 58, 53, 43, 47, 56, 52]) },
  { id: 'people-5s', category: 'process', processKey: '5s', label: '5S', metric: '上周同日出勤人数（排班+异常回补）', unit: '人', kind: 'editable', values: rowValues([3, 0, 4, 3, 3, 2, 2, 3]) },
  { id: 'people-security', category: 'process', processKey: 'security', label: '保安', metric: '上周同日出勤人数（排班+异常回补）', unit: '人', kind: 'editable', values: rowValues([2, 2, 2, 2, 2, 2, 2, 2]) },
  { id: 'people-offline', category: 'process', processKey: 'offline', label: '线下业务', metric: '上周同日出勤人数（排班+异常回补）', unit: '人', kind: 'editable', values: rowValues([5, 6, 5, 5, 4, 3, 4, 5]) },
  { id: 'people-regular', category: 'process', processKey: 'regular', label: '常规', metric: '上周同日出勤人数（排班+异常回补）', unit: '人', kind: 'editable', values: rowValues([5, 5, 5, 5, 5, 5, 5, 5]) },
]

export const shifts = [
  { id: 'REST', name: '休息', time: '00:00-23:59', color: '#A8AEB8', light: '#F0F1F4', isRest: true },
  { id: 'Z1', name: '早班1次', time: '08:00-20:00', color: '#8BC557', light: '#EEF7E4' },
  { id: 'Z2', name: '早班2次', time: '08:00-15:00', color: '#02B57D', light: '#E0F6EE' },
  { id: 'Z3', name: '中班1次', time: '11:00-15:00', color: '#44CEBF', light: '#E6F8F6' },
  { id: 'Z4', name: '中班2次', time: '23:00-06:00', color: '#C5AC8D', light: '#F6F1EA' },
  { id: 'Z5', name: '晚班1次', time: '18:00-02:00', color: '#F59A23', light: '#FFF4E5' },
  { id: 'Z6', name: '早班3次', time: '09:00-18:00', color: '#5B8DEF', light: '#EAF1FF' },
  { id: 'Z7', name: '早班4次', time: '09:00-18:00', color: '#7BB661', light: '#EEF7E8' },
  { id: 'Z8', name: '(跳)早班7次', time: '08:00-17:00', color: '#12B35D', light: '#E5F8EE', outlined: true },
]

const schedulePattern = [
  ['Z1', 'Z1', 'Z1', '休', 'Z2', 'Z2', 'Z2', 'Z2'],
  ['Z2', 'Z2', 'Z2', 'Z2', '休', 'Z1', 'Z1', 'Z1'],
  ['Z3', 'Z3', '休', 'Z3', 'Z3', 'Z3', 'Z3', '休'],
  ['Z1', 'Z1', 'Z1', 'Z1', 'Z1', '休', 'Z2', 'Z2'],
  ['Z2', 'Z2', '休', 'Z2', 'Z2', 'Z2', 'Z2', 'Z2'],
  ['Z1', 'Z1', 'Z1', 'Z1', '休', '休', 'Z1', 'Z1'],
  ['Z4', 'Z4', 'Z4', '休', 'Z4', 'Z4', 'Z4', 'Z4'],
  ['Z1', '休', 'Z1', 'Z1', 'Z1', 'Z1', 'Z1', '休'],
  ['Z5', 'Z5', '休', 'Z5', 'Z5', 'Z5', '休', 'Z5'],
  ['Z1', 'Z2', 'Z1', '休', 'Z2', 'Z1', 'Z2', 'Z1'],
  ['Z3', '休', 'Z3', 'Z3', 'Z4', 'Z4', '休', 'Z3'],
  ['Z2', 'Z2', 'Z2', 'Z2', '休', 'Z5', 'Z5', 'Z5'],
  ['Z1', 'Z1', '休', 'Z1', 'Z1', 'Z1', 'Z1', '休'],
  ['Z4', 'Z4', 'Z4', 'Z4', '休', 'Z4', 'Z4', 'Z4'],
  ['Z6', 'Z6', '休', 'Z6', 'Z6', 'Z7', 'Z7', '休'],
  ['Z1', '休', 'Z2', 'Z2', 'Z2', '休', 'Z1', 'Z1'],
  ['Z8', 'Z8', 'Z8', '休', 'Z8', 'Z8', '休', 'Z8'],
  ['Z3', 'Z3', 'Z3', 'Z3', '休', 'Z3', 'Z3', 'Z3'],
]

export const scheduleRows = employees.map((employee, rowIndex) => ({
  ...employee,
  recommendedHours: employee.type === '临时工' ? 56 : 40,
  actualHours: employee.type === '临时工' ? 56 + (rowIndex % 3) * 2 : 40,
  shifts: dates.reduce((acc, date, dateIndex) => ({ ...acc, [date.key]: schedulePattern[rowIndex][dateIndex] }), {}),
}))
