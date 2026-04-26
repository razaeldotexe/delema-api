import { Router, Request, Response } from 'express';
import { SearchRequestSchema } from '../types/schemas';
import { ResearchService } from '../services/research.service';
import { validateRequest } from '../middleware/validate';

const router = Router();

/**
 * Search for scientific papers on arXiv.
 */
router.post('/arxiv', validateRequest(SearchRequestSchema), async (req: Request, res: Response) => {
  const { query, limit = 10, lang } = req.body;
  const result = await ResearchService.searchArXiv(query, limit, lang);
  return res.json(result);
});

/**
 * Search for information on Wikipedia.
 */
router.post('/wikipedia', validateRequest(SearchRequestSchema), async (req: Request, res: Response) => {
  const { query, lang } = req.body;
  const result = await ResearchService.searchWikipedia(query, lang);
  return res.json(result);
});

/**
 * Search for Nerd Fonts.
 */
router.post('/nerdfont', validateRequest(SearchRequestSchema), (req: Request, res: Response) => {
  const { query } = req.body;
  const result = ResearchService.getNerdFonts(query);
  return res.json(result);
});

export default router;
