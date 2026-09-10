<template>
  <div class="quick-menu-bar">
    <div class="quick-menu-bar__scroll">
      <div
        v-for="(tab, index) in tabs"
        :key="tab.id"
        class="quick-menu-tab-item"
        :class="{ 'is-dragging': dragIndex === index }"
        draggable="true"
        @dragstart="onDragStart(index, $event)"
        @dragenter.prevent
        @dragover.prevent="onDragOver(index, $event)"
        @drop.prevent="onDrop"
        @dragend="onDragEnd"
        @click="onTabClick(tab.id)"
      >
        <div
          v-if="isShaped(tab)"
          class="quick-menu-tab quick-menu-tab--shaped"
          :class="{
            'is-hover': !isActive(tab) && tab.shaped,
            'is-active': isActive(tab),
          }"
        >
          <img
            v-if="isActive(tab)"
            class="quick-menu-tab__cap quick-menu-tab__cap--left-active"
            :src="assetUrl('shell/tabs/cap-left-active.svg')"
            alt=""
            aria-hidden="true"
            draggable="false"
          >
          <template v-else>
            <img
              class="quick-menu-tab__cap quick-menu-tab__cap--left-sm"
              :src="assetUrl('shell/tabs/cap-left-sm.svg')"
              alt=""
              aria-hidden="true"
              draggable="false"
            >
            <img
              class="quick-menu-tab__cap quick-menu-tab__cap--left-md"
              :src="assetUrl('shell/tabs/cap-left-md.svg')"
              alt=""
              aria-hidden="true"
              draggable="false"
            >
          </template>
          <div class="quick-menu-tab__body">
            <quick-menu-tab-actions :label="tab.label" @refresh="onRefresh(tab)" />
          </div>
          <img
            class="quick-menu-tab__cap quick-menu-tab__cap--right"
            :src="assetUrl('shell/tabs/cap-right.svg')"
            alt=""
            aria-hidden="true"
            draggable="false"
          >
        </div>

        <div v-else class="quick-menu-tab-wrap">
          <div class="quick-menu-tab" :class="`is-${tab.variant || 'default'}`">
            <quick-menu-tab-actions :label="tab.label" @refresh="onRefresh(tab)" />
          </div>
        </div>
      </div>
    </div>

    <div class="quick-menu-bar__aside">
      <el-tooltip
        v-if="showFullscreen"
        :content="fullscreen ? '退出全屏' : '全屏显示'"
        placement="bottom"
        popper-class="lui-pc-tooltip"
      >
        <button
          type="button"
          class="overview-fullscreen-btn"
          :aria-label="fullscreen ? '退出全屏' : '全屏显示'"
          @click="$emit('toggle-fullscreen')"
        >
          <img
            class="overview-fullscreen-icon"
            :src="assetUrl('lui-icon-fullscreen.svg')"
            alt=""
            width="16"
            height="16"
            draggable="false"
          >
        </button>
      </el-tooltip>
    </div>
  </div>
</template>

<script>
import { assetUrl } from '../../utils/assetUrl'
import { shellDecorativeTabs } from '../../data/shell-nav'
import QuickMenuTabActions from './QuickMenuTabActions.vue'
import ShellIcon from './ShellIcon.vue'

const PAGE_TAB_ID = 'current-page'

export default {
  name: 'AppQuickMenuTabs',
  components: { QuickMenuTabActions, ShellIcon },
  props: {
    activeTitle: { type: String, required: true },
    extraDecorativeTabs: { type: Array, default: () => [] },
    showFullscreen: { type: Boolean, default: false },
    fullscreen: { type: Boolean, default: false },
  },
  data() {
    return {
      tabs: [],
      activeId: PAGE_TAB_ID,
      dragIndex: -1,
      dragging: false,
    }
  },
  created() {
    this.rebuildTabs()
  },
  watch: {
    extraDecorativeTabs: {
      handler() {
        this.rebuildTabs()
      },
      deep: true,
    },
    activeTitle(val) {
      const pageTab = this.tabs.find((tab) => tab.isPage)
      if (!pageTab) {
        this.rebuildTabs()
        return
      }
      pageTab.label = val
      this.activeId = pageTab.id
    },
  },
  methods: {
    assetUrl,
    onRefresh(tab) {
      if (this.isActive(tab)) this.$emit('refresh')
    },
    isActive(tab) {
      return tab.id === this.activeId
    },
    isShaped(tab) {
      return this.isActive(tab) || tab.shaped
    },
    sourceTabs() {
      return this.extraDecorativeTabs.length ? this.extraDecorativeTabs : shellDecorativeTabs
    },
    rebuildTabs() {
      const extras = this.sourceTabs().map((tab) => ({
        id: tab.id,
        label: tab.label,
        shaped: !!tab.shaped,
        variant: tab.variant || 'default',
        isPage: false,
      }))
      this.tabs = [
        ...extras,
        {
          id: PAGE_TAB_ID,
          label: this.activeTitle,
          shaped: true,
          variant: 'active',
          isPage: true,
        },
      ]
      this.activeId = PAGE_TAB_ID
    },
    selectTab(id) {
      if (!this.tabs.some((tab) => tab.id === id)) return
      this.activeId = id
    },
    onTabClick(id) {
      if (this.dragging) return
      this.selectTab(id)
    },
    onDragStart(index, event) {
      this.dragging = true
      this.dragIndex = index
      event.dataTransfer.effectAllowed = 'move'
      event.dataTransfer.setData('text/plain', this.tabs[index].id)
    },
    onDragOver(index, event) {
      event.dataTransfer.dropEffect = 'move'
      if (this.dragIndex < 0 || this.dragIndex === index) return
      const next = this.tabs.slice()
      const [moved] = next.splice(this.dragIndex, 1)
      next.splice(index, 0, moved)
      this.tabs = next
      this.dragIndex = index
    },
    onDrop() {},
    onDragEnd() {
      this.dragIndex = -1
      window.setTimeout(() => {
        this.dragging = false
      }, 50)
    },
  },
}
</script>
