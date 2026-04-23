import express from 'express';
import 'express-async-errors';
import dotenv from 'dotenv';
import { requestLogger, errorHandler } from './middleware/logger';
import { webhookLogger } from './utils/logger';

// Import Routers
import recommendationsRouter from './routers/recommendations';
import rulesRouter from './routers/rules';
import routingRouter from './routers/routing';
import researchRouter from './routers/research';
import githubRouter from './routers/github';
import aiSearchRouter from './routers/ai_search';
import appSearchRouter from './routers/app_search';
import fdaRouter from './routers/fda';
import weatherRouter from './routers/weather';
import outfitRouter from './routers/outfit';

dotenv.config();

const app = express();
const port = process.env.PORT || 8000;

// Basic CORS Middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', '*');
  res.header('Access-Control-Allow-Headers', '*');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json());
app.use(requestLogger);

// Startup log
webhookLogger.log('Delema API (Node.js) is starting up...', 'SYSTEM');

// Routes
const apiPrefix = '/api/v1';
app.use(`${apiPrefix}/recommendations`, recommendationsRouter);
app.use(`${apiPrefix}/rules`, rulesRouter);
app.use(`${apiPrefix}/routing`, routingRouter);
app.use(`${apiPrefix}/research`, researchRouter);
app.use(`${apiPrefix}/github`, githubRouter);
app.use(`${apiPrefix}/ai`, aiSearchRouter);
app.use(`${apiPrefix}/apps`, appSearchRouter);
app.use(`${apiPrefix}/fda`, fdaRouter);
app.use(`${apiPrefix}/weather`, weatherRouter);
app.use(`${apiPrefix}/outfit`, outfitRouter);

// Root endpoint
app.get('/', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>Delema API</title>
        <style>
          body { font-family: sans-serif; line-height: 1.6; padding: 2rem; max-width: 800px; margin: 0 auto; background: #f4f4f9; }
          h1 { color: #333; }
          .card { background: white; padding: 1.5rem; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          code { background: #eee; padding: 0.2rem 0.4rem; border-radius: 4px; }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>Delema API (Node.js)</h1>
          <p>Decision-Support API for Complex Logic, Recommendations, and Automated Choices</p>
          <p>Version: <code>3.0.0</code></p>
          <p>Status: <strong>Online</strong></p>
          <hr>
          <p>Available endpoints under <code>/api/v1</code>:</p>
          <ul>
            <li><code>/recommendations</code> - Weighted scoring</li>
            <li><code>/rules</code> - Logic evaluation</li>
            <li><code>/routing</code> - A/B testing</li>
            <li><code>/research</code> - ArXiv & Wikipedia</li>
            <li><code>/github</code> - Repo scanning</li>
            <li><code>/ai</code> - Hybrid product search</li>
            <li><code>/apps</code> - App store search</li>
            <li><code>/fda</code> - OpenFDA search</li>
            <li><code>/weather</code> - Open-Meteo weather</li>
            <li><code>/outfit</code> - AI Outfit Rating (Vision)</li>
          </ul>
        </div>
      </body>
    </html>
  `);
});

// Error Handler
app.use(errorHandler);

if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
}

export default app;
