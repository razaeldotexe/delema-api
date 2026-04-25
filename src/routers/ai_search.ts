import { Router, Request, Response } from 'express';
import { webhookLogger } from '../utils/logger';
import { fetchRealProducts } from '../utils/product_fetcher';
import { ProductSearchRequestSchema } from '../types/schemas';
import { tryGemini, tryGroq, tryOpenRouter } from '../utils/ai_helper';

const router = Router();

router.post('/search', async (req: Request, res: Response) => {
  const validation = ProductSearchRequestSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(422).json({ detail: validation.error.errors });
  }

  const { query, limit = 5 } = validation.data;

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
    const prompt = `
    User is searching for: "${query}".
    ${contextStr}
    
    Task: Based on the real results above (if any) and your knowledge, provide a list of up to ${limit} best product recommendations.
    Include valid source_url from the real data if it matches a recommendation.
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

    const providers = [
      { name: 'Gemini', fn: tryGemini },
      { name: 'Groq', fn: tryGroq },
      { name: 'OpenRouter', fn: tryOpenRouter },
    ];

    for (const provider of providers) {
      try {
        webhookLogger.log(`Processing hybrid search with ${provider.name}...`, 'AI');
        const rawResponse = await provider.fn(prompt);

        const cleanJson = rawResponse
          .trim()
          .replace(/```json/g, '')
          .replace(/```/g, '')
          .trim();
        const products = JSON.parse(cleanJson);

        if (Array.isArray(products)) {
          webhookLogger.log(`Hybrid search successful using ${provider.name}`, 'SUCCESS');
          return res.json(products.slice(0, limit));
        }
      } catch (error: any) {
        webhookLogger.log(`Provider ${provider.name} failed: ${error.message}`, 'WARN');
      }
    }

    return res
      .status(503)
      .json({ detail: 'All AI providers failed to process the hybrid search request.' });
  } catch (error: any) {
    return res.status(500).json({ detail: error.message });
  }
});

export default router;
