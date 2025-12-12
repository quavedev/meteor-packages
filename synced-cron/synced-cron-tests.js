Later = Npm.require('@breejs/later');

Later.date.localTime(); // corresponds to SyncedCron.options.utc: true;

let originalProcessExit;

const mockProcessExit = () => {
  originalProcessExit = process.exit;
  process.exit = function () { /* noop */ };
};

const restoreProcessExit = () => {
  process.exit = originalProcessExit;
};

const TestEntry = {
  name: 'Test Job',
  schedule: function (parser) {
    return parser.cron('15 10 * * ? *'); // not required
  },
  job: async function () {
    await new Promise((resolve) => setTimeout(resolve, 3000));

    return 'ran';
  },
};

Tinytest.addAsync('Syncing works', async function (test) {
  await SyncedCron._reset();
  test.equal(await SyncedCron._collection.find().countAsync(), 0);

  // added the entry ok
  SyncedCron.add(TestEntry);
  test.equal(Object.keys(SyncedCron._entries).length, 1);

  const entry = SyncedCron._entries[TestEntry.name];
  const intendedAt = new Date(); //whatever

  // first run
  await SyncedCron._entryWrapper(entry)(intendedAt);
  test.equal(await SyncedCron._collection.find().countAsync(), 1);
  const jobHistory1 = await SyncedCron._collection.findOneAsync();
  test.equal(jobHistory1.result, 'ran');

  // second run
  await SyncedCron._entryWrapper(entry)(intendedAt);
  test.equal(await SyncedCron._collection.find().countAsync(), 1); // should still be 1
  const jobHistory2 = await SyncedCron._collection.findOneAsync();
  test.equal(jobHistory1._id, jobHistory2._id);
});

Tinytest.addAsync('Exceptions work', async function (test) {
  await SyncedCron._reset();
  SyncedCron.add(
    Object.assign({}, TestEntry, {
      job: function () {
        throw new Meteor.Error('Haha, gotcha!');
      },
    })
  );

  const entry = SyncedCron._entries[TestEntry.name];
  const intendedAt = new Date(); //whatever

  // error without result
  await SyncedCron._entryWrapper(entry)(intendedAt);
  test.equal(await SyncedCron._collection.find().countAsync(), 1);
  const jobHistory1 = await SyncedCron._collection.findOneAsync();
  test.equal(jobHistory1.result, undefined);
  test.matches(jobHistory1.error, /Haha, gotcha/);
});

Tinytest.addAsync(
  'SyncedCron.nextScheduledAtDate works',
  async function (test) {
    await SyncedCron._reset();
    test.equal(await SyncedCron._collection.find().countAsync(), 0);

    // addd 2 entries
    SyncedCron.add(TestEntry);

    const entry2 = Object.assign({}, TestEntry, {
      name: 'Test Job2',
      schedule: function (parser) {
        return parser.cron('30 11 * * ? *');
      },
    });
    SyncedCron.add(entry2);

    test.equal(Object.keys(SyncedCron._entries).length, 2);

    SyncedCron.start();

    const date = SyncedCron.nextScheduledAtDate(entry2.name);
    const correctDate = Later.schedule(entry2.schedule(Later.parse)).next(1);

    test.equal(date, correctDate);
  }
);

// Tests SyncedCron.remove in the process
Tinytest.addAsync('SyncedCron.stop works', async function (test) {
  await SyncedCron._reset();
  test.equal(await SyncedCron._collection.find().countAsync(), 0);

  // addd 2 entries
  SyncedCron.add(TestEntry);

  const entry2 = Object.assign({}, TestEntry, {
    name: 'Test Job2',
    schedule: function (parser) {
      return parser.cron('30 11 * * ? *');
    },
  });
  SyncedCron.add(entry2);

  SyncedCron.start();

  test.equal(Object.keys(SyncedCron._entries).length, 2);

  SyncedCron.stop();

  test.equal(Object.keys(SyncedCron._entries).length, 0);
});

Tinytest.addAsync('SyncedCron.pause works', async function (test) {
  await SyncedCron._reset();
  test.equal(await SyncedCron._collection.find().countAsync(), 0);

  // addd 2 entries
  SyncedCron.add(TestEntry);

  const entry2 = Object.assign({}, TestEntry, {
    name: 'Test Job2',
    schedule: function (parser) {
      return parser.cron('30 11 * * ? *');
    },
  });
  SyncedCron.add(entry2);

  SyncedCron.start();

  test.equal(Object.keys(SyncedCron._entries).length, 2);

  SyncedCron.pause();

  test.equal(Object.keys(SyncedCron._entries).length, 2);
  test.isFalse(SyncedCron.running);

  SyncedCron.start();

  test.equal(Object.keys(SyncedCron._entries).length, 2);
  test.isTrue(SyncedCron.running);
});

