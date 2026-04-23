import { Router, Request, Response } from 'express';
import { tryGemini, tryGroq, tryOpenRouter } from '../utils/ai_helper';
import { GifSearchRequestSchema, GifTrendingRequestSchema, GifResultSchema, GifResult } from '../types/schemas';
import { webhookLogger } from '../utils/logger';

const router = Router();

async function getOptimizedKeyword(query: string): Promise<string> {
  const prompt = `Convert the following user query into a short Giphy search keyword (max 4 words, English only, emotion and reaction focused, no special characters). Reply with only the keyword and nothing else: ${query}`;
  
  const providers = [
    { name: "Gemini", fn: tryGemini },
    { name: "Groq", fn: tryGroq },
    { name: "OpenRouter", fn: tryOpenRouter }
  ];

  for (const provider of providers) {
    try {
      const result = await provider.fn(prompt);
      // Clean the response: strip markdown code blocks and trim
      const cleanResult = result.replace(/```[a-z]*\n?/gi, '').replace(/```/g, '').trim();
      if (cleanResult) {
        return cleanResult;
      }
    } catch (e: any) {
      webhookLogger.log(`${provider.name} failed for GIF optimization: ${e.message}`, "WARN");
    }
  }

  webhookLogger.log("All AI providers failed for GIF search optimization", "ERROR");
  return query; // Fallback to original query
}

// POST /search
router.post('/search', async (req: Request, res: Response) => {
  try {
    const validated = GifSearchRequestSchema.safeParse(req.body);
    if (!validated.success) {
      return res.status(400).json({ error: "Missing or invalid 'query' in request body" });
    }

    const { query } = validated.data;
    const keyword = await getOptimizedKeyword(query);
    
    const apiKey = process.env.GIPHY_API_KEY;
    if (!apiKey) {
      webhookLogger.log("GIPHY_API_KEY not set", "ERROR");
      return res.status(500).json({ error: "Giphy API key not configured" });
    }

    const url = `https://api.giphy.com/v1/gifs/search?api_key=${apiKey}&q=${encodeURIComponent(keyword)}&limit=10&offset=0&rating=g&lang=en`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Giphy Search API failed with status ${response.status}`);
    }

    const data = await response.json();
    const results = data.data;

    if (!results || results.length === 0) {
      return res.status(404).json({ error: "No GIFs found for the query" });
    }

    // Pick 1 random GIF from the 10 results
    const randomIndex = Math.floor(Math.random() * results.length);
    const gif = results[randomIndex];

    const result: GifResult = {
      id: gif.id,
      title: gif.title,
      original_url: gif.images.original.url,
      preview_url: gif.images.preview_gif.url,
      source_link: gif.url
    };

    // Validate with schema
    GifResultSchema.parse(result);

    res.json(result);
  } catch (error: any) {
    webhookLogger.log(`GIF Search Error: ${error.message}`, "ERROR");
    res.status(500).json({ error: "Internal server error during GIF search" });
  }
});

// GET /trending
router.get('/trending', async (req: Request, res: Response) => {
  try {
    const validated = GifTrendingRequestSchema.safeParse({
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined
    });

    if (!validated.success) {
      return res.status(400).json({ error: "Invalid 'limit' parameter" });
    }

    const { limit } = validated.data;
    const apiKey = process.env.GIPHY_API_KEY;
    if (!apiKey) {
      webhookLogger.log("GIPHY_API_KEY not set", "ERROR");
      return res.status(500).json({ error: "Giphy API key not configured" });
    }

    const url = `https://api.giphy.com/v1/gifs/trending?api_key=${apiKey}&limit=${limit}&rating=g`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Giphy Trending API failed with status ${response.status}`);
    }

    const data = await response.json();
    const results = data.data;

    const formattedResults: GifResult[] = results.map((gif: any) => ({
      id: gif.id,
      title: gif.title,
      original_url: gif.images.original.url,
      preview_url: gif.images.preview_gif.url,
      source_link: gif.url
    }));

    // Validate results
    formattedResults.forEach(r => GifResultSchema.parse(r));

    res.json(formattedResults);
  } catch (error: any) {
    webhookLogger.log(`GIF Trending Error: ${error.message}`, "ERROR");
    res.status(500).json({ error: "Internal server error during GIF trending" });
  }
});

export default router;
