import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/main';
import axios from 'axios';
import * as aiHelper from '../src/utils/ai_helper';

vi.mock('axios');
vi.mock('../src/utils/ai_helper');

describe('Outfit Rating API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should rate an outfit from a URL', async () => {
    const mockImageBuffer = Buffer.from('fake-image-data');
    (axios.get as any).mockResolvedValue({
      data: mockImageBuffer,
      headers: { 'content-type': 'image/png' },
    });

    const mockAiResponse = JSON.stringify({
      score: 8,
      feedback: 'Great summer look!',
      suggestions: ['Add sunglasses'],
    });
    (aiHelper.tryGeminiVision as any).mockResolvedValue(mockAiResponse);

    const response = await request(app)
      .post('/api/v1/outfit/rate')
      .send({ image_url: 'https://example.com/outfit.png', context: 'summer party' });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      score: 8,
      feedback: 'Great summer look!',
      suggestions: ['Add sunglasses'],
    });

    expect(axios.get).toHaveBeenCalledWith('https://example.com/outfit.png', expect.anything());
    expect(aiHelper.tryGeminiVision).toHaveBeenCalledWith(
      expect.stringContaining('summer party'),
      'image/png',
      mockImageBuffer.toString('base64'),
    );
  });

  it('should rate an outfit from base64 data', async () => {
    const base64Data =
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
    const base64Input = `data:image/png;base64,${base64Data}`;

    const mockAiResponse = JSON.stringify({
      score: 7,
      feedback: 'Casual and comfortable.',
      suggestions: ['Try a different color shoes'],
    });
    (aiHelper.tryGeminiVision as any).mockResolvedValue(mockAiResponse);

    const response = await request(app)
      .post('/api/v1/outfit/rate')
      .send({ image_base64: base64Input });

    expect(response.status).toBe(200);
    expect(response.body.score).toBe(7);
    expect(aiHelper.tryGeminiVision).toHaveBeenCalledWith(
      expect.anything(),
      'image/png',
      base64Data,
    );
  });

  it('should return 422 if no image is provided', async () => {
    const response = await request(app).post('/api/v1/outfit/rate').send({ context: 'test' });

    expect(response.status).toBe(422);
  });

  it('should handle AI rotation failure', async () => {
    (aiHelper.tryGeminiVision as any).mockRejectedValue(
      new Error('All Gemini Vision models failed'),
    );

    const response = await request(app).post('/api/v1/outfit/rate').send({ image_base64: 'abc' });

    expect(response.status).toBe(500);
    expect(response.body.detail).toBe('All Gemini Vision models failed');
  });
});
