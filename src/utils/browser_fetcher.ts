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
    webhookLogger.info(`[Alpha] Launching browser in Docker for: ${query}`);
    
    browser = await chromium.launch({ 
      headless: true,
      args: [
        '--no-sandbox', 
        '--disable-setuid-sandbox', 
        '--disable-dev-shm-usage'
      ]
    });

    if (!browser) {
      throw new Error(`Browser launch failed.`);
    }

    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });

    const page: Page = await context.newPage();

    // 1. Try Google Search
    try {
      await page.goto(`https://www.google.com/search?q=${encodeURIComponent(query)}`, {
        waitUntil: 'domcontentloaded',
        timeout: 20000
      });

      // Handle "Before you continue" / Consent screen if it appears
      const consentBtn = await page.$('button:has-text("Accept all"), button:has-text("I agree")');
      if (consentBtn) await consentBtn.click();

      // Wait for results with a more flexible selector
      await page.waitForSelector('#search, .g, #rso', { timeout: 10000 });

      const extracted = await page.$$eval('div.g', (elements) => {
        return elements.map(el => {
          const titleEl = el.querySelector('h3');
          const linkEl = el.querySelector('a');
          const snippetEl = el.querySelector('div[style*="-webkit-line-clamp"], .VwiC3b');

          return {
            title: titleEl?.textContent || '',
            url: linkEl?.href || '',
            snippet: snippetEl?.textContent || ''
          };
        }).filter(item => item.title && item.url);
      });

      if (extracted.length > 0) {
        webhookLogger.success(`[Alpha] Google extraction success: ${extracted.length} results.`);
        extracted.slice(0, limit).forEach(item => {
          results.push({ ...item, source: 'Google (Alpha)' });
        });
        return results;
      }
    } catch (googleError) {
      webhookLogger.warn(`[Alpha] Google failed/blocked: ${googleError instanceof Error ? googleError.message : 'Timeout'}. Trying DuckDuckGo...`);
    }

    // 2. Fallback to DuckDuckGo (Browser version - less bot protection)
    await page.goto(`https://duckduckgo.com/?q=${encodeURIComponent(query)}&t=h_&ia=web`, {
      waitUntil: 'networkidle',
      timeout: 20000
    });

    const ddgResults = await page.$$eval('.result', (elements) => {
      return elements.map(el => {
        const titleEl = el.querySelector('.result__title, .result__a');
        const linkEl = el.querySelector('.result__a');
        const snippetEl = el.querySelector('.result__snippet');

        return {
          title: titleEl?.textContent || '',
          url: linkEl?.getAttribute('href') || '',
          snippet: snippetEl?.textContent || ''
        };
      }).filter(item => item.title && item.url);
    });

    webhookLogger.success(`[Alpha] DuckDuckGo extraction success: ${ddgResults.length} results.`);
    ddgResults.slice(0, limit).forEach(item => {
      results.push({
        title: item.title,
        snippet: item.snippet,
        url: item.url.startsWith('http') ? item.url : `https:${item.url}`,
        source: 'DuckDuckGo (Alpha)'
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
