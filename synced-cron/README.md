# quave:synced-cron

A simple cron system for [Meteor](http://meteor.com). It supports syncronizing jobs between multiple processes. In other words, if you add a job that runs every hour and your deployment consists of multiple app servers, only one of the app servers will execute the job each time (whichever tries first).

Quave version is compatible with Meteor 2.12 and forward.

## Installation

``` sh
$ meteor add quave:synced-cron
```

## API

### Basics

To write a cron job, give it a unique name, a schedule and a function to run like below. SyncedCron uses the fantastic [later.js](http://bunkat.github.io/later/) library behind the scenes. A Later.js `parse` object is passed into the schedule call that gives you a huge amount of flexibility for scheduling your jobs, see the [documentation](http://bunkat.github.io/later/parsers.html#overview).

```js
SyncedCron.add({
  name: 'Crunch some important numbers for the marketing department',
  schedule: function(parser) {
    // Note that the schedule function should not return
    // a promise. It works only with synchronous functions.
      
    // parser is a later.parse object
    return parser.text('every 2 hours');
  },
  job: async function() {
    await crushSomeNumbers();
  }
});
```

You can also optionally provide the following functions:

- `onSuccess(opts)`: Called after the job is finished successfully and persisted. It receives the following props inside an object:
  - `output`: The result returned by the job function.
  - `name`: A string containing the name of the job.
  - `intendedAt`: The Date object representing the intended execution time of the job.
- `onError(opts)`: Called when the job function throws an error and after it is persisted. It receives the following props inside an object:
  - `error`: The error object.
  - `name`: A string containing the name of the job.
  - `intendedAt`: The Date object representing the intended execution time of the job.
- `allowParallelExecution`: A boolean option that allows the same job to run in parallel if set to `true`. Default is `false`.
- `timeoutToConsiderRunningForParallelExecution`: A number in milliseconds. If the job takes more time than this value and it's not finished, another instance of the job can be run in parallel. This option is only considered when `allowParallelExecution` is `false`.


To start processing your jobs, somewhere in your project add:

``` js
SyncedCron.start();
```

### Advanced

SyncedCron uses a collection called `cronHistory` to syncronize between processes. This also serves as a useful log of when jobs ran along with their output or error. A sample item looks like:

``` js
{ _id: 'wdYLPBZp5zzbwdfYj',
  intendedAt: Sun Apr 13 2014 17:34:00 GMT-0700 (MST),
  finishedAt: Sun Apr 13 2014 17:34:01 GMT-0700 (MST),
  name: 'Crunch some important numbers for the marketing department',
  startedAt: Sun Apr 13 2014 17:34:00 GMT-0700 (MST),
  result: '1982 numbers crunched'
}
```

Call `SyncedCron.nextScheduledAtDate(jobName)` to find the date that the job
referenced by `jobName` will run next.

Call `SyncedCron.remove(jobName)` to remove and stop running the job referenced by jobName.

Call `SyncedCron.stop()` to remove and stop all jobs.

Call `SyncedCron.pause()` to stop all jobs without removing them.  The existing jobs can be rescheduled (i.e. restarted) with `SyncedCron.start()`.

To schedule a once off (i.e not recurring) event, create a job with a schedule like this `parser.recur().on(date).fullDate();`

### Configuration

You can configure SyncedCron with the `config` method. Defaults are:

``` js
  SyncedCron.config({
    // Log job run details to console
    log: true,

    // Use a custom logger function (defaults to Meteor's logging package)
    logger: null,

    // Name of collection to use for synchronisation and logging
    collectionName: 'cronHistory',

    // Default to using localTime
    utc: false,

    /*
      TTL in seconds for history records in collection to expire
      NOTE: Unset to remove expiry but ensure you remove the index from
      mongo by hand

      ALSO: SyncedCron can't use the `_ensureIndex` command to modify
      the TTL index. The best way to modify the default value of
      `collectionTTL` is to remove the index by hand (in the mongo shell
      run `db.cronHistory.dropIndex({startedAt: 1})`) and re-run your
      project. SyncedCron will recreate the index with the updated TTL.
    */
    collectionTTL: 172800,

    /*
      Timeout in milliseconds to consider a job "blocked" (default: 30 minutes).
      Jobs without finishedAt older than this will be marked as blocked.
      This is used ONLY for startup cleanup of jobs from crashed processes.
      Note: For parallel execution timeouts, use timeoutToConsiderRunningForParallelExecution
      per-job instead.
      Set to null or 0 to disable startup cleanup.
    */
    blockedJobTimeoutMs: 30 * 60 * 1000,

    /*
      Whether to cleanup blocked jobs from other crashed processes on startup.
      When enabled, jobs from other processes that have been running longer
      than blockedJobTimeoutMs will be marked as terminated on startup.
      Default: true
    */
    cleanupBlockedJobsOnStartup: true,

    /*
      If true, SyncedCron will NOT call process.exit() after handling
      signals (SIGTERM, SIGINT) or fatal errors (uncaughtException,
      unhandledRejection). Set this to true if you want Meteor or
      another handler to control the process lifecycle.
      Default: false
    */
    noProcessExit: false
  });
```

### Blocked Jobs Cleanup

SyncedCron automatically handles "blocked" jobs - jobs that never received a `finishedAt` timestamp, usually due to server crashes or unexpected terminations.

**Automatic cleanup on startup**: When `cleanupBlockedJobsOnStartup` is enabled (default), SyncedCron will automatically mark blocked jobs from OTHER crashed processes as terminated when the server starts. Jobs from the current process are never affected.

**Graceful shutdown**: SyncedCron automatically handles `SIGTERM`, `SIGINT`, `uncaughtException`, and `unhandledRejection` signals to mark running jobs from the current process as terminated before shutdown. By default, SyncedCron will also call `process.exit()` after cleanup. Set `noProcessExit: true` to disable this behavior and let Meteor (or other handlers) control the process lifecycle.

The cleanup adds a `terminatedBy` field to identify how the job was terminated:
- `SIGTERM` / `SIGINT`: Graceful shutdown signal
- `UNCAUGHT_EXCEPTION` / `UNHANDLED_REJECTION`: Fatal error
- `BLOCKED_ON_STARTUP`: Cleaned up when server started

### Logging

SyncedCron uses Meteor's `logging` package by default. If you want to use your own logger (for sending to other consumers or similar) you can do so by configuring the `logger` option.

SyncedCron expects a function as `logger`, and will pass arguments to it for you to take action on.

```js
const MyLogger = function(opts) {
  console.log('Level', opts.level);
  console.log('Message', opts.message);
  console.log('Tag', opts.tag);
}

SyncedCron.config({
  logger: MyLogger
});

SyncedCron.add({ name: 'Test Job', ... });
SyncedCron.start();
```

The `opts` object passed to `MyLogger` above includes `level`, `message`, and `tag`.

- `level` will be one of `info`, `warn`, `error`, `debug`.
- `message` is something like `Scheduled "Test Job" next run @Fri Mar 13 2015 10:15:00 GMT+0100 (CET)`.
- `tag` will always be `"SyncedCron"` (handy for filtering).


## Caveats

Beware, SyncedCron probably won't work as expected on certain shared hosting providers that shutdown app instances when they aren't receiving requests (like Heroku's free dyno tier or Meteor free galaxy).

## Contributing

Write some code. Write some tests. To run the tests, do:

``` sh
$ meteor test-packages ./
```

## Durable one-off jobs (opt in)

`SyncedCron.createDurableQueue` persists **future work**, independently of the
legacy `add()` API and `cronHistory`. Register named handlers on each eligible
server; enqueue EJSON data, not a function that captures request-local variables.

```js
const queue = SyncedCron.createDurableQueue({
  collectionName: 'scheduledTasks', // separate databases/collections for environments
  pollIntervalMs: 1000,
  leaseDurationMs: 30000,
  concurrency: 2, // per process
});
queue.register('sendReminder', async (data, execution) => {
  await execution.assertOwnership();
  await sendReminder(data, { idempotencyKey: execution.id });
});
Meteor.startup(() => queue.start());
await queue.enqueue({
  id: 'reminder-order-123-v1', // stable identity for this logical execution
  type: 'sendReminder',
  runAt: new Date(Date.now() + 60000),
  data: { orderId: '123' },
  maxAttempts: 5,
  retryDelayMs: 1000,
});
```

Workers poll MongoDB and atomically claim due work. An expired lease can be
claimed by a surviving worker without a restart or a container-shutdown event.
Heartbeats renew ownership while handlers run. A stale worker cannot update the
queue record after cancellation, expiry or takeover. `execution.signal` reports
lost ownership; `assertOwnership()` checks and renews it at an explicit checkpoint.
MongoDB availability and reasonably synchronized server clocks are required.

**Delivery is at least once.** A process can die after a side effect but before
acknowledging completion. Handlers must use `execution.id` to deduplicate effects,
use a transaction where appropriate, or stop for application-level reconciliation.
Leases and cancellation cannot forcibly stop JavaScript or undo an external
request already in progress. A lease check is not atomic with a later side effect.
The package never serializes functions, assumes a thrown error rolled back the
handler, or promises exactly-once business effects.

- `enqueue()` is idempotent for an identical definition. Reusing an ID with a
  different definition throws; it never resurrects terminal work. To reschedule,
  cancel the old execution and create a new ID.
- `get(id)` returns the persisted job, including status, attempts and last error.
- `cancel(id)` cancels pending/running work and invalidates ownership.
- `execution.fail(message)` fails permanently, without automatic retry.
- `stop()` stops polling and waits for active handlers while renewing their leases.
  A process that is killed instead is recovered after lease expiry.
- `runOnce()` claims up to available concurrency and waits for those executions;
  useful for tests and explicit batch processing.

States are `pending`, `running`, `completed`, `cancelled`, and `failed`. Exceptions
retry after `retryDelayMs`, up to `maxAttempts` (including expired claims). A crash
on the final attempt becomes a visible failure. Only locally registered handler
types are claimed. Rejected database/poll operations go to `onError(error)`;
handler failures are recorded on the job. Monitor failed jobs and overdue work.

Durable records have no automatic TTL: deleting a terminal record also deletes
its enqueue-deduplication protection. Define retention appropriate to your app.
The queue owns its indexes and uses the raw MongoDB driver; it does not publish
its internal execution records to clients. Existing `SyncedCron.pause/stop/remove`
only affect legacy cron entries; manage each durable queue explicitly.

Migrating an existing application requires changing producers and registering
handlers, migrating outstanding schedules, and coordinating pause/cancel paths.
Do not remove old recovery logic before pending work has been migrated. Deploy
compatible handlers before producers, and avoid mixed incompatible handler
versions during rolling updates.
