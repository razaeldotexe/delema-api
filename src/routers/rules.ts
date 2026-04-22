import express, { Router } from 'express';
import { EvaluateRequestSchema, DecisionTreeRequestSchema } from '../types/schemas';
import { evaluateGroup, traverseTree } from '../logic/rules_engine';
import { webhookLogger } from '../utils/logger';

const router: Router = express.Router();

/**
 * Evaluate a set of rules against provided facts.
 */
router.post('/evaluate', (req, res) => {
  try {
    const data = EvaluateRequestSchema.parse(req.body);
    const matched = evaluateGroup(data.ruleset, data.facts);
    webhookLogger.log(`Evaluated ruleset: matched=${matched}`);
    res.json({ matched });
  } catch (error: any) {
    webhookLogger.log(`Error evaluating rules: ${error.message}`, 'ERROR');
    res.status(400).json({ detail: error.errors || error.message });
  }
});

/**
 * Evaluate a decision tree against provided facts.
 */
router.post('/decision-tree', (req, res) => {
  try {
    const data = DecisionTreeRequestSchema.parse(req.body);
    const result = traverseTree(data.tree, data.facts);
    webhookLogger.log(`Evaluated decision tree: result=${JSON.stringify(result)}`);
    res.json({ result });
  } catch (error: any) {
    webhookLogger.log(`Error evaluating decision tree: ${error.message}`, 'ERROR');
    res.status(400).json({ detail: error.errors || error.message });
  }
});

export default router;
