import { randomUUID } from 'node:crypto';

const objects = new Map();

export function createUploadTarget(fileName, size) {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const storageKey = `uploads/${now.getFullYear()}/${month}/${randomUUID()}-${fileName}`;

  const object = {
    storageKey,
    fileName,
    size,
    uploadUrl: `https://object-storage.local/${storageKey}`
  };

  objects.set(storageKey, object);

  return object;
}

export function getObjectMetadata(storageKey) {
  return objects.get(storageKey);
}
