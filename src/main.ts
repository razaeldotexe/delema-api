import express from 'express';
import 'express-async-errors';
import dotenv from 'dotenv';
import { requestLogger, errorHandler } from './middleware/logger';
import { webhookLogger } from './utils/logger';
import { rateLimiter } from './middleware/rateLimiter';

// Import Routers
import researchRouter from './routers/research';
import aiSearchRouter from './routers/ai_search';
import fdaRouter from './routers/fda';
import weatherRouter from './routers/weather';
import codeRouter from './routers/code';
import docsRouter from './routers/docs';

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

// Global Rate Limiter: 100 requests per 15 minutes
const apiLimiter = rateLimiter(15 * 60 * 1000, 100);
app.use('/api/', apiLimiter);

// Stricter Rate Limiter for AI and Research: 20 requests per 15 minutes
const expensiveLimiter = rateLimiter(15 * 60 * 1000, 20);
app.use('/api/delema/v1/research', expensiveLimiter);
app.use('/api/delema/v1/ai', expensiveLimiter);

// Startup log
webhookLogger.system('Delema API (Node.js) is starting up...');

// Routes
const apiPrefix = '/api/delema/v1';
app.use(`${apiPrefix}/research`, researchRouter);
app.use(`${apiPrefix}/ai`, aiSearchRouter);
app.use(`${apiPrefix}/fda`, fdaRouter);
app.use(`${apiPrefix}/weather`, weatherRouter);
app.use(`${apiPrefix}/code`, codeRouter);
app.use(`${apiPrefix}/docs`, docsRouter);

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
          --success: #238636;
          --error: #f85149;
          --text-main: #d1d5db;
          --text-muted: #6b7280;
          --text-white: #ffffff;
          --border: #30363d;
          --radius: 12px;
        }

        body { 
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
          background: var(--bg-main); 
          color: var(--text-main); 
          margin: 0; 
          -webkit-font-smoothing: antialiased;
        }

        /* Header */
        header { 
          display: flex; 
          align-items: center; 
          justify-content: space-between; 
          padding: 1rem 2rem; 
          border-bottom: 1px solid var(--border); 
          background: rgba(13, 17, 23, 0.8);
          backdrop-filter: blur(12px);
          position: sticky;
          top: 0;
          z-index: 100;
        }
        .logo-container { display: flex; align-items: center; gap: 0.75rem; }
        .logo-bar { width: 4px; height: 24px; background: var(--primary); border-radius: 2px; box-shadow: 0 0 10px var(--primary); }
        .logo-text { font-weight: 800; font-size: 1.2rem; color: var(--text-white); letter-spacing: 0.05em; }

        .header-status { display: flex; gap: 1rem; align-items: center; }
        .status-badge { 
          background: rgba(35, 134, 54, 0.1); 
          color: var(--success); 
          border: 1px solid rgba(35, 134, 54, 0.3);
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          font-size: 0.7rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 0.4rem;
        }
        .status-dot { width: 6px; height: 6px; background: var(--success); border-radius: 50%; box-shadow: 0 0 5px var(--success); }

        /* Hero */
        .hero { text-align: center; padding: 4rem 1rem 3rem; background: radial-gradient(circle at top, rgba(79, 70, 229, 0.1) 0%, transparent 70%); }
        .hero h1 { font-size: 3rem; margin: 0; font-weight: 900; letter-spacing: -0.02em; color: var(--text-white); }
        .hero h1 .accent { color: var(--primary); }
        .hero p { color: var(--text-muted); font-size: 0.85rem; letter-spacing: 0.15em; margin-top: 1rem; text-transform: uppercase; font-weight: 600; }

        /* Stats Bar */
        .stats-bar { 
          max-width: 800px; 
          margin: 0 auto 2rem; 
          display: grid; 
          grid-template-columns: repeat(3, 1fr); 
          gap: 1rem; 
          padding: 0 1rem;
        }
        .stat-card {
          background: var(--bg-card);
          border: 1px solid var(--border);
          padding: 1rem;
          border-radius: var(--radius);
          text-align: center;
        }
        .stat-value { display: block; font-size: 1.25rem; font-weight: 800; color: var(--text-white); }
        .stat-label { font-size: 0.65rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.1em; margin-top: 0.25rem; }

        /* Search */
        .search-container { max-width: 800px; margin: 0 auto 2rem; padding: 0 1rem; }
        .search-box { 
          background: var(--bg-card); 
          border: 1px solid var(--border); 
          border-radius: var(--radius); 
          display: flex; 
          align-items: center; 
          padding: 1rem 1.25rem;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        .search-box:focus-within { border-color: var(--primary); box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.2); transform: translateY(-2px); }
        .search-box i { color: var(--text-muted); margin-right: 1rem; font-size: 1.1rem; }
        .search-box input { 
          background: transparent; 
          border: none; 
          color: var(--text-white); 
          width: 100%; 
          outline: none; 
          font-size: 1rem;
          font-weight: 500;
        }

        /* Content */
        .content { max-width: 800px; margin: 0 auto 4rem; padding: 0 1rem; }
        .category-header { 
          display: flex; 
          align-items: center; 
          justify-content: space-between; 
          margin: 3rem 0 1.25rem; 
          padding-bottom: 0.5rem;
          border-bottom: 1px solid var(--border);
        }
        .category-header h2 { margin: 0; font-size: 1.25rem; color: var(--text-white); font-weight: 800; display: flex; align-items: center; gap: 0.75rem; }
        .category-header h2 i { color: var(--primary); font-size: 1rem; }
        .category-header span { 
          background: var(--bg-hover);
          color: var(--text-muted); 
          font-size: 0.65rem; 
          font-weight: 800; 
          padding: 0.2rem 0.6rem;
          border-radius: 6px;
          letter-spacing: 0.05em;
        }

        /* Accordion Item */
        .endpoint-card { 
          background: var(--bg-card); 
          border: 1px solid var(--border); 
          border-radius: var(--radius); 
          margin-bottom: 0.75rem; 
          overflow: hidden;
          transition: border-color 0.2s;
        }
        .endpoint-card:hover { border-color: #40464d; }
        .endpoint-trigger { 
          width: 100%; 
          padding: 1.25rem; 
          display: flex; 
          align-items: center; 
          justify-content: space-between; 
          background: none; 
          border: none; 
          cursor: pointer; 
          text-align: left;
        }
        .endpoint-info { display: flex; align-items: center; gap: 1rem; }
        .method-badge { 
          padding: 0.3rem 0.8rem; 
          border-radius: 8px; 
          font-size: 0.75rem; 
          font-weight: 900; 
          background: rgba(79, 70, 229, 0.1); 
          color: var(--primary); 
          border: 1px solid rgba(79, 70, 229, 0.2); 
        }
        .method-badge.get { color: #2ea043; background: rgba(46, 160, 67, 0.1); border-color: rgba(46, 160, 67, 0.2); }
        .endpoint-path { font-family: 'JetBrains Mono', 'Fira Code', monospace; font-size: 0.9rem; color: var(--text-main); font-weight: 600; }
        .endpoint-name { color: var(--text-muted); font-size: 0.8rem; font-weight: 500; }

        .chevron { transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1); color: var(--text-muted); }
        .endpoint-card.active .chevron { transform: rotate(180deg); color: var(--text-white); }

        /* Expanded Content */
        .endpoint-content { 
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.3s ease-out;
          background: rgba(13, 17, 23, 0.3);
        }
        .endpoint-card.active .endpoint-content { max-height: 2000px; transition: max-height 0.5s ease-in; }
        .endpoint-inner { padding: 0 1.25rem 1.5rem; border-top: 1px solid var(--border); }
        .endpoint-desc { color: var(--text-main); font-size: 0.95rem; padding: 1.25rem 0; line-height: 1.6; }
        
        .form-label { display: block; color: var(--text-muted); font-size: 0.7rem; font-weight: 800; margin-bottom: 0.75rem; letter-spacing: 0.1em; text-transform: uppercase; }
        .input-field { 
          width: 100%; 
          background: var(--bg-input); 
          border: 1px solid var(--border); 
          border-radius: 8px; 
          padding: 1rem; 
          color: #a5d6ff; 
          font-family: 'JetBrains Mono', monospace; 
          font-size: 0.9rem; 
          box-sizing: border-box;
          outline: none;
          margin-bottom: 1.25rem;
          line-height: 1.5;
        }
        .input-field:focus { border-color: var(--primary); }
        
        .execute-btn { 
          width: 100%; 
          background: var(--primary); 
          color: white; 
          border: none; 
          padding: 1rem; 
          border-radius: 8px; 
          font-weight: 800; 
          font-size: 0.9rem; 
          letter-spacing: 0.05em; 
          cursor: pointer; 
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }
        .execute-btn:hover { background: #4338ca; transform: translateY(-1px); }
        .execute-btn:active { transform: translateY(0); }
        .execute-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        /* Response Viewer */
        .response-container { margin-top: 2rem; animation: fadeIn 0.3s ease; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        
        .response-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; }
        .response-status { font-size: 0.8rem; font-weight: 800; padding: 0.2rem 0.6rem; border-radius: 6px; }
        .status-success { background: rgba(35, 134, 54, 0.1); color: var(--success); }
        .status-error { background: rgba(248, 81, 73, 0.1); color: var(--error); }
        
        .response-body { 
          background: #010409; 
          color: #e6edf3; 
          padding: 1.25rem; 
          border-radius: 8px; 
          font-family: 'JetBrains Mono', monospace; 
          font-size: 0.85rem; 
          max-height: 500px; 
          overflow: auto; 
          white-space: pre-wrap;
          border: 1px solid var(--border);
          line-height: 1.5;
        }

        /* Custom Scrollbar */
        ::-webkit-scrollbar { width: 10px; height: 10px; }
        ::-webkit-scrollbar-track { background: var(--bg-main); }
        ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 5px; }
        ::-webkit-scrollbar-thumb:hover { background: var(--text-muted); }

        @media (max-width: 640px) {
          .hero h1 { font-size: 2.2rem; }
          .endpoint-name { display: none; }
          .stats-bar { grid-template-columns: 1fr; }
        }
      </style>
    </head>
    <body>
      <header>
        <div class="logo-container">
          <div class="logo-bar"></div>
          <span class="logo-text">DELEMA API</span>
        </div>
        <div class="header-status">
          <div class="status-badge" title="Requests remaining in current window">
             <i class="fas fa-bolt"></i> <span id="rate-limit-info">STABLE</span>
          </div>
          <div class="status-badge">
            <div class="status-dot"></div> ONLINE
          </div>
        </div>
      </header>

      <div class="hero">
        <h1>THE <span class="accent">INTELLIGENT</span> ENGINE</h1>
        <p>Decision Support & Research Infrastructure</p>
      </div>

      <div class="stats-bar">
        <div class="stat-card">
          <span class="stat-value">6+</span>
          <span class="stat-label">Routers</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">15+</span>
          <span class="stat-label">Endpoints</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">v1.2.0</span>
          <span class="stat-label">Version</span>
        </div>
      </div>

      <div class="search-container">
        <div class="search-box">
          <i class="fas fa-search"></i>
          <input type="text" id="endpoint-search" placeholder="Filter endpoints by name or path..." onkeyup="filterEndpoints()">
        </div>
      </div>

      <main class="content" id="api-list">
        <!-- Categories will be injected here -->
      </main>

      <script>
        const apiData = [
          {
            category: "Research",
            icon: "fa-microscope",
            endpoints: [
              { path: "/research/arxiv", name: "ARXIV SEARCH", method: "POST", desc: "Cari publikasi ilmiah di ArXiv dengan ringkasan AI.", body: { query: "machine learning", limit: 5 } },
              { path: "/research/wikipedia", name: "WIKIPEDIA", method: "POST", desc: "Ambil ringkasan ensiklopedia dan sintesis AI.", body: { query: "Node.js" } },
              { path: "/research/nerdfont", name: "NERD FONTS", method: "POST", desc: "Cari dan unduh Nerd Fonts.", body: { query: "JetBrains" } }
            ]
          },
          {
            category: "AI Search",
            icon: "fa-brain",
            endpoints: [
              { path: "/ai/search", name: "AI SEARCH", method: "POST", desc: "Pencarian pintar berbasis AI untuk berbagai konten.", body: { query: "macbook air", limit: 3 } }
            ]
          },
          {
            category: "Health & Safety",
            icon: "fa-shield-heart",
            endpoints: [
              { path: "/fda/search", name: "FDA SEARCH", method: "POST", desc: "Cari data obat, makanan, atau peralatan medis dari OpenFDA.", body: { query: "tylenol", category: "drug", limit: 5 } }
            ]
          },
          {
            category: "Utilities",
            icon: "fa-tools",
            endpoints: [
              { path: "/weather", name: "WEATHER", method: "GET", desc: "Dapatkan data cuaca real-time.", body: null, queryParams: "city=Jakarta" }
            ]
          },
          {
            category: "Developer Suite",
            icon: "fa-code",
            endpoints: [
              { path: "/code/explain", name: "CODE EXPLAIN", method: "POST", desc: "Jelaskan potongan kode dengan AI.", body: { code: "console.log('hello')", language: "javascript" } },
              { path: "/code/debug", name: "CODE DEBUG", method: "POST", desc: "Cari dan perbaiki bug dalam kode.", body: { code: "function add(a, b) { return a - b }", error: "Should add instead of subtract", language: "javascript" } },
              { path: "/code/generate", name: "CODE GENERATE", method: "POST", desc: "Generate kode berdasarkan prompt.", body: { prompt: "Create a simple express server", language: "typescript", framework: "express" } },
              { path: "/code/refactor", name: "CODE REFACTOR", method: "POST", desc: "Refactor kode untuk kualitas lebih baik.", body: { code: "var x = 10; if(x == 10) { console.log(x) }", instruction: "Use modern syntax", language: "javascript" } },
              { path: "/docs", name: "DOCS SEARCH", method: "GET", desc: "Cari dokumentasi dan sintesis jawaban AI.", body: null, queryParams: "q=useEffect&framework=react" }
            ]
          }
        ];

        function renderEndpoints() {
          const container = document.getElementById('api-list');
          container.innerHTML = apiData.map(cat => \`
            <div class="category-block">
              <div class="category-header">
                <h2><i class="fas \${cat.icon}"></i> \${cat.category}</h2>
                <span>\${cat.endpoints.length} ENDPOINTS</span>
              </div>
              <div class="endpoints-group">
                \${cat.endpoints.map(ep => \`
                  <div class="endpoint-card" data-search="\${ep.path} \${ep.name}">
                    <button class="endpoint-trigger" onclick="toggleAccordion(this)">
                      <div class="endpoint-info">
                        <span class="method-badge \${ep.method.toLowerCase()}">\${ep.method}</span>
                        <span class="endpoint-path">\${ep.path}</span>
                        <span class="endpoint-name">\${ep.name}</span>
                      </div>
                      <i class="fas fa-chevron-down chevron"></i>
                    </button>
                    <div class="endpoint-content">
                      <div class="endpoint-inner">
                        <p class="endpoint-desc">\${ep.desc}</p>
                        <span class="form-label">REQUEST \${ep.method === 'GET' ? 'PARAMS' : 'BODY'}</span>
                        <textarea id="input-\${ep.path}" class="input-field" rows="6" spellcheck="false">\${
                          ep.method === 'GET' ? ep.queryParams : JSON.stringify(ep.body, null, 2)
                        }</textarea>
                        <button class="execute-btn" onclick="executeRequest('\${ep.method}', '\${ep.path}')">
                          <i class="fas fa-play"></i> EXECUTE REQUEST
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
                  </div>
                \`).join('')}
              </div>
            </div>
          \`).join('');
        }

        function toggleAccordion(btn) {
          const card = btn.parentElement;
          const isActive = card.classList.contains('active');
          
          // Close all others
          document.querySelectorAll('.endpoint-card').forEach(el => el.classList.remove('active'));
          
          if (!isActive) {
            card.classList.add('active');
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
            let url = '/api/delema/v1' + path;
            const options = { method, headers: { 'Content-Type': 'application/json' } };
            
            if (method === 'GET') {
              url += '?' + input;
            } else {
              options.body = input;
            }

            const start = Date.now();
            const res = await fetch(url, options);
            const duration = Date.now() - start;
            
            // Try to parse rate limit headers if present
            const limit = res.headers.get('X-RateLimit-Limit');
            const remaining = res.headers.get('X-RateLimit-Remaining');
            if (remaining) {
              document.getElementById('rate-limit-info').textContent = remaining + ' REQS LEFT';
            }

            const data = await res.json();
            
            resStatus.textContent = \`\${res.status} \${res.statusText} (\${duration}ms)\`;
            resStatus.className = 'response-status ' + (res.ok ? 'status-success' : 'status-error');

            let bodyHtml = '';
            if (data.ai_summary) {
              bodyHtml += \`<div style="background: rgba(79, 70, 229, 0.1); border-left: 4px solid var(--primary); padding: 1rem; margin-bottom: 1.5rem; border-radius: 4px; color: var(--text-white); font-style: italic;">\${data.ai_summary}</div>\`;
            }
            bodyHtml += JSON.stringify(data, null, 2);
            
            resBody.innerHTML = bodyHtml;
          } catch (err) {
            resStatus.textContent = 'CONNECTION ERROR';
            resStatus.className = 'response-status status-error';
            resBody.textContent = 'Failed to connect to the server: ' + err.message;
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