// Tests SyncedCron.remove in the process
Tinytest.addAsync(
  'SyncedCron.add starts by it self when running',
  async function (test) {
    await SyncedCron._reset();

    test.equal(await SyncedCron._collection.find().countAsync(), 0);
    test.equal(SyncedCron.running, false);
    Log._intercept(2);

    SyncedCron.start();

    test.equal(SyncedCron.running, true);

    // addd 1 entries
    SyncedCron.add(TestEntry);

    test.equal(Object.keys(SyncedCron._entries).length, 1);

    SyncedCron.stop();

    const intercepted = Log._intercepted();
    test.equal(intercepted.length, 2);

    test.equal(SyncedCron.running, false);
    test.equal(Object.keys(SyncedCron._entries).length, 0);
  }
);

Tinytest.addAsync(
  'SyncedCron.config can customize the options object',
  async function (test) {
    await SyncedCron._reset();

    SyncedCron.config({
      log: false,
      collectionName: 'foo',
      utc: true,
      collectionTTL: 0,
    });

    test.equal(SyncedCron.options.log, false);
    test.equal(SyncedCron.options.collectionName, 'foo');
    test.equal(SyncedCron.options.utc, true);
    test.equal(SyncedCron.options.collectionTTL, 0);
  }
);

Tinytest.addAsync(
  'SyncedCron can log to injected logger',
  async function (test, done) {
    await SyncedCron._reset();

    const logger = function () {
      test.isTrue(true);

      SyncedCron.stop();
      done();
    };

    SyncedCron.options.logger = logger;

    SyncedCron.add(TestEntry);
    SyncedCron.start();

    SyncedCron.options.logger = null;
  }
);

Tinytest.addAsync(
  'SyncedCron should pass correct arguments to logger',
  async function (test, done) {
    await SyncedCron._reset();

    const logger = function (opts) {
      test.include(opts, 'level');
      test.include(opts, 'message');
      test.include(opts, 'tag');
      test.equal(opts.tag, 'SyncedCron');

      SyncedCron.stop();
      done();
    };

    SyncedCron.options.logger = logger;

    SyncedCron.add(TestEntry);
    SyncedCron.start();

    SyncedCron.options.logger = null;
  }
);

Tinytest.addAsync("Single time schedules don't break", async function () {
  // create a once off date 1 sec in the future
  const date = new Date(new Date().valueOf() + 1000);
  const schedule = Later.parse.recur().on(date).fullDate();

  // this would throw without our patch for #41
  SyncedCron._laterSetTimeout(() => {}, schedule);
});

Tinytest.addAsync(
  'Do not persist when flag is set to false',
  async function (test) {
    await SyncedCron._reset();

    const testEntryNoPersist = Object.assign({}, TestEntry, { persist: false });

    SyncedCron.add(testEntryNoPersist);

    const now = new Date();
    await SyncedCron._entryWrapper(testEntryNoPersist)(now);
    test.equal(await SyncedCron._collection.find().countAsync(), 0);
  }
);

Tinytest.addAsync(
  'allowParallelExecution: true allows parallel execution',
  async function (test) {
    await SyncedCron._reset();

    const testEntry = Object.assign({}, TestEntry, {
      name: 'Parallel Job',
      allowParallelExecution: true,
      job: async function () {
        await new Promise(resolve => setTimeout(resolve, 1000));
        return 'ran';
      }
    });

    SyncedCron.add(testEntry);
    const entry = SyncedCron._entries[testEntry.name];

    // Start the first job
    const job1Promise = SyncedCron._entryWrapper(entry)(new Date());

    // Wait a bit to ensure the first job has started
    await new Promise(resolve => setTimeout(resolve, 100));

    // Start a second job with a different intended time
    const job2Promise = SyncedCron._entryWrapper(entry)(new Date(Date.now() + 1000));

    // Wait for both jobs to complete
    await Promise.all([job1Promise, job2Promise]);

    // Check that both jobs ran
    const jobHistories = await SyncedCron._collection.find().fetchAsync();
    test.equal(jobHistories.length, 2, 'Both jobs should have run');

    if (jobHistories.length >= 2) {
      test.equal(jobHistories[0].result, 'ran', 'First job should have run');
      test.equal(jobHistories[1].result, 'ran', 'Second job should have run');
    }

    // Check that the jobs have different intendedAt times
    if (jobHistories.length >= 2) {
      test.notEqual(jobHistories[0].intendedAt.getTime(), jobHistories[1].intendedAt.getTime(), 'Jobs should have different intendedAt times');
    }
  }
);

