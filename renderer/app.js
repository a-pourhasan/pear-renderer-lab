import { createMessageStore } from './store.js'
import { perf } from './performance.js'

const store = createMessageStore()
const listEl = document.getElementById('messages')
const countEl = document.getElementById('count')

const bridge = window.bridge
const decoder = new TextDecoder('utf-8')

function render() {
	const t0 = performance.now()
	const items = store.getAll()
	const frag = document.createDocumentFragment()
	for (const m of items) {
		const li = document.createElement('li')
		li.textContent = m.id + ' | ' + m.peer + ' | ' + m.text
		frag.appendChild(li)
	}
	listEl.replaceChildren(frag)
	const { received, unique } = store.getStats()
	countEl.innerText = `${received} received, ${unique} unique, ${received - unique} duplicates`
	perf.record(performance.now() - t0, items.length)
}

store.subscribe(render)

document.getElementById('v').innerText += bridge.pkg().version

function showUpdateReady() {
  document.getElementById('v').innerText = 'Update ready!'
  const btn = document.getElementById('update-btn')
  btn.style.display = 'inline-block'
  btn.onclick = async () => {
    btn.disabled = true
    btn.innerText = 'Updating...'
    try {
      await bridge.applyUpdate()
      await bridge.appAfterUpdate()
    } catch (err) {
      document.getElementById('v').innerText = 'Update failed: ' + err.message
      btn.style.display = 'none'
    }
  }
}

function onWorkerUpdaterEvent(name) {
  if (name === 'updating') {
    document.getElementById('v').innerText = 'UPDATING...'
    return
  }
  if (name === 'updated') showUpdateReady()
}

const workers = {
  main: '/workers/main.js'
}

bridge.startWorker(workers.main)
let sentHello = false

const offWorkerStdout = bridge.onWorkerStdout(workers.main, (data) => {
  console.log('worker stdout', '[', workers.main, ']:', decoder.decode(data))
})

const offWorkerStderr = bridge.onWorkerStderr(workers.main, (data) => {
  console.error('worker stderr', '[', workers.main, ']:', decoder.decode(data))
})

const offWorkerIpc = bridge.onWorkerIPC(workers.main, (data) => {
  const message = decoder.decode(data)
  //console.log('worker ipc', '[', workers.main, ']:', message)
  //onWorkerUpdaterEvent(message)
  
  let parsed
  try {
	parsed = JSON.parse(message)
  } catch {
	onWorkerUpdaterEvent(message)
	parsed = null;
  }
  
  if(parsed?.type === 'pong') {
	document.getElementById('pong').innerText = 'worker time: ' + parsed.time
  }
  
  if (parsed?.type === 'msg') {
	//const li = document.createElement('li')
	//const ul = document.getElementById('messages')
	//li.textContent = parsed.id + '|' + parsed.peer + '|' + parsed.text
	//ul.appendChild(li)
	//document.getElementById('count').innerText = ul.children.length + 'messages'
	
	store.add(parsed)
  }

  if (!sentHello) {
    sentHello = true
    bridge.writeWorkerIPC(workers.main, 'Hello from renderer')
  }
})

document.getElementById('ping-btn').onclick = () => {
  bridge.writeWorkerIPC(workers.main, JSON.stringify({ type: 'ping' }))
}

document.getElementById('sim-btn').onclick = () => {
	store.clear()
	bridge.writeWorkerIPC(workers.main, JSON.stringify({ type: 'sim:start', count: 5000}))
}

const offWorkerExit = bridge.onWorkerExit(workers.main, (code) => {
  console.log('Worker exited with code', code)
  offWorkerStdout()
  offWorkerStderr()
  offWorkerIpc()
  offWorkerExit()
})
