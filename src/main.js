import Vue from 'vue'
import LuiUI from '@lui/lui-ui'
import '@lui/lui-ui/lib/theme-chalk/index.css'
import '@lui/lui-ui/lib/theme-chalk/display.css'
import { installFieldTooltipGuard } from './plugins/lui-field-tooltip'
import App from './App.vue'
import './styles/fonts.scss'
import './styles/page.scss'
import './styles/scheduling/element-overrides.scss'
import './styles/scheduling/shift-drawer-alert.scss'
import './styles/scheduling/legend-editing.scss'
import './styles/scheduling/domestic-smart-cycle.scss'
import './styles/scheduling/rotation-day-picker.scss'
import './styles/scheduling/viewport-layout.scss'

Vue.use(LuiUI)
installFieldTooltipGuard(Vue)
Vue.config.productionTip = false

new Vue({
  render: (h) => h(App),
}).$mount('#app')
