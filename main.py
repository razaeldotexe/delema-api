import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from routers import recommendations, rules, routing

# Configuration
PORT = int(os.getenv("PORT", 8000))

app = FastAPI(
    title="Delema API",
    description="Decision-Support API for Complex Logic, Recommendations, and Automated Choices",
    version="3.0.0"
)

# Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(recommendations.router, prefix="/api/v1")
app.include_router(rules.router, prefix="/api/v1")
app.include_router(routing.router, prefix="/api/v1")

@app.get("/", response_class=HTMLResponse)
async def root():
    return """
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Delema API | Decision Support Engine</title>
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
        <style>
            body { background: #0f172a; color: #e2e8f0; font-family: 'Inter', sans-serif; }
            .hero { padding: 80px 0; border-bottom: 1px solid #1e293b; background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%); }
            .card { background: #1e293b; border: 1px solid #334155; color: #e2e8f0; border-radius: 12px; transition: transform 0.2s; }
            .card:hover { transform: translateY(-5px); }
            code { color: #38bdf8; background: #0f172a; padding: 4px 8px; border-radius: 6px; font-size: 0.9em; }
            .endpoint { border-left: 4px solid #38bdf8; padding-left: 15px; margin-bottom: 25px; }
            .badge-post { background: #6366f1; color: white; padding: 5px 10px; }
            .text-info { color: #38bdf8 !important; }
        </style>
    </head>
    <body>
        <div class="hero text-center">
            <div class="container">
                <h1 class="display-3 fw-bold text-info mb-3">Delema API</h1>
                <p class="lead text-secondary mb-4">The Decision-Support Engine for Modern Applications</p>
                <div class="d-flex justify-content-center gap-2">
                    <span class="badge bg-success rounded-pill">v3.0.0 Stable</span>
                    <span class="badge bg-primary rounded-pill">Decision Engine</span>
                </div>
            </div>
        </div>

        <div class="container my-5">
            <div class="row">
                <div class="col-md-10 mx-auto">
                    
                    <div class="row g-4 mb-5">
                        <div class="col-md-4">
                            <div class="card h-100 p-3">
                                <h5 class="text-info">Recommendations</h5>
                                <p class="small text-secondary">Calculate weighted scores for item prioritization and ranking.</p>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="card h-100 p-3">
                                <h5 class="text-info">Business Rules</h5>
                                <p class="small text-secondary">Evaluate complex conditional logic and decision trees against context.</p>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="card h-100 p-3">
                                <h5 class="text-info">Automated Routing</h5>
                                <p class="small text-secondary">Deterministic A/B testing and variant assignment via consistent hashing.</p>
                            </div>
                        </div>
                    </div>

                    <h3 class="mb-4">API Documentation</h3>
                    
                    <div class="card mb-4 shadow-sm">
                        <div class="card-body p-4">
                            <div class="endpoint">
                                <span class="badge badge-post mb-2">POST</span>
                                <h5>/api/v1/recommend/score</h5>
                                <p class="text-secondary small">Ranks items based on weighted features.</p>
                                <code>POST {"items": [...], "weights": {"feature_a": 0.8}}</code>
                            </div>

                            <div class="endpoint">
                                <span class="badge badge-post mb-2">POST</span>
                                <h5>/api/v1/rules/evaluate</h5>
                                <p class="text-secondary small">Evaluates logical rulesets (AND/OR) against facts.</p>
                                <code>POST {"ruleset": {"condition": "AND", "rules": [...]}, "facts": {...}}</code>
                            </div>

                            <div class="endpoint">
                                <span class="badge badge-post mb-2">POST</span>
                                <h5>/api/v1/rules/decision-tree</h5>
                                <p class="text-secondary small">Traverses a decision tree to return an outcome.</p>
                                <code>POST {"tree": {"condition": {...}, "true_node": ...}, "facts": {...}}</code>
                            </div>

                            <div class="endpoint">
                                <span class="badge badge-post mb-2">POST</span>
                                <h5>/api/v1/routing/ab-test</h5>
                                <p class="text-secondary small">Assigns a user to a variant deterministically.</p>
                                <code>POST {"user_id": "u123", "variants": [{"name": "A", "weight": 50}]}</code>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>

        <footer class="text-center py-5 text-secondary border-top border-secondary-subtle">
            <div class="container">
                <p class="mb-0">&copy; 2026 OpenZero Project. Built for complex automated choices.</p>
            </div>
        </footer>
    </body>
    </html>
    """

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=PORT)