Tinytest.addAsync(
  'allowParallelExecution: false prevents parallel execution',
  async function (test) {
    await SyncedCron._reset();

    const testEntry = Object.assign({}, TestEntry, {
      name: 'Non-Parallel Job',
      allowParallelExecution: false,
      job: async function () {
        await new Promise(resolve => setTimeout(resolve, 1000));
        return 'ran';
      }
    });

    SyncedCron.add(testEntry);
    const entry = SyncedCron._entries[testEntry.name];

    // Start the first job
    const job1Promise = SyncedCron._entryWrapper(entry)(new Date());

    // Wait a bit to ensure the first job has started
    await new Promise(resolve => setTimeout(resolve, 100));

    // Try to start a second job with a different intended time
    const job2Promise = SyncedCron._entryWrapper(entry)(new Date(Date.now() + 1000));

    // Wait for both job attempts to complete
    await Promise.all([job1Promise, job2Promise]);

    // Check that only one job ran
    const jobHistories = await SyncedCron._collection.find().fetchAsync();
    test.equal(jobHistories.length, 1, 'Only one job should have run');

    if (jobHistories.length > 0) {
      test.equal(jobHistories[0].result, 'ran', 'The job should have run');
    }
  }
);

Tinytest.addAsync(
  'timeoutToConsiderRunningForParallelExecution allows execution after timeout',
  async function (test) {
    await SyncedCron._reset();

    const testEntry = Object.assign({}, TestEntry, {
      name: 'Timeout Job',
      allowParallelExecution: false,
      timeoutToConsiderRunningForParallelExecution: 1500,
      job: async function () {
        await new Promise(resolve => setTimeout(resolve, 2000));
        return 'ran';
      }
    });

    SyncedCron.add(testEntry);
    const entry = SyncedCron._entries[testEntry.name];

    // Start the first job
    const job1Promise = SyncedCron._entryWrapper(entry)(new Date());

    // Wait for more than the timeout
    await new Promise(resolve => setTimeout(resolve, 1600));

    // Start a second job
    const job2Promise = SyncedCron._entryWrapper(entry)(new Date());

    // Wait for both jobs to complete
    await Promise.all([job1Promise, job2Promise]);

    // Check that both jobs ran
    const jobHistories = await SyncedCron._collection.find().fetchAsync();
    test.equal(jobHistories.length, 2, 'Both jobs should have run');

    if (jobHistories.length >= 2) {
      test.equal(jobHistories[0].result, 'ran', 'First job should have run');
      test.equal(jobHistories[1].result, 'ran', 'Second job should have run');
      test.isTrue(jobHistories[0].timedOut, 'First job should be marked as timed out');
    }
  }
);

Tinytest.addAsync(
  'onSuccess callback is called with correct arguments',
  async function (test) {
    await SyncedCron._reset();

    let onSuccessCalled = false;
    const testEntry = {
      name: 'Success Job',
      schedule: function (parser) {
        return parser.text('every 1 second');
      },
      job: function () {
        return 'success result';
      },
      onSuccess: function (opts) {
        onSuccessCalled = true;
        test.equal(opts.output, 'success result', 'Output should match job result');
        test.equal(opts.name, 'Success Job', 'Name should match job name');
        test.isTrue(opts.intendedAt instanceof Date, 'intendedAt should be a Date object');
      }
    };

    SyncedCron.add(testEntry);
    const entry = SyncedCron._entries[testEntry.name];

    await SyncedCron._entryWrapper(entry)(new Date());

    test.isTrue(onSuccessCalled, 'onSuccess should have been called');
  }
);

Tinytest.addAsync(
  'onError callback is called with correct arguments',
  async function (test) {
    await SyncedCron._reset();

    let onErrorCalled = false;
    const testEntry = {
      name: 'Error Job',
      schedule: function (parser) {
        return parser.text('every 1 second');
      },
      job: function () {
        throw new Error('Test error');
      },
      onError: function (opts) {
        onErrorCalled = true;
        test.instanceOf(opts.error, Error, 'Error should be an Error object');
        test.equal(opts.error.message, 'Test error', 'Error message should match');
        test.equal(opts.name, 'Error Job', 'Name should match job name');
        test.isTrue(opts.intendedAt instanceof Date, 'intendedAt should be a Date object');
      }
    };

    SyncedCron.add(testEntry);
    const entry = SyncedCron._entries[testEntry.name];

    await SyncedCron._entryWrapper(entry)(new Date());

    test.isTrue(onErrorCalled, 'onError should have been called');
  }
);

