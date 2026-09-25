import { createDurableQueue } from './durable-queue';
import { MongoInternals } from 'meteor/mongo';
import { Random } from 'meteor/random';
import { EJSON } from 'meteor/ejson';

const testQueue = () => {
  const collectionName = `durable_tests_${Random.id()}`;
  const errors = [];
  const options = { collectionName, onError: (error) => errors.push(error), leaseDurationMs: 30000 };
  const queue = createDurableQueue(options);
  // createDurableQueue owns the Meteor collection. Inspect through the driver to
  // simulate process death without waiting for wall-clock lease expiry.
  const raw = MongoInternals.defaultRemoteCollectionDriver().mongo.db.collection(collectionName);
  return { queue, raw, options, errors };
};
const definition = (id = Random.id()) => ({ id, type: 'task', runAt: new Date(0), data: { value: 42 } });
const suite = (name, run) => Tinytest.addAsync(`Durable queue - ${name}`, async (test, done) => {
  const fixture = testQueue();
  try { await run(test, fixture); }
  catch (error) { test.exception(error); }
  finally { await fixture.queue.stop(); await fixture.raw.drop(); done(); }
});

suite('a different process discovers a persisted job and preserves deduplication', async (test, { queue, options }) => {
  const job = definition();
  await queue.enqueue(job); // No handler on the producer.
  let calls = 0;
  const consumer = createDurableQueue(options);
  consumer.register('task', async (data, context) => {
    test.equal(data.value, 42);
    test.equal(context.id, job.id);
    calls++;
  });
  await consumer.runOnce();
  test.equal((await queue.get(job.id)).status, 'completed');
  await queue.enqueue(job);
  await consumer.runOnce();
  test.equal(calls, 1);
  await consumer.stop();
});

suite('concurrent consumers claim only once', async (test, { queue, options }) => {
  let calls = 0;
  queue.register('task', async () => { calls++; });
  const other = createDurableQueue(options);
  other.register('task', async () => { calls++; });
  await queue.enqueue(definition());
  await Promise.all([queue.runOnce(), other.runOnce()]);
  test.equal(calls, 1);
  await other.stop();
});

suite('future jobs and unregistered types are not executed', async (test, { queue }) => {
  let calls = 0;
  queue.register('task', async () => { calls++; });
  const future = { ...definition(), runAt: new Date(Date.now() + 60000) };
  const unknown = { ...definition(), type: 'different-app' };
  await queue.enqueue(future);
  await queue.enqueue(unknown);
  await queue.runOnce();
  test.equal(calls, 0);
  test.equal((await queue.get(future.id)).status, 'pending');
  test.equal((await queue.get(unknown.id)).status, 'pending');
});

suite('expired ownership is recovered with the same execution id', async (test, { queue, raw }) => {
  const job = definition();
  await queue.enqueue(job);
  await raw.updateOne({ _id: job.id }, { $set: {
    status: 'running', attempts: 1, leaseToken: 'dead-worker', leaseUntil: new Date(0),
  } });
  queue.register('task', async (_, context) => {
    test.equal(context.id, job.id);
    test.equal(context.attempt, 2);
    await context.assertOwnership();
  });
  await queue.runOnce();
  test.equal((await queue.get(job.id)).status, 'completed');
});

suite('failed handlers retry and eventually fail visibly', async (test, { queue, raw }) => {
  const job = { ...definition(), maxAttempts: 2 };
  let calls = 0;
  queue.register('task', async () => { calls++; throw new Error('test failure'); });
  await queue.enqueue(job);
  await queue.runOnce();
  test.equal((await queue.get(job.id)).status, 'pending');
  await raw.updateOne({ _id: job.id }, { $set: { runAt: new Date(0) } });
  await queue.runOnce();
  const failed = await queue.get(job.id);
  test.equal(failed.status, 'failed');
  test.equal(failed.lastError, 'test failure');
  await queue.runOnce();
  test.equal(calls, 2);
});

suite('a crash on the last attempt becomes a visible failure', async (test, { queue, raw }) => {
  const job = { ...definition(), maxAttempts: 1 };
  await queue.enqueue(job);
  await raw.updateOne({ _id: job.id }, { $set: {
    status: 'running', attempts: 1, leaseToken: 'dead', leaseUntil: new Date(0),
  } });
  queue.register('task', async () => test.fail('must not run'));
  await queue.runOnce();
  test.equal((await queue.get(job.id)).status, 'failed');
});

suite('cancelled jobs stay cancelled after enqueue and stale completion', async (test, { queue }) => {
  const job = definition();
  queue.register('task', async (_, context) => {
    await queue.cancel(job.id);
    let rejected = false;
    try { await context.assertOwnership(); } catch { rejected = true; }
    test.isTrue(rejected);
    test.isTrue(context.signal.aborted);
  });
  await queue.enqueue(job);
  await queue.runOnce();
  await queue.enqueue(job);
  test.equal((await queue.get(job.id)).status, 'cancelled');
});

suite('a stale worker cannot overwrite a successor', async (test, { queue, raw }) => {
  const job = definition();
  queue.register('task', async () => {
    await raw.updateOne({ _id: job.id }, { $set: { leaseToken: 'new-owner' } });
  });
  await queue.enqueue(job);
  await queue.runOnce();
  const stored = await queue.get(job.id);
  test.equal(stored.status, 'running');
  test.equal(stored.leaseToken, 'new-owner');
});

suite('same identity with changed schedule is rejected', async (test, { queue }) => {
  const job = definition();
  await queue.enqueue(job);
  let rejected = false;
  try { await queue.enqueue({ ...job, runAt: new Date(100) }); } catch { rejected = true; }
  test.isTrue(rejected);
});

suite('permanent failure is not retried', async (test, { queue }) => {
  const job = definition();
  let calls = 0;
  queue.register('task', async (_, execution) => {
    calls++;
    execution.fail('operator review required');
  });
  await queue.enqueue(job);
  await queue.runOnce();
  await queue.runOnce();
  test.equal(calls, 1);
  test.equal((await queue.get(job.id)).status, 'failed');
});

suite('renewal extends ownership and rejects expired ownership', async (test, { queue, raw }) => {
  const job = definition();
  queue.register('task', async (_, execution) => {
    await raw.updateOne({ _id: job.id }, { $set: { leaseUntil: new Date(Date.now() + 500) } });
    await execution.assertOwnership();
    test.isTrue((await queue.get(job.id)).leaseUntil.getTime() > Date.now() + 10000);
    await raw.updateOne({ _id: job.id }, { $set: { leaseUntil: new Date(0) } });
    let rejected = false;
    try { await execution.assertOwnership(); } catch { rejected = true; }
    test.isTrue(rejected);
  });
  await queue.enqueue(job);
  await queue.runOnce();
  test.equal((await queue.get(job.id)).status, 'running');
});


suite('EJSON dates and binary survive storage; optional fields are normalized', async (test, { queue }) => {
  const binary = EJSON.newBinary(3);
  binary[0] = 7;
  const data = { date: new Date(1000), binary, omitted: undefined };
  const job = { ...definition(), data };
  queue.register('task', async (received) => {
    test.equal(received.date, data.date);
    test.isTrue(EJSON.isBinary(received.binary));
    test.equal(received.binary[0], 7);
    test.equal(received.omitted, undefined);
  });
  await queue.enqueue(job);
  await queue.enqueue(job);
  await queue.runOnce();
  test.equal((await queue.get(job.id)).status, 'completed');
});
