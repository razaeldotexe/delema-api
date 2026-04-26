import ddgs from 'duckduckgo-search';
import { webhookLogger } from './logger';

// @ts-ignore - Patching ddgs to use our logger which has the expected .warning() method
ddgs.logger = webhookLogger;

export interface ProductResult {
  name: string;
  description: string;
  source_url: string;
  source_name: string;
}

export interface SearchResult {
  title: string;
  snippet: string;
  url: string;
  source: string;
}

/**
 * Mengambil data produk riil dari DuckDuckGo Search (Shopping/Web results).
 */
export async function fetchRealProducts(query: string, maxResults = 5): Promise<ProductResult[]> {
  const results: ProductResult[] = [];
  try {
    webhookLogger.info(`Fetching real products for: ${query}`);

    // Mencari di DuckDuckGo dengan keyword shopping agar data lebih akurat
    const searchQuery = `${query} price buy online`;

    let count = 0;
    for await (const r of ddgs.text(searchQuery)) {
      if (count >= maxResults) break;

      results.push({
        name: r.title || 'Unknown Product',
        description: r.body || 'No description available.',
        source_url: r.href || '#',
        source_name: 'Web Result',
      });

      count++;
    }

    webhookLogger.success(`Found ${results.length} real product links.`);
  } catch (error) {
    webhookLogger.error(
      `Scraper failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  return results;
}

/**
 * Mengambil hasil pencarian web umum dari DuckDuckGo.
 */
export async function fetchWebResults(query: string, maxResults = 5): Promise<SearchResult[]> {
  const results: SearchResult[] = [];
  try {
    webhookLogger.info(`Fetching web results for: ${query}`);

    let count = 0;
    for await (const r of ddgs.text(query)) {
      if (count >= maxResults) break;

      results.push({
        title: r.title || 'Untitled',
        snippet: r.body || 'No description available.',
        url: r.href || '#',
        source: 'DuckDuckGo',
      });

      count++;
    }

    webhookLogger.success(`Found ${results.length} web search results.`);
  } catch (error) {
    webhookLogger.error(
      `Web Search Scraper failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  return results;
}

/**
 * Mencari link store aplikasi di berbagai platform (Mobile, PC, Console).
 */
export async function fetchStoreLinks(query: string): Promise<ProductResult[]> {
  const results: ProductResult[] = [];
  try {
    webhookLogger.info(`Searching store links for: ${query}`);

    // Query tertarget untuk berbagai store utama
    const searchQuery = `${query} (site:play.google.com OR site:apps.apple.com OR site:store.steampowered.com OR site:epicgames.com OR site:store.playstation.com OR site:xbox.com OR site:nintendo.com)`;

    let count = 0;
    for await (const r of ddgs.text(searchQuery)) {
      if (count >= 15) break; // Ambil lebih banyak untuk AI

      results.push({
        name: r.title || 'Store Page',
        description: r.body || '',
        source_url: r.href || '#',
        source_name: 'Store Result',
      });

      count++;
    }

    webhookLogger.success(`Found ${results.length} potential store links.`);
  } catch (error) {
    webhookLogger.error(
      `App Store Search failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  return results;
}
