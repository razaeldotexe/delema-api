import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/main';
import * as aiHelper from '../src/utils/ai_helper';
import axios from 'axios';
import arxivClient from 'arxiv-client';

vi.mock('axios');
vi.mock('arxiv-client', () => ({
  default: {
    query: vi.fn().mockReturnThis(),
    maxResults: vi.fn().mockReturnThis(),
    execute: vi.fn(),
  },
  all: vi.fn((q) => q),
}));
vi.mock('../src/utils/ai_helper');

describe('Research API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/delema/v1/research/arxiv', () => {
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

      (arxivClient.execute as any).mockResolvedValue(mockPapers);
      (aiHelper.tryAllProviders as any).mockResolvedValue('Ringkasan AI dalam Bahasa Indonesia.');

      const response = await request(app)
        .post('/api/delema/v1/research/arxiv')
        .send({ query: 'artificial intelligence', limit: 1, lang: 'Indonesian' });

      expect(response.status).toBe(200);
      expect(response.body.results).toHaveLength(1);
      expect(response.body.results[0].title).toBe('Test Paper 1');
      expect(response.body.ai_summary).toBe('Ringkasan AI dalam Bahasa Indonesia.');
      expect(arxivClient.execute).toHaveBeenCalled();
    });

    it('should handle no results from arXiv', async () => {
      (arxivClient.execute as any).mockResolvedValue([]);

      const response = await request(app)
        .post('/api/delema/v1/research/arxiv')
        .send({ query: 'nonexistent topic', lang: 'English' });

      expect(response.status).toBe(200);
      expect(response.body.results).toHaveLength(0);
      expect(response.body.ai_summary).toBeUndefined();
    });

    it('should return 422 for missing query', async () => {
      const response = await request(app).post('/api/delema/v1/research/arxiv').send({ limit: 5 });

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

      (arxivClient.execute as any).mockResolvedValue(mockPapers);
      (aiHelper.tryAllProviders as any).mockRejectedValue(new Error('All providers failed'));

      const response = await request(app)
        .post('/api/delema/v1/research/arxiv')
        .send({ query: 'ai' });

      expect(response.status).toBe(200);
      expect(response.body.ai_summary).toBe('Gagal menghasilkan ringkasan AI.');
    });
  });

  describe('POST /api/delema/v1/research/wikipedia', () => {
    it('should return wikipedia summary and AI summary', async () => {
      const mockSummary = {
        title: 'Test Topic',
        extract: 'Wikipedia extract content.',
        content_urls: { desktop: { page: 'https://en.wikipedia.org/wiki/Test_Topic' } },
      };

      (axios.get as any).mockResolvedValue({ data: mockSummary });
      (aiHelper.tryAllProviders as any).mockResolvedValue('Ringkasan AI Wikipedia.');

      const response = await request(app)
        .post('/api/delema/v1/research/wikipedia')
        .send({ query: 'Test Topic', lang: 'Indonesian' });

      expect(response.status).toBe(200);
      expect(response.body.title).toBe('Test Topic');
      expect(response.body.summary).toBe('Wikipedia extract content.');
      expect(response.body.ai_summary).toBe('Ringkasan AI Wikipedia.');
    });

    it('should return 404 when page is not found', async () => {
      (axios.get as any).mockRejectedValue({ response: { status: 404 } });

      const response = await request(app)
        .post('/api/delema/v1/research/wikipedia')
        .send({ query: 'NonExistentPage12345' });

      expect(response.status).toBe(404);
      expect(response.body.detail).toBe('Page not found');
    });

    it('should return 422 for missing query', async () => {
      const response = await request(app).post('/api/delema/v1/research/wikipedia').send({});

      expect(response.status).toBe(422);
    });

    it('should handle AI provider failures for Wikipedia', async () => {
      const mockSummary = {
        title: 'Test Topic',
        extract: 'Wikipedia extract content.',
        content_urls: { desktop: { page: 'https://en.wikipedia.org/wiki/Test_Topic' } },
      };

      (axios.get as any).mockResolvedValue({ data: mockSummary });
      (aiHelper.tryAllProviders as any).mockRejectedValue(new Error('All providers failed'));

      const response = await request(app)
        .post('/api/delema/v1/research/wikipedia')
        .send({ query: 'Test Topic', lang: 'Indonesian' });

      expect(response.status).toBe(200);
      expect(response.body.ai_summary).toBe('Gagal menghasilkan ringkasan AI.');
    });
  });
});
