import { Router, Request, Response } from 'express';
import { webhookLogger } from '../utils/logger';
import { fetchRealProducts, fetchStoreLinks } from '../utils/product_fetcher';
import { ProductSearchRequestSchema, AppCheckRequestSchema } from '../types/schemas';
import { tryGemini, tryGroq, tryOpenRouter } from '../utils/ai_helper';

const router = Router();

router.post('/app-availability', async (req: Request, res: Response) => {
  const validation = AppCheckRequestSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(422).json({ detail: validation.error.errors });
  }

  const { query } = validation.data;

  try {
    // Phase 1: Search for Store Links
    const storeResults = await fetchStoreLinks(query);

    let contextStr = '';
    if (storeResults.length > 0) {
      contextStr = 'Here are official store search results from the web:\n';
      storeResults.forEach((item, i) => {
        contextStr += `${i + 1}. ${item.name} - ${item.source_url}\n`;
      });
    }

    // Phase 2: AI Processing to extract and verify
    const prompt = `
    User query/URL: "${query}".
    ${contextStr}
    
    Task: Identify the exact App/Game name and find its official store pages for different platforms (Mobile, PC, Console).
    Use the search results above to find valid URLs.
    
    Rules:
    - Only include official stores: Google Play, Apple App Store, Steam, Epic Games, Microsoft Store, PlayStation Store, Xbox Store, Nintendo eShop.
    - Categorize them into "Mobile", "PC", or "Console".
    - Respond ONLY as a raw JSON object:
    {
        "app_name": "Official App Name",
        "platforms": [
            { "name": "Store Name (e.g. Steam)", "category": "PC", "url": "verified link" },
            ...
        ]
    }
    If no official links are found, return an empty platforms array. Do not include markdown.
    `;

    const providers = [
      { name: 'Gemini', fn: tryGemini },
      { name: 'Groq', fn: tryGroq },
      { name: 'OpenRouter', fn: tryOpenRouter },
    ];

    for (const provider of providers) {
      try {
        webhookLogger.log(`Processing app availability with ${provider.name}...`, 'AI');
        const rawResponse = await provider.fn(prompt);

        const cleanJson = rawResponse
          .trim()
          .replace(/```json/g, '')
          .replace(/```/g, '')
          .trim();
        const result = JSON.parse(cleanJson);

        if (result && result.app_name) {
          webhookLogger.log(`Availability check successful using ${provider.name}`, 'SUCCESS');
          return res.json(result);
        }
      } catch (error: any) {
        webhookLogger.log(`Provider ${provider.name} failed: ${error.message}`, 'WARN');
      }
    }

    return res
      .status(503)
      .json({ detail: 'All AI providers failed to process the availability check.' });
  } catch (error: any) {
    return res.status(500).json({ detail: error.message });
  }
});

router.post('/search-products', async (req: Request, res: Response) => {
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
