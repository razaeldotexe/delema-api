import { Router, Request, Response } from 'express';
import axios from 'axios';
import { webhookLogger } from '../utils/logger';
import { FDASearchRequestSchema } from '../types/schemas';
import { tryAllProviders } from '../utils/ai_helper';

const router = Router();

/**
 * Search for products using the OpenFDA API.
 */
router.post('/search', async (req: Request, res: Response) => {
  const validation = FDASearchRequestSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(422).json({ detail: validation.error.errors });
  }

  const { query, category, limit = 5, lang } = validation.data;

  const baseUrls: Record<string, string> = {
    drug: 'https://api.fda.gov/drug/label.json',
    food: 'https://api.fda.gov/food/enforcement.json',
    device: 'https://api.fda.gov/device/classification.json',
  };

  const url = baseUrls[category];
  const params = {
    search: query,
    limit: limit,
  };

  webhookLogger.info(`Searching FDA ${category} for: ${query}`);

  try {
    const response = await axios.get(url, { params, timeout: 15000 });
    const rawResults = response.data.results || [];

    let ai_summary: string | undefined = undefined;

    if (rawResults.length > 0) {
      // Prepare context for AI based on category
      const contextStr = rawResults
        .slice(0, 3)
        .map((r: any, i: number) => {
          if (category === 'drug') {
            return `[${i + 1}] Brand: ${r.openfda?.brand_name?.[0] || 'Unknown'}, Generic: ${r.openfda?.generic_name?.[0] || 'Unknown'}, Purpose: ${r.purpose?.[0] || 'N/A'}`;
          } else if (category === 'food') {
            return `[${i + 1}] Firm: ${r.recalling_firm}, Product: ${r.product_description}, Reason: ${r.reason_for_recall}`;
          } else {
            return `[${i + 1}] Device: ${r.device_name}, Class: ${r.device_class}, Specialty: ${r.medical_specialty_description}`;
          }
        })
        .join('\n\n');

      const languageInstruction = lang ? `Response language: ${lang}.` : 'Response language: Indonesian.';
      const prompt = `Gunakan data FDA (${category}) berikut untuk memberikan ringkasan informasi yang sangat singkat dan padat bagi pengguna awam tentang: "${query}". Berikan output dalam format "TL;DR:" yang informatif. ${languageInstruction}\n\nData:\n${contextStr}`;

      try {
        ai_summary = await tryAllProviders(prompt);
      } catch (error: any) {
        webhookLogger.error(`AI Summary failed for FDA: ${error.message}`);
        ai_summary = 'Gagal menghasilkan ringkasan AI.';
      }
    }

    return res.json({ 
      results: rawResults,
      ai_summary: ai_summary 
    });
  } catch (error: any) {
    if (error.response?.status === 404) {
      return res.json({ results: [], message: 'No results found' });
    }

    webhookLogger.error(`FDA API Error: ${error.message}`);
    return res.status(error.response?.status || 500).json({
      detail: error.response?.data?.error?.message || 'FDA API request failed',
    });
  }
});

export default router;
