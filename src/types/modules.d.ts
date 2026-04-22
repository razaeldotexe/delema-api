declare module 'duckduckgo-search' {
  interface SearchResult {
    title: string;
    href: string;
    body: string;
  }

  interface SearchApi {
    text(keywords: string, region?: string, safesearch?: string, timelimit?: string | null): AsyncGenerator<SearchResult>;
    images(keywords: string, region?: string, safesearch?: string, timelimit?: string | null, size?: string | null, color?: string | null, type_image?: string | null, layout?: string | null, license_image?: string | null): AsyncGenerator<any>;
  }

  const ddgs: SearchApi;
  export default ddgs;
}

declare module 'wikipedia';
declare module 'arxiv-client';
