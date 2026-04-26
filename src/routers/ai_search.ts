import { Router, Request, Response } from 'express';
import { AISearchRequestSchema } from '../types/schemas';
import { AISearchService } from '../services/ai_search.service';
import { validateRequest } from '../middleware/validate';

const router = Router();

router.post('/search', validateRequest(AISearchRequestSchema), async (req: Request, res: Response) => {
  const { query, limit = 5, lang } = req.body;
  const result = await AISearchService.standardSearch(query, limit, lang);
  return res.json(result);
});

export default router;
