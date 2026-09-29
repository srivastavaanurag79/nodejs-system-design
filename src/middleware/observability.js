import { randomUUID } from 'node:crypto';
import { logger } from '../lib/logger.js';

export function requestContext(req, res, next) {
  const requestId = req.get('x-request-id') ?? randomUUID();
  const startedAt = process.hrtime.bigint();

  req.id = requestId;
  res.set('x-request-id', requestId);

  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1e6;

    logger.info('request.completed', {
      requestId,
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      durationMs: Number(durationMs.toFixed(2))
    });
  });

  next();
}
