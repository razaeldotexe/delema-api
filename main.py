import os
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, RedirectResponse
from routers import recommendations, rules, routing, research, github, ai_search, app_search, fda
from utils.logger import webhook_logger

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

@app.middleware("http")
async def log_requests(request: Request, call_next):
    # Ignore favicon spam
    if request.url.path == "/favicon.ico":
        return await call_next(request)
        
    webhook_logger.log(f"Request: {request.method} {request.url.path}")
    response = await call_next(request)
    webhook_logger.log(f"Response: {response.status_code}")
    return response

@app.get("/favicon.ico", include_in_schema=False)
async def favicon():
    return Response(status_code=204)

@app.on_event("startup")
async def startup_event():
    webhook_logger.log("Delema API is starting up...", "SYSTEM")

# Include Routers
app.include_router(recommendations.router, prefix="/api/v1")
app.include_router(rules.router, prefix="/api/v1")
app.include_router(routing.router, prefix="/api/v1")
app.include_router(research.router, prefix="/api/v1")
app.include_router(github.router, prefix="/api/v1")
app.include_router(ai_search.router, prefix="/api/v1")
app.include_router(app_search.router, prefix="/api/v1")
app.include_router(fda.router, prefix="/api/v1")

@app.get("/", include_in_schema=False)
async def root():
    """Redirect to Swagger UI documentation."""
    return RedirectResponse(url="/docs")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=PORT)
