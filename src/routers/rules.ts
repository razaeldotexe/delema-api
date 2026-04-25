import express, { Router } from 'express';
import { DecisionTreeRequestSchema } from '../types/schemas';
import { traverseTree } from '../logic/rules_engine';
import { webhookLogger } from '../utils/logger';

const router: Router = express.Router();

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
