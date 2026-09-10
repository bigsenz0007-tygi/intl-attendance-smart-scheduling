<template>
  <span class="quick-menu-tab__actions">
    <span class="quick-menu-tab__label">{{ label }}</span>
    <shell-icon name="refresh" size="tab" @click.native.stop="$emit('refresh')" />
    <shell-icon name="close" size="close" />
  </span>
</template>

<script>
import ShellIcon from './ShellIcon.vue'

export default {
  name: 'QuickMenuTabActions',
  components: { ShellIcon },
  props: {
    label: { type: String, required: true },
  },
}
</script>
