#!/usr/bin/env node
/**
 * 海外仓智能排班静态预览（独立进程，不依赖 vue-cli）
 * 固定只监听 127.0.0.1:4177，避免与其他项目端口冲突。
 */
const http = require('http')
const fs = require('fs')
const path = require('path')

const root = path.join(__dirname, 'dist')
const host = '127.0.0.1'
const port = Number(process.env.PORT || 4177)
const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.map': 'application/json',
}

if (!fs.existsSync(path.join(root, 'index.html'))) {
  console.error('缺少 dist/index.html，请先在本目录执行: npm run build')
  process.exit(1)
}

const server = http.createServer((req, res) => {
  const pathname = decodeURIComponent((req.url || '/').split('?')[0])
  const requested = pathname === '/' ? '/index.html' : pathname
  let file = path.join(root, requested)
  if (!file.startsWith(root)) file = path.join(root, 'index.html')
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(root, 'index.html')
  res.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream')
  res.setHeader('Cache-Control', 'no-store')
  fs.createReadStream(file).pipe(res)
})

server.on('error', (err) => {
  if (err && err.code === 'EADDRINUSE') {
    console.error(`端口 ${port} 已被占用。可先执行: lsof -iTCP:${port} -sTCP:LISTEN`)
    process.exit(1)
  }
  throw err
})

server.listen(port, host, () => {
  console.log(`Preview: http://${host}:${port}/`)
  console.log(`Root: ${root}`)
})
