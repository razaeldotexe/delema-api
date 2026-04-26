import express from 'express';
import 'express-async-errors';
import dotenv from 'dotenv';
import { requestLogger, errorHandler } from './middleware/logger';
import { webhookLogger } from './utils/logger';
import { rateLimiter } from './middleware/rateLimiter';
import { initDB } from './utils/db';

// Import Routers
import researchRouter from './routers/research';
import aiSearchRouter from './routers/ai_search';
import aiSearchAlphaRouter from './routers/ai_search_alpha';
import fdaRouter from './routers/fda';
import weatherRouter from './routers/weather';
import codeRouter from './routers/code';
import docsRouter from './routers/docs';
import toolsRouter from './routers/tools';

dotenv.config();

const app = express();
const port = process.env.PORT || 8000;

// Initialize AI Memory
initDB();

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
app.use(`${apiPrefix}/ai/alpha`, aiSearchAlphaRouter);
app.use(`${apiPrefix}/fda`, fdaRouter);
app.use(`${apiPrefix}/weather`, weatherRouter);
app.use(`${apiPrefix}/code`, codeRouter);
app.use(`${apiPrefix}/docs`, docsRouter);
app.use(`${apiPrefix}/tools`, toolsRouter);

const commonHead = `
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Fira+Code:wght@400;500;600&display=swap" rel="stylesheet">
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.8.0/styles/github-dark.min.css">
      <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.8.0/highlight.min.js"></script>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.8.0/languages/json.min.js"></script>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.8.0/languages/javascript.min.js"></script>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.8.0/languages/typescript.min.js"></script>
      <style>
        :root {
          --bg-main: #0d1117;
          --bg-card: #161b22;
          --bg-hover: #1c2128;
          --bg-input: #0d1117;
          --primary: #4f46e5;
          --primary-hover: #4338ca;
          --secondary: #3b82f6;
          --accent: #f59e0b;
          --success: #238636;
          --error: #f85149;
          --text-main: #d1d5db;
          --text-muted: #6b7280;
          --text-white: #ffffff;
          --border: #30363d;
          --radius: 12px;
          --font-main: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
          --font-mono: 'Fira Code', 'JetBrains Mono', monospace;
        }
        * { box-sizing: border-box; }
        body { font-family: var(--font-main); background: var(--bg-main); color: var(--text-main); margin: 0; -webkit-font-smoothing: antialiased; display: flex; flex-direction: column; min-height: 100vh; }
        header { display: flex; align-items: center; justify-content: space-between; padding: 1.25rem 2rem; border-bottom: 1px solid var(--border); background: rgba(13, 17, 23, 0.8); backdrop-filter: blur(12px); position: sticky; top: 0; z-index: 100; transition: all 0.3s; }
        .logo-container { display: flex; align-items: center; gap: 0.75rem; }
        .logo-bar { width: 4px; height: 24px; background: var(--primary); border-radius: 2px; box-shadow: 0 0 12px var(--primary); }
        .logo-text { font-weight: 900; font-size: 1.25rem; color: var(--text-white); letter-spacing: 0.05em; }
        .nav-link { color: var(--text-muted); text-decoration: none; font-size: 0.85rem; font-weight: 700; transition: all 0.2s; display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 0.75rem; border-radius: 8px; }
        .nav-link:hover { color: var(--text-white); background: var(--bg-hover); }
        footer { border-top: 1px solid var(--border); padding: 2.5rem 2rem; display: flex; justify-content: center; gap: 2rem; background: var(--bg-card); margin-top: auto; border-bottom: 4px solid var(--primary); }
        .status-badge { background: rgba(35, 134, 54, 0.08); color: var(--success); border: 1px solid rgba(35, 134, 54, 0.2); padding: 0.4rem 0.8rem; border-radius: 20px; font-size: 0.75rem; font-weight: 700; display: flex; align-items: center; gap: 0.5rem; }
        .status-dot { width: 8px; height: 8px; background: var(--success); border-radius: 50%; box-shadow: 0 0 8px var(--success); }
        .copy-btn { background: var(--bg-hover); border: 1px solid var(--border); color: var(--text-muted); padding: 0.4rem 0.6rem; border-radius: 6px; cursor: pointer; font-size: 0.75rem; transition: all 0.2s; display: flex; align-items: center; gap: 0.4rem; }
        .copy-btn:hover { color: var(--text-white); border-color: var(--text-muted); }
        .copy-btn.success { color: var(--success); border-color: var(--success); }
        code, pre { font-family: var(--font-mono); }
        @media (max-width: 640px) {
          header { padding: 1rem; }
          .logo-text { font-size: 1.1rem; }
          .nav-link span { display: none; }
          footer { flex-direction: column; align-items: center; padding: 2rem 1rem; gap: 1rem; }
        }
      </style>
    </head>
`;

