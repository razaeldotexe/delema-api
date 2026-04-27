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
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.13/codemirror.min.css">
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.13/theme/material-palenight.min.css">
      <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.8.0/highlight.min.js"></script>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.13/codemirror.min.js"></script>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.13/mode/javascript/javascript.min.js"></script>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.8.0/languages/json.min.js"></script>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.8.0/languages/javascript.min.js"></script>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.8.0/languages/typescript.min.js"></script>
      <script src="https://cdn.tailwindcss.com"></script>
      <script>
        tailwind.config = {
          darkMode: 'class',
          theme: {
            extend: {
              colors: {
                background: '#0f0f1e',
                foreground: '#e0e0e0',
                card: '#1a1a2e',
                'card-foreground': '#ffffff',
                popover: '#1a1a2e',
                'popover-foreground': '#ffffff',
                primary: {
                  DEFAULT: '#5b5bff',
                  foreground: '#ffffff',
                },
                secondary: {
                  DEFAULT: '#2a2a3e',
                  foreground: '#e0e0e0',
                },
                muted: {
                  DEFAULT: '#3a3a4e',
                  foreground: '#8a8a9e',
                },
                accent: {
                  DEFAULT: '#ff1493',
                  foreground: '#ffffff',
                },
                destructive: {
                  DEFAULT: '#ff4444',
                  foreground: '#ffffff',
                },
                border: '#2a2a3e',
                input: '#2a2a3e',
                ring: '#5b5bff',
              },
              borderRadius: {
                lg: '0.625rem',
                md: 'calc(0.625rem - 2px)',
                sm: 'calc(0.625rem - 4px)',
              },
              fontFamily: {
                sans: ['Inter', 'ui-sans-serif', 'system-ui'],
                mono: ['Fira Code', 'ui-monospace', 'SFMono-Regular'],
              },
            },
          },
        }
      </script>
      <style type="text/tailwindcss">
        @layer base {
          * { @apply border-border outline-ring/50; }
          body { @apply bg-background text-foreground; font-family: theme('fontFamily.sans'); -webkit-font-smoothing: antialiased; }
        }
        @layer utilities {
          .gradient-rainbow {
            background: linear-gradient(90deg, #ff1493, #ff7700, #ffff00, #00ff88, #00bfff, #5b5bff, #ff1493);
            background-size: 200% 200%;
          }
          .gradient-rainbow-text {
            background: linear-gradient(90deg, #ff1493, #ff7700, #ffff00, #00ff88, #00bfff, #5b5bff);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }
          .gradient-button {
            background: linear-gradient(135deg, #ff1493 0%, #5b5bff 100%);
            position: relative;
          }
          .gradient-button:hover {
            filter: brightness(1.1);
          }
          .fade-in-up {
            animation: fadeInUp 0.8s ease-out forwards;
          }
          @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .pulse-button {
            animation: pulse-soft 2s infinite;
          }
          @keyframes pulse-soft {
            0%, 100% { box-shadow: 0 0 0 0 rgba(91, 91, 255, 0.4); }
            50% { box-shadow: 0 0 0 10px rgba(91, 91, 255, 0); }
          }
          .card-hover {
            @apply transition-all duration-300 border-transparent border;
          }
          .card-hover:hover {
            @apply border-primary translate-y-[-4px];
            box-shadow: 0 0 20px rgba(91, 91, 255, 0.3);
          }
        }
      </style>
    </head>
`;

const commonHeader = `
      <nav class="fixed top-0 w-full bg-background/95 backdrop-blur-md border-b border-border z-50">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between items-center h-16">
            <!-- Logo -->
            <div class="flex items-center gap-2 cursor-pointer" onclick="window.scrollTo({top: 0, behavior: 'smooth'})">
              <img 
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/full_icon-XTtiCTsY6QjoCpnsd7io8clRLzrppc.png"
                alt="Delema API"
                class="h-8 w-8"
              />
              <span class="text-xl font-bold text-white hidden sm:inline">Delema API</span>
            </div>

            <!-- Desktop Navigation -->
            <div class="hidden md:flex gap-8">
              <button onclick="document.getElementById('features')?.scrollIntoView({behavior: 'smooth'})" class="text-gray-300 hover:text-white transition-colors text-sm font-medium">Features</button>
              <button onclick="document.getElementById('pricing')?.scrollIntoView({behavior: 'smooth'})" class="text-gray-300 hover:text-white transition-colors text-sm font-medium">Pricing</button>
              <button onclick="document.getElementById('docs')?.scrollIntoView({behavior: 'smooth'})" class="text-gray-300 hover:text-white transition-colors text-sm font-medium">Docs</button>
              <button onclick="document.getElementById('faq')?.scrollIntoView({behavior: 'smooth'})" class="text-gray-300 hover:text-white transition-colors text-sm font-medium">FAQ</button>
              <a href="/api-docs" class="text-gray-300 hover:text-white transition-colors text-sm font-medium">Full Docs</a>
            </div>

            <!-- CTA Button -->
            <div class="hidden sm:flex gap-4">
              <button onclick="document.getElementById('api-console')?.scrollIntoView({behavior: 'smooth'})" class="gradient-button px-6 py-2 rounded-lg text-white font-semibold text-sm hover:shadow-lg hover:shadow-blue-500/50 transition-all">
                Try Console
              </button>
            </div>

            <!-- Mobile Menu Button -->
            <button onclick="toggleMobileMenu()" class="md:hidden text-gray-300 hover:text-white">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        <!-- Mobile Navigation -->
        <div id="mobile-menu" class="hidden md:hidden pb-4 border-t border-border bg-background">
          <button onclick="scrollToAndClose('features')" class="block w-full text-left px-4 py-2 text-gray-300 hover:text-white hover:bg-secondary rounded">Features</button>
          <button onclick="scrollToAndClose('pricing')" class="block w-full text-left px-4 py-2 text-gray-300 hover:text-white hover:bg-secondary rounded">Pricing</button>
          <button onclick="scrollToAndClose('docs')" class="block w-full text-left px-4 py-2 text-gray-300 hover:text-white hover:bg-secondary rounded">Docs</button>
          <button onclick="scrollToAndClose('faq')" class="block w-full text-left px-4 py-2 text-gray-300 hover:text-white hover:bg-secondary rounded">FAQ</button>
          <a href="/api-docs" class="block w-full text-left px-4 py-2 text-gray-300 hover:text-white hover:bg-secondary rounded">Full Docs</a>
          <button onclick="scrollToAndClose('api-console')" class="w-full mt-4 gradient-button px-4 py-2 rounded-lg text-white font-semibold text-sm">Try Console</button>
        </div>
      </nav>
      <script>
        function toggleMobileMenu() {
          const menu = document.getElementById('mobile-menu');
          menu.classList.toggle('hidden');
        }
        function scrollToAndClose(id) {
          document.getElementById(id)?.scrollIntoView({behavior: 'smooth'});
          document.getElementById('mobile-menu').classList.add('hidden');
        }
      </script>
`;

const commonFooter = `
      <footer class="bg-background border-t border-border py-16 px-4 mt-20">
        <div class="max-w-7xl mx-auto">
          <div class="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            <!-- Brand Column -->
            <div>
              <div class="flex items-center gap-2 mb-4">
                <img 
                  src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/full_icon-XTtiCTsY6QjoCpnsd7io8clRLzrppc.png"
                  alt="Delema API"
                  class="h-8 w-8"
                />
                <span class="text-xl font-bold text-white">Delema API</span>
              </div>
              <p class="text-gray-400 text-sm">
                Powering automation with AI. Build smarter applications.
              </p>
              <div class="flex gap-4 mt-6">
                <a href="#" class="text-gray-400 hover:text-primary transition-colors"><i class="fab fa-twitter text-xl"></i></a>
                <a href="#" class="text-gray-400 hover:text-primary transition-colors"><i class="fab fa-github text-xl"></i></a>
                <a href="#" class="text-gray-400 hover:text-primary transition-colors"><i class="fab fa-linkedin text-xl"></i></a>
              </div>
              <!-- Status Badges -->
              <div class="flex gap-3 mt-6">
                <div class="bg-success/10 text-success border border-success/20 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2">
                  <div class="w-2 h-2 bg-success rounded-full animate-pulse shadow-[0_0_8px_var(--success)]"></div> ONLINE
                </div>
                <div class="bg-primary/10 text-primary border border-primary/20 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2">
                  <i class="fas fa-bolt"></i> <span id="rate-limit-info">STABLE</span>
                </div>
              </div>
            </div>

            <!-- Product Column -->
            <div>
              <h4 class="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Product</h4>
              <ul class="space-y-3">
                <li><a href="#features" class="text-gray-400 hover:text-white transition-colors text-sm">Features</a></li>
                <li><a href="#pricing" class="text-gray-400 hover:text-white transition-colors text-sm">Pricing</a></li>
                <li><a href="/api-docs" class="text-gray-400 hover:text-white transition-colors text-sm">Documentation</a></li>
                <li><a href="#" class="text-gray-400 hover:text-white transition-colors text-sm">Status</a></li>
              </ul>
            </div>

            <!-- Company Column -->
            <div>
              <h4 class="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Company</h4>
              <ul class="space-y-3">
                <li><a href="#" class="text-gray-400 hover:text-white transition-colors text-sm">About</a></li>
                <li><a href="#" class="text-gray-400 hover:text-white transition-colors text-sm">Blog</a></li>
                <li><a href="#" class="text-gray-400 hover:text-white transition-colors text-sm">Careers</a></li>
              </ul>
            </div>

            <!-- Legal Column -->
            <div>
              <h4 class="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Legal</h4>
              <ul class="space-y-3">
                <li><a href="#" class="text-gray-400 hover:text-white transition-colors text-sm">Privacy Policy</a></li>
                <li><a href="#" class="text-gray-400 hover:text-white transition-colors text-sm">Terms of Service</a></li>
                <li><a href="#" class="text-gray-400 hover:text-white transition-colors text-sm">Security</a></li>
              </ul>
            </div>
          </div>

          <!-- Bottom Footer -->
          <div class="border-t border-border pt-8">
            <div class="flex flex-col md:flex-row justify-between items-center gap-4">
              <p class="text-gray-500 text-sm text-center md:text-left">
                &copy; 2026 Delema API. OpenZero Project.
              </p>
              <p class="text-gray-500 text-sm">
                Made with <span class="text-accent">❤</span> by the Delema Team
              </p>
            </div>
          </div>
        </div>
      </footer>
`;

// Root endpoint
app.get('/', (req, res) => {
  const heroHtml = `
      <section id="hero" class="min-h-[90vh] pt-16 flex items-center justify-center px-4 bg-background relative overflow-hidden">
        <div class="absolute inset-0 overflow-hidden pointer-events-none">
          <div class="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl"></div>
          <div class="absolute bottom-20 right-10 w-72 h-72 bg-accent/10 rounded-full blur-3xl"></div>
        </div>

        <div class="max-w-7xl mx-auto text-center relative z-10">
          <div class="mb-8 animate-fade-in">
            <img 
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/full_icon-XTtiCTsY6QjoCpnsd7io8clRLzrppc.png"
              alt="Delema API Logo"
              class="w-32 h-32 mx-auto mb-6 animate-pulse"
            />
          </div>

          <h1 class="text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-6 fade-in-up">
            Delema <span class="gradient-rainbow-text">API</span>
          </h1>

          <p class="text-xl sm:text-2xl text-gray-300 mb-8 max-w-2xl mx-auto leading-relaxed fade-in-up">
            🚀 Powering Automation with AI ✨
          </p>

          <p class="text-base sm:text-lg text-gray-400 mb-12 max-w-3xl mx-auto fade-in-up">
            Delema API provides a powerful, flexible platform for integrating AI-driven automation into your applications. 
            Build smarter, faster, and more efficient solutions with our comprehensive API suite.
          </p>

          <div class="flex flex-col sm:flex-row gap-4 justify-center mb-16 fade-in-up">
            <button onclick="document.getElementById('api-console')?.scrollIntoView({behavior: 'smooth'})" class="gradient-button px-8 py-3 rounded-lg text-white font-semibold text-lg hover:shadow-2xl transition-all">
              Try Interactive Console
            </button>
            <a href="/api-docs" class="px-8 py-3 rounded-lg border-2 border-primary text-primary font-semibold text-lg hover:bg-primary/10 transition-all">
              View Documentation
            </a>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-8 mt-16 pt-8 border-t border-border">
            <div class="fade-in-up">
              <div class="text-3xl sm:text-4xl font-bold gradient-rainbow-text">⚡ 99.9%</div>
              <p class="text-gray-400 mt-2">Uptime SLA</p>
            </div>
            <div class="fade-in-up">
              <div class="text-3xl sm:text-4xl font-bold gradient-rainbow-text">🔥 10M+</div>
              <p class="text-gray-400 mt-2">API Calls/Day</p>
            </div>
            <div class="fade-in-up">
              <div class="text-3xl sm:text-4xl font-bold gradient-rainbow-text">🌐 50+</div>
              <p class="text-gray-400 mt-2">Integrations</p>
            </div>
          </div>
        </div>
      </section>
  `;

  const featuresHtml = `
      <section id="features" class="py-24 px-4 bg-background">
        <div class="max-w-7xl mx-auto">
          <div class="text-center mb-16">
            <h2 class="text-4xl sm:text-5xl font-bold text-white mb-4">
              Powerful <span class="gradient-rainbow-text">Features</span>
            </h2>
            <p class="text-gray-400 max-w-2xl mx-auto text-lg">
              Everything you need to build amazing applications powered by AI automation
            </p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div class="card-hover p-6 rounded-xl bg-card border border-border">
              <div class="mb-4 inline-flex p-3 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                <i class="fas fa-brain text-2xl"></i>
              </div>
              <h3 class="text-xl font-bold text-white mb-3">AI-Powered Integration</h3>
              <p class="text-gray-400 leading-relaxed">Seamlessly integrate AI capabilities into your applications with our intelligent APIs.</p>
              <div class="mt-4 h-1 w-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600"></div>
            </div>
            <div class="card-hover p-6 rounded-xl bg-card border border-border">
              <div class="mb-4 inline-flex p-3 rounded-lg bg-gradient-to-br from-yellow-500 to-orange-600 text-white">
                <i class="fas fa-bolt text-2xl"></i>
              </div>
              <h3 class="text-xl font-bold text-white mb-3">Real-time Processing</h3>
              <p class="text-gray-400 leading-relaxed">Process data in real-time with our high-performance infrastructure and instant responses.</p>
              <div class="mt-4 h-1 w-12 rounded-full bg-gradient-to-r from-yellow-500 to-orange-600"></div>
            </div>
            <div class="card-hover p-6 rounded-xl bg-card border border-border">
              <div class="mb-4 inline-flex p-3 rounded-lg bg-gradient-to-br from-green-500 to-teal-600 text-white">
                <i class="fas fa-lock text-2xl"></i>
              </div>
              <h3 class="text-xl font-bold text-white mb-3">Enterprise Security</h3>
              <p class="text-gray-400 leading-relaxed">Bank-level security with end-to-end encryption and compliance with industry standards.</p>
              <div class="mt-4 h-1 w-12 rounded-full bg-gradient-to-r from-green-500 to-teal-600"></div>
            </div>
            <div class="card-hover p-6 rounded-xl bg-card border border-border">
              <div class="mb-4 inline-flex p-3 rounded-lg bg-gradient-to-br from-pink-500 to-rose-600 text-white">
                <i class="fas fa-link text-2xl"></i>
              </div>
              <h3 class="text-xl font-bold text-white mb-3">Easy Integration</h3>
              <p class="text-gray-400 leading-relaxed">Simple REST APIs with comprehensive documentation and SDK support for all major languages.</p>
              <div class="mt-4 h-1 w-12 rounded-full bg-gradient-to-r from-pink-500 to-rose-600"></div>
            </div>
            <div class="card-hover p-6 rounded-xl bg-card border border-border">
              <div class="mb-4 inline-flex p-3 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 text-white">
                <i class="fas fa-chart-line text-2xl"></i>
              </div>
              <h3 class="text-xl font-bold text-white mb-3">Scalable Infrastructure</h3>
              <p class="text-gray-400 leading-relaxed">Handle millions of requests without worrying about infrastructure or scalability.</p>
              <div class="mt-4 h-1 w-12 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600"></div>
            </div>
            <div class="card-hover p-6 rounded-xl bg-card border border-border">
              <div class="mb-4 inline-flex p-3 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
                <i class="fas fa-code text-2xl"></i>
              </div>
              <h3 class="text-xl font-bold text-white mb-3">Developer Friendly</h3>
              <p class="text-gray-400 leading-relaxed">Extensive documentation, code examples, and 24/7 developer support to help you succeed.</p>
              <div class="mt-4 h-1 w-12 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600"></div>
            </div>
          </div>
        </div>
      </section>
  `;

  const consoleHtml = `
      <section id="api-console" class="py-24 px-4 bg-slate-950/50 border-y border-border">
        <div class="max-w-7xl mx-auto">
          <div class="text-center mb-16">
            <h2 class="text-4xl sm:text-5xl font-bold text-white mb-4 uppercase tracking-tighter">
              The <span class="gradient-rainbow-text">Interactive</span> Console
            </h2>
            <p class="text-gray-400 max-w-2xl mx-auto text-lg">
              Test endpoints directly from your browser and see real-time AI responses.
            </p>
          </div>

          <div class="max-w-4xl mx-auto mb-12">
            <div class="bg-card/80 backdrop-blur-md border border-border rounded-xl flex items-center p-4 shadow-2xl focus-within:border-primary transition-all">
              <i class="fas fa-search text-muted-foreground mr-4 text-xl"></i>
              <input type="text" id="endpoint-search" placeholder="Search endpoints (e.g. arxiv, weather, code)..." class="bg-transparent border-none text-white w-full outline-none text-lg font-medium" onkeyup="filterEndpoints()">
            </div>
          </div>

          <main id="api-list" class="space-y-12"></main>
        </div>
      </section>
  `;

  const pricingHtml = `
      <section id="pricing" class="py-24 px-4 bg-background">
        <div class="max-w-7xl mx-auto">
          <div class="text-center mb-16">
            <h2 class="text-4xl sm:text-5xl font-bold text-white mb-4">
              Simple <span class="gradient-rainbow-text">Pricing</span>
            </h2>
            <p class="text-gray-400 max-w-2xl mx-auto text-lg">
              Choose the perfect plan for your needs. Scale as you grow.
            </p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div class="relative rounded-2xl border border-border bg-card hover:border-slate-700 transition-all p-8 flex flex-col">
              <h3 class="text-2xl font-bold text-white mb-2">Starter</h3>
              <p class="text-gray-400 text-sm mb-6">Perfect for getting started</p>
              <div class="mb-6"><span class="text-5xl font-bold text-white">Free</span></div>
              <button class="w-full py-3 rounded-lg font-semibold mb-8 border border-border text-gray-300 hover:border-primary hover:text-white transition-all">Get Started</button>
              <ul class="space-y-4 flex-1 text-sm text-gray-300">
                <li class="flex items-start gap-3"><i class="fas fa-check-circle text-primary mt-1"></i> 10,000 API calls/month</li>
                <li class="flex items-start gap-3"><i class="fas fa-check-circle text-primary mt-1"></i> Basic support</li>
                <li class="flex items-start gap-3"><i class="fas fa-check-circle text-primary mt-1"></i> Community access</li>
                <li class="flex items-start gap-3"><i class="fas fa-check-circle text-primary mt-1"></i> Rate limit: 10 req/sec</li>
              </ul>
            </div>
            <div class="relative rounded-2xl border-2 border-primary bg-gradient-to-b from-slate-900 to-slate-950 shadow-2xl shadow-primary/20 md:scale-105 p-8 flex flex-col">
              <div class="absolute top-4 right-4"><span class="px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-accent to-primary text-white">Most Popular</span></div>
              <h3 class="text-2xl font-bold text-white mb-2">Professional</h3>
              <p class="text-gray-400 text-sm mb-6">For growing businesses</p>
              <div class="mb-6"><span class="text-5xl font-bold text-white">$99</span><span class="text-gray-400 text-lg ml-2">/month</span></div>
              <button class="w-full py-3 rounded-lg font-semibold mb-8 gradient-button text-white hover:shadow-lg">Start Free Trial</button>
              <ul class="space-y-4 flex-1 text-sm text-gray-300">
                <li class="flex items-start gap-3"><i class="fas fa-check-circle text-primary mt-1"></i> 1,000,000 API calls/month</li>
                <li class="flex items-start gap-3"><i class="fas fa-check-circle text-primary mt-1"></i> Priority support</li>
                <li class="flex items-start gap-3"><i class="fas fa-check-circle text-primary mt-1"></i> Advanced analytics</li>
                <li class="flex items-start gap-3"><i class="fas fa-check-circle text-primary mt-1"></i> Custom integrations</li>
                <li class="flex items-start gap-3"><i class="fas fa-check-circle text-primary mt-1"></i> Rate limit: 100 req/sec</li>
              </ul>
            </div>
            <div class="relative rounded-2xl border border-border bg-card hover:border-slate-700 transition-all p-8 flex flex-col">
              <h3 class="text-2xl font-bold text-white mb-2">Enterprise</h3>
              <p class="text-gray-400 text-sm mb-6">For large-scale operations</p>
              <div class="mb-6"><span class="text-5xl font-bold text-white">Custom</span></div>
              <button class="w-full py-3 rounded-lg font-semibold mb-8 border border-border text-gray-300 hover:border-primary hover:text-white transition-all">Contact Sales</button>
              <ul class="space-y-4 flex-1 text-sm text-gray-300">
                <li class="flex items-start gap-3"><i class="fas fa-check-circle text-primary mt-1"></i> Unlimited API calls</li>
                <li class="flex items-start gap-3"><i class="fas fa-check-circle text-primary mt-1"></i> 24/7 dedicated support</li>
                <li class="flex items-start gap-3"><i class="fas fa-check-circle text-primary mt-1"></i> Custom SLA</li>
                <li class="flex items-start gap-3"><i class="fas fa-check-circle text-primary mt-1"></i> Dedicated infrastructure</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
  `;

  const faqHtml = `
      <section id="faq" class="py-24 px-4 bg-background">
        <div class="max-w-4xl mx-auto text-center mb-16">
          <h2 class="text-4xl sm:text-5xl font-bold text-white mb-4">
            Frequently Asked <span class="gradient-rainbow-text">Questions</span>
          </h2>
          <p class="text-gray-400 text-lg">Have questions? We have answers.</p>
        </div>
        <div class="max-w-3xl mx-auto space-y-4">
          <div class="rounded-xl border border-border bg-card overflow-hidden transition-colors">
            <button onclick="toggleFaq(this)" class="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-800/50 transition-colors">
              <h3 class="text-lg font-semibold text-white text-left">What is Delema API?</h3>
              <i class="fas fa-chevron-down text-primary transition-transform"></i>
            </button>
            <div class="faq-content hidden px-6 py-4 border-t border-border bg-background/50">
              <p class="text-gray-400 leading-relaxed">Delema API is a powerful platform providing AI-driven automation and integration capabilities. It allows developers to seamlessly incorporate advanced AI features into their applications through simple REST APIs.</p>
            </div>
          </div>
          <div class="rounded-xl border border-border bg-card overflow-hidden transition-colors">
            <button onclick="toggleFaq(this)" class="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-800/50 transition-colors">
              <h3 class="text-lg font-semibold text-white text-left">How do I get started?</h3>
              <i class="fas fa-chevron-down text-primary transition-transform"></i>
            </button>
            <div class="faq-content hidden px-6 py-4 border-t border-border bg-background/50">
              <p class="text-gray-400 leading-relaxed">Getting started is easy! Sign up for a free account, generate your API key, and follow our documentation to make your first API request.</p>
            </div>
          </div>
        </div>
      </section>
      <script>
        function toggleFaq(btn) {
          const content = btn.nextElementSibling;
          const icon = btn.querySelector('i');
          content.classList.toggle('hidden');
          icon.classList.toggle('rotate-180');
        }
      </script>
  `;

  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    ${commonHead}
    <body>
      ${commonHeader}
      ${heroHtml}
      ${featuresHtml}
      ${consoleHtml}
      ${pricingHtml}
      ${faqHtml}
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
            html += '<div class="category-block mb-16">';
            html += '<div class="flex items-center justify-between mb-6 pb-2 border-b border-border"><h2 class="text-2xl font-bold text-white flex items-center gap-3"><i class="fas ' + cat.icon + ' text-primary"></i> ' + cat.category + '</h2><span class="bg-secondary text-muted-foreground text-xs font-bold px-3 py-1 rounded-full">' + cat.endpoints.length + ' ENDPOINTS</span></div>';
            html += '<div class="grid grid-cols-1 gap-4">';
            cat.endpoints.forEach(function(ep) {
              const bodyStr = ep.body ? JSON.stringify(ep.body, null, 2) : '';
              html += '<div class="endpoint-card bg-card border border-border rounded-xl overflow-hidden hover:border-primary transition-all duration-300" data-search="' + ep.path + ' ' + ep.name + '">';
              html += '<button class="w-full p-6 flex items-center justify-between text-left" onclick="toggleAccordion(this)"><div class="flex items-center gap-4 flex-wrap"><span class="px-3 py-1 rounded-md text-xs font-extrabold ' + (ep.method === 'GET' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-primary/10 text-primary border border-primary/20') + '">' + ep.method + '</span><span class="font-mono text-sm text-gray-200 font-semibold">' + ep.path + '</span><span class="text-muted-foreground text-xs font-bold uppercase tracking-wider">' + ep.name + '</span></div><i class="fas fa-chevron-down text-muted-foreground transition-transform duration-300 chevron"></i></button>';
              html += '<div class="endpoint-content max-h-0 overflow-hidden transition-all duration-500 ease-in-out bg-slate-950/30"><div class="p-6 border-t border-border space-y-6"><p class="text-gray-300 leading-relaxed">' + ep.desc + '</p><div><span class="block text-muted-foreground text-[10px] font-bold uppercase tracking-[0.2em] mb-3">REQUEST ' + (ep.method === 'GET' ? 'PARAMS' : 'BODY') + '</span>';
              html += '<textarea id="input-' + ep.path + '" class="w-full bg-background border border-border rounded-lg p-4 text-sm font-mono text-gray-300 outline-none focus:border-primary transition-colors min-h-[120px]" spellcheck="false">' + (ep.method === 'GET' ? ep.queryParams : bodyStr) + '</textarea></div>';
              html += '<button id="btn-' + ep.path + '" class="w-full gradient-button text-white font-bold py-4 rounded-lg flex items-center justify-center gap-3 hover:shadow-xl transition-all" onclick="executeRequest(\\'' + ep.method + '\\', \\'' + ep.path + '\\')"><i class="fas fa-play text-xs"></i> EXECUTE REQUEST</button>';
              html += '<div id="res-container-' + ep.path + '" class="hidden pt-8"><div class="flex items-center justify-between mb-4"><span class="text-muted-foreground text-[10px] font-bold uppercase tracking-[0.2em]">RESPONSE</span><span id="status-' + ep.path + '" class="text-xs font-mono font-bold px-2 py-1 rounded"></span></div><div class="relative group"><button class="absolute top-4 right-4 z-10 opacity-30 group-hover:opacity-100 transition-opacity bg-secondary/80 text-white text-xs px-2 py-1 rounded" onclick="copyToClipboard(\\'' + ep.path + '\\')"><i class="far fa-copy mr-1"></i> Copy</button><div id="body-' + ep.path + '" class="bg-background border border-border rounded-lg p-6 font-mono text-sm text-gray-300 overflow-auto max-h-[600px] whitespace-pre-wrap word-break-all"></div></div></div>';
              html += '</div></div></div>';
            });
            html += '</div></div>';
          });
          container.innerHTML = html;
        }

        function toggleAccordion(btn) { 
          const card = btn.parentElement; 
          const content = btn.nextElementSibling;
          const chevron = btn.querySelector('.chevron');
          const isActive = card.classList.contains('active'); 
          
          if (isActive) {
            card.classList.remove('active');
            content.style.maxHeight = '0';
            chevron.classList.remove('rotate-180');
          } else {
            // Close others
            document.querySelectorAll('.endpoint-card.active').forEach(el => {
              el.classList.remove('active');
              el.querySelector('.endpoint-content').style.maxHeight = '0';
              el.querySelector('.chevron').classList.remove('rotate-180');
            });
            card.classList.add('active'); 
            content.style.maxHeight = content.scrollHeight + 'px';
            chevron.classList.add('rotate-180');
          }
        }

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
                empty.className = 'text-center py-20 bg-card border border-dashed border-border rounded-2xl';
                empty.innerHTML = '<i class="fas fa-search text-4xl text-muted-foreground mb-4"></i><h3 class="text-xl font-bold text-white">No results found</h3><p class="text-muted-foreground mt-2">Try searching for a different keyword or path.</p>';
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
          
          resContainer.classList.remove('hidden');
          resBody.innerHTML = '<div class="flex items-center gap-2"><i class="fas fa-spinner fa-spin text-primary"></i> Executing request...</div>';
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
            if (remaining) {
                const infoEl = document.getElementById('rate-limit-info');
                if (infoEl) infoEl.textContent = remaining + ' REQS LEFT';
            }
            
            const data = await res.json();
            resStatus.textContent = res.status + ' ' + res.statusText + ' (' + duration + 'ms)';
            resStatus.className = 'text-xs font-mono font-bold px-2 py-1 rounded ' + (res.ok ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500');
            
            resBody.innerHTML = '';
            
            if (data.ai_summary) { 
              const summaryDiv = document.createElement('div');
              summaryDiv.className = 'bg-primary/10 border-l-4 border-primary p-5 mb-6 rounded-r-lg text-gray-200 italic leading-relaxed text-sm';
              summaryDiv.innerHTML = '<div class="not-italic font-bold text-primary mb-1 tracking-widest text-[10px] uppercase">AI INSIGHT</div>' + data.ai_summary;
              resBody.appendChild(summaryDiv);
            }
            
            const pre = document.createElement('pre');
            pre.className = 'language-json m-0 p-0 bg-transparent whitespace-pre-wrap break-all';
            pre.textContent = JSON.stringify(data, null, 2);
            resBody.appendChild(pre);
            
            hljs.highlightElement(pre);
            
            // Adjust accordion height
            const content = executeBtn.closest('.endpoint-content');
            content.style.maxHeight = 'none';
          } catch (err) { 
            resStatus.textContent = 'CONNECTION ERROR'; 
            resStatus.className = 'text-xs font-mono font-bold px-2 py-1 rounded bg-red-500/10 text-red-500'; 
            resBody.textContent = 'Failed to connect to the server: ' + err.message; 
          } finally {
            executeBtn.disabled = false;
            executeBtn.innerHTML = '<i class="fas fa-play text-xs"></i> EXECUTE REQUEST';
          }
        }

        function copyToClipboard(path) {
            const body = document.getElementById('body-' + path);
            const btn = event.currentTarget;
            const text = body.innerText;
            navigator.clipboard.writeText(text).then(() => {
                const originalHtml = btn.innerHTML;
                btn.innerHTML = '<i class="fas fa-check text-green-500"></i> Copied!';
                setTimeout(() => {
                    btn.innerHTML = originalHtml;
                }, 2000);
            });
        }

        renderEndpoints();
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
    <body>
      ${commonHeader}
      <div class="pt-32 pb-20 px-4 bg-background">
        <div class="max-w-7xl mx-auto">
          <!-- Section Header -->
          <div class="text-center mb-16">
            <h2 class="text-4xl sm:text-5xl font-bold text-white mb-4">
              API <span class="gradient-rainbow-text">Documentation</span>
            </h2>
            <p class="text-gray-400 max-w-2xl mx-auto text-lg">
              Power your applications with the Delema Intelligent Engine.
            </p>
          </div>

          <!-- Documentation Content -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <!-- Left Side - Documentation -->
            <div class="space-y-8">
              <!-- Base URL -->
              <div class="bg-card p-8 rounded-2xl border border-border shadow-xl">
                <h3 class="text-xl font-bold text-white mb-4 flex items-center gap-3">
                  <i class="fas fa-link text-primary"></i> Base URL
                </h3>
                <p class="text-gray-400 mb-4">All API requests should be made to:</p>
                <div class="bg-background p-4 rounded-xl font-mono text-sm text-primary border border-primary/20">
                  https://delema.razael-fox.my.id/api/delema/v1
                </div>
              </div>

              <!-- Authentication -->
              <div class="bg-card p-8 rounded-2xl border border-border shadow-xl">
                <h3 class="text-xl font-bold text-white mb-4 flex items-center gap-3">
                  <i class="fas fa-key text-primary"></i> Authentication
                </h3>
                <p class="text-gray-400 mb-4">Currently, most public endpoints are open but rate-limited. Future versions will require Bearer tokens.</p>
                <div class="bg-background p-4 rounded-xl font-mono text-sm text-gray-400 border border-border">
                  Authorization: Bearer YOUR_API_KEY
                </div>
              </div>

              <!-- Rate Limiting -->
              <div class="bg-card p-8 rounded-2xl border border-border shadow-xl">
                <h3 class="text-xl font-bold text-white mb-4 flex items-center gap-3">
                  <i class="fas fa-bolt text-primary"></i> Rate Limiting
                </h3>
                <ul class="space-y-4 text-gray-400">
                  <li class="flex items-center gap-3"><span class="w-2 h-2 bg-primary rounded-full"></span> <strong>Global:</strong> 100 requests / 15 mins</li>
                  <li class="flex items-center gap-3"><span class="w-2 h-2 bg-primary rounded-full"></span> <strong>AI & Research:</strong> 20 requests / 15 mins</li>
                </ul>
              </div>
            </div>

            <!-- Right Side - Code Examples -->
            <div class="bg-card rounded-2xl border border-border shadow-2xl overflow-hidden flex flex-col">
              <!-- Language Tabs -->
              <div class="flex border-b border-border bg-slate-950/50">
                <button onclick="switchExample(0)" id="tab-0" class="flex-1 py-4 px-4 font-bold text-xs uppercase tracking-widest transition-all text-primary border-b-2 border-primary bg-card">Python</button>
                <button onclick="switchExample(1)" id="tab-1" class="flex-1 py-4 px-4 font-bold text-xs uppercase tracking-widest transition-all text-muted-foreground hover:text-gray-300">JavaScript</button>
                <button onclick="switchExample(2)" id="tab-2" class="flex-1 py-4 px-4 font-bold text-xs uppercase tracking-widest transition-all text-muted-foreground hover:text-gray-300">cURL</button>
              </div>

              <!-- Code Content -->
              <div class="p-8 bg-background flex-1">
                <pre id="code-display" class="font-mono text-sm text-gray-300 overflow-x-auto whitespace-pre"></pre>
              </div>

              <!-- Copy Button -->
              <div class="p-6 border-t border-border bg-slate-950/30 flex justify-between items-center">
                <span class="text-xs text-muted-foreground font-medium italic">
                  Ready to integrate? 🚀
                </span>
                <button onclick="copyExampleCode()" class="gradient-button px-6 py-2 rounded-lg text-white font-bold text-sm transition-all flex items-center gap-2">
                  <i class="far fa-copy"></i> Copy Example
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      ${commonFooter}
      <script>
        const examples = [
          {
            lang: 'python',
            code: \`import requests\\n\\nurl = "https://delema.razael-fox.my.id/api/delema/v1/ai/search"\\ndata = {\\n    "query": "macbook air m3",\\n    "limit": 3,\\n    "lang": "English"\\n}\\n\\nresponse = requests.post(url, json=data)\\nprint(response.json())\`
          },
          {
            lang: 'javascript',
            code: \`const response = await fetch(\\n  'https://delema.razael-fox.my.id/api/delema/v1/ai/search',\\n  {\\n    method: 'POST',\\n    headers: { 'Content-Type': 'application/json' },\\n    body: JSON.stringify({\\n      query: 'macbook air m3',\\n      limit: 3,\\n      lang: 'English'\\n    })\\n  }\\n);\\n\\nconst result = await response.json();\\nconsole.log(result);\`
          },
          {
            lang: 'bash',
            code: \`curl -X POST https://delema.razael-fox.my.id/api/delema/v1/ai/search \\\\\\n  -H "Content-Type: application/json" \\\\\\n  -d '{\\n    "query": "macbook air m3",\\n    "limit": 3,\\n    "lang": "English"\\n  }'\`
          }
        ];

        let activeIdx = 0;

        function switchExample(idx) {
          activeIdx = idx;
          // Update tabs
          for(let i=0; i<3; i++) {
            const tab = document.getElementById('tab-' + i);
            if(tab) {
                if(i === idx) {
                  tab.classList.add('text-primary', 'border-b-2', 'border-primary', 'bg-card');
                  tab.classList.remove('text-muted-foreground');
                } else {
                  tab.classList.remove('text-primary', 'border-b-2', 'border-primary', 'bg-card');
                  tab.classList.add('text-muted-foreground');
                }
            }
          }
          // Update code
          const display = document.getElementById('code-display');
          if(display) {
              display.textContent = examples[idx].code;
              display.className = 'font-mono text-sm text-gray-300 overflow-x-auto language-' + (examples[idx].lang === 'bash' ? 'shell' : examples[idx].lang);
              hljs.highlightElement(display);
          }
        }

        function copyExampleCode() {
          navigator.clipboard.writeText(examples[activeIdx].code).then(() => {
            const btn = event.currentTarget;
            const originalHtml = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-check"></i> Copied!';
            setTimeout(() => { btn.innerHTML = originalHtml; }, 2000);
          });
        }

        // Init
        setTimeout(() => switchExample(0), 100);
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
