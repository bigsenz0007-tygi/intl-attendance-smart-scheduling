<template>
  <aside class="app-sidebar">
    <div class="app-sidebar__inner">
      <div class="app-sidebar__group">
        <template v-for="item in navTree">
          <div
            v-if="!item.children"
            :key="item.id"
            class="app-nav-item"
            :class="{ 'is-active': isLeafActive(item) }"
            @click="onLeafClick(item)"
          >
            <shell-icon class="app-nav-item__icon" :src="navIcon(item, isLeafActive(item))" />
            <span class="app-nav-item__label">{{ item.label }}</span>
          </div>

          <div v-else :key="item.id" class="app-nav-block">
            <div
              class="app-nav-item"
              :class="{ 'is-parent-active': isParentActive(item) }"
              @click="onParentClick(item)"
            >
              <shell-icon class="app-nav-item__icon" :src="navIcon(item, isParentActive(item))" />
              <span class="app-nav-item__label">{{ item.label }}</span>
              <shell-icon
                v-if="item.expandable"
                class="app-nav-item__arrow"
                :name="isExpanded(item) ? 'chevronUp' : 'chevronDown'"
                size="chevron"
              />
            </div>
            <template v-if="isExpanded(item)">
              <div
                v-for="child in item.children"
                :key="child.id"
                class="app-nav-item app-nav-item--child"
                :class="{ 'is-active': isChildActive(child) }"
                @click.stop="onChildClick(child, item)"
              >
                <span class="app-nav-item__label">{{ child.label }}</span>
                <shell-icon
                  v-if="child.expandable !== false && item.id === 'dashboard'"
                  class="app-nav-item__arrow"
                  name="chevronUp"
                  size="chevron"
                />
              </div>
            </template>
          </div>
        </template>
      </div>
    </div>
    <span class="app-sidebar__divider" aria-hidden="true"></span>
  </aside>
</template>

<script>
import { assetUrl } from '../../utils/assetUrl'
import { shellNavTree } from '../../data/shell-nav'
import ShellIcon from './ShellIcon.vue'

export default {
  name: 'AppSidebar',
  components: { ShellIcon },
  props: {
    viewMode: { type: String, default: 'schedule' },
  },
  data() {
    return {
      navTree: shellNavTree,
      expandedIds: ['schedule-mgmt', 'dashboard'],
      selectedLeafId: null,
    }
  },
  watch: {
    viewMode: {
      immediate: true,
      handler(mode) {
        const scheduleModes = [
          'schedule-domestic',
          'schedule-intl',
          'smart-domestic',
          'smart-intl',
        ]
        if (scheduleModes.includes(mode) && !this.expandedIds.includes('schedule-mgmt')) {
          this.expandedIds.push('schedule-mgmt')
        }
        this.selectedLeafId = null
      },
    },
  },
  methods: {
    assetUrl,
    navIcon(item, isActive) {
      const base = String(item.icon || '').replace(/\.svg$/, '')
      const file = isActive ? `${base}-active.svg` : `${base}.svg`
      return assetUrl(`shell/nav/${file}`)
    },
    isExpanded(item) {
      return this.expandedIds.includes(item.id)
    },
    isChildActive(child) {
      return child.mode && child.mode === this.viewMode
    },
    isParentActive(item) {
      if (item.id === 'schedule-mgmt') return this.hasScheduleActive()
      return false
    },
    isLeafActive(item) {
      return this.selectedLeafId === item.id
    },
    hasScheduleActive() {
      return [
        'schedule-domestic',
        'schedule-intl',
        'smart-domestic',
        'smart-intl',
      ].includes(this.viewMode)
    },
    onParentClick(item) {
      if (!item.expandable) return
      if (this.isExpanded(item)) {
        this.expandedIds = this.expandedIds.filter((id) => id !== item.id)
      } else {
        this.expandedIds = [...this.expandedIds, item.id]
      }
    },
    onLeafClick(item) {
      this.selectedLeafId = item.id
      this.$emit('placeholder', item.label)
    },
    onChildClick(child, parent) {
      if (child.mode) {
        this.selectedLeafId = null
        this.$emit('navigate', child.mode)
        return
      }
      if (parent && parent.id === 'schedule-mgmt') return
      this.$emit('placeholder', child.label)
    },
  },
}
</script>
