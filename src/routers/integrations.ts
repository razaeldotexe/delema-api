import { Router, Request, Response } from 'express';
import axios from 'axios';
import { 
  AppSearchRequestSchema, 
  GitHubScanRequestSchema, 
  GitHubContentRequestSchema 
} from '../types/schemas';

const router = Router();

/**
 * Search for Android applications on GitHub.
 * Formerly POST /apps/github
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

/**
 * Scans a GitHub repository for files.
 * Formerly POST /github/scan
 */
router.post('/github/scan', async (req: Request, res: Response) => {
  const validation = GitHubScanRequestSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(422).json({ detail: validation.error.errors });
  }

  const { owner, repo, token, path } = validation.data;
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'Delema-API-NodeJS',
  };
  if (token) {
    headers['Authorization'] = `token ${token}`;
  }

  try {
    const response = await axios.get(url, { headers });
    let contents = response.data;
    if (!Array.isArray(contents)) {
      contents = [contents];
    }

    const files = contents
      .filter((item: any) => item.type === 'file' && item.name.endsWith('.md'))
      .map((item: any) => ({
        name: item.name,
        path: item.path,
        type: item.type,
        download_url: item.download_url,
      }));

    return res.json(files);
  } catch (error: any) {
    const status = error.response?.status || 500;
    const detail = error.response?.data?.message || error.message;
    return res.status(status).json({ detail });
  }
});

/**
 * Fetches the content of a file from GitHub.
 * Formerly POST /github/content
 */
router.post('/github/content', async (req: Request, res: Response) => {
  const validation = GitHubContentRequestSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(422).json({ detail: validation.error.errors });
  }

  const { owner, repo, token, path } = validation.data;
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github.v3.raw',
    'User-Agent': 'Delema-API-NodeJS',
  };
  if (token) {
    headers['Authorization'] = `token ${token}`;
  }

  try {
    const response = await axios.get(url, { headers, responseType: 'text' });
    return res.json({ content: response.data });
  } catch (error: any) {
    const status = error.response?.status || 500;
    const detail = error.response?.data?.message || 'Failed to fetch file content';
    return res.status(status).json({ detail });
  }
});

export default router;
