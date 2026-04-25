import { Router, Request, Response } from 'express';
import { webhookLogger } from '../utils/logger';
import { fetchRealProducts } from '../utils/product_fetcher';
import { ProductSearchRequestSchema } from '../types/schemas';
import { tryAllProviders } from '../utils/ai_helper';

const router = Router();

router.post('/search', async (req: Request, res: Response) => {
  const validation = ProductSearchRequestSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(422).json({ detail: validation.error.errors });
  }

  const { query, limit = 5, lang } = validation.data;

  try {
    // Phase 1: Fetch Real Data
    const realData = await fetchRealProducts(query, limit * 2);

    let contextStr = '';
    if (realData.length > 0) {
      contextStr = 'Here are some real search results from the web to help you:\n';
      realData.forEach((item, i) => {
        contextStr += `${i + 1}. ${item.name} - ${item.description} (Source: ${item.source_url})\n`;
      });
    }

    // Phase 2: AI Processing
    const languageInstruction = lang ? `Response language: ${lang}.` : 'Response language: Indonesian.';
    const prompt = `
    User is searching for: "${query}".
    ${contextStr}
    
    Task: Based on the real results above (if any) and your knowledge, provide a list of up to ${limit} best product recommendations.
    Include valid source_url from the real data if it matches a recommendation.
    ${languageInstruction}
    Format your response ONLY as a raw JSON list:
    [
        {
            "name": "Product Name", 
            "description": "Short summary", 
            "price": "Estimated or real price",
            "source_url": "Real URL from data above or null",
            "source_name": "Store name or 'Web Result'"
        },
        ...
    ]
    Do not include markdown or introductory text.
    `;

    try {
      webhookLogger.ai(`Processing hybrid search using multi-provider rotation...`);
      const rawResponse = await tryAllProviders(prompt);

      const cleanJson = rawResponse
        .trim()
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();
      const products = JSON.parse(cleanJson);

      if (Array.isArray(products)) {
        webhookLogger.success(`Hybrid search successful`);
        return res.json(products.slice(0, limit));
      }
    } catch (error: any) {
      webhookLogger.error(`All AI providers failed: ${error.message}`);
      return res
        .status(503)
        .json({ detail: 'All AI providers failed to process the hybrid search request.' });
    }

    return res.status(500).json({ detail: 'Failed to parse AI response' });
  } catch (error: any) {
    return res.status(500).json({ detail: error.message });
  }
});

export default router;
