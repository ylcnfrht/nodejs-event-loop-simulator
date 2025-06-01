const QUEUE_NAMES = {
  NEXT_TICK: 'nextTick',
  MICROTASKS: 'microtasks',
  TIMERS: 'timers',
  PENDING_CALLBACKS: 'pendingCallbacks',
  IDLE_PREPARE: 'idlePrepare',
  POLL: 'poll',
  CHECK: 'check',
  CLOSE_CALLBACKS: 'closeCallbacks',
};

module.exports = class EventLoopSimulator {
  constructor() {
    this.queues = {
      nextTick: [],
      microtasks: [],
      timers: [],
      pendingCallbacks: [],
      idlePrepare: [],
      poll: [],
      check: [],
      closeCallbacks: [],
    };

    this.running = false;
  }

  log(phase, msg) {
    console.log(`[${phase}] ${msg}`);
  }
  queueNextTick(callback) {
    this.queues.nextTick.push(callback);
  }
  queueMicrotask(callback) {
    this.queues.microtasks.push(callback);
  }
  queueTimer(callback) {
    this.queues.timers.push(callback);
  }
  queuePendingCallback(callback) {
    this.queues.pendingCallbacks.push(callback);
  }
  queueIdlePrepare(callback) {
    this.queues.idlePrepare.push(callback);
  }
  queuePoll(callback) {
    this.queues.poll.push(callback);
  }
  queueCheck(callback) {
    this.queues.check.push(callback);
  }
  queueCloseCallback(callback) {
    this.queues.closeCallbacks.push(callback);
  }

  runNextTick() {
    this.log(QUEUE_NAMES.NEXT_TICK, 'nextTick phase started');
    while (this.queues.nextTick.length > 0) {
      const task = this.queues.nextTick.shift();
      task();
    }
    this.log(QUEUE_NAMES.NEXT_TICK, 'nextTick phase completed');
  }

  runMicrotasks() {
    this.log(QUEUE_NAMES.MICROTASKS, 'Microtasks phase started');
    while (this.queues.microtasks.length > 0) {
      const task = this.queues.microtasks.shift();
      task();
    }
    this.log(QUEUE_NAMES.MICROTASKS, 'Microtasks phase completed');
  }

  runNextTickAndMicrotasks() {
    this.runNextTick();
    this.runMicrotasks();
  }

  runPhase(phase, queue) {

    this.runNextTick();

    this.log(phase, '>> ' + phase + ' phase started');
    while (queue.length > 0) {
      const callback = queue.shift();
      callback();
      this.runMicrotasks();
    }

    this.log(phase, '>> ' + phase + ' phase completed');
  }

  tick() {
    this.runPhase(QUEUE_NAMES.TIMERS, this.queues.timers);
    this.runPhase(QUEUE_NAMES.PENDING_CALLBACKS, this.queues.pendingCallbacks);
    this.runPhase(QUEUE_NAMES.IDLE_PREPARE, this.queues.idlePrepare);
    this.runPhase(QUEUE_NAMES.POLL, this.queues.poll);
    this.runPhase(QUEUE_NAMES.CHECK, this.queues.check);
    this.runPhase(QUEUE_NAMES.CLOSE_CALLBACKS, this.queues.closeCallbacks);
  }
};
