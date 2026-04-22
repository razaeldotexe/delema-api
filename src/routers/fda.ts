import { Router, Request, Response } from 'express';
import axios from 'axios';
import { webhookLogger } from '../utils/logger';
import { FDASearchRequestSchema } from '../types/schemas';

const router = Router();

/**
 * Search for products using the OpenFDA API.
 */
router.post('/search', async (req: Request, res: Response) => {
  const validation = FDASearchRequestSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(422).json({ detail: validation.error.errors });
  }

  const { query, category, limit = 5 } = validation.data;

  const baseUrls: Record<string, string> = {
    drug: "https://api.fda.gov/drug/label.json",
    food: "https://api.fda.gov/food/enforcement.json",
    device: "https://api.fda.gov/device/classification.json"
  };
  
  const url = baseUrls[category];
  const params = {
    search: query,
    limit: limit
  };
  
  webhookLogger.log(`Searching FDA ${category} for: ${query}`, "FDA");
  
  try {
    const response = await axios.get(url, { params, timeout: 15000 });
    return res.json({ results: response.data.results || [] });
  } catch (error: any) {
    if (error.response?.status === 404) {
      return res.json({ results: [], message: "No results found" });
    }
    
    webhookLogger.log(`FDA API Error: ${error.message}`, "ERROR");
    return res.status(error.response?.status || 500).json({ 
      detail: error.response?.data?.error?.message || "FDA API request failed" 
    });
  }
});

export default router;
