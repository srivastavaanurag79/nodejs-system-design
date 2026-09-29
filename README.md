# System Design for Node.js Backend Developers

Companion repository for the article **System Design for Node.js Backend Developers: From Express API to Production Architecture**.

The goal is not to build a giant distributed system. It is to show how ordinary Node.js code changes once traffic, data, files, and background work grow — and to make each architectural idea runnable instead of abstract.

## Run it

```bash
npm install
npm start
```

Optional configuration:

```bash
cp .env.example .env
node --env-file=.env src/server.js
```

Then open the console:

- **UI:** `http://localhost:3000` — click through cache-aside, jobs, uploads, rate limiting, and observability without a terminal
- `GET http://localhost:3000/health`
- `GET http://localhost:3000/api/products`

Call `/api/products` twice. The second response reports `source: "cache"`.

Run the tests:

```bash
npm test
```

## Endpoints

| Method | Path | Demonstrates |
| --- | --- | --- |
| `GET` | `/` | EJS console that drives every endpoint visually |
| `GET` | `/health` | Production health check (uptime + queue depth) |
| `GET` | `/api/products` | Cache-aside reads |
| `GET` | `/api/rate-limited` | A strict limiter (3 / 10s) for demoing `429` |
| `POST` | `/api/jobs` | Moving slow work off the request path |
| `GET` | `/api/jobs` | Queue depth and job counters |
| `GET` | `/api/jobs/:id` | Job status, attempts, and result |
| `POST` | `/api/uploads` | Object-storage upload target + metadata |

Every `/api` route is behind a rate limiter and emits structured request logs. The console at `/` is server-rendered with EJS and drives these same JSON endpoints, so the API stays clean and the UI is just a client.

## Try the concepts

### 1. Cache-aside (article §5)

```bash
curl -s http://localhost:3000/api/products   # source: service
curl -s http://localhost:3000/api/products   # source: cache
```

### 2. Rate limiting (article §11)

`GET /api/rate-limited` is a deliberately strict endpoint (3 requests per 10s) so the limiter trips immediately:

```bash
for i in $(seq 1 4); do
  curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/api/rate-limited
done
```

The fourth request returns `429`, with `retry-after`, `x-ratelimit-limit`, and `x-ratelimit-remaining` headers.

The same limiter protects every real `/api` route. Control it with `RATE_LIMIT_MAX` and `RATE_LIMIT_WINDOW_MS`.

### 3. Queue + worker (article §7, §8)

Enqueue a slow job and return immediately with `202 Accepted`:

```bash
curl -s -X POST http://localhost:3000/api/jobs \
  -H 'content-type: application/json' \
  -d '{"type":"generate-report","payload":{"reportId":"r-42"}}'
# { "status": true, "jobId": "...", "jobStatus": "queued" }

curl -s http://localhost:3000/api/jobs/<jobId>
```

A job that throws is retried up to `maxAttempts` (3) before it is marked `failed`. `send-email` always fails without a `to` field, which shows the retry path:

```bash
curl -s -X POST http://localhost:3000/api/jobs \
  -H 'content-type: application/json' \
  -d '{"type":"send-email","payload":{}}'
```

### 4. Object storage (article §9)

The API hands back a storage key and an upload URL instead of holding the file in the Node.js process:

```bash
curl -s -X POST http://localhost:3000/api/uploads \
  -H 'content-type: application/json' \
  -d '{"fileName":"inspection-video.mp4","size":524288000}'
```

### 5. Observability (article §13)

Server output is structured JSON. Every request gets an `x-request-id` (reused if the client sends one) and a duration:

```json
{"level":"info","message":"request.completed","requestId":"...","method":"GET","path":"/api/products","status":200,"durationMs":52.31}
```

### 6. Graceful shutdown (article §12)

Send `Ctrl+C` (or `SIGTERM`). The server stops accepting connections, drains in-flight jobs, then exits. A force-exit timer guards against stuck work.

## Repository map

```text
.
├── docs/
│   └── architecture.md
├── src/
│   ├── lib/
│   │   └── logger.js
│   ├── middleware/
│   │   ├── observability.js
│   │   └── rateLimit.js
│   ├── queue/
│   │   └── jobQueue.js
│   ├── workers/
│   │   └── jobWorker.js
│   ├── routes/
│   │   ├── health.js
│   │   ├── jobs.js
│   │   ├── products.js
│   │   ├── ui.js
│   │   └── uploads.js
│   ├── services/
│   │   ├── objectStorage.js
│   │   └── productService.js
│   ├── views/
│   │   └── index.ejs
│   ├── app.js
│   └── server.js
├── test/
│   ├── health.test.js
│   ├── jobs.test.js
│   ├── observability.test.js
│   ├── products.test.js
│   ├── rateLimit.test.js
│   ├── ui.test.js
│   └── uploads.test.js
├── test-support/
│   └── helpers.js
├── .env.example
├── .gitignore
└── package.json
```

## Tests

`npm test` runs the suite with Node's built-in test runner (no test framework to install). It covers cache-aside behavior, job completion, job retries, rate limiting, upload metadata, request IDs, and the console page.

## Concept coverage

Runnable in this demo:

1. Stateless Express API
2. Cache-aside reads
3. Rate limiting
4. Queue plus worker with retries
5. Object-storage metadata
6. Observability (structured logs, request IDs, timings)
7. Reliability (health check, graceful shutdown)

Documented, not unit-tested here (article §3, §6, §10, §14, §15):

- Horizontal scaling and load balancing
- Database indexing, replicas, and sharding
- CDN for static assets
- Monolith vs microservices

## Production caveats

Everything here is intentionally in-process so the demo runs with a single `npm install`:

- The cache is a local `Map`, so two API instances do not share it. Production would use Redis.
- The rate limiter counts per process. Production would keep counters in Redis so limits are consistent across instances.
- The queue is in memory, so jobs are lost on restart. Production would use BullMQ, RabbitMQ, Kafka, or SQS.
- `src/services/objectStorage.js` returns a fake upload URL. Production would sign a real S3/R2/Wasabi URL.

The point is the architecture, not the storage backend: **the same code path with Redis, a real queue, and real object storage is the production system.**

## License

MIT — see [LICENSE](LICENSE).
