import { chromium, Browser, Page } from 'playwright';
import { webhookLogger } from './logger';

export interface BrowserSearchResult {
  title: string;
  snippet: string;
  url: string;
  source: string;
}

/**
 * Advanced web search using Playwright (Alpha).
 * Uses a headless browser to scrape results from Google.
 */
export async function searchWithBrowser(query: string, limit = 5): Promise<BrowserSearchResult[]> {
  const results: BrowserSearchResult[] = [];
  let browser: Browser | null = null;

  try {
    webhookLogger.info(`[Alpha] Launching browser for: ${query}`);
    
    browser = await chromium.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });

    const page: Page = await context.newPage();

    // Search on Google (often has better depth than DDG for Alpha version)
    await page.goto(`https://www.google.com/search?q=${encodeURIComponent(query)}`, {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });

    // Wait for the results container
    await page.waitForSelector('#search', { timeout: 10000 });

    // Extract organic results
    const extracted = await page.$$eval('div.g', (elements) => {
      return elements.map(el => {
        const titleEl = el.querySelector('h3');
        const linkEl = el.querySelector('a');
        const snippetEl = el.querySelector('div[style*="-webkit-line-clamp"]'); // Common snippet selector
        const altSnippetEl = el.querySelector('.VwiC3b'); // Alternative snippet selector

        return {
          title: titleEl?.textContent || '',
          url: linkEl?.href || '',
          snippet: snippetEl?.textContent || altSnippetEl?.textContent || ''
        };
      }).filter(item => item.title && item.url);
    });

    webhookLogger.success(`[Alpha] Successfully extracted ${extracted.length} results.`);

    extracted.slice(0, limit).forEach(item => {
      results.push({
        title: item.title,
        snippet: item.snippet,
        url: item.url,
        source: 'Google (Browser)'
      });
    });

  } catch (error: any) {
    webhookLogger.error(`[Alpha] Browser Search failed: ${error.message}`);
  } finally {
    if (browser) {
      await browser.close();
    }
  }

  return results;
}
