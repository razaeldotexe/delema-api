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
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Delema API Dashboard</title>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
      <style>
        :root {
          --primary: #4f46e5;
          --primary-hover: #4338ca;
          --bg: #f8fafc;
          --card-bg: #ffffff;
          --text: #1e293b;
          --text-light: #64748b;
          --border: #e2e8f0;
          --code-bg: #1e1e1e;
        }
        body { font-family: 'Inter', system-ui, sans-serif; background: var(--bg); color: var(--text); margin: 0; display: flex; height: 100vh; overflow: hidden; }
        
        /* Sidebar */
        .sidebar { width: 300px; background: var(--card-bg); border-right: 1px solid var(--border); overflow-y: auto; display: flex; flex-direction: column; }
        .sidebar-header { padding: 1.5rem; border-bottom: 1px solid var(--border); }
        .sidebar-header h1 { font-size: 1.25rem; margin: 0; color: var(--primary); display: flex; align-items: center; gap: 0.5rem; }
        .endpoint-group { padding: 1rem; }
        .group-title { font-size: 0.75rem; text-transform: uppercase; color: var(--text-light); font-weight: 700; letter-spacing: 0.05em; margin-bottom: 0.5rem; padding-left: 0.5rem; }
        .endpoint-item { padding: 0.75rem; border-radius: 6px; cursor: pointer; transition: 0.2s; display: flex; align-items: center; gap: 0.75rem; font-size: 0.9rem; color: var(--text); text-decoration: none; }
        .endpoint-item:hover { background: #f1f5f9; }
        .endpoint-item.active { background: #e0e7ff; color: var(--primary); font-weight: 600; }
        .method { font-size: 0.7rem; font-weight: 800; padding: 2px 6px; border-radius: 4px; width: 45px; text-align: center; }
        .method.post { background: #ecfdf5; color: #059669; }
        .method.get { background: #eff6ff; color: #2563eb; }

        /* Main Content */
        .main { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
        .playground { flex: 1; padding: 2rem; overflow-y: auto; display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; }
        
        /* Tester Form */
        .tester-section { display: flex; flex-direction: column; gap: 1.5rem; }
        .input-group { display: flex; flex-direction: column; gap: 0.5rem; }
        .input-group label { font-size: 0.875rem; font-weight: 600; color: var(--text-light); }
        input, select, textarea { padding: 0.75rem; border: 1px solid var(--border); border-radius: 8px; font-family: inherit; font-size: 1rem; background: white; }
        textarea { font-family: 'Fira Code', 'Courier New', monospace; resize: vertical; min-height: 200px; }
        button { background: var(--primary); color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 8px; font-weight: 600; cursor: pointer; transition: 0.2s; display: flex; align-items: center; justify-content: center; gap: 0.5rem; }
        button:hover { background: var(--primary-hover); }
        button:disabled { background: var(--text-light); cursor: not-allowed; }

        /* Response View */
        .response-section { display: flex; flex-direction: column; gap: 1rem; }
        .response-header { display: flex; justify-content: space-between; align-items: center; }
        .status-badge { padding: 4px 12px; border-radius: 20px; font-size: 0.8rem; font-weight: 700; display: none; }
        .status-success { background: #dcfce7; color: #166534; display: block; }
        .status-error { background: #fee2e2; color: #991b1b; display: block; }
        .response-body { background: var(--code-bg); color: #d4d4d4; padding: 1.5rem; border-radius: 12px; overflow: auto; font-family: 'Fira Code', monospace; font-size: 0.85rem; flex: 1; white-space: pre-wrap; box-shadow: inset 0 2px 10px rgba(0,0,0,0.2); }
        
        @media (max-width: 1000px) { .playground { grid-template-columns: 1fr; } .sidebar { width: 80px; } .sidebar span, .sidebar .group-title { display: none; } }
      </style>
    </head>
    <body>
      <div class="sidebar">
        <div class="sidebar-header">
          <h1><i class="fas fa-brain"></i> <span>Delema API</span></h1>
        </div>
        
        <div class="endpoint-group">
          <div class="group-title">Research & Logic</div>
          <div class="endpoint-item" onclick="setEndpoint('POST', '/research/arxiv', {query: 'artificial intelligence', limit: 3})">
            <span class="method post">POST</span> <span>/arxiv</span>
          </div>
          <div class="endpoint-item" onclick="setEndpoint('POST', '/research/wikipedia', {query: 'Node.js'})">
            <span class="method post">POST</span> <span>/wikipedia</span>
          </div>
          <div class="endpoint-item" onclick="setEndpoint('POST', '/recommendations/score', {items: [{id: 1, price: 100, rating: 4.5}, {id: 2, price: 50, rating: 4.0}], weights: {price: -0.5, rating: 2.0}})">
            <span class="method post">POST</span> <span>/recommendations</span>
          </div>
        </div>

        <div class="endpoint-group">
          <div class="group-title">AI & Search</div>
          <div class="endpoint-item" onclick="setEndpoint('POST', '/ai/search-products', {query: 'gaming mouse', limit: 3})">
            <span class="method post">POST</span> <span>/ai-products</span>
          </div>
          <div class="endpoint-item" onclick="setEndpoint('POST', '/apps/appstore', {query: 'discord', limit: 5})">
            <span class="method post">POST</span> <span>/appstore</span>
          </div>
          <div class="endpoint-item" onclick="setEndpoint('POST', '/gif/search', {query: 'happy cat'})">
            <span class="method post">POST</span> <span>/gif-search</span>
          </div>
        </div>

        <div class="endpoint-group">
          <div class="group-title">Utilities</div>
          <div class="endpoint-item" onclick="setEndpoint('GET', '/weather?city=Jakarta')">
            <span class="method get">GET</span> <span>/weather</span>
          </div>
          <div class="endpoint-item" onclick="setEndpoint('POST', '/routing/ab-test', {user_id: 'user_123', variants: [{name: 'v1', weight: 50}, {name: 'v2', weight: 50}]})">
            <span class="method post">POST</span> <span>/ab-test</span>
          </div>
        </div>
      </div>

      <div class="main">
        <div class="playground">
          <div class="tester-section">
            <h2 style="margin-top:0">API Playground</h2>
            
            <div class="input-group">
              <label>Target URL</label>
              <div style="display:flex; gap:0.5rem">
                <select id="method" style="width:100px">
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                </select>
                <input type="text" id="url" value="/api/v1/research/arxiv" style="flex:1">
              </div>
            </div>

            <div class="input-group" id="body-group">
              <label>JSON Request Body</label>
              <textarea id="body">{
  "query": "artificial intelligence",
  "limit": 3
}</textarea>
            </div>

            <button id="send-btn" onclick="sendRequest()">
              <i class="fas fa-paper-plane"></i> Send Request
            </button>
          </div>

          <div class="response-section">
            <div class="response-header">
              <h2 style="margin:0">Response</h2>
              <div id="status" class="status-badge">200 OK</div>
            </div>
            <div id="response" class="response-body">Click 'Send Request' to see results...</div>
          </div>
        </div>
      </div>

      <script>
        function setEndpoint(method, path, defaultBody) {
          document.getElementById('method').value = method;
          document.getElementById('url').value = '/api/v1' + path;
          
          const bodyGroup = document.getElementById('body-group');
          if (method === 'GET') {
            bodyGroup.style.display = 'none';
          } else {
            bodyGroup.style.display = 'flex';
            document.getElementById('body').value = JSON.stringify(defaultBody, null, 2);
          }

          // Update active state in sidebar
          document.querySelectorAll('.endpoint-item').forEach(el => {
            el.classList.remove('active');
            if (el.textContent.includes(path.split('/')[path.split('/').length - 1])) {
              el.classList.add('active');
            }
          });
        }

        async function sendRequest() {
          const method = document.getElementById('method').value;
          const url = document.getElementById('url').value;
          const bodyContent = document.getElementById('body').value;
          const responseEl = document.getElementById('response');
          const statusEl = document.getElementById('status');
          const btn = document.getElementById('send-btn');

          responseEl.textContent = 'Loading...';
          statusEl.className = 'status-badge';
          btn.disabled = true;

          try {
            const options = {
              method: method,
              headers: { 'Content-Type': 'application/json' }
            };

            if (method === 'POST') {
              options.body = bodyContent;
            }

            const start = Date.now();
            const res = await fetch(url, options);
            const duration = Date.now() - start;
            const data = await res.json();

            statusEl.textContent = res.status + ' ' + res.statusText + ' (' + duration + 'ms)';
            statusEl.classList.add(res.ok ? 'status-success' : 'status-error');
            responseEl.textContent = JSON.stringify(data, null, 2);
          } catch (err) {
            statusEl.textContent = 'Error';
            statusEl.classList.add('status-error');
            responseEl.textContent = 'Failed to connect: ' + err.message;
          } finally {
            btn.disabled = false;
          }
        }

        // Initialize with POST body visibility
        document.getElementById('method').addEventListener('change', (e) => {
          document.getElementById('body-group').style.display = e.target.value === 'POST' ? 'flex' : 'none';
        });
      </script>
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
