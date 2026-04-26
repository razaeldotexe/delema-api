import axios from 'axios';
import arxivClient, { all } from 'arxiv-client';
import { tryAllProviders } from '../utils/ai_helper';
import { webhookLogger } from '../utils/logger';

export class ResearchService {
  /**
   * Search for scientific papers on arXiv and generate AI summary.
   */
  static async searchArXiv(query: string, limit: number = 10, lang?: string) {
    const results = await arxivClient.query(all(query)).maxResults(limit).execute();

    const papers = results.map((paper: any) => ({
      title: paper.title,
      authors: Array.isArray(paper.authors) ? paper.authors.map((a: any) => a.name) : [],
      summary: paper.summary,
      published: paper.published,
      primary_category: paper.categories?.[0]?.term || 'unknown',
      pdf_url: paper.links?.find((l: any) => l.type === 'pdf')?.href || paper.id || '',
      entry_id: paper.id,
    }));

    let ai_summary: string | undefined = undefined;

    if (papers.length > 0) {
      const abstracts = papers
        .slice(0, 10)
        .map((p: any, i: number) => `[${i + 1}] ${p.summary.substring(0, 1500)}`)
        .join('\n\n');

      const languageInstruction = lang ? `Response language: ${lang}.` : 'Response language: Indonesian.';
      const prompt = `Gunakan informasi abstrak penelitian berikut untuk merangkum lanskap penelitian terkini tentang topik: "${query}". Berikan ringkasan dalam format "TL;DR:" yang sangat ringkas dan informatif. ${languageInstruction}\n\nAbstrak:\n${abstracts}`;

      try {
        ai_summary = await tryAllProviders(prompt);
      } catch (error: any) {
        webhookLogger.error(`All AI providers failed for arXiv summary of "${query}": ${error.message}`);
        ai_summary = 'Gagal menghasilkan ringkasan AI.';
      }
    }

    return {
      results: papers,
      ai_summary,
    };
  }

  /**
   * Search Wikipedia and generate AI summary.
   */
  static async searchWikipedia(query: string, lang?: string) {
    const userAgent = 'DelemaAPI/1.0 (https://delema.razael-fox.my.id; contact@razael-fox.my.id)';
    let summaryData: any = null;
    let usedLang = 'en';

    // Try English first
    try {
      const enUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`;
      const response = await axios.get(enUrl, {
        headers: { 'User-Agent': userAgent },
        timeout: 10000,
      });
      summaryData = response.data;
    } catch (e: any) {
      if (e.response?.status === 404) {
        try {
          const idUrl = `https://id.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`;
          const response = await axios.get(idUrl, {
            headers: { 'User-Agent': userAgent },
            timeout: 10000,
          });
          summaryData = response.data;
          usedLang = 'id';
        } catch {
          throw e; // throw original EN 404 if ID also fails
        }
      } else {
        throw e;
      }
    }

    if (!summaryData || summaryData.type === 'disambiguation') {
      throw new Error('Page not found or is a disambiguation page');
    }

    let ai_summary: string | undefined = undefined;
    const languageInstruction = lang ? `Response language: ${lang}.` : 'Response language: Indonesian.';
    const prompt = `Buatkan ringkasan sangat singkat dalam format "TL;DR:" untuk pertanyaan: "${query}". ${languageInstruction} Gunakan HANYA informasi berikut dari Wikipedia: "${(summaryData.extract || '').substring(0, 1500)}". Jika informasinya tidak relevan, katakan saja "Konteks relevan tidak ditemukan di Wikipedia."`;

    try {
      ai_summary = await tryAllProviders(prompt);
    } catch (error: any) {
      webhookLogger.error(`All AI providers failed for Wikipedia summary of "${query}": ${error.message}`);
      ai_summary = 'Gagal menghasilkan ringkasan AI.';
    }

    return {
      title: summaryData.title,
      summary: (summaryData.extract || '').substring(0, 2000),
      fullurl: summaryData.content_urls?.desktop?.page || `https://${usedLang}.wikipedia.org/wiki/${encodeURIComponent(summaryData.title)}`,
      ai_summary,
    };
  }

  /**
   * Search for Nerd Fonts.
   */
  static getNerdFonts(query: string) {
    const fonts = [
      { name: 'JetBrainsMono', display: 'JetBrains Mono Nerd Font', unpatched: 'JetBrains Mono' },
      { name: 'FiraCode', display: 'Fira Code Nerd Font', unpatched: 'Fira Code' },
      { name: 'Hack', display: 'Hack Nerd Font', unpatched: 'Hack' },
      { name: 'Meslo', display: 'Meslo LG Nerd Font', unpatched: 'Meslo LG' },
      { name: 'SourceCodePro', display: 'Source Code Pro Nerd Font', unpatched: 'Source Code Pro' },
      { name: 'CascadiaCode', display: 'Cascadia Code Nerd Font', unpatched: 'Cascadia Code' },
      { name: 'UbuntuMono', display: 'Ubuntu Mono Nerd Font', unpatched: 'Ubuntu Mono' },
    ];

    const q = query.toLowerCase();
    const version = 'v3.3.0';

    const results = fonts
      .filter((f) => f.name.toLowerCase().includes(q) || f.display.toLowerCase().includes(q))
      .map((f) => ({
        patchedName: f.display,
        unpatchedName: f.unpatched,
        folderName: f.name,
        downloadUrl: `https://github.com/ryanoasis/nerd-fonts/releases/download/${version}/${f.name}.zip`,
      }));

    if (results.length === 0) {
      const name = query.replace(/\s+/g, '');
      results.push({
        patchedName: `${query} Nerd Font`,
        unpatchedName: query,
        folderName: name,
        downloadUrl: `https://github.com/ryanoasis/nerd-fonts/releases/download/${version}/${name}.zip`,
      });
    }

    return results;
  }
}
