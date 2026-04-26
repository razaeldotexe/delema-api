import { Router, Request, Response } from 'express';
import { FDASearchRequestSchema } from '../types/schemas';
import { FDAService } from '../services/fda.service';
import { validateRequest } from '../middleware/validate';

const router = Router();

/**
 * Search for products using the OpenFDA API.
 */
router.post('/search', validateRequest(FDASearchRequestSchema), async (req: Request, res: Response) => {
  const { query, category, limit = 5, lang } = req.body;
  const result = await FDAService.search(query, category, limit, lang);
  return res.json(result);
});

export default router;
