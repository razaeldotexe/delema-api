import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { ABTestRequestSchema } from '../types/schemas';

const router = Router();

/**
 * Deterministically assign a user to a variant based on consistent hashing.
 */
router.post('/ab-test', (req: Request, res: Response) => {
  const validation = ABTestRequestSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(422).json({ detail: validation.error.errors });
  }

  const { user_id, variants } = validation.data;

  if (variants.length === 0) {
    return res.status(400).json({ detail: 'No variants provided' });
  }

  const totalWeight = variants.reduce((sum, v) => sum + v.weight, 0);
  if (totalWeight === 0) {
    return res.status(400).json({ detail: 'Total weight must be greater than 0' });
  }

  // Generate a deterministic hash for the user_id (0-99)
  const hash = crypto.createHash('md5').update(user_id).digest('hex');
  // Use BigInt to handle the large hex value and get the bucket
  const bucket = Number(BigInt(`0x${hash}`) % 100n);

  let cumulative = 0;
  for (const variant of variants) {
    // Scale variant weight to 100
    const scaledWeight = (variant.weight / totalWeight) * 100;
    cumulative += scaledWeight;
    if (bucket < cumulative) {
      return res.json({ variant: variant.name, data: variant.data });
    }
  }

  // Fallback to last variant
  const lastVariant = variants[variants.length - 1];
  return res.json({ variant: lastVariant.name, data: lastVariant.data });
});

export default router;
