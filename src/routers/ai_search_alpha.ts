import { Router, Request, Response } from 'express';
import { webhookLogger } from '../utils/logger';
import { searchWithBrowser } from '../utils/browser_fetcher';
import { AISearchRequestSchema } from '../types/schemas';
import { tryAllProviders } from '../utils/ai_helper';

const router = Router();

/**
 * @tag Alpha
 * AI Search Alpha using Playwright for deep web access.
 */
router.post('/search', async (req: Request, res: Response) => {
  const validation = AISearchRequestSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(422).json({ detail: validation.error.errors });
  }

  const { query, limit = 5, lang } = validation.data;

  try {
    webhookLogger.system(`[Alpha] Starting Playwright-based search...`);
    
    // Phase 1: Deep Search using Playwright
    const webResults = await searchWithBrowser(query, limit);

    if (webResults.length === 0) {
      return res.json({ 
        results: [], 
        ai_summary: 'No results found during deep search.',
        engine: 'playwright-alpha' 
      });
    }

    let contextStr = 'Here are some deep search results from the web to help you:\n';
    webResults.forEach((item, i) => {
      contextStr += `${i + 1}. ${item.title} - ${item.snippet} (Source: ${item.url})\n`;
    });

    // Phase 2: AI Processing
    const languageInstruction = lang ? `Response language: ${lang}.` : 'Response language: Indonesian.';
    const prompt = `
    User is performing a DEEP SEARCH for: "${query}".
    Below is the raw data extracted from a browser session:
    ${contextStr}
    
    Task: Provide an authoritative, detailed, and highly helpful synthesis based on the results above.
    ${languageInstruction}
    Provide ONLY the summary text in the requested language. Use a professional tone.
    `;

    webhookLogger.ai(`[Alpha] Processing AI deep synthesis...`);
    const ai_summary = await tryAllProviders(prompt);

    webhookLogger.success(`[Alpha] AI Deep Search successful`);
    return res.json({
      results: webResults,
      ai_summary: ai_summary,
      engine: 'playwright-alpha'
    });

  } catch (error: any) {
    webhookLogger.error(`[Alpha] Search failed: ${error.message}`);
    return res.status(500).json({ detail: error.message });
  }
});

export default router;
