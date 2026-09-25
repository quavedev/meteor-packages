import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { Random } from 'meteor/random';
import { EJSON } from 'meteor/ejson';

// Collections are shared by queue instances in one process. Separate processes
// discover the same work through MongoDB, without sharing closures or timers.
class PermanentJobError extends Error {}
const collections = new Map();
const positiveInteger = (value, name) => {
  if (!Number.isSafeInteger(value) || value < 1) {
    throw new Error(`${name} must be a positive integer`);
  }
};
const nonemptyString = (value, name) => {
  if (typeof value !== 'string' || !value.length) {
    throw new Error(`${name} must be a nonempty string`);
  }
};
const unwrap = (result) => result && (
  Object.prototype.hasOwnProperty.call(result, 'value') ? result.value : result
);

export function createDurableQueue({
  collectionName,
  pollIntervalMs = 1000,
  leaseDurationMs = 30000,
  concurrency = 1,
  onError = (error) => console.error('[SyncedCron durable queue]', error),
}) {
  nonemptyString(collectionName, 'collectionName');
  positiveInteger(pollIntervalMs, 'pollIntervalMs');
  positiveInteger(leaseDurationMs, 'leaseDurationMs');
  positiveInteger(concurrency, 'concurrency');
  if (leaseDurationMs < 300) throw new Error('leaseDurationMs must be at least 300');
  if (typeof onError !== 'function') throw new Error('onError must be a function');
  if (!collections.has(collectionName)) {
    collections.set(collectionName, new Mongo.Collection(collectionName));
  }
  const collection = collections.get(collectionName);
  const raw = collection.rawCollection();
  const handlers = new Map();
  const active = new Set();
  let timer;
  let polling;
  let initializing;
  let stopped = true;

  const initialize = () => {
    if (!initializing) {
      initializing = (async () => {
        await raw.createIndex({ status: 1, type: 1, runAt: 1 });
        await raw.createIndex({ status: 1, type: 1, leaseUntil: 1 });
      })().catch((error) => { initializing = undefined; throw error; });
    }
    return initializing;
  };

  const execute = async (job) => {
    const controller = new AbortController();
    const owned = () => ({
      _id: job._id, status: 'running', leaseToken: job.leaseToken,
      leaseUntil: { $gt: new Date() },
    });
    let renewing = false;
    const renew = async () => {
      const result = await raw.updateOne(owned(), {
        $set: { leaseUntil: new Date(Date.now() + leaseDurationMs) },
      });
      if (!result.matchedCount) {
        controller.abort();
        throw new Error('Durable job lease lost');
      }
    };
    const heartbeat = Meteor.setInterval(async () => {
      if (renewing) return;
      renewing = true;
      try { await renew(); } catch (error) { controller.abort(); onError(error); }
      finally { renewing = false; }
    }, Math.floor(leaseDurationMs / 3));
    try {
      await handlers.get(job.type)(EJSON.clone(job.data), {
        id: job._id,
        attempt: job.attempts,
        leaseToken: job.leaseToken,
        signal: controller.signal,
        // A fence/checkpoint, not a transaction with the handler's side effects.
        assertOwnership: renew,
        fail(message) { throw new PermanentJobError(message); },
      });
      await raw.updateOne(owned(), {
        $set: { status: 'completed', finishedAt: new Date() },
        $unset: { leaseToken: '', leaseUntil: '', lastError: '' },
      });
    } catch (error) {
      const terminal = error instanceof PermanentJobError || job.attempts >= job.maxAttempts;
      // A stale worker cannot finish, retry or overwrite a successor's job.
      await raw.updateOne(owned(), {
        $set: {
          status: terminal ? 'failed' : 'pending',
          runAt: new Date(Date.now() + job.retryDelayMs),
          lastError: String(error?.message || error).slice(0, 2000),
          ...(terminal ? { finishedAt: new Date() } : {}),
        },
        $unset: { leaseToken: '', leaseUntil: '' },
      });
    } finally {
      Meteor.clearInterval(heartbeat);
    }
  };

  const poll = async () => {
    await initialize();
    const types = [...handlers.keys()];
    if (!types.length) return;
    // A process can die on its last attempt. Do not leave that job running forever.
    await raw.updateMany({
      type: { $in: types }, status: 'running', leaseUntil: { $lte: new Date() },
      $expr: { $gte: ['$attempts', '$maxAttempts'] },
    }, {
      $set: { status: 'failed', finishedAt: new Date(), lastError: 'Lease expired on final attempt' },
      $unset: { leaseToken: '', leaseUntil: '' },
    });
    const available = concurrency - active.size;
    for (let slot = 0; slot < available; slot++) {
      const now = new Date();
      const job = unwrap(await raw.findOneAndUpdate({
        type: { $in: types },
        $expr: { $lt: ['$attempts', '$maxAttempts'] },
        $or: [
          { status: 'pending', runAt: { $lte: now } },
          { status: 'running', leaseUntil: { $lte: now } },
        ],
      }, {
        $set: {
          status: 'running', startedAt: now,
          leaseToken: Random.id(), leaseUntil: new Date(now.getTime() + leaseDurationMs),
        },
        $inc: { attempts: 1 },
      }, { sort: { runAt: 1, _id: 1 }, returnDocument: 'after' }));
      if (!job) break;
      const task = execute(job).catch(onError);
      active.add(task);
      task.finally(() => active.delete(task));
    }
  };
  const tick = () => {
    if (!polling) polling = poll().finally(() => { polling = undefined; });
    return polling;
  };

  return {
    register(type, handler) {
      nonemptyString(type, 'type');
      if (typeof handler !== 'function') throw new Error('handler must be a function');
      if (handlers.has(type)) throw new Error(`Handler already registered: ${type}`);
      handlers.set(type, handler);
    },
    async enqueue({ id, type, runAt, data = {}, maxAttempts = 5, retryDelayMs = 1000 }) {
      nonemptyString(id, 'id');
      nonemptyString(type, 'type');
      if (!(runAt instanceof Date) || !Number.isFinite(runAt.getTime())) {
        throw new Error('runAt must be a valid Date');
      }
      positiveInteger(maxAttempts, 'maxAttempts');
      positiveInteger(retryDelayMs, 'retryDelayMs');
      // Validate/copy as data, never persist executable functions or closures.
      const payload = EJSON.clone(data);
      const rejectFunctions = (value) => {
        if (typeof value === 'function' || typeof value === 'symbol' || typeof value === 'bigint') {
          throw new Error('data must be EJSON serializable');
        }
        if (value && typeof value === 'object') Object.values(value).forEach(rejectFunctions);
      };
      rejectFunctions(data);
      await initialize();
      const definition = { type, runAt, scheduledAt: runAt, data: payload, maxAttempts, retryDelayMs };
      try {
        await raw.updateOne({ _id: id }, {
          $setOnInsert: { ...definition, status: 'pending', attempts: 0, createdAt: new Date() },
        }, { upsert: true });
      } catch (error) {
        if (error.code !== 11000) throw error;
      }
      const existing = await raw.findOne({ _id: id });
      // Never resurrect completed/cancelled work by re-enqueueing its identity.
      // runAt changes during retries; scheduledAt remains immutable.
      if (existing.type !== type || !EJSON.equals(existing.scheduledAt, runAt) ||
          !EJSON.equals(existing.data, payload) ||
          existing.maxAttempts !== maxAttempts || existing.retryDelayMs !== retryDelayMs) {
        throw new Error(`Durable job id already has a different definition: ${id}`);
      }
      return id;
    },
    async get(id) {
      nonemptyString(id, 'id');
      return raw.findOne({ _id: id });
    },
    async cancel(id) {
      nonemptyString(id, 'id');
      const result = await raw.updateOne({ _id: id, status: { $in: ['pending', 'running'] } }, {
        $set: { status: 'cancelled', finishedAt: new Date() },
        $unset: { leaseToken: '', leaseUntil: '' },
      });
      return result.modifiedCount > 0;
    },
    async runOnce() {
      await tick();
      await Promise.all([...active]);
    },
    async start() {
      if (!stopped) return;
      await initialize();
      if (!stopped) return;
      stopped = false;
      timer = Meteor.setInterval(() => tick().catch(onError), pollIntervalMs);
      await tick();
    },
    async stop() {
      stopped = true;
      if (timer) Meteor.clearInterval(timer);
      timer = undefined;
      // In-flight work retains its heartbeat until it finishes. A hard kill is
      // recovered through expiry; never release a live handler's ownership.
      if (polling) await polling;
      await Promise.all([...active]);
    },
  };
}
