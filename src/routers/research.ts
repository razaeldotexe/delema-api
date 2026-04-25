import { Router, Request, Response } from 'express';
import wikipedia from 'wikipedia';
import arxivClient, { all } from 'arxiv-client';
import { SearchRequestSchema } from '../types/schemas';
import { tryGemini, tryGroq, tryOpenRouter } from '../utils/ai_helper';
import { webhookLogger } from '../utils/logger';

const router = Router();

/**
 * Search for scientific papers on arXiv.
 */
router.post('/arxiv', async (req: Request, res: Response) => {
  const validation = SearchRequestSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(422).json({ detail: validation.error.errors });
  }

  const { query, limit = 10 } = validation.data;

  try {
    const results = await arxivClient
      .query(all(query))
      .maxResults(limit)
      .execute();

    const papers = results.map((paper: any) => ({
      title: paper.title,
      authors: Array.isArray(paper.authors) ? paper.authors.map((a: any) => a.name) : [],
      summary: paper.summary,
      published: paper.published,
      primary_category: paper.categories?.[0]?.term || 'unknown',
      pdf_url: paper.links?.find((l: any) => l.type === 'pdf')?.href || '',
      entry_id: paper.id,
    }));

    let ai_summary: string | undefined = undefined;

    if (papers.length > 0) {
      const providers = [
        { name: 'Gemini', fn: tryGemini },
        { name: 'Groq', fn: tryGroq },
        { name: 'OpenRouter', fn: tryOpenRouter },
      ];

      const abstracts = papers
        .slice(0, 10)
        .map((p: any, i: number) => `[${i + 1}] ${p.summary.substring(0, 1500)}`)
        .join('\n\n');

      const prompt = `Gunakan informasi abstrak penelitian berikut untuk merangkum lanskap penelitian terkini tentang topik: "${query}". Berikan ringkasan yang ringkas dan informatif (maksimal 4-5 kalimat) dalam Bahasa Indonesia.\n\nAbstrak:\n${abstracts}`;

      for (const provider of providers) {
        try {
          webhookLogger.log(
            `Generating AI summary for arXiv query "${query}" using ${provider.name}...`,
            'AI',
          );
          const response = await provider.fn(prompt);
          if (response) {
            ai_summary = response.trim();
            webhookLogger.log(
              `AI summary for arXiv generated successfully using ${provider.name}`,
              'SUCCESS',
            );
            break;
          }
        } catch (error: any) {
          webhookLogger.log(`Provider ${provider.name} failed for arXiv: ${error.message}`, 'WARN');
        }
      }
    }

    if (!ai_summary && papers.length > 0) {
      webhookLogger.log(`All AI providers failed for arXiv summary of "${query}"`, 'ERROR');
      ai_summary = 'Gagal menghasilkan ringkasan AI.';
    }

    return res.json({
      results: papers,
      ai_summary,
    });
  } catch (error: any) {
    return res.status(500).json({ detail: error.message });
  }
});

/**
 * Search for information on Wikipedia.
 */
router.post('/wikipedia', async (req: Request, res: Response) => {
  const validation = SearchRequestSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(422).json({ detail: validation.error.errors });
  }

  const { query } = validation.data;

  try {
    const page = await wikipedia.page(query);
    const summary = await page.summary();

    let ai_summary: string | undefined = undefined;

    // Force AI Summary
    const providers = [
      { name: 'Gemini', fn: tryGemini },
      { name: 'Groq', fn: tryGroq },
      { name: 'OpenRouter', fn: tryOpenRouter },
    ];

    const prompt = `Buatkan ringkasan singkat (maksimal 2-3 kalimat) dan langsung ke intinya untuk pertanyaan: "${query}". Gunakan HANYA informasi berikut dari Wikipedia: "${(summary.extract || '').substring(0, 1500)}". Jika informasinya tidak relevan, katakan saja "Konteks relevan tidak ditemukan di Wikipedia."`;

    for (const provider of providers) {
      try {
        webhookLogger.log(`Generating AI summary for "${query}" using ${provider.name}...`, 'AI');
        const response = await provider.fn(prompt);
        if (response) {
          ai_summary = response.trim();
          webhookLogger.log(`AI summary generated successfully using ${provider.name}`, 'SUCCESS');
          break;
        }
      } catch (error: any) {
        webhookLogger.log(`Provider ${provider.name} failed: ${error.message}`, 'WARN');
      }
    }

    if (!ai_summary) {
      webhookLogger.log(`All AI providers failed for Wikipedia summary of "${query}"`, 'ERROR');
      ai_summary = 'Gagal menghasilkan ringkasan AI.';
    }

    return res.json({
      title: page.title,
      summary: (summary.extract || '').substring(0, 2000),
      fullurl: page.fullurl,
      ai_summary,
    });
  } catch (error: any) {
    if (error.message.includes('not find')) {
      return res.status(404).json({ detail: 'Page not found' });
    }
    return res.status(500).json({ detail: error.message });
  }
});

/**
 * Search for Nerd Fonts.
 */
router.post('/nerdfont', (req: Request, res: Response) => {
  const validation = SearchRequestSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(422).json({ detail: validation.error.errors });
  }

  const { query } = validation.data;
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

  return res.json(results);
});

export default router;
