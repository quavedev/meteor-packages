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
    collectionTTL: 172800
  });
```

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
