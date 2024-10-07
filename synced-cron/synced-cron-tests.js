Later = Npm.require('@breejs/later');

Later.date.localTime(); // corresponds to SyncedCron.options.utc: true;

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