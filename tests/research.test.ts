import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/main';
import * as aiHelper from '../src/utils/ai_helper';
import { search as arxivSearch } from 'arxiv-client';
import wikipedia from 'wikipedia';

vi.mock('arxiv-client', () => ({
  search: vi.fn(),
}));
vi.mock('wikipedia');
vi.mock('../src/utils/ai_helper');

describe('Research API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/v1/research/arxiv', () => {
    it('should return papers and an AI summary', async () => {
      const mockPapers = [
        {
          title: 'Test Paper 1',
          authors: [{ name: 'Author 1' }],
          summary: 'Summary 1',
          published: '2023-01-01',
          categories: [{ term: 'cs.AI' }],
          links: [{ type: 'pdf', href: 'http://example.com/1.pdf' }],
          id: '1',
        },
      ];

      (arxivSearch as any).mockResolvedValue(mockPapers);
      (aiHelper.tryGemini as any).mockResolvedValue('Ringkasan AI dalam Bahasa Indonesia.');

      const response = await request(app)
        .post('/api/v1/research/arxiv')
        .send({ query: 'artificial intelligence', limit: 1 });

      expect(response.status).toBe(200);
      expect(response.body.results).toHaveLength(1);
      expect(response.body.results[0].title).toBe('Test Paper 1');
      expect(response.body.ai_summary).toBe('Ringkasan AI dalam Bahasa Indonesia.');
      expect(arxivSearch).toHaveBeenCalled();
    });

    it('should handle no results from arXiv', async () => {
      (arxivSearch as any).mockResolvedValue([]);

      const response = await request(app)
        .post('/api/v1/research/arxiv')
        .send({ query: 'nonexistent topic' });

      expect(response.status).toBe(200);
      expect(response.body.results).toHaveLength(0);
      expect(response.body.ai_summary).toBeUndefined();
    });

    it('should return 422 for missing query', async () => {
      const response = await request(app)
        .post('/api/v1/research/arxiv')
        .send({ limit: 5 });

      expect(response.status).toBe(422);
    });

    it('should handle AI provider failures', async () => {
      const mockPapers = [
        {
          title: 'Test Paper 1',
          authors: [{ name: 'Author 1' }],
          summary: 'Summary 1',
          published: '2023-01-01',
          categories: [{ term: 'cs.AI' }],
          links: [{ type: 'pdf', href: 'http://example.com/1.pdf' }],
          id: '1',
        },
      ];

      (arxivSearch as any).mockResolvedValue(mockPapers);
      (aiHelper.tryGemini as any).mockRejectedValue(new Error('Gemini failed'));
      (aiHelper.tryGroq as any).mockRejectedValue(new Error('Groq failed'));
      (aiHelper.tryOpenRouter as any).mockRejectedValue(new Error('OpenRouter failed'));

      const response = await request(app)
        .post('/api/v1/research/arxiv')
        .send({ query: 'ai' });

      expect(response.status).toBe(200);
      expect(response.body.ai_summary).toBe('Gagal menghasilkan ringkasan AI.');
    });
  });

  describe('POST /api/v1/research/wikipedia', () => {
    it('should return wikipedia summary and AI summary', async () => {
      const mockPage = {
        title: 'Test Topic',
        fullurl: 'https://en.wikipedia.org/wiki/Test_Topic',
        summary: vi.fn().mockResolvedValue({ extract: 'Wikipedia extract content.' }),
      };

      (wikipedia.page as any).mockResolvedValue(mockPage);
      (aiHelper.tryGemini as any).mockResolvedValue('Ringkasan AI Wikipedia.');

      const response = await request(app)
        .post('/api/v1/research/wikipedia')
        .send({ query: 'Test Topic' });

      expect(response.status).toBe(200);
      expect(response.body.title).toBe('Test Topic');
      expect(response.body.summary).toBe('Wikipedia extract content.');
      expect(response.body.ai_summary).toBe('Ringkasan AI Wikipedia.');
    });

    it('should return 404 when page is not found', async () => {
      (wikipedia.page as any).mockRejectedValue(new Error('Could not find page'));

      const response = await request(app)
        .post('/api/v1/research/wikipedia')
        .send({ query: 'NonExistentPage12345' });

      expect(response.status).toBe(404);
      expect(response.body.detail).toBe('Page not found');
    });

    it('should return 422 for missing query', async () => {
      const response = await request(app)
        .post('/api/v1/research/wikipedia')
        .send({});

      expect(response.status).toBe(422);
    });

    it('should handle AI provider failures for Wikipedia', async () => {
      const mockPage = {
        title: 'Test Topic',
        fullurl: 'https://en.wikipedia.org/wiki/Test_Topic',
        summary: vi.fn().mockResolvedValue({ extract: 'Wikipedia extract content.' }),
      };

      (wikipedia.page as any).mockResolvedValue(mockPage);
      (aiHelper.tryGemini as any).mockRejectedValue(new Error('Gemini failed'));
      (aiHelper.tryGroq as any).mockRejectedValue(new Error('Groq failed'));
      (aiHelper.tryOpenRouter as any).mockRejectedValue(new Error('OpenRouter failed'));

      const response = await request(app)
        .post('/api/v1/research/wikipedia')
        .send({ query: 'Test Topic' });

      expect(response.status).toBe(200);
      expect(response.body.ai_summary).toBe('Gagal menghasilkan ringkasan AI.');
    });
  });
});
