import { Router } from 'express';
import { createUploadTarget } from '../services/objectStorage.js';

const router = Router();

router.post('/', (req, res) => {
  const { fileName, size } = req.body ?? {};

  if (!fileName || typeof size !== 'number') {
    return res.status(400).json({
      status: false,
      message: 'fileName and a numeric size are required'
    });
  }

  const target = createUploadTarget(fileName, size);

  return res.status(201).json({
    status: true,
    uploadUrl: target.uploadUrl,
    metadata: {
      fileName: target.fileName,
      storageKey: target.storageKey,
      size: target.size
    }
  });
});

export default router;
