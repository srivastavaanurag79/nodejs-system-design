import { randomUUID } from 'node:crypto';
import { logger } from '../lib/logger.js';

const MAX_ATTEMPTS = 3;

const jobs = new Map();
const pending = [];

let handler = null;
let draining = false;
let stopped = false;

export function startQueue(jobHandler) {
  handler = jobHandler;
  stopped = false;
}

export function enqueue(type, payload = {}) {
  const job = {
    id: randomUUID(),
    type,
    payload,
    status: 'queued',
    attempts: 0,
    maxAttempts: MAX_ATTEMPTS,
    result: null,
    error: null,
    createdAt: new Date().toISOString(),
    startedAt: null,
    finishedAt: null
  };

  jobs.set(job.id, job);
  pending.push(job);
  setImmediate(drain);

  return job;
}

export function getJob(id) {
  return jobs.get(id);
}

export function queueStats() {
  const all = [...jobs.values()];

  return {
    depth: pending.filter(job => job.status === 'queued').length,
    processing: all.filter(job => job.status === 'processing').length,
    completed: all.filter(job => job.status === 'completed').length,
    failed: all.filter(job => job.status === 'failed').length
  };
}

export function stopQueue() {
  stopped = true;
}

async function drain() {
  if (draining || stopped || !handler) {
    return;
  }

  draining = true;

  try {
    while (pending.length && !stopped) {
      const job = pending.shift();

      if (job.status !== 'queued') {
        continue;
      }

      job.attempts += 1;
      job.status = 'processing';
      job.startedAt = new Date().toISOString();

      try {
        job.result = await handler(job);
        job.status = 'completed';
        job.finishedAt = new Date().toISOString();

        logger.info('job.completed', {
          jobId: job.id,
          type: job.type,
          attempts: job.attempts
        });
      } catch (error) {
        job.error = error.message;
        job.finishedAt = new Date().toISOString();

        if (job.attempts < job.maxAttempts) {
          job.status = 'queued';
          pending.push(job);

          logger.warn('job.retry', {
            jobId: job.id,
            type: job.type,
            attempts: job.attempts,
            error: error.message
          });
        } else {
          job.status = 'failed';

          logger.error('job.failed', {
            jobId: job.id,
            type: job.type,
            error: error.message
          });
        }
      }
    }
  } finally {
    draining = false;
  }
}

export function waitForIdle(timeoutMs = 5_000) {
  return new Promise(resolve => {
    const deadline = Date.now() + timeoutMs;

    const check = () => {
      if ((!draining && pending.length === 0) || Date.now() >= deadline) {
        resolve();
        return;
      }

      setTimeout(check, 25);
    };

    check();
  });
}
