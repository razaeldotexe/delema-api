import * as prettier from 'prettier';

export class FormatService {
  static async format(code: string, language: string): Promise<string> {
    const parserMap: Record<string, string> = {
      javascript: 'babel',
      typescript: 'babel-ts',
      json: 'json',
      html: 'html',
      css: 'css',
    };

    const parser = parserMap[language] || 'babel';

    try {
      return await prettier.format(code, {
        parser,
        semi: true,
        singleQuote: true,
        tabWidth: 2,
      });
    } catch (error: any) {
      throw new Error(`Formatting failed: ${error.message}`);
    }
  }
}