Tinytest.addAsync(
  'Cleanup marks jobs as terminated on SIGTERM',
  async function (test) {
    mockProcessExit();
    await SyncedCron._reset();

    // Create a long-running job
    const testEntry = {
      name: 'Long Running Job',
      schedule: function (parser) {
        return parser.text('every 1 second');
      },
      job: async function () {
        await new Promise(resolve => setTimeout(resolve, 5000));
        return 'completed';
      }
    };

    SyncedCron.add(testEntry);
    const entry = SyncedCron._entries[testEntry.name];

    // Start the job but don't await it
    SyncedCron._entryWrapper(entry)(new Date());

    // Wait a bit to ensure the job has started
    await new Promise(resolve => setTimeout(resolve, 100));

    // Simulate SIGTERM
    process.emit('SIGTERM');

    // Wait for cleanup to complete
    await new Promise(resolve => setTimeout(resolve, 100));

    // Check the job history
    const jobHistory = await SyncedCron._collection.findOneAsync();

    test.isNotNull(jobHistory, 'Job history should exist');
    test.isNotUndefined(jobHistory.finishedAt, 'Job should be marked as finished');
    test.equal(jobHistory.terminatedBy, 'SIGTERM', 'Job should be marked as terminated by SIGTERM');

    restoreProcessExit();
  }
);

Tinytest.addAsync(
  'Cleanup marks jobs as terminated on uncaught exception',
  async function (test) {
    mockProcessExit();
    await SyncedCron._reset();

    // Create a long-running job
    const testEntry = {
      name: 'Exception Job',
      schedule: function (parser) {
        return parser.text('every 1 second');
      },
      job: async function () {
        await new Promise(resolve => setTimeout(resolve, 5000));
        return 'completed';
      }
    };

    SyncedCron.add(testEntry);
    const entry = SyncedCron._entries[testEntry.name];

    // Start the job but don't await it
    SyncedCron._entryWrapper(entry)(new Date());

    // Wait a bit to ensure the job has started
    await new Promise(resolve => setTimeout(resolve, 100));

    // Create a fatal error
    const fatalError = new Error('Fatal error')

    // Simulate fatal error
    process.emit('uncaughtException', fatalError);

    // Wait for cleanup to complete
    await new Promise(resolve => setTimeout(resolve, 100));

    // Check the job history
    const jobHistory = await SyncedCron._collection.findOneAsync();

    test.isNotNull(jobHistory, 'Job history should exist');
    test.isNotUndefined(jobHistory.finishedAt, 'Job should be marked as finished');
    test.equal(jobHistory.terminatedBy, 'UNCAUGHT_EXCEPTION', 'Job should be marked as terminated by UNCAUGHT_EXCEPTION');

    restoreProcessExit();
  }
);

Tinytest.addAsync(
  'Non-fatal errors do not trigger cleanup',
  async function (test) {
    mockProcessExit();
    await SyncedCron._reset();

    // Create a long-running job
    const testEntry = {
      name: 'Non-Fatal Error Job',
      schedule: function (parser) {
        return parser.text('every 1 second');
      },
      job: async function () {
        await new Promise(resolve => setTimeout(resolve, 5000));
        return 'completed';
      }
    };

    SyncedCron.add(testEntry);
    const entry = SyncedCron._entries[testEntry.name];

    // Start the job but don't await it
    SyncedCron._entryWrapper(entry)(new Date());

    // Wait a bit to ensure the job has started
    await new Promise(resolve => setTimeout(resolve, 100));

    // Add another error handler to make the error non-fatal
    const errorHandler = () => { };
    process.on('uncaughtException', errorHandler);

    // Simulate non-fatal error
    process.emit('uncaughtException', new Error('Non-fatal error'));

    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 100));

    // Check the job history
    const jobHistory = await SyncedCron._collection.findOneAsync();

    test.isNotNull(jobHistory, 'Job history should exist');
    test.equal(jobHistory.finishedAt, undefined, 'Job should not be marked as finished');
    test.equal(jobHistory.terminatedBy, undefined, 'Job should not be marked as terminated');

    // Cleanup
    process.removeListener('uncaughtException', errorHandler);
    restoreProcessExit();
  }
);

