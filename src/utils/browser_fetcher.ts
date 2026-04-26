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

      const consentBtn = await page.$('button:has-text("Accept all"), button:has-text("I agree"), #L2AGLb');
      if (consentBtn) await consentBtn.click();

      // Flexible wait for any result-like element
      await page.waitForSelector('div.g, #rso, div[data-hveid]', { timeout: 10000 });
      await page.waitForTimeout(1000); // Small breath for JS

      const extracted = await page.$$eval('div.g, .tF2Cxc', (elements) => {
        return elements.map(el => {
          const titleEl = el.querySelector('h3');
          const linkEl = el.querySelector('a');
          const snippetEl = el.querySelector('div[style*="-webkit-line-clamp"], .VwiC3b, .kb0N9d');

          return {
            title: titleEl?.textContent || '',
            url: linkEl?.href || '',
            snippet: snippetEl?.textContent || ''
          };
        }).filter(item => item.title && item.url);
      });

      if (extracted.length > 0) {
        webhookLogger.success(`[Alpha] Google success: ${extracted.length} results.`);
        extracted.slice(0, limit).forEach(item => results.push({ ...item, source: 'Google (Alpha)' }));
        return results;
      }
    } catch (err) {
      webhookLogger.warn(`[Alpha] Google failed. Trying DuckDuckGo...`);
    }

    // 2. Try DuckDuckGo
    try {
      await page.goto(`https://duckduckgo.com/?q=${encodeURIComponent(query)}&ia=web`, {
        waitUntil: 'networkidle',
        timeout: 15000
      });
      
      const ddgResults = await page.$$eval('article, .result', (elements) => {
        return elements.map(el => {
          const titleEl = el.querySelector('.result__title, [data-testid="result-title-a"]');
          const linkEl = el.querySelector('.result__a, [data-testid="result-title-a"]');
          const snippetEl = el.querySelector('.result__snippet, [data-testid="result-snippet"]');

          return {
            title: titleEl?.textContent || '',
            url: linkEl?.getAttribute('href') || '',
            snippet: snippetEl?.textContent || ''
          };
        }).filter(item => item.title && item.url);
      });

      if (ddgResults.length > 0) {
        webhookLogger.success(`[Alpha] DDG success: ${ddgResults.length} results.`);
        ddgResults.slice(0, limit).forEach(item => {
          results.push({
            title: item.title,
            snippet: item.snippet,
            url: item.url.startsWith('http') ? item.url : `https:${item.url}`,
            source: 'DuckDuckGo (Alpha)'
          });
        });
        return results;
      }
    } catch (err) {
      webhookLogger.warn(`[Alpha] DDG failed. Trying Brave Search...`);
    }

    // 3. Final Fallback: Brave Search (Very scraper friendly)
    try {
      await page.goto(`https://search.brave.com/search?q=${encodeURIComponent(query)}`, {
        waitUntil: 'domcontentloaded',
        timeout: 15000
      });

      const braveResults = await page.$$eval('.snippet', (elements) => {
        return elements.map(el => {
          const titleEl = el.querySelector('.title');
          const linkEl = el.querySelector('a');
          const snippetEl = el.querySelector('.snippet-content, .snippet-description');

          return {
            title: titleEl?.textContent || '',
            url: linkEl?.href || '',
            snippet: snippetEl?.textContent || ''
          };
        }).filter(item => item.title && item.url);
      });

      webhookLogger.success(`[Alpha] Brave success: ${braveResults.length} results.`);
      braveResults.slice(0, limit).forEach(item => results.push({ ...item, source: 'Brave (Alpha)' }));
    } catch (err: any) {
      webhookLogger.error(`[Alpha] All search engines failed: ${err.message}`);
    }

  } catch (error: any) {
    webhookLogger.error(`[Alpha] Browser Search failed: ${error.message}`);
  } finally {
    if (browser) {
      await browser.close();
    }
  }

  return results;
}
