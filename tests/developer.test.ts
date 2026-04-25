import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/main';
import * as aiHelper from '../src/utils/ai_helper';
import { DocsScraper } from '../src/utils/docs_fetcher';

vi.mock('../src/utils/ai_helper');
vi.mock('../src/utils/docs_fetcher');

describe('Developer API Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/delema/v1/code/explain', () => {
    it('should explain code successfully', async () => {
      const mockExplanation = 'This code defines a function that adds two numbers.';
      (aiHelper.tryGemini as any).mockResolvedValue(mockExplanation);

      const response = await request(app)
        .post('/api/delema/v1/code/explain')
        .send({
          code: 'function add(a, b) { return a + b; }',
          language: 'javascript',
          context: 'Basic arithmetic'
        });

      expect(response.status).toBe(200);
      expect(response.body.explanation).toBe(mockExplanation);
      expect(aiHelper.tryGemini).toHaveBeenCalled();
    });

    it('should return 400 for missing code', async () => {
      const response = await request(app)
        .post('/api/delema/v1/code/explain')
        .send({ language: 'javascript' });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/delema/v1/code/debug', () => {
    it('should debug code successfully', async () => {
      const mockFix = 'The bug was a missing semicolon. Fixed code: ...';
      (aiHelper.tryGemini as any).mockResolvedValue(mockFix);

      const response = await request(app)
        .post('/api/delema/v1/code/debug')
        .send({
          code: 'const x = 10',
          error: 'SyntaxError',
          language: 'javascript'
        });

      expect(response.status).toBe(200);
      expect(response.body.fix).toBe(mockFix);
    });

    it('should return 400 for missing code', async () => {
      const response = await request(app)
        .post('/api/delema/v1/code/debug')
        .send({ error: 'Some error' });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/delema/v1/code/generate', () => {
    it('should generate code successfully', async () => {
      const mockGeneratedCode = '```javascript\nconsole.log("Hello World");\n```';
      (aiHelper.tryGemini as any).mockResolvedValue(mockGeneratedCode);

      const response = await request(app)
        .post('/api/delema/v1/code/generate')
        .send({
          prompt: 'Print hello world',
          language: 'javascript',
          framework: 'Node.js'
        });

      expect(response.status).toBe(200);
      expect(response.body.code).toBe(mockGeneratedCode);
    });

    it('should return 400 for missing prompt or language', async () => {
      const response1 = await request(app)
        .post('/api/delema/v1/code/generate')
        .send({ language: 'javascript' });
      
      const response2 = await request(app)
        .post('/api/delema/v1/code/generate')
        .send({ prompt: 'Hello' });

      expect(response1.status).toBe(400);
      expect(response2.status).toBe(400);
    });
  });

  describe('POST /api/delema/v1/code/refactor', () => {
    it('should refactor code successfully', async () => {
      const mockRefactored = 'const add = (a, b) => a + b;';
      (aiHelper.tryGemini as any).mockResolvedValue(mockRefactored);

      const response = await request(app)
        .post('/api/delema/v1/code/refactor')
        .send({
          code: 'function add(a, b) { return a + b; }',
          instruction: 'Use arrow function',
          language: 'javascript'
        });

      expect(response.status).toBe(200);
      expect(response.body.refactoredCode).toBe(mockRefactored);
    });

    it('should return 400 for missing code', async () => {
      const response = await request(app)
        .post('/api/delema/v1/code/refactor')
        .send({ instruction: 'Refactor this' });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/delema/v1/docs', () => {
    it('should lookup docs successfully', async () => {
      const mockDocsResult = {
        title: 'React Reference: useState',
        content: 'useState is a React Hook...',
        url: 'https://react.dev/reference/react/useState',
        source: 'React Docs (Direct)'
      };
      const mockAnswer = 'useState allows you to add state to functional components.';

      (DocsScraper.prototype.search as any).mockResolvedValue(mockDocsResult);
      (aiHelper.tryGemini as any).mockResolvedValue(mockAnswer);

      const response = await request(app)
        .get('/api/delema/v1/docs')
        .query({ q: 'useState', framework: 'react' });

      expect(response.status).toBe(200);
      expect(response.body.answer).toBe(mockAnswer);
      expect(response.body.source).toBe(mockDocsResult.source);
      expect(response.body.url).toBe(mockDocsResult.url);
    });

    it('should return 400 for missing query', async () => {
      const response = await request(app)
        .get('/api/delema/v1/docs')
        .query({ framework: 'react' });

      expect(response.status).toBe(400);
    });
  });
});
