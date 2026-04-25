import ddgs from 'duckduckgo-search';
import axios from 'axios';
import { webhookLogger } from './logger';

export interface DocsResult {
  title: string;
  content: string;
  url: string;
  source: string;
}

/**
 * Hybrid documentation scraper that combines direct hits and DuckDuckGo search.
 */
export class DocsScraper {
  /**
   * Search for documentation based on query and optional framework.
   */
  async search(query: string, framework?: string): Promise<DocsResult> {
    try {
      webhookLogger.info(
        `Searching docs for: ${query} (Framework: ${framework || 'None'})`
      );

      // 1. Try direct hit for known frameworks first
      if (framework) {
        const directResult = await this.tryDirectHit(query, framework);
        if (directResult) {
          webhookLogger.success(`Direct hit success for ${framework}`);
          return directResult;
        }
      }

      // 2. Fallback to DuckDuckGo
      return await this.fallbackSearch(query, framework);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      webhookLogger.error(`DocsScraper failed: ${errorMsg}`);
      return {
        title: 'Error',
        content: `Failed to fetch documentation: ${errorMsg}`,
        url: '',
        source: 'Error',
      };
    }
  }

  /**
   * Attempts to guess the documentation URL for common frameworks.
   */
  private async tryDirectHit(query: string, framework: string): Promise<DocsResult | null> {
    const fw = framework.toLowerCase();
    let url = '';

    // Heuristics for direct documentation links
    if (fw === 'react' && /^[a-zA-Z]+$/.test(query)) {
      url = `https://react.dev/reference/react/${query}`;
    } else if ((fw === 'nextjs' || fw === 'next.js') && /^[a-zA-Z-]+$/.test(query)) {
      url = `https://nextjs.org/docs/app/api-reference/functions/${query}`;
    }

    if (url) {
      const content = await this.fetchPageText(url);
      if (content && content.length > 500) {
        return {
          title: `${framework} Reference: ${query}`,
          content,
          url,
          source: `${framework} Docs (Direct)`,
        };
      }
    }

    return null;
  }

  /**
   * Fallback search using DuckDuckGo with site restriction.
   */
  private async fallbackSearch(query: string, framework?: string): Promise<DocsResult> {
    let searchQuery = query;
    if (framework) {
      const site = this.getSiteForFramework(framework);
      searchQuery = `site:${site} ${query}`;
    }

    webhookLogger.info(`DDG Fallback Search: ${searchQuery}`);

    let topResult: any = null;
    try {
      for await (const r of ddgs.text(searchQuery)) {
        topResult = r;
        break;
      }
    } catch (err) {
      webhookLogger.warn(`DDG Search failed: ${err}`);
    }

    if (!topResult) {
      return {
        title: 'No results',
        content: 'No documentation found for your query.',
        url: '',
        source: 'DuckDuckGo',
      };
    }

    webhookLogger.info(`Fetching content from: ${topResult.href}`);
    const pageContent = await this.fetchPageText(topResult.href);

    return {
      title: topResult.title || 'Documentation',
      content: pageContent || topResult.body || 'No content available.',
      url: topResult.href || '',
      source: 'DuckDuckGo',
    };
  }

  /**
   * Fetches a page and extracts plain text.
   */
  private async fetchPageText(url: string): Promise<string | null> {
    try {
      const response = await axios.get(url, {
        timeout: 5000,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        },
      });

      if (typeof response.data !== 'string') return null;

      // Simple HTML to text conversion (strip tags)
      const text = response.data
        .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, '')
        .replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gim, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      return text.substring(0, 5000); // Return first 5000 chars for context
    } catch {
      return null;
    }
  }

  /**
   * Maps framework names to their primary documentation domains.
   */
  private getSiteForFramework(framework: string): string {
    const fw = framework.toLowerCase();
    switch (fw) {
      case 'react':
        return 'react.dev';
      case 'nextjs':
      case 'next.js':
        return 'nextjs.org';
      case 'vue':
      case 'vuejs':
        return 'vuejs.org';
      case 'angular':
        return 'angular.io';
      default:
        return `${fw}.dev`;
    }
  }
}
