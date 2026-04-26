import { Router, Request, Response } from 'express';
import { webhookLogger } from '../utils/logger';
import { searchWithBrave } from '../utils/browser_fetcher';
import { AISearchRequestSchema } from '../types/schemas';
import { tryAllProviders } from '../utils/ai_helper';

const router = Router();

/**
 * @tag Alpha
 * AI Search Alpha using Playwright with Brave Search.
 */
router.post('/search', async (req: Request, res: Response) => {
  const validation = AISearchRequestSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(422).json({ detail: validation.error.errors });
  }

  const { query, limit = 5, lang } = validation.data;

  try {
    webhookLogger.system(`[Alpha] Starting Brave-based search...`);
    
    // Phase 1: Deep Search using Brave
    const webResults = await searchWithBrave(query, limit);

    if (webResults.length === 0) {
      return res.json({ 
        results: [], 
        ai_summary: 'No results found during Brave search.',
        engine: 'playwright-brave-alpha' 
      });
    }

    let contextStr = 'Here are some search results from the web (Brave) to help you:\n';
    webResults.forEach((item, i) => {
      contextStr += `${i + 1}. ${item.title} - ${item.snippet} (Source: ${item.url})\n`;
    });

    // Phase 2: AI Processing
    const languageInstruction = lang ? `Response language: ${lang}.` : 'Response language: Indonesian.';
    const prompt = `
    User is performing an AI SEARCH for: "${query}".
    Below is the raw data extracted from Brave Search:
    ${contextStr}
    
    Task: Provide an authoritative, detailed, and highly helpful synthesis based on the results above.
    ${languageInstruction}
    Provide ONLY the summary text in the requested language. Use a professional tone.
    `;

    webhookLogger.ai(`[Alpha] Processing AI synthesis...`);
    const ai_summary = await tryAllProviders(prompt);

    webhookLogger.success(`[Alpha] AI Search successful`);
    return res.json({
      results: webResults,
      ai_summary: ai_summary,
      engine: 'playwright-brave-alpha'
    });

  } catch (error: any) {
    webhookLogger.error(`[Alpha] Search failed: ${error.message}`);
    return res.status(500).json({ detail: error.message });
  }
});

export default router;
