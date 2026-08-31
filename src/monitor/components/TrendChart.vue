<template>
  <div class="trend-chart">
    <div class="trend-chart__title">
      <i class="trend-chart__bar" :style="{ background: color }"></i>
      <span>{{ title }}</span>
    </div>
    <div class="trend-chart__plot">
      <div class="trend-chart__y-axis" aria-hidden="true">
        <span
          v-for="tick in yTicks"
          :key="'y-' + tick"
          class="trend-chart__axis-num"
          :style="{ top: yPercent(tick) }"
        >{{ tick }}%</span>
      </div>
      <div class="trend-chart__main">
        <svg
          ref="svg"
          class="trend-chart__svg"
          :viewBox="`0 0 ${width} ${height}`"
          preserveAspectRatio="none"
          overflow="visible"
          role="img"
          :aria-label="title"
        >
          <defs>
            <linearGradient :id="gradId" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" :stop-color="color" stop-opacity="0.28" />
              <stop offset="100%" :stop-color="color" stop-opacity="0.02" />
            </linearGradient>
          </defs>

          <g class="trend-chart__grid">
            <line
              v-for="tick in yTicks"
              :key="'g-' + tick"
              :x1="0"
              :x2="width"
              :y1="yOf(tick)"
              :y2="yOf(tick)"
              stroke="#E8EBF0"
              stroke-width="1"
              stroke-dasharray="4 4"
              vector-effect="non-scaling-stroke"
            />
          </g>

          <path :d="areaPath" :fill="`url(#${gradId})`" />
          <path
            class="trend-chart__line"
            :d="linePath"
            fill="none"
            :stroke="color"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            vector-effect="non-scaling-stroke"
          />
        </svg>
        <div class="trend-chart__dots-html" aria-hidden="true">
          <span
            v-for="(pt, i) in htmlDots"
            :key="'hd-' + i"
            class="trend-chart__dot-html"
            :style="{
              left: pt.left,
              top: pt.top,
              borderColor: color,
            }"
          />
        </div>
        <div class="trend-chart__x-axis" aria-hidden="true">
          <span
            v-for="(label, i) in labels"
            :key="'x-' + i"
            class="trend-chart__axis-num"
            :style="xLabelStyle(i)"
          >{{ label }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'TrendChart',
  props: {
    title: { type: String, required: true },
    color: { type: String, default: '#3C6EF0' },
    labels: { type: Array, default: () => [] },
    points: { type: Array, default: () => [] },
  },
  data() {
    return {
      width: 1000,
      height: 280,
      pad: { t: 8, r: 8, b: 8, l: 8 },
      yTicks: [100, 80, 60, 40, 20, 0],
    }
  },
  computed: {
    gradId() {
      return `trend-fill-${this._uid}`
    },
    coords() {
      return this.points.map((v, i) => ({
        x: this.xOf(i),
        y: this.yOf(v),
      }))
    },
    linePath() {
      return this.buildCurvePath(this.coords)
    },
    areaPath() {
      if (!this.coords.length) return ''
      const baseY = this.yOf(0)
      const first = this.coords[0]
      const last = this.coords[this.coords.length - 1]
      return `${this.linePath} L${last.x} ${baseY} L${first.x} ${baseY} Z`
    },
    htmlDots() {
      return this.coords.map((pt) => ({
        left: `${(pt.x / this.width) * 100}%`,
        top: `${(pt.y / this.height) * 100}%`,
      }))
    },
  },
  methods: {
    xOf(i) {
      const n = Math.max(this.labels.length - 1, 1)
      const inner = this.width - this.pad.l - this.pad.r
      return this.pad.l + (inner * i) / n
    },
    yOf(v) {
      const inner = this.height - this.pad.t - this.pad.b
      const clamped = Math.max(0, Math.min(100, Number(v) || 0))
      return this.pad.t + inner * (1 - clamped / 100)
    },
    yPercent(tick) {
      return `${((100 - tick) / 100) * 100}%`
    },
    xLabelStyle(i) {
      const n = Math.max(this.labels.length - 1, 1)
      const left = `${(i / n) * 100}%`
      let transform = 'translateX(-50%)'
      if (i === 0) transform = 'translateX(0)'
      if (i === this.labels.length - 1) transform = 'translateX(-100%)'
      return { left, transform }
    },
    buildCurvePath(pts) {
      if (!pts.length) return ''
      if (pts.length === 1) return `M${pts[0].x} ${pts[0].y}`
      if (pts.length === 2) return `M${pts[0].x} ${pts[0].y} L${pts[1].x} ${pts[1].y}`

      let d = `M${pts[0].x} ${pts[0].y}`
      for (let i = 0; i < pts.length - 1; i += 1) {
        const p0 = pts[i === 0 ? i : i - 1]
        const p1 = pts[i]
        const p2 = pts[i + 1]
        const p3 = pts[i + 2] || p2
        const cp1x = p1.x + (p2.x - p0.x) / 6
        const cp1y = p1.y + (p2.y - p0.y) / 6
        const cp2x = p2.x - (p3.x - p1.x) / 6
        const cp2y = p2.y - (p3.y - p1.y) / 6
        d += ` C${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`
      }
      return d
    },
  },
}
</script>
