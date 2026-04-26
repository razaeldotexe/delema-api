import { Router } from 'express';
import {
  CodeExplainSchema,
  CodeDebugSchema,
  CodeGenerateSchema,
  CodeRefactorSchema,
} from '../types/schemas';
import { DeveloperService } from '../services/developer.service';
import { validateRequest } from '../middleware/validate';

const router = Router();

/**
 * POST /explain
 * Explains the provided code snippet.
 */
router.post('/explain', validateRequest(CodeExplainSchema), async (req, res) => {
  const { code, language, context, lang } = req.body;
  const result = await DeveloperService.explainCode(code, language, context, lang);
  res.json(result);
});

/**
 * POST /debug
 * Analyzes code for bugs and suggests fixes.
 */
router.post('/debug', validateRequest(CodeDebugSchema), async (req, res) => {
  const { code, error, language, lang } = req.body;
  const result = await DeveloperService.debugCode(code, error, language, lang);
  res.json(result);
});

/**
 * POST /generate
 * Generates code based on a natural language prompt.
 */
router.post('/generate', validateRequest(CodeGenerateSchema), async (req, res) => {
  const { prompt, language, framework, lang } = req.body;
  const result = await DeveloperService.generateCode(prompt, language, framework, lang);
  res.json(result);
});

/**
 * POST /refactor
 * Refactors code for better quality, performance, or readability.
 */
router.post('/refactor', validateRequest(CodeRefactorSchema), async (req, res) => {
  const { code, instruction, language, lang } = req.body;
  const result = await DeveloperService.refactorCode(code, instruction, language, lang);
  res.json(result);
});

export default router;
