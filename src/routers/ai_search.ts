import { Router, Request, Response } from 'express';
import { webhookLogger } from '../utils/logger';
import { fetchWebResults } from '../utils/search_fetcher';
import { AISearchRequestSchema } from '../types/schemas';
import { tryAllProviders } from '../utils/ai_helper';

const router = Router();

router.post('/search', async (req: Request, res: Response) => {
  const validation = AISearchRequestSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(422).json({ detail: validation.error.errors });
  }

  const { query, limit = 5, lang } = validation.data;

  try {
    // Phase 1: Fetch Real Data
    const webResults = await fetchWebResults(query, limit);

    if (webResults.length === 0) {
      return res.json({ results: [], ai_summary: 'No results found on the web.' });
    }

    let contextStr = 'Here are some real search results from the web to help you:\n';
    webResults.forEach((item, i) => {
      contextStr += `${i + 1}. ${item.title} - ${item.snippet} (Source: ${item.url})\n`;
    });

    // Phase 2: AI Processing
    const languageInstruction = lang ? `Response language: ${lang}.` : 'Response language: Indonesian.';
    const prompt = `
    User is searching for: "${query}".
    ${contextStr}
    
    Task: Based on the real results above and your knowledge, provide a comprehensive, concise, and helpful summary for the user's query.
    ${languageInstruction}
    Provide ONLY the summary text in the requested language. Do not include markdown headers or introductory filler.
    `;

    try {
      webhookLogger.ai(`Processing AI search synthesis using multi-provider rotation...`);
      const ai_summary = await tryAllProviders(prompt);

      webhookLogger.success(`AI Search successful`);
      return res.json({
        results: webResults,
        ai_summary: ai_summary,
      });
    } catch (error: any) {
      webhookLogger.error(`All AI providers failed: ${error.message}`);
      // Return results even if summary fails
      return res.json({
        results: webResults,
        ai_summary: 'Gagal menghasilkan ringkasan AI.',
      });
    }
  } catch (error: any) {
    return res.status(500).json({ detail: error.message });
  }
});

export default router;
