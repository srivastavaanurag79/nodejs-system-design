import { Router } from 'express';
import { queueStats } from '../queue/jobQueue.js';

const router = Router();

router.get('/', (_req, res) => {
  res.render('index', {
    title: 'Node.js System Design Console',
    queue: queueStats()
  });
});

export default router;
