const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')
const files = [path.join(root, 'src/styles/page.scss')]
const forbidden = /^(?:\.el-|\.v-modal\b|body\b.*(?:\.el-|\.v-modal\b))/
const violations = []

files.forEach((file) => {
  fs.readFileSync(file, 'utf8').split(/\r?\n/).forEach((line, index) => {
    if (forbidden.test(line)) violations.push(`${path.relative(root, file)}:${index + 1} ${line.trim()}`)
  })
})

if (violations.length) {
  console.error('Unscoped LUI/Element selectors found:')
  console.error(violations.join('\n'))
  console.error('Move them to src/styles/scheduling/element-overrides.scss and add an explicit scheduling boundary.')
  process.exit(1)
}

const frozenLargeFiles = [
  { file: path.join(root, 'src/styles/page.scss'), maxLines: 6807 },
  { file: path.join(root, 'src/zn/ZnShiftModule.vue'), maxLines: 3651 },
]
const oversized = frozenLargeFiles.flatMap(({ file, maxLines }) => {
  const lines = fs.readFileSync(file, 'utf8').replace(/\r?\n$/, '').split(/\r?\n/).length
  return lines > maxLines
    ? [`${path.relative(root, file)} has ${lines} lines (frozen baseline: ${maxLines}). Extract the new feature into a scoped module instead of growing this file.`]
    : []
})

if (oversized.length) {
  console.error('Large-file budget exceeded:')
  console.error(oversized.join('\n'))
  process.exit(1)
}

console.log('Style scope check passed.')
