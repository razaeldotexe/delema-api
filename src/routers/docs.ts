import { Router } from 'express';
import { DocsLookupSchema } from '../types/schemas';
import { DocsScraper } from '../utils/docs_fetcher';
import { tryAllProviders } from '../utils/ai_helper';

const router = Router();
const scraper = new DocsScraper();

/**
 * GET /
 * Searches for documentation and synthesizes an answer using AI.
 */
router.get('/', async (req, res) => {
  // DocsLookupSchema expects { query: string, framework?: string }
  // But the task says "Use DocsLookupSchema to validate the q query parameter"
  // Let's check the schema again.

  const validated = DocsLookupSchema.parse({
    query: req.query.q || req.query.query,
    framework: req.query.framework,
  });

  const result = await scraper.search(validated.query, validated.framework);

  const prompt = `Based on the following documentation content, provide a concise developer-friendly answer for the query: "${validated.query}"\n\nContent:\n${result.content}\n\nSource: ${result.url}\n\nIf the content is not relevant, say you couldn't find a specific answer but provide what you can from the context.`;

  const answer = await tryAllProviders(prompt);

  res.json({
    answer,
    source: result.source,
    url: result.url,
  });
});

export default router;
