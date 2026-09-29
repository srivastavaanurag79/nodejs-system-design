import test from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/app.js';
import { startServer } from '../test-support/helpers.js';

test('rate limiter allows requests up to the limit, then returns 429', async () => {
  const server = await startServer(createApp({ rateLimitMax: 3 }));

  try {
    const statuses = [];

    for (let i = 0; i < 4; i += 1) {
      const response = await fetch(`${server.baseUrl}/api/products`);
      statuses.push(response.status);
    }

    assert.deepEqual(statuses, [200, 200, 200, 429]);
  } finally {
    await server.close();
  }
});

test('rate limit headers are returned', async () => {
  const server = await startServer(createApp({ rateLimitMax: 2 }));

  try {
    const response = await fetch(`${server.baseUrl}/api/products`);

    assert.equal(response.headers.get('x-ratelimit-limit'), '2');
    assert.equal(response.headers.get('x-ratelimit-remaining'), '1');
  } finally {
    await server.close();
  }
});

test('the deliberately strict /api/rate-limited endpoint trips at 3 requests', async () => {
  const server = await startServer(createApp({ rateLimitMax: 1_000 }));

  try {
    const statuses = [];

    for (let i = 0; i < 4; i += 1) {
      const response = await fetch(`${server.baseUrl}/api/rate-limited`);
      statuses.push(response.status);
    }

    assert.deepEqual(statuses, [200, 200, 200, 429]);
  } finally {
    await server.close();
  }
});
