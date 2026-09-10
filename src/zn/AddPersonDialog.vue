<template>
  <el-dialog
    title="添加人员"
    :visible.sync="innerVisible"
    width="640px"
    append-to-body
    :close-on-click-modal="false"
    custom-class="zn-add-person-dialog"
  >
    <el-input
      v-model="keyword"
      clearable
      prefix-icon="el-icon-search"
      class="zn-add-person-search"
      placeholder="搜索姓名或ERP"
    />

    <div class="zn-add-person-card-scroll">
      <div v-if="filteredPeople.length" class="zn-add-person-card-grid">
        <label
          v-for="person in filteredPeople"
          :key="personKey(person)"
          class="zn-add-person-card"
          :style="personCardStyle(person)"
          :class="{
            'is-selected': isSelected(person),
            'is-disabled': !isSelectable(person),
          }"
        >
          <el-checkbox
            :value="isSelected(person)"
            :disabled="!isSelectable(person)"
            @change="togglePerson(person, $event)"
          />
          <span class="zn-add-person-card__content">
            <strong>{{ person.name }}</strong>
            <small>{{ person.code || person.erp || '--' }}</small>
          </span>
        </label>
      </div>

      <div v-else class="search-empty-state zn-add-person-empty">
        <div class="search-empty-illus" aria-hidden="true">
          <img class="search-empty-shadow" :src="assetUrl('empty-state/empty-shadow.svg')" alt="" width="50" height="16" />
          <img class="search-empty-doc" :src="assetUrl('empty-state/empty-doc.svg')" alt="" width="36" height="30" />
        </div>
        <p>暂时没有数据</p>
      </div>
    </div>

    <div slot="footer" class="zn-add-person-dialog__footer">
      <el-button @click="innerVisible = false">取消</el-button>
      <el-button type="primary" :disabled="selected.length === 0" @click="confirm">确定</el-button>
    </div>
  </el-dialog>
</template>

<script>
import { assetUrl } from '../utils/assetUrl'

export default {
  name: 'AddPersonDialog',
  props: {
    visible: { type: Boolean, default: false },
    /** 可选：未添加班次人员列表；默认空以匹配空态稿 */
    people: { type: Array, default: () => [] },
    /** 当前列表已存在的用户编码/姓名；对应行禁选，防止重复添加 */
    disabledKeys: { type: Array, default: () => [] },
  },
  data() {
    return {
      selected: [],
      keyword: '',
    }
  },
  computed: {
    innerVisible: {
      get() {
        return this.visible
      },
      set(val) {
        this.$emit('update:visible', val)
      },
    },
    filteredPeople() {
      const keyword = this.keyword.trim().toLowerCase()
      if (!keyword) return this.people
      return this.people.filter((person) => (
        `${person.name || ''} ${person.code || person.erp || ''}`.toLowerCase().includes(keyword)
      ))
    },
    disabledKeySet() {
      return new Set((this.disabledKeys || []).map((key) => String(key)))
    },
  },
  watch: {
    visible(val) {
      if (val) {
        this.selected = []
        this.keyword = ''
      }
    },
  },
  methods: {
    assetUrl,
    personKey(person) {
      return String((person && (person.code || person.erp || person.name)) || '')
    },
    isSelected(person) {
      const key = this.personKey(person)
      return this.selected.some((item) => this.personKey(item) === key)
    },
    personCardStyle(person) {
      const palette = (person && person.palette) || {}
      return {
        '--zn-person-color': palette.color || '#3c6ef0',
        '--zn-person-background': palette.background || '#edf2ff',
        '--zn-person-border': palette.borderColor || '#c8d7fb',
      }
    },
    togglePerson(person, checked) {
      const key = this.personKey(person)
      this.selected = checked
        ? this.selected.concat([person]).filter((item, index, list) => (
          list.findIndex((candidate) => this.personKey(candidate) === this.personKey(item)) === index
        ))
        : this.selected.filter((item) => this.personKey(item) !== key)
    },
    isSelectable(row) {
      const code = String((row && row.code) || '')
      const name = String((row && row.name) || '')
      return !this.disabledKeySet.has(code) && !this.disabledKeySet.has(name)
    },
    confirm() {
      this.$emit('confirm', this.selected.slice())
      this.innerVisible = false
    },
  },
}
</script>

<style lang="scss">
.zn-add-person-dialog.el-dialog {
  border-radius: 8px;
  overflow: hidden;
}

.zn-add-person-dialog .el-dialog__header {
  margin: 0;
  padding: 16px 24px;
  border-bottom: 1px solid #eaeaea;
}

.zn-add-person-dialog .el-dialog__title {
  color: #23252b;
  font-size: 16px;
  font-weight: 500;
  line-height: 24px;
}

.zn-add-person-dialog .el-dialog__headerbtn {
  top: 16px;
  right: 20px;
}

.zn-add-person-dialog .el-dialog__body {
  padding: 16px 24px;
}

.zn-add-person-dialog .el-dialog__footer {
  padding: 12px 24px 16px;
  border-top: 1px solid #eaeaea;
}

.zn-add-person-dialog__footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.zn-add-person-dialog__footer .el-button {
  min-width: 72px;
  min-height: 32px;
  margin-left: 0;
  border-radius: 8px;
}

.zn-add-person-dialog__footer .el-button + .el-button { margin-left: 0 !important; }

.zn-add-person-search {
  width: 100%;
  margin-bottom: 16px;
}

.zn-add-person-search .el-input__inner {
  height: 40px;
  border-radius: 8px;
  line-height: 40px;
}

.zn-add-person-search .el-input__icon { line-height: 40px; }

.zn-add-person-card-scroll {
  box-sizing: border-box;
  min-height: 280px;
  max-height: 360px;
  overflow-y: auto;
  padding: 1px 4px 1px 1px;
}

.zn-add-person-card-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}

.zn-add-person-card {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  box-sizing: border-box;
  min-width: 0;
  min-height: 56px;
  padding: 8px 12px;
  border: 1px solid var(--zn-person-border, #c8d7fb);
  border-radius: 8px;
  background: var(--zn-person-background, #edf2ff);
  cursor: pointer;
  transition: border-color .16s ease, background .16s ease, box-shadow .16s ease;
}

.zn-add-person-card:hover {
  border-color: var(--zn-person-color, #3c6ef0);
  background: var(--zn-person-background, #edf2ff);
}

.zn-add-person-card.is-selected {
  border-color: var(--zn-person-color, #3c6ef0);
  background: var(--zn-person-background, #edf2ff);
  box-shadow: none;
}

.zn-add-person-card.is-disabled {
  border-color: var(--zn-person-border, #c8d7fb);
  background: var(--zn-person-background, #edf2ff);
  opacity: .52;
  cursor: not-allowed;
}

.zn-add-person-card .el-checkbox {
  flex: 0 0 auto;
  margin: 2px 0 0;
  line-height: 16px;
}

.zn-add-person-card .el-checkbox__inner {
  border-radius: 4px;
}

.zn-add-person-card__content {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 2px;
}

.zn-add-person-card__content strong,
.zn-add-person-card__content small {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.zn-add-person-card__content strong {
  color: var(--zn-person-color, #3c6ef0);
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
}

.zn-add-person-card__content small {
  color: var(--zn-person-color, #3c6ef0);
  font-size: 12px;
  line-height: 18px;
}

.zn-add-person-empty {
  min-height: 280px;
  padding: 48px 16px 32px;
}

@media (max-width: 720px) {
  .zn-add-person-card-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
</style>
