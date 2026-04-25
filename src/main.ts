import express from 'express';
import 'express-async-errors';
import dotenv from 'dotenv';
import { requestLogger, errorHandler } from './middleware/logger';
import { webhookLogger } from './utils/logger';

// Import Routers
import researchRouter from './routers/research';
import integrationsRouter from './routers/integrations';
import aiSearchRouter from './routers/ai_search';
import fdaRouter from './routers/fda';
import weatherRouter from './routers/weather';

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
app.use(`${apiPrefix}/research`, researchRouter);
app.use(`${apiPrefix}/integrations`, integrationsRouter);
app.use(`${apiPrefix}/ai`, aiSearchRouter);
app.use(`${apiPrefix}/fda`, fdaRouter);
app.use(`${apiPrefix}/weather`, weatherRouter);

// Root endpoint
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Delema API - Console V3</title>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
      <style>
        :root {
          --bg-main: #0d1117;
          --bg-card: #161b22;
          --bg-hover: #1c2128;
          --bg-input: #0d1117;
          --primary: #4f46e5; /* Indigo */
          --secondary: #3b82f6; /* Blue */
          --accent: #f59e0b; /* Yellow */
          --text-main: #d1d5db;
          --text-muted: #6b7280;
          --text-white: #ffffff;
          --border: #30363d;
        }

        body { 
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
          background: var(--bg-main); 
          color: var(--text-main); 
          margin: 0; 
          padding-bottom: 80px; 
          -webkit-font-smoothing: antialiased;
        }

        /* Header */
        header { 
          display: flex; 
          align-items: center; 
          justify-content: space-between; 
          padding: 1rem 1.5rem; 
          border-bottom: 1px solid var(--border); 
          background: var(--bg-main);
          position: sticky;
          top: 0;
          z-index: 100;
        }
        .logo-container { display: flex; align-items: center; gap: 0.75rem; }
        .logo-bar { width: 4px; height: 24px; background: var(--primary); border-radius: 2px; }
        .logo-text { font-weight: 700; font-size: 1.1rem; color: var(--text-white); letter-spacing: 0.05em; }

        /* Hero */
        .hero { text-align: center; padding: 3rem 1rem 2rem; }
        .hero h1 { font-size: 2.5rem; margin: 0; font-weight: 800; display: flex; align-items: center; justify-content: center; gap: 0.5rem; }
        .hero h1 .accent { color: var(--accent); }
        .hero .version { color: var(--text-muted); font-size: 1.25rem; font-weight: 400; margin-left: 0.5rem; }
        .hero p { color: var(--text-muted); font-size: 0.75rem; letter-spacing: 0.2em; margin-top: 1rem; text-transform: uppercase; }

        /* Search */
        .search-container { max-width: 800px; margin: 0 auto 2rem; padding: 0 1rem; }
        .search-box { 
          background: var(--bg-card); 
          border: 1px solid var(--border); 
          border-radius: 8px; 
          display: flex; 
          align-items: center; 
          padding: 0.75rem 1rem;
          transition: border-color 0.2s;
        }
        .search-box:focus-within { border-color: var(--primary); }
        .search-box i { color: var(--text-muted); margin-right: 0.75rem; }
        .search-box input { 
          background: transparent; 
          border: none; 
          color: var(--text-white); 
          width: 100%; 
          outline: none; 
          font-size: 0.9rem;
          letter-spacing: 0.05em;
        }

        /* Content */
        .content { max-width: 800px; margin: 0 auto; padding: 0 1rem; }
        .category-header { 
          display: flex; 
          align-items: center; 
          justify-content: space-between; 
          margin: 2rem 0 1rem; 
          border-left: 4px solid var(--primary); 
          padding-left: 0.75rem;
        }
        .category-header h2 { margin: 0; font-size: 1.1rem; color: var(--text-white); font-weight: 700; }
        .category-header span { color: var(--text-muted); font-size: 0.75rem; font-weight: 600; }

        /* Accordion Item */
        .endpoint-card { 
          background: var(--bg-card); 
          border: 1px solid var(--border); 
          border-radius: 8px; 
          margin-bottom: 0.5rem; 
          overflow: hidden;
        }
        .endpoint-trigger { 
          width: 100%; 
          padding: 1rem; 
          display: flex; 
          align-items: center; 
          justify-content: space-between; 
          background: none; 
          border: none; 
          cursor: pointer; 
          text-align: left;
          transition: background 0.2s;
        }
        .endpoint-trigger:hover { background: var(--bg-hover); }
        .endpoint-info { display: flex; align-items: center; gap: 0.75rem; }
        .method-badge { 
          padding: 0.2rem 0.6rem; 
          border-radius: 4px; 
          font-size: 0.7rem; 
          font-weight: 800; 
          background: rgba(59, 130, 246, 0.1); 
          color: var(--secondary); 
          border: 1px solid rgba(59, 130, 246, 0.2); 
        }
        .endpoint-path { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 0.85rem; color: var(--text-main); }
        .endpoint-name { color: var(--text-muted); font-size: 0.75rem; }

        /* Expanded Content */
        .endpoint-content { padding: 0 1rem 1rem; border-top: 1px solid var(--border); display: none; }
        .endpoint-content.active { display: block; }
        .endpoint-desc { color: var(--text-muted); font-size: 0.85rem; padding: 1rem 0; line-height: 1.5; }
        
        .form-label { display: block; color: var(--text-muted); font-size: 0.7rem; font-weight: 700; margin-bottom: 0.5rem; letter-spacing: 0.1em; }
        .input-field { 
          width: 100%; 
          background: var(--bg-input); 
          border: 1px solid var(--border); 
          border-radius: 6px; 
          padding: 0.75rem; 
          color: var(--text-main); 
          font-family: monospace; 
          font-size: 0.9rem; 
          box-sizing: border-box;
          outline: none;
          margin-bottom: 1rem;
        }
        .input-field:focus { border-color: var(--text-muted); }
        
        .execute-btn { 
          width: 100%; 
          background: var(--primary); 
          color: white; 
          border: none; 
          padding: 0.75rem; 
          border-radius: 6px; 
          font-weight: 700; 
          font-size: 0.85rem; 
          letter-spacing: 0.1em; 
          cursor: pointer; 
          transition: background 0.2s;
        }
        .execute-btn:hover { background: #a93226; }
        .execute-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        /* Response Viewer */
        .response-container { margin-top: 1.5rem; }
        .response-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; }
        .response-status { font-size: 0.75rem; font-weight: 700; }
        .status-success { color: #238636; }
        .status-error { color: var(--primary); }
        .response-body { 
          background: #010409; 
          color: #d1d5db; 
          padding: 1rem; 
          border-radius: 8px; 
          font-family: monospace; 
          font-size: 0.8rem; 
          max-height: 400px; 
          overflow: auto; 
          white-space: pre-wrap;
          border: 1px solid var(--border);
        }

        /* Bottom Nav */
        .bottom-nav { 
          position: fixed; 
          bottom: 0; 
          left: 0; 
          right: 0; 
          background: var(--bg-main); 
          border-top: 1px solid var(--border); 
          padding: 0.75rem 1rem; 
          display: flex; 
          justify-content: space-around; 
          max-width: 800px; 
          margin: 0 auto; 
          z-index: 100;
        }
        .nav-item { color: var(--text-muted); font-size: 1.2rem; cursor: pointer; transition: color 0.2s; }
        .nav-item:hover { color: var(--text-white); }
        .nav-item.active { color: var(--text-white); }

        @media (max-width: 640px) {
          .hero h1 { font-size: 1.8rem; }
          .endpoint-name { display: none; }
        }
      </style>
    </head>
    <body>
      <header>
        <div class="logo-container">
          <div class="logo-bar"></div>
          <span class="logo-text">DELEMA API</span>
        </div>
      </header>

      <div class="search-container" style="padding-top: 3rem;">
        <div class="search-box">
          <i class="fas fa-search"></i>
          <input type="text" id="endpoint-search" placeholder="FILTER ENDPOINTS..." onkeyup="filterEndpoints()">
        </div>
      </div>

      <main class="content" id="api-list">
        <!-- Categories will be injected here -->
      </main>

      <nav class="bottom-nav">
        <div class="nav-item active"><i class="fas fa-home"></i></div>
        <div class="nav-item"><i class="fas fa-bookmark"></i></div>
        <div class="nav-item"><i class="fas fa-search"></i></div>
        <div class="nav-item"><i class="fas fa-history"></i></div>
        <div class="nav-item"><i class="fas fa-user"></i></div>
      </nav>

      <script>
        const apiData = [
          {
            category: "Research",
            endpoints: [
              { path: "/research/arxiv", name: "ARXIV SEARCH", method: "POST", desc: "Cari publikasi ilmiah di ArXiv dengan ringkasan AI.", body: { query: "machine learning", limit: 5 } },
              { path: "/research/wikipedia", name: "WIKIPEDIA", method: "POST", desc: "Ambil ringkasan ensiklopedia dan sintesis AI.", body: { query: "Node.js" } }
            ]
          },
          {
            category: "AI Search",
            endpoints: [
              { path: "/ai/search", name: "AI SEARCH", method: "POST", desc: "Pencarian pintar berbasis AI untuk berbagai konten.", body: { query: "macbook air", limit: 3 } }
            ]
          },
          {
            category: "Developer Integrations",
            endpoints: [
              { path: "/integrations/github", name: "GITHUB SEARCH", method: "POST", desc: "Cari aplikasi dan repository di GitHub.", body: { query: "browser", limit: 5 } },
              { path: "/integrations/github/scan", name: "REPO SCANNER", method: "POST", desc: "Scan file markdown di repository GitHub.", body: { owner: "razaeldotexe", repo: "delema-api", path: "" } },
              { path: "/integrations/github/content", name: "REPO CONTENT", method: "POST", desc: "Ambil isi file dari repository GitHub.", body: { owner: "razaeldotexe", repo: "delema-api", path: "README.md" } }
            ]
          },
          {
            category: "Utilities",
            endpoints: [
              { path: "/weather", name: "WEATHER", method: "GET", desc: "Dapatkan data cuaca real-time.", body: null, queryParams: "city=Jakarta" }
            ]
          }
        ];

        function renderEndpoints() {
          const container = document.getElementById('api-list');
          container.innerHTML = apiData.map(cat => \`
            <div class="category-block">
              <div class="category-header">
                <h2>\${cat.category}</h2>
                <span>\${cat.endpoints.length} ENDPOINTS</span>
              </div>
              <div class="endpoints-group">
                \${cat.endpoints.map(ep => \`
                  <div class="endpoint-card" data-search="\${ep.path} \${ep.name}">
                    <button class="endpoint-trigger" onclick="toggleAccordion(this)">
                      <div class="endpoint-info">
                        <span class="method-badge">\${ep.method}</span>
                        <span class="endpoint-path">\${ep.path}</span>
                        <span class="endpoint-name">\${ep.name}</span>
                      </div>
                      <i class="fas fa-chevron-down text-muted"></i>
                    </button>
                    <div class="endpoint-content">
                      <p class="endpoint-desc">\${ep.desc}</p>
                      <span class="form-label">REQUEST \${ep.method === 'GET' ? 'PARAMS' : 'BODY'}</span>
                      <textarea id="input-\${ep.path}" class="input-field" rows="6">\${
                        ep.method === 'GET' ? ep.queryParams : JSON.stringify(ep.body, null, 2)
                      }</textarea>
                      <button class="execute-btn" onclick="executeRequest('\${ep.method}', '\${ep.path}')">
                        EXECUTE REQUEST
                      </button>
                      <div id="res-container-\${ep.path}" class="response-container" style="display:none">
                        <div class="response-header">
                          <span class="form-label">RESPONSE</span>
                          <span id="status-\${ep.path}" class="response-status"></span>
                        </div>
                        <div id="body-\${ep.path}" class="response-body"></div>
                      </div>
                    </div>
                  </div>
                \`).join('')}
              </div>
            </div>
          \`).join('');
        }

        function toggleAccordion(btn) {
          const card = btn.parentElement;
          const content = card.querySelector('.endpoint-content');
          const icon = btn.querySelector('.fa-chevron-down');
          
          const isActive = content.classList.contains('active');
          
          // Close all others
          document.querySelectorAll('.endpoint-content').forEach(el => el.classList.remove('active'));
          document.querySelectorAll('.fa-chevron-down').forEach(el => el.style.transform = 'rotate(0deg)');
          
          if (!isActive) {
            content.classList.add('active');
            icon.style.transform = 'rotate(180deg)';
          }
        }

        function filterEndpoints() {
          const q = document.getElementById('endpoint-search').value.toLowerCase();
          document.querySelectorAll('.endpoint-card').forEach(card => {
            const text = card.getAttribute('data-search').toLowerCase();
            card.style.display = text.includes(q) ? 'block' : 'none';
          });
          // Hide empty categories
          document.querySelectorAll('.category-block').forEach(cat => {
            const hasVisible = Array.from(cat.querySelectorAll('.endpoint-card')).some(c => c.style.display !== 'none');
            cat.style.display = hasVisible ? 'block' : 'none';
          });
        }

        async function executeRequest(method, path) {
          const input = document.getElementById('input-' + path).value;
          const resContainer = document.getElementById('res-container-' + path);
          const resBody = document.getElementById('body-' + path);
          const resStatus = document.getElementById('status-' + path);
          
          resContainer.style.display = 'block';
          resBody.textContent = 'Loading...';
          
          try {
            let url = '/api/v1' + path;
            const options = { method, headers: { 'Content-Type': 'application/json' } };
            
            if (method === 'GET') {
              url += '?' + input;
            } else {
              options.body = input;
            }

            const start = Date.now();
            const res = await fetch(url, options);
            const duration = Date.now() - start;
            const data = await res.json();
            
            resStatus.textContent = \`\${res.status} \${res.statusText} (\${duration}ms)\`;
            resStatus.className = 'response-status ' + (res.ok ? 'status-success' : 'status-error');
            resBody.textContent = JSON.stringify(data, null, 2);
          } catch (err) {
            resStatus.textContent = 'ERROR';
            resStatus.className = 'response-status status-error';
            resBody.textContent = 'Connection failed: ' + err.message;
          }
        }

        renderEndpoints();
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
