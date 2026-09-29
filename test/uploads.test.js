import test from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/app.js';
import { startServer } from '../test-support/helpers.js';

test('POST /api/uploads returns a storage key and upload target', async () => {
  const server = await startServer(createApp({ rateLimitMax: 1_000 }));

  try {
    const response = await fetch(`${server.baseUrl}/api/uploads`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ fileName: 'inspection-video.mp4', size: 524_288_000 })
    });

    assert.equal(response.status, 201);
    const body = await response.json();

    assert.match(body.metadata.storageKey, /^uploads\/\d{4}\/\d{2}\//);
    assert.equal(body.metadata.fileName, 'inspection-video.mp4');
    assert.equal(body.metadata.size, 524_288_000);
    assert.ok(body.uploadUrl.startsWith('https://'));
  } finally {
    await server.close();
  }
});

test('POST /api/uploads requires a fileName and numeric size', async () => {
  const server = await startServer(createApp({ rateLimitMax: 1_000 }));

  try {
    const response = await fetch(`${server.baseUrl}/api/uploads`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ fileName: 'video.mp4' })
    });

    assert.equal(response.status, 400);
  } finally {
    await server.close();
  }
});
