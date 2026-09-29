import test from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/app.js';
import { startWorker } from '../src/workers/jobWorker.js';
import { startServer, pollJob } from '../test-support/helpers.js';

startWorker();

test('POST /api/jobs accepts work and completes it asynchronously', async () => {
  const server = await startServer(createApp({ rateLimitMax: 1_000 }));

  try {
    const response = await fetch(`${server.baseUrl}/api/jobs`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        type: 'send-notification',
        payload: { channel: 'email' }
      })
    });

    assert.equal(response.status, 202);
    const { jobId, jobStatus } = await response.json();
    assert.equal(jobStatus, 'queued');

    const job = await pollJob(server.baseUrl, jobId);
    assert.equal(job.status, 'completed');
    assert.equal(job.result.channel, 'email');
  } finally {
    await server.close();
  }
});

test('POST /api/jobs rejects unknown job types', async () => {
  const server = await startServer(createApp({ rateLimitMax: 1_000 }));

  try {
    const response = await fetch(`${server.baseUrl}/api/jobs`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ type: 'not-a-job' })
    });

    assert.equal(response.status, 400);
  } finally {
    await server.close();
  }
});

test('a failing job is retried up to maxAttempts and then marked failed', async () => {
  const server = await startServer(createApp({ rateLimitMax: 1_000 }));

  try {
    const response = await fetch(`${server.baseUrl}/api/jobs`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ type: 'send-email', payload: {} })
    });

    const { jobId } = await response.json();
    const job = await pollJob(server.baseUrl, jobId, 10_000);

    assert.equal(job.status, 'failed');
    assert.equal(job.attempts, 3);
    assert.match(job.error, /to/);
  } finally {
    await server.close();
  }
});