Tinytest.addAsync(
  'Jobs are tagged with process ID',
  async (test) => {
    await SyncedCron._reset();

    const testEntry = {
      name: 'Process ID Test Job',
      schedule(parser) {
        return parser.text('every 1 second');
      },
      job() {
        return 'completed';
      },
    };

    SyncedCron.add(testEntry);
    const entry = SyncedCron._entries[testEntry.name];

    // Run the job
    await SyncedCron._entryWrapper(entry)(new Date());

    // Check the job history
    const jobHistory = await SyncedCron._collection.findOneAsync();

    test.isNotNull(jobHistory, 'Job history should exist');
    test.isNotNull(jobHistory.processId, 'Job should have a process ID');
    test.equal(jobHistory.processId, SyncedCron.processId, 'Job process ID should match SyncedCron process ID');
  }
);

Tinytest.addAsync(
  'Cleanup only affects jobs from current process',
  async (test) => {
    mockProcessExit();
    await SyncedCron._reset();

    // Create two jobs with different process IDs
    const currentProcessJob = {
      name: 'Current Process Job',
      intendedAt: new Date(),
      startedAt: new Date(),
      processId: SyncedCron.processId,
    };

    const otherProcessJob = {
      name: 'Other Process Job',
      intendedAt: new Date(),
      startedAt: new Date(),
      processId: 'other-process-id',
    };

    // Insert both jobs
    await SyncedCron._collection.insertAsync(currentProcessJob);
    await SyncedCron._collection.insertAsync(otherProcessJob);

    // Simulate SIGTERM
    process.emit('SIGTERM');

    // Wait for cleanup to complete
    await new Promise(resolve => setTimeout(resolve, 100));

    // Check the job histories
    const currentProcessJobHistory = await SyncedCron._collection.findOneAsync(
      { processId: SyncedCron.processId }
    );
    const otherProcessJobHistory = await SyncedCron._collection.findOneAsync(
      { processId: 'other-process-id' }
    );

    test.isNotNull(currentProcessJobHistory, 'Current process job should exist');
    test.isNotNull(otherProcessJobHistory, 'Other process job should exist');

    // Current process job should be marked as terminated
    test.isNotUndefined(currentProcessJobHistory.finishedAt, 'Current process job should be marked as finished');
    test.equal(currentProcessJobHistory.terminatedBy, 'SIGTERM', 'Current process job should be marked as terminated by SIGTERM');

    // Other process job should be untouched
    test.isUndefined(otherProcessJobHistory.finishedAt, 'Other process job should not be marked as finished');
    test.isUndefined(otherProcessJobHistory.terminatedBy, 'Other process job should not be marked as terminated');

    restoreProcessExit();
  }
);

Tinytest.addAsync(
  'Process ID is consistent across job runs',
  async (test) => {
    await SyncedCron._reset();

    const testEntry = {
      name: 'Process ID Consistency Job',
      schedule(parser) {
        return parser.text('every 1 second');
      },
      job() {
        return 'completed';
      },
    };

    SyncedCron.add(testEntry);
    const entry = SyncedCron._entries[testEntry.name];

    // Run the job twice
    await SyncedCron._entryWrapper(entry)(new Date());
    await SyncedCron._entryWrapper(entry)(new Date(Date.now() + 1000));

    // Get all job histories
    const jobHistories = await SyncedCron._collection.find().fetchAsync();

    test.equal(jobHistories.length, 2, 'Should have two job histories');

    if (jobHistories.length >= 2) {
      test.equal(
        jobHistories[0].processId,
        jobHistories[1].processId,
        'Process ID should be consistent across job runs'
      );
      test.equal(
        jobHistories[0].processId,
        SyncedCron.processId,
        'Job process ID should match SyncedCron process ID'
      );
    }
  }
);

Tinytest.addAsync(
  'Process exit is called on fatal errors',
  async (test) => {
    let exitCalled = false;
    mockProcessExit();

    // Override the mock to track if it was called
    process.exit = () => {
      exitCalled = true;
    };

    await SyncedCron._reset();

    const testEntry = {
      name: 'Fatal Error Job',
      schedule(parser) {
        return parser.text('every 1 second');
      },
      async job() {
        await new Promise(resolve => setTimeout(resolve, 1000));
        return 'completed';
      },
    };

    SyncedCron.add(testEntry);
    const entry = SyncedCron._entries[testEntry.name];

    // Start the job
    SyncedCron._entryWrapper(entry)(new Date());

    // Wait a bit to ensure the job has started
    await new Promise(resolve => setTimeout(resolve, 100));

    // Simulate fatal error (with no other handlers)
    process.emit('uncaughtException', new Error('Fatal error'));

    // Wait for cleanup to complete
    await new Promise(resolve => setTimeout(resolve, 100));

    test.isTrue(exitCalled, 'Process.exit should have been called');

    restoreProcessExit();
  }
);