const commonHeader = `
      <header>
        <div class="logo-container">
          <div class="logo-bar"></div>
          <span class="logo-text">DELEMA API</span>
        </div>
        <div style="display: flex; gap: 0.5rem; align-items: center;">
          <a href="/" class="nav-link" id="nav-console"><i class="fas fa-terminal"></i> <span>CONSOLE</span></a>
          <a href="/api-docs" class="nav-link" id="nav-docs"><i class="fas fa-book"></i> <span>DOCUMENTATION</span></a>
        </div>
      </header>
`;

const commonFooter = `
      <footer>
        <div class="header-status" style="display: flex; gap: 1rem;">
          <div class="status-badge" title="Stable Service">
             <i class="fas fa-bolt"></i> <span id="rate-limit-info">STABLE</span>
          </div>
          <div class="status-badge">
            <div class="status-dot"></div> ONLINE
          </div>
        </div>
        <div style="color: var(--text-muted); font-size: 0.75rem; font-weight: 500;">
          © 2026 OpenZero Project. Distributed Engine.
        </div>
      </footer>
`;

// Root endpoint
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    ${commonHead}
    <style>
        .hero { text-align: center; padding: 6rem 1rem 4rem; background: radial-gradient(circle at top, rgba(79, 70, 229, 0.12) 0%, transparent 70%); }
        .hero h1 { font-size: clamp(2rem, 8vw, 3.5rem); margin: 0; font-weight: 900; letter-spacing: -0.03em; color: var(--text-white); }
        .hero h1 .accent { color: var(--primary); text-shadow: 0 0 20px rgba(79, 70, 229, 0.3); }
        .hero p { color: var(--text-muted); font-size: 0.9rem; letter-spacing: 0.2em; margin-top: 1.5rem; text-transform: uppercase; font-weight: 700; }
        .stats-bar { max-width: 900px; margin: -2rem auto 3rem; display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.25rem; padding: 0 1.5rem; }
        .stat-card { background: var(--bg-card); border: 1px solid var(--border); padding: 1.5rem; border-radius: var(--radius); text-align: center; transition: transform 0.2s, border-color 0.2s; }
        .stat-card:hover { transform: translateY(-4px); border-color: var(--primary); }
        .stat-value { display: block; font-size: 1.5rem; font-weight: 900; color: var(--text-white); }
        .stat-label { font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.15em; margin-top: 0.5rem; font-weight: 800; }
        .search-container { max-width: 800px; margin: 0 auto 3rem; padding: 0 1.5rem; position: sticky; top: 85px; z-index: 90; }
        .search-box { background: rgba(22, 27, 34, 0.85); border: 1px solid var(--border); border-radius: var(--radius); display: flex; align-items: center; padding: 1.1rem 1.5rem; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3); backdrop-filter: blur(12px); }
        .search-box:focus-within { border-color: var(--primary); box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.15); transform: translateY(-2px); }
        .search-box i { color: var(--text-muted); margin-right: 1.25rem; font-size: 1.2rem; }
        .search-box input { background: transparent; border: none; color: var(--text-white); width: 100%; outline: none; font-size: 1.05rem; font-weight: 500; font-family: var(--font-main); }
        .content { max-width: 900px; margin: 0 auto 5rem; padding: 0 1.5rem; }
        .category-header { display: flex; align-items: center; justify-content: space-between; margin: 4rem 0 1.5rem; padding-bottom: 0.75rem; border-bottom: 1px solid var(--border); gap: 1rem; }
        .category-header h2 { margin: 0; font-size: 1.4rem; color: var(--text-white); font-weight: 900; display: flex; align-items: center; gap: 1rem; min-width: 0; }
        .category-header h2 i { color: var(--primary); font-size: 1.1rem; flex-shrink: 0; }
        .category-header span { background: var(--bg-hover); color: var(--text-muted); font-size: 0.7rem; font-weight: 800; padding: 0.3rem 0.75rem; border-radius: 8px; letter-spacing: 0.05em; flex-shrink: 0; white-space: nowrap; }
        .endpoint-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius); margin-bottom: 1rem; overflow: hidden; transition: all 0.2s ease; width: 100%; box-sizing: border-box; }
        .endpoint-card:hover { border-color: #40464d; box-shadow: 0 4px 12px rgba(0,0,0,0.2); }
        .endpoint-trigger { width: 100%; padding: 1.5rem; display: flex; align-items: center; justify-content: space-between; background: none; border: none; cursor: pointer; text-align: left; }
        .endpoint-info { display: flex; align-items: center; gap: 1.25rem; flex-wrap: wrap; }
        .method-badge { padding: 0.4rem 1rem; border-radius: 8px; font-size: 0.8rem; font-weight: 900; background: rgba(79, 70, 229, 0.1); color: var(--primary); border: 1px solid rgba(79, 70, 229, 0.2); }
        .method-badge.get { color: #2ea043; background: rgba(46, 160, 67, 0.1); border-color: rgba(46, 160, 67, 0.2); }
        .endpoint-path { font-family: var(--font-mono); font-size: 0.95rem; color: var(--text-main); font-weight: 600; }
        .endpoint-name { color: var(--text-muted); font-size: 0.85rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.02em; }
        .chevron { transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1); color: var(--text-muted); }
        .endpoint-card.active .chevron { transform: rotate(180deg); color: var(--text-white); }
        .endpoint-content { max-height: 0; overflow: hidden; transition: max-height 0.4s cubic-bezier(0, 1, 0, 1); background: rgba(13, 17, 23, 0.4); }
        .endpoint-card.active .endpoint-content { max-height: 4000px; transition: max-height 0.8s ease-in-out; }
        .endpoint-inner { padding: 0 1.5rem 2rem; border-top: 1px solid var(--border); }
        .endpoint-desc { color: var(--text-main); font-size: 1rem; padding: 1.5rem 0; line-height: 1.7; }
        .form-label { display: block; color: var(--text-muted); font-size: 0.75rem; font-weight: 800; margin-bottom: 1rem; letter-spacing: 0.15em; text-transform: uppercase; }
        .input-field { width: 100%; background: var(--bg-input); border: 1px solid var(--border); border-radius: 10px; padding: 1.25rem; color: #a5d6ff; font-family: var(--font-mono); font-size: 0.95rem; box-sizing: border-box; outline: none; margin-bottom: 1.5rem; line-height: 1.6; resize: vertical; min-height: 120px; transition: border-color 0.2s; }
        .input-field:focus { border-color: var(--primary); }
        .execute-btn { width: 100%; background: var(--primary); color: white; border: none; padding: 1.25rem; border-radius: 10px; font-weight: 800; font-size: 1rem; letter-spacing: 0.05em; cursor: pointer; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); display: flex; align-items: center; justify-content: center; gap: 0.75rem; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.2); }
        .execute-btn:hover { background: var(--primary-hover); transform: translateY(-2px); box-shadow: 0 6px 16px rgba(79, 70, 229, 0.3); }
        .execute-btn:active { transform: translateY(0); }
        .execute-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
        .response-container { margin-top: 2.5rem; animation: fadeIn 0.4s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
        .response-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
        .response-status { font-size: 0.85rem; font-weight: 800; padding: 0.3rem 0.75rem; border-radius: 6px; font-family: var(--font-mono); }
        .status-success { background: rgba(35, 134, 54, 0.12); color: #3fb950; }
        .status-error { background: rgba(248, 81, 73, 0.12); color: #f85149; }
        .response-body-wrapper { position: relative; border-radius: 10px; overflow: hidden; border: 1px solid var(--border); width: 100%; max-width: 100%; box-sizing: border-box; }
        .response-body { background: #010409; color: #e6edf3; padding: 1.5rem; font-family: var(--font-mono); font-size: 0.9rem; max-height: 600px; overflow: auto; white-space: pre-wrap; line-height: 1.6; word-break: break-all; overflow-wrap: anywhere; }
        .response-body-wrapper .copy-btn { position: absolute; top: 1rem; right: 1rem; z-index: 10; opacity: 0.5; }
        .response-body-wrapper:hover .copy-btn { opacity: 1; }
        .empty-state { text-align: center; padding: 5rem 2rem; background: var(--bg-card); border-radius: var(--radius); border: 1px dashed var(--border); margin-top: 2rem; }
        .empty-state i { font-size: 3rem; color: var(--text-muted); margin-bottom: 1.5rem; }
        .empty-state h3 { font-size: 1.5rem; color: var(--text-white); margin: 0 0 0.5rem; }
        .empty-state p { color: var(--text-muted); margin: 0; }
        @media (max-width: 768px) { 
          .stats-bar { grid-template-columns: repeat(3, 1fr); gap: 1rem; } 
          .search-container { top: 75px; } 
        }
        @media (max-width: 640px) {
          .stats-bar { grid-template-columns: repeat(3, 1fr); gap: 0.75rem; margin-top: -1rem; padding: 0 1rem; }
          .stat-card { padding: 1rem 0.25rem; }
          .stat-value { font-size: 1.1rem; }
          .stat-label { font-size: 0.55rem; letter-spacing: 0.05em; }
          .endpoint-info { flex-direction: column; align-items: flex-start; gap: 0.5rem; }
          .endpoint-trigger { padding: 1.25rem; }
          .method-badge { font-size: 0.7rem; padding: 0.25rem 0.75rem; }
          .endpoint-path { font-size: 0.85rem; }
        }
    </style>
    </head>
    <body>
      ${commonHeader}
      <div class="hero">
        <h1>THE <span class="accent">INTELLIGENT</span> ENGINE</h1>
        <p>Decision Support & Research Infrastructure • v1.7.0</p>
      </div>
      <div class="stats-bar">
        <div class="stat-card"><span class="stat-value">8+</span><span class="stat-label">Routers</span></div>
        <div class="stat-card"><span class="stat-value">21+</span><span class="stat-label">Endpoints</span></div>
        <div class="stat-card"><span class="stat-value">v1.7.0</span><span class="stat-label">Version</span></div>
      </div>
      <div class="search-container">
        <div class="search-box">
          <i class="fas fa-search"></i>
          <input type="text" id="endpoint-search" placeholder="Search endpoints (e.g. arxiv, weather, code)..." onkeyup="filterEndpoints()">
        </div>
      </div>
      <main class="content" id="api-list"></main>
      ${commonFooter}
      <script>
        const apiData = [
          { category: "Research", icon: "fa-microscope", endpoints: [
            { path: "/research/arxiv", name: "ARXIV SEARCH", method: "POST", desc: "Cari publikasi ilmiah di ArXiv dengan ringkasan AI.", body: { query: "machine learning", limit: 5, lang: "Indonesian" } },
            { path: "/research/wikipedia", name: "WIKIPEDIA", method: "POST", desc: "Ambil ringkasan ensiklopedia dan sintesis AI.", body: { query: "Node.js", lang: "Indonesian" } },
            { path: "/research/nerdfont", name: "NERD FONTS", method: "POST", desc: "Cari dan unduh Nerd Fonts.", body: { query: "JetBrains" } }
          ]},
          { category: "AI Search", icon: "fa-brain", endpoints: [
            { path: "/ai/search", name: "AI SEARCH", method: "POST", desc: "Pencarian pintar berbasis AI untuk berbagai konten.", body: { query: "macbook air", limit: 3, lang: "English" } },
            { path: "/ai/alpha/search", name: "AI SEARCH ALPHA", method: "POST", desc: "Deep Search menggunakan Playwright Browser (Slow but Detailed).", body: { query: "berita terbaru hari ini", limit: 5, lang: "Indonesian" } }
          ]},
          { category: "Health & Safety", icon: "fa-shield-heart", endpoints: [
            { path: "/fda/search", name: "FDA SEARCH", method: "POST", desc: "Cari data obat, makanan, atau peralatan medis dari OpenFDA.", body: { query: "tylenol", category: "drug", limit: 5, lang: "Indonesian" } }
          ]},
          { category: "Utilities", icon: "fa-tools", endpoints: [
            { path: "/weather", name: "WEATHER", method: "GET", desc: "Dapatkan data cuaca real-time.", body: null, queryParams: "city=Jakarta" }
          ]},
          { category: "Developer Suite", icon: "fa-code", endpoints: [
            { path: "/code/explain", name: "CODE EXPLAIN", method: "POST", desc: "Jelaskan potongan kode dengan AI.", body: { code: "console.log('hello')", language: "javascript", lang: "English" } },
            { path: "/code/debug", name: "CODE DEBUG", method: "POST", desc: "Cari dan perbaiki bug dalam kode.", body: { code: "function add(a, b) { return a - b }", error: "Should add instead of subtract", language: "javascript", lang: "English" } },
            { path: "/code/generate", name: "CODE GENERATE", method: "POST", desc: "Generate kode berdasarkan prompt.", body: { prompt: "Create a simple express server", language: "typescript", framework: "express", lang: "English" } },
            { path: "/code/refactor", name: "CODE REFACTOR", method: "POST", desc: "Refactor kode untuk kualitas lebih baik.", body: { code: "var x = 10; if(x == 10) { console.log(x) }", instruction: "Use modern syntax", language: "javascript", lang: "English" } },
            { path: "/docs", name: "DOCS SEARCH", method: "GET", desc: "Cari dokumentasi dan sintesis jawaban AI.", body: null, queryParams: "q=useEffect&framework=react&lang=English" }
          ]},
          { category: "Automation Tools", icon: "fa-robot", endpoints: [
            { path: "/tools/json", name: "JSON UTILS", method: "POST", desc: "Prettify, Minify, Validate, or Diff JSON.", body: { action: "prettify", input: '{"a":1,"b":2}' } },
            { path: "/tools/format", name: "CODE FORMAT", method: "POST", desc: "Format code using Prettier.", body: { language: "javascript", code: "function test(){console.log('hi')}" } },
            { path: "/tools/crypto", name: "CRYPTO", method: "POST", desc: "Hashing (MD5, SHA256) or Base64 encoding/decoding.", body: { action: "hash", type: "sha256", input: "hello world" } },
            { path: "/tools/url", name: "URL UTILS", method: "POST", desc: "Parse, Encode, or Decode URLs.", body: { action: "parse", input: "https://example.com/search?q=openzero" } },
            { path: "/tools/time", name: "TIME UTILS", method: "POST", desc: "Get current time or convert timestamps.", body: { action: "now" } }
          ]}
        ];
        function renderEndpoints() {
          const container = document.getElementById('api-list');
          let html = '';
          apiData.forEach(function(cat) {
            html += '<div class="category-block">';
            html += '<div class="category-header"><h2><i class="fas ' + cat.icon + '"></i> ' + cat.category + '</h2><span>' + cat.endpoints.length + ' ENDPOINTS</span></div>';
            html += '<div class="endpoints-group">';
            cat.endpoints.forEach(function(ep) {
              const bodyStr = ep.body ? JSON.stringify(ep.body, null, 2) : '';
              html += '<div class="endpoint-card" data-search="' + ep.path + ' ' + ep.name + '">';
              html += '<button class="endpoint-trigger" onclick="toggleAccordion(this)"><div class="endpoint-info"><span class="method-badge ' + ep.method.toLowerCase() + '">' + ep.method + '</span><span class="endpoint-path">' + ep.path + '</span><span class="endpoint-name">' + ep.name + '</span></div><i class="fas fa-chevron-down chevron"></i></button>';
              html += '<div class="endpoint-content"><div class="endpoint-inner"><p class="endpoint-desc">' + ep.desc + '</p><span class="form-label">REQUEST ' + (ep.method === 'GET' ? 'PARAMS' : 'BODY') + '</span>';
              html += '<textarea id="input-' + ep.path + '" class="input-field" rows="6" spellcheck="false">' + (ep.method === 'GET' ? ep.queryParams : bodyStr) + '</textarea>';
              html += '<button id="btn-' + ep.path + '" class="execute-btn" onclick="executeRequest(\\'' + ep.method + '\\', \\'' + ep.path + '\\')"><i class="fas fa-play"></i> EXECUTE REQUEST</button>';
              html += '<div id="res-container-' + ep.path + '" class="response-container" style="display:none"><div class="response-header"><span class="form-label">RESPONSE</span><span id="status-' + ep.path + '" class="response-status"></span></div><div class="response-body-wrapper"><button class="copy-btn" onclick="copyToClipboard(\\'' + ep.path + '\\')"><i class="far fa-copy"></i> Copy</button><div id="body-' + ep.path + '" class="response-body"></div></div></div>';
              html += '</div></div></div>';
            });
            html += '</div></div>';
          });
          container.innerHTML = html;
        }
        function toggleAccordion(btn) { const card = btn.parentElement; const isActive = card.classList.contains('active'); if (!isActive) { document.querySelectorAll('.endpoint-card').forEach(el => el.classList.remove('active')); card.classList.add('active'); } else { card.classList.remove('active'); } }
        function filterEndpoints() { 
            const q = document.getElementById('endpoint-search').value.toLowerCase(); 
            let foundCount = 0;
            document.querySelectorAll('.endpoint-card').forEach(card => { 
                const text = card.getAttribute('data-search').toLowerCase(); 
                const isMatch = text.includes(q);
                card.style.display = isMatch ? 'block' : 'none'; 
                if(isMatch) foundCount++;
            }); 
            document.querySelectorAll('.category-block').forEach(cat => { 
                const hasVisible = Array.from(cat.querySelectorAll('.endpoint-card')).some(c => c.style.display !== 'none'); 
                cat.style.display = hasVisible ? 'block' : 'none'; 
            }); 
            const list = document.getElementById('api-list');
            const existingEmpty = document.getElementById('search-empty');
            if (foundCount === 0 && !existingEmpty) {
                const empty = document.createElement('div');
                empty.id = 'search-empty';
                empty.className = 'empty-state';
                empty.innerHTML = '<i class="fas fa-search"></i><h3>No results found</h3><p>Try searching for a different keyword or path.</p>';
                list.appendChild(empty);
            } else if (foundCount > 0 && existingEmpty) {
                existingEmpty.remove();
            }
        }
        async function executeRequest(method, path) {
          const input = document.getElementById('input-' + path).value;
          const resContainer = document.getElementById('res-container-' + path);
          const resBody = document.getElementById('body-' + path);
          const resStatus = document.getElementById('status-' + path);
          const executeBtn = document.getElementById('btn-' + path);
          resContainer.style.display = 'block';
          resBody.textContent = 'Executing request...';
          executeBtn.disabled = true;
          executeBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> EXECUTING...';
          try {
            let url = '/api/delema/v1' + path;
            const options = { method, headers: { 'Content-Type': 'application/json' } };
            if (method === 'GET') { url += '?' + input; } else { options.body = input; }
            const start = Date.now();
            const res = await fetch(url, options);
            const duration = Date.now() - start;
            const remaining = res.headers.get('X-RateLimit-Remaining');
            if (remaining) document.getElementById('rate-limit-info').textContent = remaining + ' REQS LEFT';
            const data = await res.json();
            resStatus.textContent = res.status + ' ' + res.statusText + ' (' + duration + 'ms)';
            resStatus.className = 'response-status ' + (res.ok ? 'status-success' : 'status-error');
            
            let responseText = JSON.stringify(data, null, 2);
            resBody.innerHTML = '';
            
            if (data.ai_summary) { 
              const summaryDiv = document.createElement('div');
              summaryDiv.style.cssText = 'background: rgba(79, 70, 229, 0.08); border-left: 4px solid var(--primary); padding: 1.25rem; margin-bottom: 1.5rem; border-radius: 4px; color: var(--text-white); font-style: italic; line-height: 1.6; font-size: 0.95rem;';
              summaryDiv.textContent = data.ai_summary;
              resBody.appendChild(summaryDiv);
            }
            
            const pre = document.createElement('pre');
            pre.className = 'language-json';
            pre.style.margin = '0';
            pre.style.padding = '0';
            pre.style.background = 'transparent';
            pre.textContent = responseText;
            resBody.appendChild(pre);
            
            hljs.highlightElement(pre);
          } catch (err) { 
            resStatus.textContent = 'CONNECTION ERROR'; 
            resStatus.className = 'response-status status-error'; 
            resBody.textContent = 'Failed to connect to the server: ' + err.message; 
          } finally {
            executeBtn.disabled = false;
            executeBtn.innerHTML = '<i class="fas fa-play"></i> EXECUTE REQUEST';
          }
        }
        function copyToClipboard(path) {
            const body = document.getElementById('body-' + path);
            const btn = event.currentTarget;
            const text = body.innerText;
            navigator.clipboard.writeText(text).then(() => {
                const originalHtml = btn.innerHTML;
                btn.innerHTML = '<i class="fas fa-check"></i> Copied!';
                btn.classList.add('success');
                setTimeout(() => {
                    btn.innerHTML = originalHtml;
                    btn.classList.remove('success');
                }, 2000);
            });
        }
        renderEndpoints();
        document.getElementById('nav-console').style.color = 'var(--text-white)';
        document.getElementById('nav-console').style.background = 'var(--bg-hover)';
      </script>
    </body>
    </html>
  `);
});

// Documentation endpoint
app.get('/api-docs', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    ${commonHead}
    <style>
        .container { max-width: 900px; margin: 5rem auto; padding: 0 2rem; flex: 1; width: 100%; }
        h1 { font-size: clamp(2.2rem, 7vw, 3.2rem); font-weight: 950; color: var(--text-white); margin-bottom: 1.5rem; letter-spacing: -0.03em; }
        h2 { font-size: 1.7rem; font-weight: 800; color: var(--text-white); margin: 3.5rem 0 1.5rem; border-bottom: 1px solid var(--border); padding-bottom: 1rem; }
        p { font-size: 1.1rem; line-height: 1.8; margin-bottom: 1.75rem; color: var(--text-main); word-wrap: break-word; }
        code { font-family: var(--font-mono); background: var(--bg-card); padding: 0.3rem 0.6rem; border-radius: 6px; color: #a5d6ff; font-size: 0.9em; border: 1px solid var(--border); word-break: break-word; }
        .code-block-wrapper { position: relative; margin: 2rem 0; box-shadow: 0 8px 30px rgba(0,0,0,0.4); border-radius: var(--radius); overflow: hidden; border: 1px solid var(--border); width: 100%; }
        pre { background: #010409; padding: 2rem; margin: 0; overflow-x: auto; line-height: 1.8; font-size: 0.95rem; width: 100%; }
        .code-block-wrapper .copy-btn { position: absolute; top: 1rem; right: 1rem; z-index: 10; opacity: 0.6; }
        .code-block-wrapper:hover .copy-btn { opacity: 1; }
        .highlight { color: var(--primary); font-weight: 800; }
        ul { padding-left: 1.5rem; margin-bottom: 2.5rem; }
        li { margin-bottom: 0.85rem; font-size: 1.05rem; word-wrap: break-word; }
        .info-card { background: rgba(79, 70, 229, 0.08); border-left: 4px solid var(--primary); padding: 1.75rem; border-radius: 10px; margin: 3rem 0; box-shadow: 0 4px 15px rgba(0,0,0,0.1); word-wrap: break-word; }
        .info-card i { color: var(--primary); margin-right: 1rem; font-size: 1.2rem; }
        @media (max-width: 640px) { 
          .container { margin: 3rem auto; padding: 0 1.25rem; } 
          h1 { font-size: 2.2rem; }
          h2 { font-size: 1.5rem; margin-top: 2.5rem; }
          pre { padding: 1.5rem; font-size: 0.85rem; }
          .info-card { padding: 1.25rem; margin: 2rem 0; }
          p { font-size: 1rem; }
          li { font-size: 0.95rem; }
        }
    </style>
    </head>
    <body>
      ${commonHeader}
      <div class="container">
        <h1>API Documentation</h1>
        <p>Gunakan panduan ini untuk mengintegrasikan layanan penelitian pintar dan pengambilan data <strong>Delema API</strong> ke dalam aplikasi atau bot Anda.</p>
        <div class="info-card">
          <i class="fas fa-bolt"></i> <strong>Penting:</strong> Seluruh endpoint diproteksi oleh rate limiter berbasis IP. Pastikan aplikasi Anda menangani kode status <code>429 Too Many Requests</code>.
        </div>
        <h2>Base URL</h2>
        <p>Endpoint production berada di rute berikut:</p>
        <div class="code-block-wrapper">
          <button class="copy-btn" onclick="copyText(this)"><i class="far fa-copy"></i> Copy</button>
          <pre><code class="language-http">https://delema.razael-fox.my.id/api/delema/v1</code></pre>
        </div>
        <h2>Rate Limiting</h2>
        <p>Batas penggunaan dibedakan berdasarkan kompleksitas tugas:</p>
        <ul>
          <li><span class="highlight">Global:</span> 100 requests / 15 menit (untuk Utilities dan Docs).</li>
          <li><span class="highlight">AI & Research:</span> 20 requests / 15 menit (ArXiv, Wikipedia, AI Search).</li>
          <li><span class="highlight">Alpha (Browser):</span> 10 requests / 15 menit (AI Search Alpha).</li>
        </ul>
        <h2>Response Format</h2>
        <p>Format respons standar menggunakan JSON. Field <code>ai_summary</code> berisi sintesis cerdas dari data riil yang ditemukan.</p>
        <div class="code-block-wrapper">
          <button class="copy-btn" onclick="copyText(this)"><i class="far fa-copy"></i> Copy</button>
          <pre><code class="language-json">{
  "results": [...],
  "ai_summary": "TL;DR: Sintesis pintar dari data penelitian terkini.",
  "engine": "playwright-alpha"
}</code></pre>
        </div>
        <h2>Node.js / Fetch Integration</h2>
        <p>Contoh pemanggilan API menggunakan JavaScript modern:</p>
        <div class="code-block-wrapper">
          <button class="copy-btn" onclick="copyText(this)"><i class="far fa-copy"></i> Copy</button>
          <pre><code class="language-javascript">// Example: AI Search Alpha (Deep Search)
const callAlpha = async () => {
  const res = await fetch('https://delema.razael-fox.my.id/api/delema/v1/ai/alpha/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: 'Trend teknologi 2026',
      lang: 'Indonesian'
    })
  });
  const data = await res.json();
  console.log(data.ai_summary);
};</code></pre>
        </div>
      </div>
      ${commonFooter}
      <script>
        document.addEventListener('DOMContentLoaded', (event) => {
          document.querySelectorAll('pre code').forEach((el) => {
            hljs.highlightElement(el);
          });
        });
        document.getElementById('nav-docs').style.color = 'var(--text-white)';
        document.getElementById('nav-docs').style.background = 'var(--bg-hover)';
        function copyText(btn) {
            const code = btn.nextElementSibling.innerText;
            navigator.clipboard.writeText(code).then(() => {
                const originalHtml = btn.innerHTML;
                btn.innerHTML = '<i class="fas fa-check"></i> Copied!';
                btn.classList.add('success');
                setTimeout(() => {
                    btn.innerHTML = originalHtml;
                    btn.classList.remove('success');
                }, 2000);
            });
        }
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
