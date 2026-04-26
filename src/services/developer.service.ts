import { tryAllProviders } from '../utils/ai_helper';
import { DocsScraper } from '../utils/docs_fetcher';

export class DeveloperService {
  private static scraper = new DocsScraper();

  static async explainCode(code: string, language?: string | null, context?: string | null, lang?: string | null) {
    const languageInstruction = lang ? `Response language: ${lang}.` : 'Response language: English.';
    const prompt = `Explain the following ${language || ''} code in a clear and concise way. ${
      context ? `Additional Context: ${context}` : ''
    } ${languageInstruction}\n\nCode:\n\`\`\`\n${code}\n\`\`\``;

    return { explanation: await tryAllProviders(prompt) };
  }

  static async debugCode(code: string, error?: string | null, language?: string | null, lang?: string | null) {
    const languageInstruction = lang ? `Response language: ${lang}.` : 'Response language: English.';
    const prompt = `Identify and fix the bug in the following ${language || ''} code. ${
      error ? `Reported Error: ${error}` : ''
    } ${languageInstruction}\n\nCode:\n\`\`\`\n${code}\n\`\`\``;

    return { fix: await tryAllProviders(prompt) };
  }

  static async generateCode(userPrompt: string, language: string, framework?: string | null, lang?: string | null) {
    const languageInstruction = lang ? `Brief explanation language: ${lang}.` : 'Brief explanation language: English.';
    const prompt = `Generate ${language} code ${
      framework ? `using the ${framework} framework` : ''
    } for the following requirement:\n${userPrompt}\n\nProvide only the code block and a brief explanation. ${languageInstruction}`;

    return { code: await tryAllProviders(prompt) };
  }

  static async refactorCode(code: string, instruction?: string | null, language?: string | null, lang?: string | null) {
    const languageInstruction = lang ? `Response language: ${lang}.` : 'Response language: English.';
    const prompt = `Refactor the following ${language || ''} code. ${
      instruction
        ? `Specific Instruction: ${instruction}`
        : 'Focus on improving readability and performance.'
    } ${languageInstruction}\n\nCode:\n\`\`\`\n${code}\n\`\`\``;

    return { refactoredCode: await tryAllProviders(prompt) };
  }

  static async lookupDocs(query: string, framework?: string | null, lang?: string | null) {
    const result = await this.scraper.search(query, framework);

    const languageInstruction = lang ? `Response language: ${lang}.` : 'Response language: English.';
    const prompt = `Based on the following documentation content, provide a concise developer-friendly answer for the query: "${query}"\n\nContent:\n${result.content}\n\nSource: ${result.url}\n\n${languageInstruction}\n\nIf the content is not relevant, say you couldn't find a specific answer but provide what you can from the context.`;

    const answer = await tryAllProviders(prompt);

    return {
      answer,
      source: result.source,
      url: result.url,
    };
  }
}