// Stuck jobs tests
Tinytest.addAsync(
  'checkStuckJobs: finds and removes stuck jobs',
  async (test) => {
    await SyncedCron._reset();

    // Insert a job that started 20 minutes ago without finishedAt
    const twentyMinutesAgo = new Date(Date.now() - 20 * 60 * 1000);
    const stuckJob = {
      name: 'Stuck Job',
      intendedAt: twentyMinutesAgo,
      startedAt: twentyMinutesAgo,
      processId: 'some-process-id',
    };

    await SyncedCron._collection.insertAsync(stuckJob);

    // Check there is 1 job
    test.equal(await SyncedCron._collection.find().countAsync(), 1);

    // Run checkStuckJobs with 15 minute threshold (default)
    const result = await SyncedCron.checkStuckJobs();

    test.equal(result.found, 1, 'Should find 1 stuck job');
    test.equal(result.removed, 1, 'Should remove 1 stuck job');
    test.equal(result.stuckJobs.length, 1, 'Should return 1 stuck job');
    test.equal(result.stuckJobs[0].name, 'Stuck Job', 'Stuck job name should match');

    // Check the job was removed
    test.equal(await SyncedCron._collection.find().countAsync(), 0);
  }
);

Tinytest.addAsync(
  'checkStuckJobs: does not remove jobs within threshold',
  async (test) => {
    await SyncedCron._reset();

    // Insert a job that started 5 minutes ago without finishedAt
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const recentJob = {
      name: 'Recent Job',
      intendedAt: fiveMinutesAgo,
      startedAt: fiveMinutesAgo,
      processId: 'some-process-id',
    };

    await SyncedCron._collection.insertAsync(recentJob);

    // Check there is 1 job
    test.equal(await SyncedCron._collection.find().countAsync(), 1);

    // Run checkStuckJobs with 15 minute threshold (default)
    const result = await SyncedCron.checkStuckJobs();

    test.equal(result.found, 0, 'Should find 0 stuck jobs');
    test.equal(result.removed, 0, 'Should remove 0 stuck jobs');

    // Check the job was NOT removed
    test.equal(await SyncedCron._collection.find().countAsync(), 1);
  }
);

Tinytest.addAsync(
  'checkStuckJobs: respects custom threshold option',
  async (test) => {
    await SyncedCron._reset();

    // Insert a job that started 5 minutes ago without finishedAt
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const recentJob = {
      name: 'Recent Job',
      intendedAt: fiveMinutesAgo,
      startedAt: fiveMinutesAgo,
      processId: 'some-process-id',
    };

    await SyncedCron._collection.insertAsync(recentJob);

    // Run checkStuckJobs with 3 minute threshold
    const result = await SyncedCron.checkStuckJobs({
      stuckJobsThreshold: 3 * 60 * 1000,
    });

    test.equal(result.found, 1, 'Should find 1 stuck job with custom threshold');
    test.equal(result.removed, 1, 'Should remove 1 stuck job');

    // Check the job was removed
    test.equal(await SyncedCron._collection.find().countAsync(), 0);
  }
);

Tinytest.addAsync(
  'checkStuckJobs: calls onStuckJobFound callback for each stuck job',
  async (test) => {
    await SyncedCron._reset();

    // Insert two stuck jobs
    const twentyMinutesAgo = new Date(Date.now() - 20 * 60 * 1000);
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

    await SyncedCron._collection.insertAsync({
      name: 'Stuck Job 1',
      intendedAt: twentyMinutesAgo,
      startedAt: twentyMinutesAgo,
      processId: 'process-1',
    });

    await SyncedCron._collection.insertAsync({
      name: 'Stuck Job 2',
      intendedAt: thirtyMinutesAgo,
      startedAt: thirtyMinutesAgo,
      processId: 'process-2',
    });

    const callbackCalls = [];

    const result = await SyncedCron.checkStuckJobs({
      onStuckJobFound: ({ job, runningTimeMs }) => {
        callbackCalls.push({ jobName: job.name, runningTimeMs });
      },
    });

    test.equal(result.found, 2, 'Should find 2 stuck jobs');
    test.equal(callbackCalls.length, 2, 'onStuckJobFound should be called twice');

    // Check callback received correct data
    const jobNames = callbackCalls.map(c => c.jobName).sort();
    test.equal(jobNames[0], 'Stuck Job 1');
    test.equal(jobNames[1], 'Stuck Job 2');

    // Check running times are roughly correct (within 1 minute tolerance)
    callbackCalls.forEach(call => {
      test.isTrue(call.runningTimeMs > 15 * 60 * 1000, 'Running time should be greater than 15 minutes');
    });
  }
);

