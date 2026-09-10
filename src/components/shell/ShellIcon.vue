<template>
  <img
    class="shell-icon"
    :class="sizeClass"
    :src="resolvedSrc"
    alt=""
    aria-hidden="true"
    draggable="false"
  >
</template>

<script>
import { assetUrl } from '../../utils/assetUrl'
import { shellIcons } from '../../data/shell-icons'

export default {
  name: 'ShellIcon',
  props: {
    name: { type: String, default: '' },
    src: { type: String, default: '' },
    size: {
      type: String,
      default: 'md',
      validator: (v) => ['md', 'sm', 'tab', 'chevron', 'close'].includes(v),
    },
  },
  computed: {
    sizeClass() {
      if (this.size === 'sm') return 'shell-icon--sm'
      if (this.size === 'tab') return 'shell-icon--tab'
      if (this.size === 'chevron') return 'shell-icon--chevron'
      if (this.size === 'close') return 'shell-icon--close'
      return ''
    },
    resolvedSrc() {
      if (this.src) {
        return this.src.startsWith('http') || this.src.startsWith('/')
          ? this.src
          : assetUrl(this.src)
      }
      const path = shellIcons[this.name]
      return path ? assetUrl(path) : ''
    },
  },
}
</script>
