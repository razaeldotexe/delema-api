import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/main';
import axios from 'axios';

vi.mock('axios');
const mockedAxios = axios as any;

// Mock global fetch
global.fetch = vi.fn();

describe('GIF API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.GIPHY_API_KEY = 'test_key';
    process.env.GEMINI_API_KEY = 'test_gemini_key';
  });

  describe('POST /api/v1/gif/search', () => {
    it('should return a GIF when AI and Giphy succeed', async () => {
      // Mock AI response (Gemini)
      mockedAxios.post.mockResolvedValueOnce({
        status: 200,
        data: {
          candidates: [{ content: { parts: [{ text: 'funny cat' }] } }]
        }
      });

      // Mock Giphy response
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [
            {
              id: '123',
              title: 'Funny Cat',
              url: 'https://giphy.com/gifs/123',
              images: {
                original: { url: 'https://media.giphy.com/media/123/giphy.gif' },
                preview_gif: { url: 'https://media.giphy.com/media/123/giphy-preview.gif' }
              }
            }
          ]
        })
      });

      const response = await request(app)
        .post('/api/v1/gif/search')
        .send({ query: 'show me something funny' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', '123');
      expect(response.body).toHaveProperty('title', 'Funny Cat');
      expect(response.body.original_url).toBe('https://media.giphy.com/media/123/giphy.gif');
      
      // Verify AI was called
      expect(mockedAxios.post).toHaveBeenCalled();
      // Verify Giphy was called with optimized keyword
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('q=funny%20cat'));
    });

    it('should return 400 when query is missing', async () => {
      const response = await request(app)
        .post('/api/v1/gif/search')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Missing or invalid');
    });

    it('should fallback to original query when AI fails', async () => {
      // Mock AI failure (all providers)
      mockedAxios.post.mockRejectedValue(new Error('AI failed'));

      // Mock Giphy response
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [
            {
              id: '456',
              title: 'Original Query Result',
              url: 'https://giphy.com/gifs/456',
              images: {
                original: { url: 'https://media.giphy.com/media/456/giphy.gif' },
                preview_gif: { url: 'https://media.giphy.com/media/456/giphy-preview.gif' }
              }
            }
          ]
        })
      });

      const response = await request(app)
        .post('/api/v1/gif/search')
        .send({ query: 'original query' });

      expect(response.status).toBe(200);
      expect(response.body.id).toBe('456');
      // Verify Giphy was called with original query
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('q=original%20query'));
    });

    it('should return 500 when Giphy API fails', async () => {
       // Mock AI response
       mockedAxios.post.mockResolvedValueOnce({
        status: 200,
        data: {
          candidates: [{ content: { parts: [{ text: 'funny cat' }] } }]
        }
      });

      // Mock Giphy failure
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500
      });

      const response = await request(app)
        .post('/api/v1/gif/search')
        .send({ query: 'funny cat' });

      expect(response.status).toBe(500);
      expect(response.body.error).toContain('Internal server error');
    });
  });

  describe('GET /api/v1/gif/trending', () => {
    it('should return trending GIFs', async () => {
      // Mock Giphy response
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [
            {
              id: 'trend1',
              title: 'Trending 1',
              url: 'https://giphy.com/gifs/trend1',
              images: {
                original: { url: 'https://media.giphy.com/media/trend1/giphy.gif' },
                preview_gif: { url: 'https://media.giphy.com/media/trend1/giphy-preview.gif' }
              }
            }
          ]
        })
      });

      const response = await request(app)
        .get('/api/v1/gif/trending?limit=5');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body[0].id).toBe('trend1');
      
      // Verify limit was passed to Giphy
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('limit=5'));
    });

    it('should return 400 for invalid limit', async () => {
      const response = await request(app)
        .get('/api/v1/gif/trending?limit=invalid');

      expect(response.status).toBe(400);
    });
  });
});
