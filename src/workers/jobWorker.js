import { startQueue } from '../queue/jobQueue.js';

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const handlers = {
  'send-email': async job => {
    await delay(300);

    if (!job.payload.to) {
      throw new Error('send-email requires a "to" address');
    }

    return { deliveredTo: job.payload.to };
  },
  'generate-report': async job => {
    await delay(1_500);

    return {
      reportId: job.payload.reportId ?? job.id,
      url: `https://cdn.local/reports/${job.id}.pdf`
    };
  },
  'send-notification': async job => {
    await delay(100);

    return { channel: job.payload.channel ?? 'push' };
  }
};

export function startWorker() {
  startQueue(async job => {
    const handler = handlers[job.type];

    if (!handler) {
      throw new Error(`Unknown job type: ${job.type}`);
    }

    return handler(job);
  });
}
