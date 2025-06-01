const EventLoopSimulator = require('./event-loop-simulator');

console.log('=== Simulation Start ===');

const eventLoop = new EventLoopSimulator();

// Next Tick Phase (similar to process.nextTick)
eventLoop.queueNextTick(() => {
  console.log('[nextTick] callback 1');
  eventLoop.queueMicrotask(() =>
    console.log('[microtask] from inside nextTick')
  );
  eventLoop.queueNextTick(() =>
    console.log('[nextTick] added from inside nextTick')
  );
});
eventLoop.queueNextTick(() => console.log('[nextTick] callback 2'));

// Microtasks (similar to Promise.then or queueMicrotask)
eventLoop.queueMicrotask(() => {
  console.log('[microtask] callback 1');
  eventLoop.queueMicrotask(() => console.log('[microtask] nested callback'));
});
eventLoop.queueMicrotask(() => console.log('[microtask] callback 2'));

// Timers Phase (setTimeout simulation)
eventLoop.queueTimer(() => {
  console.log('[timer] callback 1');
  eventLoop.queueCheck(() => console.log('[check] from timer 1'));
});
eventLoop.queueTimer(() => console.log('[timer] callback 2'));

// Pending Callbacks (like fs I/O)
eventLoop.queuePendingCallback(() => console.log('[pending] callback 1'));
eventLoop.queuePendingCallback(() => console.log('[pending] callback 2'));

// Idle / Prepare Phase
eventLoop.queueIdlePrepare(() => {
  console.log('[idle/prepare] callback');
});

// Poll Phase (I/O and thread pool)
eventLoop.queuePoll(() => {
  console.log('[poll] callback 1');
  eventLoop.queueNextTick(() => console.log('[nextTick] from poll'));
});
eventLoop.queuePoll(() => console.log('[poll] callback 2'));

// Check Phase (like setImmediate)
eventLoop.queueCheck(() => {
  console.log('[check] callback 1');
  eventLoop.queueMicrotask(() => console.log('[microtask] from check'));
});
eventLoop.queueCheck(() => console.log('[check] callback 2'));

// Close Callbacks (e.g., socket close)
eventLoop.queueCloseCallback(() => console.log('[close] callback 1'));
eventLoop.queueCloseCallback(() => console.log('[close] callback 2'));

// Run event loop for multiple ticks (to simulate async behavior)
let ticksToRun = 3;
for (let i = 1; i <= ticksToRun; i++) {
  console.log(`\n>>> Tick ${i}`);
  eventLoop.tick();
}

// Output
/**
 * === Simulation Start ===

>>> Tick 1
[---------------- event loop] Starting tick ----------------
[nextTick] nextTick phase started
[nextTick] callback 1
[nextTick] callback 2
[nextTick] added from inside nextTick
[nextTick] nextTick phase completed
[timers] >> timers phase started
[timer] callback 1
[microtasks] Microtasks phase started
[microtask] callback 1
[microtask] callback 2
[microtask] from inside nextTick
[microtask] nested callback
[microtasks] Microtasks phase completed
[timer] callback 2
[microtasks] Microtasks phase started
[microtasks] Microtasks phase completed
[timers] >> timers phase completed
[nextTick] nextTick phase started
[nextTick] nextTick phase completed
[pendingCallbacks] >> pendingCallbacks phase started
[pending] callback 1
[microtasks] Microtasks phase started
[microtasks] Microtasks phase completed
[pending] callback 2
[microtasks] Microtasks phase started
[microtasks] Microtasks phase completed
[pendingCallbacks] >> pendingCallbacks phase completed
[nextTick] nextTick phase started
[nextTick] nextTick phase completed
[idlePrepare] >> idlePrepare phase started
[idle/prepare] callback
[microtasks] Microtasks phase started
[microtasks] Microtasks phase completed
[idlePrepare] >> idlePrepare phase completed
[nextTick] nextTick phase started
[nextTick] nextTick phase completed
[poll] >> poll phase started
[poll] callback 1
[microtasks] Microtasks phase started
[microtasks] Microtasks phase completed
[poll] callback 2
[microtasks] Microtasks phase started
[microtasks] Microtasks phase completed
[poll] >> poll phase completed
[nextTick] nextTick phase started
[nextTick] from poll
[nextTick] nextTick phase completed
[check] >> check phase started
[check] callback 1
[microtasks] Microtasks phase started
[microtask] from check
[microtasks] Microtasks phase completed
[check] callback 2
[microtasks] Microtasks phase started
[microtasks] Microtasks phase completed
[check] from timer 1
[microtasks] Microtasks phase started
[microtasks] Microtasks phase completed
[check] >> check phase completed
[nextTick] nextTick phase started
[nextTick] nextTick phase completed
[closeCallbacks] >> closeCallbacks phase started
[close] callback 1
[microtasks] Microtasks phase started
[microtasks] Microtasks phase completed
[close] callback 2
[microtasks] Microtasks phase started
[microtasks] Microtasks phase completed
[closeCallbacks] >> closeCallbacks phase completed
[event loop] Tick finished

>>> Tick 2
[---------------- event loop] Starting tick ----------------
[nextTick] nextTick phase started
[nextTick] nextTick phase completed
[timers] >> timers phase started
[timers] >> timers phase completed
[nextTick] nextTick phase started
[nextTick] nextTick phase completed
[pendingCallbacks] >> pendingCallbacks phase started
[pendingCallbacks] >> pendingCallbacks phase completed
[nextTick] nextTick phase started
[nextTick] nextTick phase completed
[idlePrepare] >> idlePrepare phase started
[idlePrepare] >> idlePrepare phase completed
[nextTick] nextTick phase started
[nextTick] nextTick phase completed
[poll] >> poll phase started
[poll] >> poll phase completed
[nextTick] nextTick phase started
[nextTick] nextTick phase completed
[check] >> check phase started
[check] >> check phase completed
[nextTick] nextTick phase started
[nextTick] nextTick phase completed
[closeCallbacks] >> closeCallbacks phase started
[closeCallbacks] >> closeCallbacks phase completed
[event loop] Tick finished

>>> Tick 3
[---------------- event loop] Starting tick ----------------
[nextTick] nextTick phase started
[nextTick] nextTick phase completed
[timers] >> timers phase started
[timers] >> timers phase completed
[nextTick] nextTick phase started
[nextTick] nextTick phase completed
[pendingCallbacks] >> pendingCallbacks phase started
[pendingCallbacks] >> pendingCallbacks phase completed
[nextTick] nextTick phase started
[nextTick] nextTick phase completed
[idlePrepare] >> idlePrepare phase started
[idlePrepare] >> idlePrepare phase completed
[nextTick] nextTick phase started
[nextTick] nextTick phase completed
[poll] >> poll phase started
[poll] >> poll phase completed
[nextTick] nextTick phase started
[nextTick] nextTick phase completed
[check] >> check phase started
[check] >> check phase completed
[nextTick] nextTick phase started
[nextTick] nextTick phase completed
[closeCallbacks] >> closeCallbacks phase started
[closeCallbacks] >> closeCallbacks phase completed
[event loop] Tick finished
 */
