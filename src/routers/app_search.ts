import { Router, Request, Response } from 'express';
import axios from 'axios';
import {
  AppSearchRequestSchema,
  AppStoreSearchRequestSchema,
  TrendingRequestSchema,
} from '../types/schemas';

const router = Router();

/**
 * Get top or trending apps from GitHub or F-Droid.
 */
router.post('/trending', async (req: Request, res: Response) => {
  const validation = TrendingRequestSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(422).json({ detail: validation.error.errors });
  }

  const { source, limit = 10 } = validation.data;

  if (source === 'github') {
    const url = 'https://api.github.com/search/repositories?q=topic:android&sort=stars&order=desc';
    const headers = { Accept: 'application/vnd.github.v3+json', 'User-Agent': 'Delema-API-NodeJS' };

    try {
      const response = await axios.get(`${url}&per_page=${limit}`, { headers });
      const items = response.data.items || [];
      const results = items.map((item: any) => ({
        name: item.full_name,
        summary: item.description,
        icon_url: item.owner.avatar_url,
        url: item.html_url,
        source: 'github',
      }));
      return res.json(results);
    } catch (error: any) {
      return res.status(error.response?.status || 500).json({ detail: error.message });
    }
  } else if (source === 'fdroid') {
    const url = 'https://search.f-droid.org/api/search_apps?q=android';
    try {
      const response = await axios.get(url);
      const apps = response.data.apps || [];
      const results = apps.slice(0, limit).map((app: any) => ({
        name: app.name || 'Unknown',
        summary: app.summary,
        icon_url: app.icon,
        url: app.url,
        source: 'fdroid',
      }));
      return res.json(results);
    } catch (error: any) {
      return res.status(error.response?.status || 500).json({ detail: error.message });
    }
  } else {
    return res.status(400).json({ detail: "Invalid source. Use 'github' or 'fdroid'." });
  }
});

/**
 * Search for Android apps on F-Droid.
 */
router.post('/fdroid', async (req: Request, res: Response) => {
  const validation = AppSearchRequestSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(422).json({ detail: validation.error.errors });
  }

  const { query, limit = 10 } = validation.data;
  const url = `https://search.f-droid.org/api/search_apps?q=${encodeURIComponent(query)}`;

  try {
    const response = await axios.get(url, { timeout: 10000 });
    const apps = response.data.apps || [];
    const results = apps.slice(0, limit).map((app: any) => ({
      name: app.name || 'Unknown',
      summary: app.summary,
      icon_url: app.icon,
      url: app.url || `https://f-droid.org/packages/${app.id || ''}`,
      source: 'fdroid',
    }));
    return res.json(results);
  } catch (error: any) {
    return res.status(error.response?.status || 500).json({ detail: error.message });
  }
});

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

/**
 * Search for iOS applications on the Apple App Store.
 */
router.post('/appstore', async (req: Request, res: Response) => {
  const validation = AppStoreSearchRequestSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(422).json({ detail: validation.error.errors });
  }

  const { query, limit = 10, country = 'us' } = validation.data;
  const url = `https://itunes.apple.com/search?entity=software&term=${encodeURIComponent(query)}&limit=${limit}&country=${country}`;

  try {
    const response = await axios.get(url, { timeout: 10000 });
    const results = (response.data.results || []).map((item: any) => ({
      name: item.trackName,
      summary: item.description,
      icon_url: item.artworkUrl60,
      url: item.trackViewUrl,
      source: 'appstore',
    }));
    return res.json(results);
  } catch (error: any) {
    return res.status(error.response?.status || 500).json({ detail: error.message });
  }
});

export default router;
