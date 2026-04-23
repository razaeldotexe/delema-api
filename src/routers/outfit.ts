import { Router, Request, Response } from 'express';
import axios from 'axios';
import { webhookLogger } from '../utils/logger';
import { OutfitRatingRequestSchema, OutfitRatingResultSchema } from '../types/schemas';
import { tryGeminiVision } from '../utils/ai_helper';

const router = Router();

/**
 * Rate an outfit using AI vision models.
 */
router.post('/rate', async (req: Request, res: Response) => {
  const validation = OutfitRatingRequestSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(422).json({ detail: validation.error.errors });
  }

  const { image_url, image_base64, context } = validation.data;

  try {
    let finalBase64 = "";
    let mimeType = "image/jpeg";

    if (image_url) {
      webhookLogger.log(`Fetching outfit image from URL: ${image_url}`, "OUTFIT");
      const imageResp = await axios.get(image_url, { responseType: 'arraybuffer', timeout: 10000 });
      mimeType = imageResp.headers['content-type'] || "image/jpeg";
      finalBase64 = Buffer.from(imageResp.data, 'binary').toString('base64');
    } else if (image_base64) {
      if (image_base64.startsWith('data:')) {
        const matches = image_base64.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.*)$/);
        if (matches && matches.length === 3) {
          mimeType = matches[1];
          finalBase64 = matches[2];
        } else {
          finalBase64 = image_base64;
        }
      } else {
        finalBase64 = image_base64;
      }
    }

    const contextPrompt = context ? ` The user provided this context: "${context}".` : "";
    const prompt = `
    Analyze this outfit and provide a rating. ${contextPrompt}
    Respond ONLY as a raw JSON object with the following structure:
    {
      "score": number (1-10),
      "feedback": "string summarizing the critique",
      "suggestions": ["list of strings for improvements"]
    }
    Do not include markdown fences or any other text.
    `;

    webhookLogger.log("Calling AI for outfit rating...", "OUTFIT");
    const aiResponse = await tryGeminiVision(prompt, mimeType, finalBase64);
    
    // Attempt to parse JSON
    try {
      const cleanJson = aiResponse.trim().replace(/```json/g, "").replace(/```/g, "").trim();
      const result = JSON.parse(cleanJson);
      
      const outputValidation = OutfitRatingResultSchema.safeParse(result);
      if (!outputValidation.success) {
        webhookLogger.log("AI output validation failed", "ERROR");
        return res.status(500).json({ detail: "AI returned invalid format", raw: aiResponse });
      }

      webhookLogger.log(`Outfit rating completed with score: ${result.score}`, "SUCCESS");
      return res.json(outputValidation.data);
    } catch (parseError: any) {
      webhookLogger.log(`Failed to parse AI response: ${aiResponse}`, "ERROR");
      return res.status(500).json({ detail: "Failed to parse AI response", raw: aiResponse });
    }

  } catch (error: any) {
    webhookLogger.log(`Outfit Rating Error: ${error.message}`, "ERROR");
    return res.status(error.response?.status || 500).json({ detail: error.message });
  }
});

export default router;