Tinytest.addAsync(
  'checkStuckJobs: uses onStuckJobFound from global options',
  async (test) => {
    await SyncedCron._reset();

    const twentyMinutesAgo = new Date(Date.now() - 20 * 60 * 1000);
    await SyncedCron._collection.insertAsync({
      name: 'Stuck Job Global',
      intendedAt: twentyMinutesAgo,
      startedAt: twentyMinutesAgo,
      processId: 'process-1',
    });

    let globalCallbackCalled = false;
    const originalOnStuckJobFound = SyncedCron.options.onStuckJobFound;

    SyncedCron.options.onStuckJobFound = ({ job }) => {
      globalCallbackCalled = true;
      test.equal(job.name, 'Stuck Job Global');
    };

    await SyncedCron.checkStuckJobs();

    test.isTrue(globalCallbackCalled, 'Global onStuckJobFound should be called');

    // Restore original option
    SyncedCron.options.onStuckJobFound = originalOnStuckJobFound;
  }
);

Tinytest.addAsync(
  'checkStuckJobs: does not remove finished jobs',
  async (test) => {
    await SyncedCron._reset();

    // Insert a job that finished
    const twentyMinutesAgo = new Date(Date.now() - 20 * 60 * 1000);
    const finishedJob = {
      name: 'Finished Job',
      intendedAt: twentyMinutesAgo,
      startedAt: twentyMinutesAgo,
      finishedAt: new Date(Date.now() - 19 * 60 * 1000),
      processId: 'some-process-id',
      result: 'completed',
    };

    await SyncedCron._collection.insertAsync(finishedJob);

    const result = await SyncedCron.checkStuckJobs();

    test.equal(result.found, 0, 'Should not find finished jobs as stuck');
    test.equal(await SyncedCron._collection.find().countAsync(), 1, 'Finished job should remain');
  }
);

Tinytest.addAsync(
  'checkStuckJobs: handles async onStuckJobFound callback',
  async (test) => {
    await SyncedCron._reset();

    const twentyMinutesAgo = new Date(Date.now() - 20 * 60 * 1000);
    await SyncedCron._collection.insertAsync({
      name: 'Stuck Job Async',
      intendedAt: twentyMinutesAgo,
      startedAt: twentyMinutesAgo,
      processId: 'process-1',
    });

    let asyncCallbackCompleted = false;

    const result = await SyncedCron.checkStuckJobs({
      onStuckJobFound: async ({ job }) => {
        await new Promise(resolve => setTimeout(resolve, 50));
        asyncCallbackCompleted = true;
      },
    });

    test.isTrue(asyncCallbackCompleted, 'Async callback should complete');
    test.equal(result.found, 1, 'Should find 1 stuck job');
  }
);

Tinytest.addAsync(
  'checkStuckJobs: continues processing if callback throws',
  async (test) => {
    await SyncedCron._reset();

    // Insert two stuck jobs
    const twentyMinutesAgo = new Date(Date.now() - 20 * 60 * 1000);
    await SyncedCron._collection.insertAsync({
      name: 'Stuck Job Error 1',
      intendedAt: twentyMinutesAgo,
      startedAt: twentyMinutesAgo,
      processId: 'process-1',
    });

    await SyncedCron._collection.insertAsync({
      name: 'Stuck Job Error 2',
      intendedAt: new Date(Date.now() - 25 * 60 * 1000),
      startedAt: new Date(Date.now() - 25 * 60 * 1000),
      processId: 'process-2',
    });

    let callCount = 0;

    const result = await SyncedCron.checkStuckJobs({
      onStuckJobFound: ({ job }) => {
        callCount++;
        if (callCount === 1) {
          throw new Error('Callback error');
        }
      },
    });

    test.equal(callCount, 2, 'Callback should be called for both jobs');
    test.equal(result.found, 2, 'Should find 2 stuck jobs');
    test.equal(result.removed, 2, 'Should remove both jobs despite callback error');
  }
);

