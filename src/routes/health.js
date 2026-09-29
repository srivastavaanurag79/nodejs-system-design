import { Router } from 'express';
import { queueStats } from '../queue/jobQueue.js';

const router = Router();

router.get('/', (_req, res) => {
  res.json({
    status: 'ok',
    uptimeSeconds: Math.round(process.uptime()),
    queue: queueStats()
  });
});

export default router;
