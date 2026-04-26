import { Router } from 'express';
import { DocsLookupSchema } from '../types/schemas';
import { DeveloperService } from '../services/developer.service';
import { validateRequest } from '../middleware/validate';

const router = Router();

/**
 * GET /
 * Searches for documentation and synthesizes an answer using AI.
 */
router.get('/', validateRequest(DocsLookupSchema, 'query'), async (req, res) => {
  const { query, q, framework, lang } = req.query as any;
  const result = await DeveloperService.lookupDocs((query || q), framework, lang);
  res.json(result);
});

export default router;
