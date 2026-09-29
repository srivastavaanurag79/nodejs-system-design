import test from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/app.js';
import { startServer } from '../test-support/helpers.js';

test('responses carry an x-request-id header', async () => {
  const server = await startServer(createApp({ rateLimitMax: 1_000 }));

  try {
    const response = await fetch(`${server.baseUrl}/api/products`);

    assert.ok(response.headers.get('x-request-id'));
  } finally {
    await server.close();
  }
});

test('a client supplied x-request-id is preserved', async () => {
  const server = await startServer(createApp({ rateLimitMax: 1_000 }));

  try {
    const response = await fetch(`${server.baseUrl}/api/products`, {
      headers: { 'x-request-id': 'trace-abc-123' }
    });

    assert.equal(response.headers.get('x-request-id'), 'trace-abc-123');
  } finally {
    await server.close();
  }
});
