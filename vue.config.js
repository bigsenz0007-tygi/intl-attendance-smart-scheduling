const publicPath = process.env.VUE_APP_PUBLIC_PATH || '/'

module.exports = {
  publicPath,
  lintOnSave: false,
  productionSourceMap: false,
  css: {
    loaderOptions: {
      scss: {
        prependData: `$public-path: '${publicPath}';`,
      },
    },
  },
  pages: {
    index: {
      entry: 'src/main.js',
      template: 'public/index.html',
      filename: 'index.html',
      title: '海外仓智能排班 · 设计预览',
    },
    monitor: {
      entry: 'src/monitor/main.js',
      template: 'public/monitor.html',
      filename: 'monitor.html',
      title: '排班监控中心 · 设计预览',
    },
  },
  configureWebpack: {
    cache: false,
  },
  devServer: {
    host: '127.0.0.1',
    port: 4177,
    disableHostCheck: true,
  },
}
