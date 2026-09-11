export default {
  computed: {
    scheduleStatsByDate() {
      return this.dates.reduce((result, date) => {
        const values = this.filteredRows.map((row) => row.shifts && row.shifts[date.key])
        result[date.key] = {
          shiftCount: values.filter((value) => value && value !== 'EMPTY' && value !== '休' && value !== 'REST').length,
          restCount: values.filter((value) => value === '休' || value === 'REST').length,
          emptyCount: values.filter((value) => !value || value === 'EMPTY').length,
        }
        return result
      }, {})
    },
    hasActiveScheduleFilter() {
      return this.onlyUnscheduled
        || this.filterApplied.showScheduleData
        || this.filterApplied.staffStatus.length < 2
        || this.filterApplied.empType.length < 2
        || this.filterApplied.position.length < 1
    },
  },
  methods: {
    createDefaultFilterState() {
      return {
        onlyUnscheduled: false,
        showScheduleData: false,
        staffStatus: ['normal', 'changed'],
        empType: ['A', 'I'],
        position: ['sorter'],
      }
    },
    cloneFilterState(source) {
      return {
        onlyUnscheduled: Boolean(source.onlyUnscheduled),
        showScheduleData: Boolean(source.showScheduleData),
        staffStatus: [...(source.staffStatus || [])],
        empType: [...(source.empType || [])],
        position: [...(source.position || [])],
      }
    },
    onFilterPopoverShow() {
      this.filterDraft = this.cloneFilterState({ ...this.filterApplied, onlyUnscheduled: this.onlyUnscheduled })
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
  },
}
