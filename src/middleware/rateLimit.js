export const RATE_LIMIT_PREFIX = 'rate-limit';

export function rateLimit({ windowMs = 60_000, max = 100 } = {}) {
  const buckets = new Map();

  return (req, res, next) => {
    const now = Date.now();
    const key = req.ip;
    const bucket = buckets.get(key);

    if (!bucket || bucket.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      res.set('x-ratelimit-limit', String(max));
      res.set('x-ratelimit-remaining', String(max - 1));
      return next();
    }

    bucket.count += 1;

    const remaining = Math.max(0, max - bucket.count);
    res.set('x-ratelimit-limit', String(max));
    res.set('x-ratelimit-remaining', String(remaining));

    if (bucket.count > max) {
      res.set('retry-after', String(Math.ceil((bucket.resetAt - now) / 1000)));
      return res.status(429).json({ status: false, message: 'Too many requests' });
    }

    return next();
  };
}
