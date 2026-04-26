import { Router, Request, Response } from 'express';
import { WeatherRequestSchema } from '../types/schemas';
import { WeatherService } from '../services/weather.service';
import { validateRequest } from '../middleware/validate';

const router = Router();

/**
 * Get weather data from Open-Meteo.
 */
router.get('/', validateRequest(WeatherRequestSchema, 'query'), async (req: Request, res: Response) => {
  const query = req.query as any;
  const result = await WeatherService.getWeather(query);
  return res.json(result);
});

export default router;
