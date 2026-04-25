import { Router } from 'express';
import {
  CodeExplainSchema,
  CodeDebugSchema,
  CodeGenerateSchema,
  CodeRefactorSchema,
} from '../types/schemas';
import { tryAllProviders } from '../utils/ai_helper';

const router = Router();

/**
 * POST /explain
 * Explains the provided code snippet.
 */
router.post('/explain', async (req, res) => {
  const { code, language, context, lang } = CodeExplainSchema.parse(req.body);
  const languageInstruction = lang ? `Response language: ${lang}.` : 'Response language: English.';
  const prompt = `Explain the following ${language || ''} code in a clear and concise way. ${
    context ? `Additional Context: ${context}` : ''
  } ${languageInstruction}\n\nCode:\n\`\`\`\n${code}\n\`\`\``;

  const explanation = await tryAllProviders(prompt);
  res.json({ explanation });
});

/**
 * POST /debug
 * Analyzes code for bugs and suggests fixes.
 */
router.post('/debug', async (req, res) => {
  const { code, error, language, lang } = CodeDebugSchema.parse(req.body);
  const languageInstruction = lang ? `Response language: ${lang}.` : 'Response language: English.';
  const prompt = `Identify and fix the bug in the following ${language || ''} code. ${
    error ? `Reported Error: ${error}` : ''
  } ${languageInstruction}\n\nCode:\n\`\`\`\n${code}\n\`\`\``;

  const fix = await tryAllProviders(prompt);
  res.json({ fix });
});

/**
 * POST /generate
 * Generates code based on a natural language prompt.
 */
router.post('/generate', async (req, res) => {
  const { prompt: userPrompt, language, framework, lang } = CodeGenerateSchema.parse(req.body);
  const languageInstruction = lang ? `Brief explanation language: ${lang}.` : 'Brief explanation language: English.';
  const prompt = `Generate ${language} code ${
    framework ? `using the ${framework} framework` : ''
  } for the following requirement:\n${userPrompt}\n\nProvide only the code block and a brief explanation. ${languageInstruction}`;

  const code = await tryAllProviders(prompt);
  res.json({ code });
});

/**
 * POST /refactor
 * Refactors code for better quality, performance, or readability.
 */
router.post('/refactor', async (req, res) => {
  const { code, instruction, language, lang } = CodeRefactorSchema.parse(req.body);
  const languageInstruction = lang ? `Response language: ${lang}.` : 'Response language: English.';
  const prompt = `Refactor the following ${language || ''} code. ${
    instruction
      ? `Specific Instruction: ${instruction}`
      : 'Focus on improving readability and performance.'
  } ${languageInstruction}\n\nCode:\n\`\`\`\n${code}\n\`\`\``;

  const refactoredCode = await tryAllProviders(prompt);
  res.json({ refactoredCode });
});

export default router;
