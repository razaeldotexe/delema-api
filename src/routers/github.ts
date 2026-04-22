import { Router, Request, Response } from 'express';
import axios from 'axios';
import { GitHubScanRequestSchema, GitHubContentRequestSchema, FileInfoSchema } from '../types/schemas';

const router = Router();

/**
 * Scans a GitHub repository for files.
 */
router.post('/scan', async (req: Request, res: Response) => {
  const validation = GitHubScanRequestSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(422).json({ detail: validation.error.errors });
  }

  const { owner, repo, token, path } = validation.data;
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
  const headers: Record<string, string> = {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'Delema-API-NodeJS'
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
        download_url: item.download_url
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
 */
router.post('/content', async (req: Request, res: Response) => {
  const validation = GitHubContentRequestSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(422).json({ detail: validation.error.errors });
  }

  const { owner, repo, token, path } = validation.data;
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
  const headers: Record<string, string> = {
    'Accept': 'application/vnd.github.v3.raw',
    'User-Agent': 'Delema-API-NodeJS'
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
