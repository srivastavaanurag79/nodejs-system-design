import { createApp } from './app.js';
import { startWorker } from './workers/jobWorker.js';
import { stopQueue, waitForIdle } from './queue/jobQueue.js';
import { logger } from './lib/logger.js';

const PORT = process.env.PORT || 3000;
const SHUTDOWN_TIMEOUT_MS = Number(process.env.SHUTDOWN_TIMEOUT_MS) || 10_000;

startWorker();

const app = createApp();
const server = app.listen(PORT, () => {
  logger.info('server.started', {
    port: Number(PORT),
    url: `http://localhost:${PORT}`
  });
});

let shuttingDown = false;

async function shutdown(signal) {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;
  logger.info('server.shutdown', { signal });

  server.close();
  stopQueue();

  const forceExit = setTimeout(() => {
    logger.warn('server.forcedExit', { timeoutMs: SHUTDOWN_TIMEOUT_MS });
    process.exit(1);
  }, SHUTDOWN_TIMEOUT_MS);
  forceExit.unref();

  await waitForIdle(SHUTDOWN_TIMEOUT_MS);
  logger.info('server.closed');
  process.exit(0);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
