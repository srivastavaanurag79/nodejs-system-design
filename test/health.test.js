import test from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/app.js';
import { startServer } from '../test-support/helpers.js';

test('GET /health reports status, uptime, and queue depth', async () => {
  const server = await startServer(createApp({ rateLimitMax: 1_000 }));

  try {
    const response = await fetch(`${server.baseUrl}/health`);
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.status, 'ok');
    assert.equal(typeof body.uptimeSeconds, 'number');
    assert.equal(typeof body.queue.depth, 'number');
  } finally {
    await server.close();
  }
});

test('unknown routes return 404', async () => {
  const server = await startServer(createApp({ rateLimitMax: 1_000 }));

  try {
    const response = await fetch(`${server.baseUrl}/does-not-exist`);

    assert.equal(response.status, 404);
  } finally {
    await server.close();
  }
});
