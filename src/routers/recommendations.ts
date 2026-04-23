import express, { Router } from 'express';
import { ScoreRequestSchema } from '../types/schemas';
import { webhookLogger } from '../utils/logger';

const router: Router = express.Router();

/**
 * Calculate scores for a list of items based on provided weights.
 */
router.post('/score', (req, res) => {
  try {
    const data = ScoreRequestSchema.parse(req.body);

    if (!data.items || data.items.length === 0) {
      return res.json({ scored_items: [] });
    }

    const scoredItems = data.items.map((item) => {
      let score = 0.0;
      for (const [key, weight] of Object.entries(data.weights)) {
        const val = item[key];
        if (typeof val === 'number') {
          score += val * weight;
        } else if (typeof val === 'boolean') {
          score += (val ? 1.0 : 0.0) * weight;
        }
      }

      return {
        ...item,
        _score: Number(score.toFixed(4)),
      };
    });

    // Sort by score descending
    scoredItems.sort((a, b) => b._score - a._score);

    webhookLogger.log(`Calculated scores for ${scoredItems.length} items`);
    res.json({ scored_items: scoredItems });
  } catch (error: any) {
    webhookLogger.log(`Error calculating scores: ${error.message}`, 'ERROR');
    res.status(400).json({ detail: error.errors || error.message });
  }
});

export default router;
