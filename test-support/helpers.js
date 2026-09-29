import { once } from 'node:events';

export async function startServer(app) {
  const server = app.listen(0);
  await once(server, 'listening');
  const { port } = server.address();

  return {
    baseUrl: `http://127.0.0.1:${port}`,
    close: () => new Promise(resolve => server.close(resolve))
  };
}

export async function pollJob(baseUrl, jobId, timeoutMs = 5_000) {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const response = await fetch(`${baseUrl}/api/jobs/${jobId}`);
    const { job } = await response.json();

    if (job?.status === 'completed' || job?.status === 'failed') {
      return job;
    }

    await new Promise(resolve => setTimeout(resolve, 50));
  }

  throw new Error(`Job ${jobId} did not finish within ${timeoutMs}ms`);
}
