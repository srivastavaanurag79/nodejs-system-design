import { Router } from 'express';
import { enqueue, getJob, queueStats } from '../queue/jobQueue.js';

const router = Router();

const allowedTypes = new Set(['send-email', 'generate-report', 'send-notification']);

router.post('/', (req, res) => {
  const { type, payload } = req.body ?? {};

  if (!allowedTypes.has(type)) {
    return res.status(400).json({
      status: false,
      message: `type must be one of: ${[...allowedTypes].join(', ')}`
    });
  }

  const job = enqueue(type, payload);

  return res.status(202).json({
    status: true,
    jobId: job.id,
    jobStatus: job.status
  });
});

router.get('/', (_req, res) => {
  res.json({ status: true, queue: queueStats() });
});

router.get('/:id', (req, res) => {
  const job = getJob(req.params.id);

  if (!job) {
    return res.status(404).json({ status: false, message: 'Job not found' });
  }

  return res.json({ status: true, job });
});

export default router;
