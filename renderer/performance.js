// This is a Performance Calculator

export const perf = {
  renders: 0,
  total: 0,
  max: 0,
  last: 0,
  items: 0,
  timer: null,

  record(ms, items) {
    this.renders++
    this.total += ms
    this.max = Math.max(this.max, ms)
    this.last = ms
    this.items = items
    clearTimeout(this.timer)
    this.timer = setTimeout(() => this.report(), 1500)
  },

  report() {
	/**
	* Benchmark Metrics:
	* - renders: Total UI re-render count
	* - total: Total DOM construction time (primary comparison metric)
	* - avg / max: Average and worst render times (> ~16ms indicates dropped frames at 60 FPS)
	* - last: Final render duration with 5,000 messages
	*/
    console.log(
      `[perf] renders=${this.renders} total=${this.total.toFixed(0)}ms ` +
      `avg=${(this.total / this.renders).toFixed(1)}ms max=${this.max.toFixed(1)}ms ` +
      `last=${this.last.toFixed(1)}ms items=${this.items}`
    )
    this.renders = 0
    this.total = 0
    this.max = 0
  }
}