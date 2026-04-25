import { Router, Request, Response } from 'express';
import axios from 'axios';
import { AppSearchRequestSchema } from '../types/schemas';

const router = Router();

/**
 * Search for Android applications on GitHub.
 */
router.post('/github', async (req: Request, res: Response) => {
  const validation = AppSearchRequestSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(422).json({ detail: validation.error.errors });
  }

  const { query, limit = 10 } = validation.data;
  const searchQuery = `${query} topic:android`;
  const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(searchQuery)}&per_page=${limit}`;
  const headers = { Accept: 'application/vnd.github.v3+json', 'User-Agent': 'Delema-API-NodeJS' };

  try {
    const response = await axios.get(url, { headers, timeout: 10000 });
    const items = response.data.items || [];
    const results = items.map((repo: any) => ({
      name: repo.full_name || repo.name,
      summary: repo.description,
      icon_url: repo.owner?.avatar_url,
      url: repo.html_url,
      source: 'github',
    }));
    return res.json(results);
  } catch (error: any) {
    return res.status(error.response?.status || 500).json({ detail: error.message });
  }
});

export default router;
