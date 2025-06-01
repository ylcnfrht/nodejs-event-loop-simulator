# 🌀 nodejs-event-loop-simulator

A minimal and educational simulation of Node.js event loop phases — including `process.nextTick`, microtasks (`Promise.then`), timers, poll, check, and close callbacks.

---

## 📚 Overview

This project is designed to help developers understand the internal workings of the Node.js Event Loop by simulating each phase step-by-step.

It supports queuing callbacks for:

- `nextTick` (like `process.nextTick`)
- Microtasks (like `Promise.then`)
- Timers (like `setTimeout`)
- Pending callbacks (e.g., I/O like `fs.readFile`)
- Idle/Prepare (internal phases)
- Poll (I/O polling)
- Check (like `setImmediate`)
- Close callbacks (e.g., socket `.on('close')`)

---

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/your-username/event-loop-simulator.git
cd event-loop-simulator
```

### 2. Run the simulation

```bash
node index.js
```

### ✨ Example Usage
```
const EventLoopSimulator = require('./event-loop');

const eventLoop = new EventLoopSimulator();

eventLoop.queueNextTick(() => console.log('nextTick callback'));
eventLoop.queueMicrotask(() => console.log('microtask callback'));
eventLoop.queueTimer(() => console.log('timer callback'));

eventLoop.tick();
```

### 🔄 Supported Phases and Methods
```
Phase ------------------------ Method
Next Tick -------------------- queueNextTick(cb)
Microtask -------------------- queueMicrotask(cb)
Timer ------------------------ queueTimer(cb)
Pending Callback ------------- queuePendingCallback(cb)
Idle/Prepare ----------------- queueIdlePrepare(cb)
Poll ------------------------- queuePoll(cb)
Check ------------------------ queueCheck(cb)
Close ------------------------ queueCloseCallback(cb)
```

### 🎯 Purpose
This simulator is intended for educational purposes only.
It helps visualize the order and behavior of various phases in the Node.js event loop without using real asynchronous APIs.


### 📄 License
MIT License