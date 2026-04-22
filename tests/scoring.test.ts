import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/main';

describe('Scoring API', () => {
  it('should calculate scores correctly', async () => {
    const payload = {
      items: [
        { id: 1, price: 100, available: true },
        { id: 2, price: 200, available: false },
        { id: 3, price: 150, available: true },
      ],
      weights: {
        price: -0.1,
        available: 10,
      },
    };

    const response = await request(app)
      .post('/api/v1/recommendations/score')
      .send(payload);

    expect(response.status).toBe(200);
    expect(response.body.scored_items).toHaveLength(3);

    // Item 1: 100 * -0.1 + 1 * 10 = -10 + 10 = 0
    // Item 2: 200 * -0.1 + 0 * 10 = -20 + 0 = -20
    // Item 3: 150 * -0.1 + 1 * 10 = -15 + 10 = -5

    const items = response.body.scored_items;
    expect(items[0].id).toBe(1);
    expect(items[0]._score).toBe(0);
    expect(items[1].id).toBe(3);
    expect(items[1]._score).toBe(-5);
    expect(items[2].id).toBe(2);
    expect(items[2]._score).toBe(-20);
  });

  it('should handle empty items list', async () => {
    const payload = {
      items: [],
      weights: { price: 1 },
    };

    const response = await request(app)
      .post('/api/v1/recommendations/score')
      .send(payload);

    expect(response.status).toBe(200);
    expect(response.body.scored_items).toEqual([]);
  });

  it('should return 400 for invalid payload', async () => {
    const payload = {
      items: [{ id: 1 }],
      // missing weights
    };

    const response = await request(app)
      .post('/api/v1/recommendations/score')
      .send(payload);

    expect(response.status).toBe(400);
  });
});
