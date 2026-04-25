import axios from 'axios';
import { webhookLogger } from './logger';

export const GEMINI_MODELS = [
  'gemini-3.1-flash-preview',
  'gemini-3.1-flash-lite-preview',
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-1.5-flash',
];
export const GEMINI_VISION_MODELS = ['gemini-3.1-flash-preview', 'gemini-2.5-flash'];
export const GROQ_MODELS = ['llama-4-maverick-400b-128e', 'llama-4-scout-109b-16e'];
export const OPENROUTER_MODELS = [
  'google/gemini-3.1-flash',
  'meta-llama/llama-4-maverick',
  'meta-llama/llama-4-scout',
];

export async function tryGemini(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not set');

  for (const model of GEMINI_MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const response = await axios.post(
        url,
        {
          contents: [{ parts: [{ text: prompt }] }],
        },
        { timeout: 10000 },
      );

      if (response.status === 200) {
        return response.data.candidates[0].content.parts[0].text;
      }
    } catch (error: any) {
      webhookLogger.warn(`Gemini ${model} failed: ${error.message}`);
    }
  }
  throw new Error('All Gemini models failed');
}

export async function tryGeminiVision(
  prompt: string,
  mimeType: string,
  base64Data: string,
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not set');

  for (const model of GEMINI_VISION_MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const response = await axios.post(
        url,
        {
          contents: [
            {
              parts: [
                { text: prompt },
                {
                  inlineData: {
                    mimeType: mimeType,
                    data: base64Data,
                  },
                },
              ],
            },
          ],
        },
        { timeout: 15000 },
      );

      if (response.status === 200) {
        return response.data.candidates[0].content.parts[0].text;
      }
    } catch (error: any) {
      webhookLogger.warn(`Gemini Vision ${model} failed: ${error.message}`);
    }
  }
  throw new Error('All Gemini Vision models failed');
}

export async function tryGroq(prompt: string): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY not set');

  for (const model of GROQ_MODELS) {
    try {
      const url = 'https://api.groq.com/openai/v1/chat/completions';
      const response = await axios.post(
        url,
        {
          model: model,
          messages: [{ role: 'user', content: prompt }],
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        },
      );

      if (response.status === 200) {
        return response.data.choices[0].message.content;
      }
    } catch (error: any) {
      webhookLogger.warn(`Groq ${model} failed: ${error.message}`);
    }
  }
  throw new Error('All Groq models failed');
}

export async function tryOpenRouter(prompt: string): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('OPENROUTER_API_KEY not set');

  for (const model of OPENROUTER_MODELS) {
    try {
      const url = 'https://openrouter.ai/api/v1/chat/completions';
      const response = await axios.post(
        url,
        {
          model: model,
          messages: [{ role: 'user', content: prompt }],
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'HTTP-Referer': 'https://delema.razael-fox.my.id',
            'X-Title': 'Delema API',
          },
          timeout: 15000,
        },
      );

      if (response.status === 200) {
        return response.data.choices[0].message.content;
      }
    } catch (error: any) {
      webhookLogger.warn(`OpenRouter ${model} failed: ${error.message}`);
    }
  }
  throw new Error('All OpenRouter models failed');
}

export async function tryAllProviders(prompt: string): Promise<string> {
  const providers = [
    { name: 'Gemini', fn: tryGemini },
    { name: 'Groq', fn: tryGroq },
    { name: 'OpenRouter', fn: tryOpenRouter },
  ];

  for (const provider of providers) {
    try {
      const result = await provider.fn(prompt);
      if (result) return result;
    } catch (error: any) {
      webhookLogger.warn(`${provider.name} provider exhausted: ${error.message}`);
    }
  }

  throw new Error('All AI providers failed');
}
