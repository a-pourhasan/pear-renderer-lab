// This is a Message Organization Handler

export function createMessageStore() {
  const seen = new Set()
  const list = []
  const listeners = new Set()
  let received = 0
  let scheduled = false

  function compare(a, b) {
    return a.ts - b.ts || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)
  }

  function findIndex(msg) {
    let lo = 0
    let hi = list.length
    while (lo < hi) {
      const mid = (lo + hi) >> 1
      if (compare(list[mid], msg) <= 0) lo = mid + 1
      else hi = mid
    }
    return lo
  }

  function scheduleNotify() {
    if (scheduled) return
    scheduled = true
    requestAnimationFrame(() => {
      scheduled = false
      listeners.forEach((fn) => fn())
    })
  }

  function add(msg) {
    received++
    scheduleNotify()
    if (seen.has(msg.id)) return false
    seen.add(msg.id)
    list.splice(findIndex(msg), 0, msg)
    return true
  }

  function clear() {
    seen.clear()
    list.length = 0
    received = 0
    scheduleNotify()
  }

  return {
    add,
    clear,
    getAll: () => list,
    getStats: () => ({ received, unique: list.length }),
    subscribe(fn) {
      listeners.add(fn)
      return () => listeners.delete(fn)
    }
  }
}
