const BODY_CLASS = 'is-page-fullscreen'

export default {
  data() {
    return {
      pageFullscreen: false,
    }
  },
  mounted() {
    document.addEventListener('keydown', this.onPageFullscreenKeydown)
  },
  beforeDestroy() {
    document.removeEventListener('keydown', this.onPageFullscreenKeydown)
    this.exitPageFullscreen()
  },
  methods: {
    togglePageFullscreen() {
      if (this.pageFullscreen) this.exitPageFullscreen()
      else this.enterPageFullscreen()
    },
    enterPageFullscreen() {
      this.pageFullscreen = true
      document.body.classList.add(BODY_CLASS)
    },
    exitPageFullscreen() {
      this.pageFullscreen = false
      document.body.classList.remove(BODY_CLASS)
    },
    onPageFullscreenKeydown(event) {
      if (event.key === 'Escape' && this.pageFullscreen) {
        this.exitPageFullscreen()
      }
    },
  },
}
