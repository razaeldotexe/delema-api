import { webhookLogger } from '../utils/logger';
import { fetchWebResults } from '../utils/search_fetcher';
import { searchWithBrowser, searchWithBrave } from '../utils/browser_fetcher';
import { tryAllProviders } from '../utils/ai_helper';

export class AISearchService {
  /**
   * Perform standard AI Search with DuckDuckGo fallback to Browser.
   */
  static async standardSearch(query: string, limit: number = 5, lang?: string) {
    let webResults;
    let engine = 'duckduckgo';

    try {
      // Phase 1: Try Standard DDG Search
      webResults = await fetchWebResults(query, limit);
      if (webResults.length === 0) throw new Error('No results from DDG');
    } catch (ddgError: any) {
      webhookLogger.warn(`Standard search failed: ${ddgError.message}. Falling back to Browser search...`);
      // Fallback to Playwright
      const browserResults = await searchWithBrowser(query, limit);
      webResults = browserResults.map(r => ({
        title: r.title,
        snippet: r.snippet,
        url: r.url,
        source: r.source
      }));
      engine = 'playwright-fallback';
    }

    if (!webResults || webResults.length === 0) {
      return { results: [], ai_summary: 'No results found on the web.', engine };
    }

    const ai_summary = await this.synthesizeResults(query, webResults, lang);

    return {
      results: webResults,
      ai_summary,
      engine
    };
  }

  /**
   * Perform Alpha AI Search using Brave + Playwright.
   */
  static async alphaSearch(query: string, limit: number = 5, lang?: string) {
    webhookLogger.system(`[Alpha] Starting Brave-based search...`);
    
    const webResults = await searchWithBrave(query, limit);

    if (webResults.length === 0) {
      return { 
        results: [], 
        ai_summary: 'No results found during Brave search.',
        engine: 'playwright-brave-alpha' 
      };
    }

    const ai_summary = await this.synthesizeResults(query, webResults, lang, true);

    return {
      results: webResults,
      ai_summary,
      engine: 'playwright-brave-alpha'
    };
  }

  /**
   * Private helper to synthesize search results using AI.
   */
  private static async synthesizeResults(query: string, results: any[], lang?: string, isAlpha: boolean = false) {
    let contextStr = `Here are some search results from the web ${isAlpha ? '(Brave)' : ''} to help you:\n`;
    results.forEach((item, i) => {
      contextStr += `${i + 1}. ${item.title} - ${item.snippet} (Source: ${item.url})\n`;
    });

    const languageInstruction = lang ? `Response language: ${lang}.` : 'Response language: Indonesian.';
    const prompt = `
    User is ${isAlpha ? 'performing an AI SEARCH' : 'searching'} for: "${query}".
    ${contextStr}
    
    Task: Based on the real results above and your knowledge, provide a ${isAlpha ? 'authoritative, detailed, and highly helpful synthesis' : 'comprehensive, concise, and helpful summary'} for the user's query.
    ${languageInstruction}
    Provide ONLY the summary text in the requested language. ${isAlpha ? 'Use a professional tone.' : 'Do not include markdown headers or introductory filler.'}
    `;

    try {
      webhookLogger.ai(`${isAlpha ? '[Alpha] ' : ''}Processing AI search synthesis using multi-provider rotation...`);
      return await tryAllProviders(prompt);
    } catch (error: any) {
      webhookLogger.error(`All AI providers failed: ${error.message}`);
      return 'Gagal menghasilkan ringkasan AI.';
    }
  }
}
