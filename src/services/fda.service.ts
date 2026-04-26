import axios from 'axios';
import { webhookLogger } from '../utils/logger';
import { tryAllProviders } from '../utils/ai_helper';

export class FDAService {
  /**
   * Search for products using the OpenFDA API and generate AI summary.
   */
  static async search(query: string, category: string, limit: number = 5, lang?: string) {
    const baseUrls: Record<string, string> = {
      drug: 'https://api.fda.gov/drug/label.json',
      food: 'https://api.fda.gov/food/enforcement.json',
      device: 'https://api.fda.gov/device/classification.json',
    };

    const url = baseUrls[category];
    const params = {
      search: query,
      limit: limit,
    };

    webhookLogger.info(`Searching FDA ${category} for: ${query}`);

    try {
      const response = await axios.get(url, { params, timeout: 15000 });
      const rawResults = response.data.results || [];

      let ai_summary: string | undefined = undefined;

      if (rawResults.length > 0) {
        // Prepare context for AI based on category
        const contextStr = rawResults
          .slice(0, 3)
          .map((r: any, i: number) => {
            if (category === 'drug') {
              return `[${i + 1}] Brand: ${r.openfda?.brand_name?.[0] || 'Unknown'}, Generic: ${r.openfda?.generic_name?.[0] || 'Unknown'}, Purpose: ${r.purpose?.[0] || 'N/A'}`;
            } else if (category === 'food') {
              return `[${i + 1}] Firm: ${r.recalling_firm}, Product: ${r.product_description}, Reason: ${r.reason_for_recall}`;
            } else {
              return `[${i + 1}] Device: ${r.device_name}, Class: ${r.device_class}, Specialty: ${r.medical_specialty_description}`;
            }
          })
          .join('\n\n');

        const languageInstruction = lang ? `Response language: ${lang}.` : 'Response language: Indonesian.';
        const prompt = `Gunakan data FDA (${category}) berikut untuk memberikan ringkasan informasi yang sangat singkat dan padat bagi pengguna awam tentang: "${query}". Berikan output dalam format "TL;DR:" yang informatif. ${languageInstruction}\n\nData:\n${contextStr}`;

        try {
          ai_summary = await tryAllProviders(prompt);
        } catch (error: any) {
          webhookLogger.error(`AI Summary failed for FDA: ${error.message}`);
          ai_summary = 'Gagal menghasilkan ringkasan AI.';
        }
      }

      return { 
        results: rawResults,
        ai_summary: ai_summary 
      };
    } catch (error: any) {
      if (error.response?.status === 404) {
        return { results: [], message: 'No results found' };
      }
      throw error;
    }
  }
}