// Automatic stuck jobs check tests
Tinytest.addAsync(
  'checkStuckJobsSchedule: registers job when configured',
  async (test) => {
    await SyncedCron._reset();

    const originalSchedule = SyncedCron.options.checkStuckJobsSchedule;

    // Set a schedule
    SyncedCron.options.checkStuckJobsSchedule = (parser) => parser.text('every 1 second');

    SyncedCron._startStuckJobsCheck();

    // Check that the job was registered
    const entry = SyncedCron._entries[SyncedCron._stuckJobsCheckName];
    test.isNotUndefined(entry, 'Stuck jobs check entry should be registered');
    test.equal(entry.persist, false, 'Stuck jobs check should not persist');

    // Cleanup
    SyncedCron._stopStuckJobsCheck();
    SyncedCron.options.checkStuckJobsSchedule = originalSchedule;
  }
);

Tinytest.addAsync(
  'checkStuckJobsSchedule: does not register when not configured',
  async (test) => {
    await SyncedCron._reset();

    const originalSchedule = SyncedCron.options.checkStuckJobsSchedule;
    SyncedCron.options.checkStuckJobsSchedule = null;

    SyncedCron._startStuckJobsCheck();

    // Check that no job was registered
    const entry = SyncedCron._entries[SyncedCron._stuckJobsCheckName];
    test.isUndefined(entry, 'Stuck jobs check entry should not be registered when disabled');

    // Cleanup
    SyncedCron.options.checkStuckJobsSchedule = originalSchedule;
  }
);

Tinytest.addAsync(
  'checkStuckJobsSchedule: removes job on stop',
  async (test) => {
    await SyncedCron._reset();

    const originalSchedule = SyncedCron.options.checkStuckJobsSchedule;
    SyncedCron.options.checkStuckJobsSchedule = (parser) => parser.text('every 1 second');

    SyncedCron._startStuckJobsCheck();
    test.isNotUndefined(SyncedCron._entries[SyncedCron._stuckJobsCheckName], 'Job should be registered');

    SyncedCron._stopStuckJobsCheck();
    test.isUndefined(SyncedCron._entries[SyncedCron._stuckJobsCheckName], 'Job should be removed on stop');

    // Cleanup
    SyncedCron.options.checkStuckJobsSchedule = originalSchedule;
  }
);

Tinytest.addAsync(
  'checkStuckJobsSchedule: job executes and removes stuck jobs',
  async (test) => {
    await SyncedCron._reset();

    const originalSchedule = SyncedCron.options.checkStuckJobsSchedule;
    const originalThreshold = SyncedCron.options.stuckJobsThreshold;

    SyncedCron.options.checkStuckJobsSchedule = (parser) => parser.text('every 1 second');
    SyncedCron.options.stuckJobsThreshold = 100; // 100ms

    // Insert a stuck job
    const twoSecondsAgo = new Date(Date.now() - 2000);
    await SyncedCron._collection.insertAsync({
      name: 'Auto Check Stuck Job',
      intendedAt: twoSecondsAgo,
      startedAt: twoSecondsAgo,
      processId: 'process-1',
    });

    // Manually run the job entry wrapper to simulate execution
    SyncedCron._startStuckJobsCheck();
    const entry = SyncedCron._entries[SyncedCron._stuckJobsCheckName];

    // Execute the job directly
    await entry.job();

    // The stuck job should have been removed
    const count = await SyncedCron._collection.find().countAsync();
    test.equal(count, 0, 'Stuck job should be removed by check job');

    // Cleanup
    SyncedCron._stopStuckJobsCheck();
    SyncedCron.options.checkStuckJobsSchedule = originalSchedule;
    SyncedCron.options.stuckJobsThreshold = originalThreshold;
  }
);

Tinytest.addAsync(
  'checkStuckJobsSchedule: replaces previous job when restarted',
  async (test) => {
    await SyncedCron._reset();

    const originalSchedule = SyncedCron.options.checkStuckJobsSchedule;
    SyncedCron.options.checkStuckJobsSchedule = (parser) => parser.text('every 1 second');

    SyncedCron._startStuckJobsCheck();
    const firstEntry = SyncedCron._entries[SyncedCron._stuckJobsCheckName];
    test.isNotUndefined(firstEntry, 'First entry should be registered');

    // Change schedule and restart
    SyncedCron.options.checkStuckJobsSchedule = (parser) => parser.text('every 5 seconds');
    SyncedCron._startStuckJobsCheck();

    const secondEntry = SyncedCron._entries[SyncedCron._stuckJobsCheckName];
    test.isNotUndefined(secondEntry, 'Second entry should be registered');

    // Cleanup
    SyncedCron._stopStuckJobsCheck();
    SyncedCron.options.checkStuckJobsSchedule = originalSchedule;
  }
);
