import axios from 'axios';
import { webhookLogger } from './logger';

export const GEMINI_MODELS = ["gemini-2.0-flash", "gemini-2.0-flash-lite-preview-02-05"];
export const GEMINI_VISION_MODELS = ["gemini-2.0-flash", "gemini-2.5-flash"];
export const GROQ_MODELS = ["llama-3.3-70b-versatile", "mixtral-8x7b-32768"];
export const OPENROUTER_MODELS = ["google/gemini-2.0-flash-001", "meta-llama/llama-3.3-70b-instruct"];

export async function tryGemini(prompt: string): Promise<string> {
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

export async function tryGeminiVision(prompt: string, mimeType: string, base64Data: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not set");

  for (const model of GEMINI_VISION_MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const response = await axios.post(url, {
        contents: [{
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: mimeType,
                data: base64Data
              }
            }
          ]
        }]
      }, { timeout: 15000 });

      if (response.status === 200) {
        return response.data.candidates[0].content.parts[0].text;
      }
    } catch (error: any) {
      webhookLogger.log(`Gemini Vision ${model} failed: ${error.message}`, "WARN");
    }
  }
  throw new Error("All Gemini Vision models failed");
}

export async function tryGroq(prompt: string): Promise<string> {
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

export async function tryOpenRouter(prompt: string): Promise<string> {
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
