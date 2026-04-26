export class UrlService {
  static parse(input: string): any {
    try {
      const url = new URL(input);
      const query: Record<string, string> = {};
      url.searchParams.forEach((value, key) => {
        query[key] = value;
      });

      return {
        protocol: url.protocol,
        host: url.host,
        hostname: url.hostname,
        port: url.port,
        path: url.pathname,
        query: query,
        hash: url.hash
      };
    } catch (error: any) {
      throw new Error(`Invalid URL: ${error.message}`);
    }
  }

  static encode(input: string): string {
    return encodeURIComponent(input);
  }

  static decode(input: string): string {
    return decodeURIComponent(input);
  }
}
