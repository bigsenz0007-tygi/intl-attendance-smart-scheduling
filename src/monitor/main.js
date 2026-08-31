import Vue from 'vue'
import LuiUI from '@lui/lui-ui'
import '@lui/lui-ui/lib/theme-chalk/index.css'
import '@lui/lui-ui/lib/theme-chalk/display.css'
import App from './App.vue'
import '../styles/fonts.scss'
import '../styles/page.scss'
import './monitor.scss'

Vue.use(LuiUI)
Vue.config.productionTip = false

new Vue({
  render: (h) => h(App),
}).$mount('#app')
