import { describe, it, expect, vi } from 'vitest';

vi.mock('playwright', () => ({
  chromium: {
    launch: vi.fn(),
  },
}));

import request from 'supertest';
import app from '../src/main';

const apiPrefix = '/api/delema/v1/tools';

describe('Tools API', () => {
  describe('POST /json', () => {
    it('should prettify JSON', async () => {
      const response = await request(app)
        .post(`${apiPrefix}/json`)
        .send({ action: 'prettify', input: '{"a":1}' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.result).toBe('{\n  "a": 1\n}');
    });

    it('should minify JSON', async () => {
      const response = await request(app)
        .post(`${apiPrefix}/json`)
        .send({ action: 'minify', input: '{\n  "a": 1\n}' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.result).toBe('{"a":1}');
    });

    it('should validate JSON', async () => {
      const response = await request(app)
        .post(`${apiPrefix}/json`)
        .send({ action: 'validate', input: '{"a":1}' });

      expect(response.status).toBe(200);
      expect(response.body.result.valid).toBe(true);
    });

    it('should return error for invalid JSON', async () => {
      const response = await request(app)
        .post(`${apiPrefix}/json`)
        .send({ action: 'prettify', input: 'invalid' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('should diff JSON', async () => {
      const response = await request(app)
        .post(`${apiPrefix}/json`)
        .send({ action: 'diff', input: '{"a":1}', input2: '{"a":2, "b":3}' });

      expect(response.status).toBe(200);
      expect(response.body.result.equal).toBe(false);
      expect(response.body.result.changes.modified.a.to).toBe(2);
      expect(response.body.result.changes.added.b).toBe(3);
    });
  });

  describe('POST /format', () => {
    it('should format javascript code', async () => {
      const response = await request(app)
        .post(`${apiPrefix}/format`)
        .send({ language: 'javascript', code: 'function a(){const b=1;return b}' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.result).toContain('function a() {');
    });
  });

  describe('POST /crypto', () => {
    it('should hash with md5', async () => {
      const response = await request(app)
        .post(`${apiPrefix}/crypto`)
        .send({ action: 'hash', type: 'md5', input: 'hello' });

      expect(response.status).toBe(200);
      expect(response.body.result).toBe('5d41402abc4b2a76b9719d911017c592');
    });

    it('should encode base64', async () => {
      const response = await request(app)
        .post(`${apiPrefix}/crypto`)
        .send({ action: 'encode', type: 'base64', input: 'hello' });

      expect(response.status).toBe(200);
      expect(response.body.result).toBe('aGVsbG8=');
    });

    it('should decode base64', async () => {
      const response = await request(app)
        .post(`${apiPrefix}/crypto`)
        .send({ action: 'decode', type: 'base64', input: 'aGVsbG8=' });

      expect(response.status).toBe(200);
      expect(response.body.result).toBe('hello');
    });
  });

  describe('POST /url', () => {
    it('should parse URL', async () => {
      const response = await request(app)
        .post(`${apiPrefix}/url`)
        .send({ action: 'parse', input: 'https://example.com/path?q=test' });

      expect(response.status).toBe(200);
      expect(response.body.host).toBe('example.com');
      expect(response.body.path).toBe('/path');
      expect(response.body.query.q).toBe('test');
    });

    it('should encode URL component', async () => {
      const response = await request(app)
        .post(`${apiPrefix}/url`)
        .send({ action: 'encode', input: 'hello world' });

      expect(response.status).toBe(200);
      expect(response.body.result).toBe('hello%20world');
    });
  });

  describe('POST /time', () => {
    it('should return now', async () => {
      const response = await request(app)
        .post(`${apiPrefix}/time`)
        .send({ action: 'now' });

      expect(response.status).toBe(200);
      expect(response.body.unix).toBeDefined();
      expect(response.body.iso).toBeDefined();
      expect(response.body.readable).toBeDefined();
    });

    it('should convert timestamp', async () => {
      const response = await request(app)
        .post(`${apiPrefix}/time`)
        .send({ action: 'convert', input: 1714046400 });

      expect(response.status).toBe(200);
      expect(response.body.iso).toContain('2024-04-25');
    });
  });
});
