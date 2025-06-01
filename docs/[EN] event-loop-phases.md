/**
 * EventLoopSimulator simulates the Node.js event loop phases and callback queues.
 *
 * This simulation models the key phases of the Node.js event loop, illustrating
 * the order in which different types of callbacks are executed.
 *
 * The event loop phases are processed in the following order within each tick:
 *
 * 1. nextTick            // process.nextTick, queueMicrotask, etc.
 * 2. microtasks          // Promise callbacks, async/await continuations, etc.
 * 3. timers              // setTimeout, setInterval callbacks
 * 4. pendingCallbacks     // I/O callbacks like some TCP errors, etc.
 * 5. idlePrepare         // mostly for internal system tasks
 * 6. poll                // I/O callbacks and thread pool callbacks
 * 7. check               // setImmediate callbacks
 * 8. closeCallbacks      // close events
 *
 * Phases:
 * 1. Run nextTick callbacks (process.nextTick, queueMicrotask, etc.)
 *
 * What happens during the nextTick phase:
 *
 * - This phase runs *immediately* after the current synchronous operation completes,
 *   before the event loop continues to the next phase.
 * - Callbacks registered with process.nextTick() are executed here.
 * - Also, queueMicrotask() callbacks and Promise microtasks are processed around this phase,
 *   but microtasks are handled slightly differently (between phases).
 * - nextTick callbacks have higher priority than other I/O or timer callbacks,
 *   meaning they always run before any timers, I/O, or setImmediate callbacks.
 * - This phase allows you to schedule code to run asynchronously, but as soon as possible,
 *   effectively deferring execution to the next turn of the event loop without letting other events run.
 * - Using process.nextTick too heavily can starve I/O and timer callbacks,
 *   causing performance problems or delays in handling incoming requests.
 *
 * Common use cases:
 *
 * - Deferring work until after the current function completes, but before any I/O happens.
 * - Breaking up CPU-heavy synchronous code into chunks to keep the event loop responsive.
 * - Ensuring asynchronous callbacks run before timers or I/O callbacks.
 *
 * Examples:
 *
 * 1. Basic nextTick callback:
 *    process.nextTick(() => {
 *      console.log('nextTick callback executed');
 *    });
 *
 * 2. Using queueMicrotask (runs similarly, but in microtask queue):
 *    queueMicrotask(() => {
 *      console.log('microtask callback executed');
 *    });
 *
 * 3. Promise.then callbacks are microtasks and run immediately after current phase:
 *    Promise.resolve().then(() => {
 *      console.log('Promise.then microtask executed');
 *    });
 *
 * Summary:
 *
 * The nextTick phase is a special microtask queue that executes immediately after the current
 * operation, allowing you to schedule callbacks that run before any other I/O or timer events.
 * It’s useful for high-priority deferred tasks but should be used with care to avoid blocking the event loop.
 * 
 * ###########################################################################################
 * 
 * 2. Run microtasks (Promise callbacks, async/await continuations, etc.)
 *
 * What happens during the microtasks phase:
 *
 * - Microtasks are a queue of callbacks that execute immediately after the current operation
 *   and after all `process.nextTick` callbacks have run, but *before* the event loop moves on
 *   to the next phase (like timers, I/O, etc.).
 * - Common sources of microtasks include:
 *    - Promise `.then()`, `.catch()`, and `.finally()` callbacks
 *    - Async/await continuations (after an `await` resolves)
 *    - queueMicrotask() calls
 * - Microtasks allow you to schedule follow-up work that should happen immediately,
 *   ensuring state consistency before any other asynchronous callbacks run.
 * - The microtask queue is processed to completion before the event loop moves on,
 *   meaning if microtasks schedule more microtasks, they all run before continuing.
 * - This can cause the event loop to be "starved" if microtasks keep adding more microtasks,
 *   preventing timers or I/O from executing.
 * - Microtasks have slightly lower priority than `process.nextTick` callbacks but higher priority
 *   than timers, I/O, and setImmediate callbacks.
 *
 * Common use cases:
 *
 * - Chaining asynchronous operations with Promises.
 * - Running follow-up code immediately after an async operation resolves.
 * - Deferring some operations to run right after the current call stack but before I/O.
 *
 * Examples:
 *
 * 1. Promise microtask example:
 *    Promise.resolve().then(() => {
 *      console.log('Promise callback executed');
 *    });
 *
 * 2. Async/await continuation:
 *    async function foo() {
 *      await Promise.resolve();
 *      console.log('Async function continuation executed');
 *    }
 *    foo();
 *
 * 3. queueMicrotask usage:
 *    queueMicrotask(() => {
 *      console.log('queueMicrotask callback executed');
 *    });
 *
 * Summary:
 * The microtasks phase executes after `process.nextTick` callbacks and before
 * the next event loop phase, allowing high-priority asynchronous callbacks
 * like Promises and async/await continuations to run as soon as possible.
 * Proper use of microtasks ensures timely execution of async code while avoiding
 * blocking other I/O or timer events.
 *
 * ###########################################################################################
 *
 * 3. Run timers phase (setTimeout, setInterval callbacks)
 * What happens during the timers phase:

 * - This phase executes callbacks scheduled by `setTimeout()` and `setInterval()`
 *   when their timers have expired.
 * - Only callbacks whose timer duration has elapsed will be executed in this phase.
 * - Timers scheduled with zero delay (`setTimeout(fn, 0)`) are not guaranteed to
 *   execute immediately in this phase; they execute only after the event loop
 *   reaches the timers phase and the timer has expired.
 * - Timers are checked and executed once per event loop tick during this phase.
 * - If a timer callback schedules more timers, those new timers will not run in
 *   the current tick but in a future one when their time expires.
 * - If the callback duration is long, it can delay subsequent phases and starve
 *   I/O or other event loop phases.
 * Typical use cases:
 * - Delayed execution of a function after a specified duration.
 * - Repeated execution of a function at fixed intervals (`setInterval`).
 * - Implementing retry mechanisms with delays.

 * Examples:
 * 1. Basic setTimeout:
 *    setTimeout(() => {
 *      console.log('timeout callback executed after delay');
 *    }, 1000); // runs after approximately 1 second
 * 
 * 2. Zero-delay timer:
 *    setTimeout(() => {
 *      console.log('timeout with 0ms delay');
 *    }, 0);

 * 3. setInterval example:
 *    let count = 0;
 *    const intervalId = setInterval(() => {
 *      console.log('interval callback executed', ++count);
 *      if (count >= 5) clearInterval(intervalId);
 *    }, 500); // runs every 500ms until cleared
 *
 * Summary:
 * The timers phase handles execution of callbacks scheduled with `setTimeout` and
 * `setInterval` whose specified delay time has passed. It’s the main way to defer
 * or repeat code execution in the future based on time intervals.
 *
 * ###########################################################################################
 *
 * 4. Run pending callbacks phase (I/O callbacks like some TCP errors, etc.)
 *
 * What happens during the pending callbacks phase:
 *
 * - This phase executes callbacks for some system-level operations and certain
 *   types of I/O events that were deferred from earlier phases.
 * - It handles callbacks for specific system operations such as TCP errors or
 *   other network-related events that don’t fit into the poll phase directly.
 * - Certain platform-specific callbacks, like some TCP errors, are processed here.
 * - This phase is less commonly interacted with directly in user code but is
 *   important for handling edge-case asynchronous I/O operations.
 *
 * Examples:
 *
 * 1. File system read callback (which can be handled here or in poll phase depending on timing):
 *    fs.readFile('file.txt', (err, data) => {
 *      if (err) throw err;
 *      console.log('file read callback executed');
 *    });
 *
 * 2. Handling TCP socket errors:
 *    const net = require('net');
 *    const server = net.createServer((socket) => {
 *      socket.on('error', (err) => {
 *        console.error('TCP socket error:', err);
 *      });
 *    });
 *    server.listen(3000);
 *
 * Summary:
 * The pending callbacks phase deals with callbacks for some low-level system
 * operations, like TCP errors or other deferred I/O events, which require
 * special handling outside of the main poll phase. It's a narrower and more
 * specialized phase in the Node.js event loop.
 * 
 * ###########################################################################################
 * 5. Run idle phase (mostly for internal system tasks)
 *
 * What happens during the idle phase:
 *
 * - This phase is primarily used internally by Node.js and libuv for system maintenance tasks.
 * - It is not typically exposed to user code and does not run user callbacks directly.
 * - The idle phase helps prepare the event loop for the next phases and manages internal housekeeping.
 * - It can involve tasks like resource cleanup, handle management, or preparing timers.
 *
 * Characteristics:
 *
 * - Usually invisible to developers, as it doesn’t handle user-registered callbacks.
 * - Runs when the event loop is idle and waiting for other operations to complete.
 * - Helps ensure smooth operation and efficient management of system resources.
 *
 * Example:
 *
 * - There is no direct user-level API or callback to hook into the idle phase.
 * - It's handled internally by the Node.js runtime and libuv.
 *
 * Summary:
 *
 * The idle phase is a low-level maintenance phase in the event loop used by Node.js
 * internally to keep the system ready for I/O and timers. User applications don’t
 * typically interact with this phase directly.
 * 
 * ############################################################################################# 
 *
 * 6. Run poll phase (I/O callbacks and thread pool callbacks are handled here)
 * This is the main and often the busiest phase in the Node.js event loop.
 *
 * What happens during the poll phase:
 *
 * - This phase handles the majority of asynchronous I/O operations in Node.js.
 * - Callbacks for completed I/O operations such as file system reads/writes, network I/O, and asynchronous database queries are executed here.
 * - Examples of such I/O operations include:
 *    - File system operations via fs module (e.g., fs.readFile, fs.writeFile)
 *    - Network communication: TCP, UDP, HTTP requests (both incoming and outgoing)
 *    - DNS resolution requests
 *    - Crypto operations like hashing or key derivation functions, which run in libuv's thread pool
 *    - Asynchronous database query callbacks (e.g., MySQL, MongoDB, PostgreSQL, Redis clients)
 * - The poll phase also handles incoming network requests (e.g., HTTP requests received by Express or native http server).
 * - Outgoing requests (for example, HTTP requests made by the application to external services) are initiated during user code execution, but the poll phase handles their callbacks when responses arrive asynchronously.
 * - If the poll queue (the list of callbacks waiting to be executed) is empty and there are timers scheduled, the event loop will transition early to the timers phase to avoid unnecessary idle time.
 * - If there are no callbacks and no timers, the poll phase will block and wait for new events to arrive (e.g., incoming connections or I/O completions).
 * - After each poll callback execution, the event loop will process microtasks (Promise callbacks, async/await continuations) before moving to the next callback in the poll queue.
 * - The poll phase finishes either when the poll queue is empty or after processing the allowed callbacks within a tick.
 * - After the poll phase ends, the event loop proceeds to the check phase where setImmediate callbacks are run.
 *
 * Detailed examples:
 *
 * 1. File system read (fs.readFile):
 *    This async operation is initiated by the user code and when the file is read,
 *    its callback is queued in the poll phase to be executed.
 *
 *    fs.readFile('example.txt', (err, data) => {
 *      if (err) throw err;
 *      console.log('File read completed:', data.toString());
 *    });
 *
 * 2. Incoming network request handled by Express or native HTTP server:
 *    When a client sends an HTTP request, the OS/network stack passes the event to Node.js.
 *    The callback registered by Express or http.createServer is invoked during the poll phase.
 *
 *    const express = require('express');
 *    const app = express();
 *    app.get('/', (req, res) => {
 *      res.send('Hello from poll phase!');
 *    });
 *    app.listen(3000);
 *
 * 3. Outgoing HTTP request made from your app:
 *    When you make an outgoing HTTP request (e.g., to a REST API), the request is sent immediately,
 *    but the response handling callback executes in the poll phase once the response is received.
 *
 *    const http = require('http');
 *    http.get('http://jsonplaceholder.typicode.com/todos/1', (response) => {
 *      let data = '';
 *      response.on('data', chunk => data += chunk);
 *      response.on('end', () => {
 *        console.log('Outgoing HTTP request completed:', data);
 *      });
 *    });
 *
 * 4. Database query callback (async DB operation):
 *    When you query a database asynchronously, the query is sent to the DB server,
 *    and when the response comes back, its callback is run in the poll phase.
 *
 *    simulateDatabaseQuery((result) => {
 *      console.log('Database query result:', result);
 *    });
 *
 * 5. Crypto operations that run in libuv thread pool:
 *    CPU-intensive tasks like pbkdf2 hashing are offloaded to libuv’s thread pool,
 *    and their completion callbacks execute during the poll phase.
 *
 *    const crypto = require('crypto');
 *    crypto.pbkdf2('password', 'salt', 100000, 64, 'sha512', () => {
 *      console.log('Crypto pbkdf2 callback executed');
 *    });
 *
 * Summary:
 * The poll phase is the heartbeat of Node.js asynchronous I/O.
 * It processes most I/O-related callbacks, handles incoming network requests, and manages callbacks for outgoing requests.
 * Proper understanding of this phase helps in designing efficient async code and debugging event loop related performance issues.
 * 
 * ############################################################################################# 
 *
 * 7. Run check phase (setImmediate callbacks)
 *
 * What happens during the check phase:
 *
 * - This phase executes callbacks scheduled by setImmediate().
 * - setImmediate callbacks run **after** the poll phase completes.
 * - Unlike timers (setTimeout/setInterval), setImmediate callbacks are designed
 *   to run immediately after the current poll phase, regardless of timer expiration.
 * - It provides a way to execute callbacks right after I/O events but before timers.
 *
 * Characteristics:
 *
 * - Callbacks queued via setImmediate() are processed in this phase.
 * - Useful for running callbacks that need to happen right after I/O operations.
 * - Ensures that setImmediate callbacks are executed once per event loop iteration,
 *   after all poll phase callbacks have been handled.
 *
 * Example:
 *
 * setImmediate(() => {
 *   console.log('setImmediate callback executed');
 * });
 *
 * This callback will run after all I/O callbacks in the poll phase finish.
 *
 * Summary:
 *
 * The check phase handles setImmediate callbacks, executing them right after the poll phase,
 * allowing developers to schedule callbacks that run immediately after I/O processing.
 * 
 * #############################################################################################
 *
 * 8. Run close callbacks phase (socket close events, etc.)
 *
 * What happens during the close callbacks phase:
 *
 * - This phase handles cleanup callbacks triggered when handles are closed,
 *   such as sockets, servers, or other resources.
 * - When a resource like a TCP socket or a server is closed, its 'close' event
 *   is emitted, and the corresponding callbacks run in this phase.
 * - It ensures graceful cleanup of resources and allows developers to perform
 *   any finalization logic before the resource is fully disposed.
 *
 * Characteristics:
 *
 * - Typically involves event handlers like 'close' on sockets, servers, or streams.
 * - Called once a handle is fully closed, after all pending I/O and callbacks complete.
 * - Enables releasing resources, logging, or triggering dependent processes.
 *
 * Example:
 *
 * const net = require('net');
 * const server = net.createServer((socket) => {
 *   socket.on('close', () => {
 *     console.log('Socket closed');
 *   });
 *   socket.end();
 * });
 *
 * server.listen(3000, () => {
 *   console.log('Server started');
 *   server.close(() => {
 *     console.log('Server closed');
 *   });
 * });
 *
 * In this example, the 'close' event callbacks for the socket and server
 * are executed during the close callbacks phase.
 *
 * Summary:
 *
 * The close callbacks phase is the event loop phase dedicated to running cleanup
 * callbacks for closed handles, allowing proper resource management and cleanup.
 */
