# GEMINI.md - Delema API Project Context

## Project Overview

**Delema API** is a specialized decision-support engine designed to handle complex logic, AI-powered research, and automated data retrieval. It provides high-performance endpoints for academic synthesis, regulatory data search, and intelligent AI-driven routing.

- **Primary Technologies**: Node.js (18+), TypeScript, Express.js.
- **Architecture**: Modular structure using Express `Router`. Logic is separated into specific domains under the `src/routers/` directory.
- **Validation**: Strict schema validation using **Zod** for all request and response bodies.

## Building and Running

### Installation

Install the required dependencies using pnpm:

```bash
pnpm install
```

### Running the Application

Start the development server:

```bash
pnpm run dev
```

Build and start for production:

```bash
pnpm run build
pnpm run start
```

### Deployment

The project is configured for deployment using the included `Procfile` and `nixpacks.toml`.

- **Command**: `node dist/main.js`

## Development Conventions

### Code Style & Patterns

- **Data Validation**: Every endpoint must use Zod schemas defined in `src/types/schemas.ts` to validate incoming requests and outgoing responses.
- **Modularity**: New logic or features should be implemented as new routers in the `src/routers/` directory and registered in `src/main.ts`.
- **AI Integration**: AI-driven features (summaries, intelligent search) should leverage the `tryAllProviders` helper in `src/utils/ai_helper.ts` for multi-LLM resilience (Gemini, Groq, OpenRouter).
- **Rate Limiting**: Critical endpoints (AI/Research) must be rate-limited using the custom middleware in `src/middleware/rateLimiter.ts`.

### API Documentation

- **Custom Console**: The root endpoint `/` serves an interactive HTML dashboard (V3) for testing endpoints and viewing documentation.

### Dependencies

- New dependencies should be added via `pnpm add` and verified for compatibility with the TypeScript environment.

## Project Structure

- `src/main.ts`: Entry point, middleware configuration, and router registration.
- `src/routers/`:
  - `research.ts`: ArXiv and Wikipedia AI synthesis.
  - `ai_search.ts`: Intelligent product and content search.
  - `fda.ts`: Regulatory data retrieval with AI TL;DR summaries.
  - `weather.ts`: Real-time weather data integration.
  - `code.ts`: AI-powered developer utilities.
- `src/middleware/`:
  - `rateLimiter.ts`: Spam prevention logic.
  - `logger.ts`: Request/Error logging.
- `src/utils/`:
  - `ai_helper.ts`: Multi-provider AI interface.
- `Procfile`: Deployment instruction for web processes.
- `README.md`: General project documentation.
