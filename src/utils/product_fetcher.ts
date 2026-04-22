import ddgs from 'duckduckgo-search';
import { webhookLogger } from './logger';

export interface ProductResult {
  name: string;
  description: string;
  source_url: string;
  source_name: string;
}

/**
 * Mengambil data produk riil dari DuckDuckGo Search (Shopping/Web results).
 */
export async function fetchRealProducts(query: string, maxResults = 5): Promise<ProductResult[]> {
  const results: ProductResult[] = [];
  try {
    webhookLogger.log(`Fetching real products for: ${query}`, 'SCRAPER');
    
    // Mencari di DuckDuckGo dengan keyword shopping agar data lebih akurat
    const searchQuery = `${query} price buy online`;
    
    let count = 0;
    for await (const r of ddgs.text(searchQuery)) {
      if (count >= maxResults) break;
      
      results.push({
        name: r.title || 'Unknown Product',
        description: r.body || 'No description available.',
        source_url: r.href || '#',
        source_name: 'Web Result'
      });
      
      count++;
    }

    webhookLogger.log(`Found ${results.length} real product links.`, 'SUCCESS');
  } catch (error) {
    webhookLogger.log(`Scraper failed: ${error instanceof Error ? error.message : String(error)}`, 'ERROR');
  }

  return results;
}
