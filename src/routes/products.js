import { Router } from 'express';
import { listProducts } from '../services/productService.js';

const router = Router();

const cache = new Map();
const CACHE_TTL_MS = Number(process.env.CACHE_TTL_MS) || 30_000;

router.get('/', async (req, res, next) => {
  try {
    const cached = cache.get('products');

    if (cached && cached.expiresAt > Date.now()) {
      return res.json({ source: 'cache', data: cached.data });
    }

    const products = await listProducts();
    cache.set('products', {
      data: products,
      expiresAt: Date.now() + CACHE_TTL_MS
    });

    return res.json({ source: 'service', data: products });
  } catch (error) {
    next(error);
  }
});

export default router;
