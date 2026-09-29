import test from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/app.js';
import { startServer } from '../test-support/helpers.js';

test('GET /api/products serves from the service, then the cache', async () => {
  const server = await startServer(createApp({ rateLimitMax: 1_000 }));

  try {
    const first = await (await fetch(`${server.baseUrl}/api/products`)).json();
    const second = await (await fetch(`${server.baseUrl}/api/products`)).json();

    assert.equal(first.source, 'service');
    assert.equal(second.source, 'cache');
    assert.ok(Array.isArray(first.data));
    assert.deepEqual(first.data, second.data);
  } finally {
    await server.close();
  }
});
