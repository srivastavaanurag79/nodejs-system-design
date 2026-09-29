import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import healthRouter from './routes/health.js';
import productsRouter from './routes/products.js';
import jobsRouter from './routes/jobs.js';
import uploadsRouter from './routes/uploads.js';
import uiRouter from './routes/ui.js';
import { requestContext } from './middleware/observability.js';
import { rateLimit } from './middleware/rateLimit.js';
import { logger } from './lib/logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function intFromEnv(name, fallback) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

export function createApp(options = {}) {
  const app = express();

  const rateLimitWindowMs = options.rateLimitWindowMs ?? intFromEnv('RATE_LIMIT_WINDOW_MS', 60_000);
  const rateLimitMax = options.rateLimitMax ?? intFromEnv('RATE_LIMIT_MAX', 100);

  app.set('view engine', 'ejs');
  app.set('views', path.join(__dirname, 'views'));
  app.set('trust proxy', true);

  app.use(express.json({ limit: '1mb' }));
  app.use(requestContext);

  app.use('/health', healthRouter);

  app.use(
    '/api/rate-limited',
    rateLimit({ windowMs: 10_000, max: 3 }),
    (_req, res) => res.json({ status: true, message: 'ok' })
  );

  app.use('/api', rateLimit({ windowMs: rateLimitWindowMs, max: rateLimitMax }));
  app.use('/api/products', productsRouter);
  app.use('/api/jobs', jobsRouter);
  app.use('/api/uploads', uploadsRouter);
  app.use('/', uiRouter);

  app.use((_req, res) => {
    res.status(404).json({ status: false, message: 'Not found' });
  });

  app.use((error, _req, res, _next) => {
    logger.error('request.failed', { message: error.message });
    res.status(500).json({ status: false, message: 'Internal server error' });
  });

  return app;
}
