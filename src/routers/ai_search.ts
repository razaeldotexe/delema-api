import { Router, Request, Response } from 'express';
import axios from 'axios';
import { webhookLogger } from '../utils/logger';
import { fetchRealProducts } from '../utils/product_fetcher';
import { ProductSearchRequestSchema } from '../types/schemas';

const router = Router();

const GEMINI_MODELS = ["gemini-2.0-flash", "gemini-2.0-flash-lite-preview-02-05"];
const GROQ_MODELS = ["llama-3.3-70b-versatile", "mixtral-8x7b-32768"];
const OPENROUTER_MODELS = ["google/gemini-2.0-flash-001", "meta-llama/llama-3.3-70b-instruct"];

async function tryGemini(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not set");

  for (const model of GEMINI_MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const response = await axios.post(url, {
        contents: [{ parts: [{ text: prompt }] }]
      }, { timeout: 10000 });

      if (response.status === 200) {
        return response.data.candidates[0].content.parts[0].text;
      }
    } catch (error: any) {
      webhookLogger.log(`Gemini ${model} failed: ${error.message}`, "WARN");
    }
  }
  throw new Error("All Gemini models failed");
}

async function tryGroq(prompt: string): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY not set");

  for (const model of GROQ_MODELS) {
    try {
      const url = "https://api.groq.com/openai/v1/chat/completions";
      const response = await axios.post(url, {
        model: model,
        messages: [{ role: "user", content: prompt }]
      }, {
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        timeout: 10000
      });

      if (response.status === 200) {
        return response.data.choices[0].message.content;
      }
    } catch (error: any) {
      webhookLogger.log(`Groq ${model} failed: ${error.message}`, "WARN");
    }
  }
  throw new Error("All Groq models failed");
}

async function tryOpenRouter(prompt: string): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY not set");

  for (const model of OPENROUTER_MODELS) {
    try {
      const url = "https://openrouter.ai/api/v1/chat/completions";
      const response = await axios.post(url, {
        model: model,
        messages: [{ role: "user", content: prompt }]
      }, {
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "HTTP-Referer": "https://delema.razael-fox.my.id",
          "X-Title": "Delema API"
        },
        timeout: 15000
      });

      if (response.status === 200) {
        return response.data.choices[0].message.content;
      }
    } catch (error: any) {
      webhookLogger.log(`OpenRouter ${model} failed: ${error.message}`, "WARN");
    }
  }
  throw new Error("All OpenRouter models failed");
}

router.post('/search-products', async (req: Request, res: Response) => {
  const validation = ProductSearchRequestSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(422).json({ detail: validation.error.errors });
  }

  const { query, limit = 5 } = validation.data;

  try {
    // Phase 1: Fetch Real Data
    const realData = await fetchRealProducts(query, limit * 2);
    
    let contextStr = "";
    if (realData.length > 0) {
      contextStr = "Here are some real search results from the web to help you:\n";
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
      { name: "Gemini", fn: tryGemini },
      { name: "Groq", fn: tryGroq },
      { name: "OpenRouter", fn: tryOpenRouter }
    ];

    for (const provider of providers) {
      try {
        webhookLogger.log(`Processing hybrid search with ${provider.name}...`, "AI");
        const rawResponse = await provider.fn(prompt);
        
        const cleanJson = rawResponse.trim().replace(/```json/g, "").replace(/```/g, "").trim();
        const products = JSON.parse(cleanJson);
        
        if (Array.isArray(products)) {
          webhookLogger.log(`Hybrid search successful using ${provider.name}`, "SUCCESS");
          return res.json(products.slice(0, limit));
        }
      } catch (error: any) {
        webhookLogger.log(`Provider ${provider.name} failed: ${error.message}`, "WARN");
      }
    }

    return res.status(503).json({ detail: "All AI providers failed to process the hybrid search request." });
  } catch (error: any) {
    return res.status(500).json({ detail: error.message });
  }
});

export default router;
