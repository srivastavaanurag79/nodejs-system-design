import test from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/app.js';
import { startServer } from '../test-support/helpers.js';

test('GET / renders the console', async () => {
  const server = await startServer(createApp({ rateLimitMax: 1_000 }));

  try {
    const response = await fetch(`${server.baseUrl}/`);
    const html = await response.text();

    assert.equal(response.status, 200);
    assert.match(html, /Node\.js System Design Console/);
    assert.match(html, /\/api\/products/);
    assert.match(html, /\/api\/jobs/);
    assert.match(html, /\/api\/uploads/);
  } finally {
    await server.close();
  }
});
