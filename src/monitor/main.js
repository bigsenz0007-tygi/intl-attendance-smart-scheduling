import Vue from 'vue'
import LuiUI from '@lui/lui-ui'
import '@lui/lui-ui/lib/theme-chalk/index.css'
import '@lui/lui-ui/lib/theme-chalk/display.css'
import { installFieldTooltipGuard } from '../plugins/lui-field-tooltip'
import App from './App.vue'
import '../styles/fonts.scss'
import '../styles/page.scss'
import './monitor.scss'

Vue.use(LuiUI)
installFieldTooltipGuard(Vue)
Vue.config.productionTip = false

new Vue({
  render: (h) => h(App),
}).$mount('#app')
