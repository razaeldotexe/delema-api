---
title: "FastAPI to Node.js Conversion Implementation Plan"
design_ref: "docs/maestro/plans/2026-04-22-fastapi-to-nodejs-conversion-design.md"
created: "2026-04-22T10:35:14.375Z"
status: "approved"
total_phases: 5
estimated_files: 25
task_complexity: "complex"
---

# FastAPI to Node.js Conversion Implementation Plan

## Plan Overview
- **Total phases**: 5
- **Agents involved**: coder, tester
- **Estimated effort**: Complex (Full conversion, recursive logic, utility mapping)

## Dependency Graph
```
Phase 1 (Foundation)
    |
Phase 2 (Utilities & Models)
    |
Phase 3 (Core Logic: Rules & Scoring)
    |
Phase 4 (Routers & Entry)
    |
Phase 5 (Quality & Deployment)
```

## Execution Strategy
| Stage | Phases | Execution | Agent Count | Notes |
|-------|--------|-----------|-------------|-------|
| 1     | Phase 1 | Sequential | 1 | Foundation Setup |
| 2     | Phase 2 | Sequential | 1 | Shared Utils & Types |
| 3     | Phase 3 | Sequential | 1 | Core Recursive Logic |
| 4     | Phase 4 | Sequential | 1 | API Integration |
| 5     | Phase 5 | Sequential | 1 | Quality & Deployment |

## Phase 1: Foundation
- **Objective**: Set up the Node.js project with TypeScript, Express, and pnpm.
- **Agent**: coder
- **Files**: `package.json`, `tsconfig.json`, `pnpm-lock.yaml`, `.env`.

## Phase 2: Utilities & Models
- **Objective**: Re-implement core utilities (logger, fetcher) and define Zod schemas.
- **Agent**: coder
- **Files**: `src/utils/logger.ts`, `src/utils/product_fetcher.ts`, `src/types/schemas.ts`.

## Phase 3: Core Logic (Rules & Scoring)
- **Objective**: Port the recursive rule evaluation and weighted scoring logic.
- **Agent**: coder
- **Files**: `src/routers/rules.ts`, `src/routers/recommendations.ts`, `src/logic/rules_engine.ts`.

## Phase 4: Routers & Entry
- **Objective**: Integrate all remaining routers and the main Express entry point.
- **Agent**: coder
- **Files**: `src/main.ts`, `src/routers/routing.ts`, `src/routers/weather.ts`, `src/routers/github.ts`, `src/middleware/logger.ts`.

## Phase 5: Quality & Deployment
- **Objective**: Add unit tests and update deployment configuration.
- **Agent**: tester
- **Files**: `tests/rules.test.ts`, `tests/scoring.test.ts`, `Procfile`, `nixpacks.toml`.

## File Inventory
| # | File | Phase | Purpose |
|---|------|-------|---------|
| 1 | `package.json` | 1 | Node.js project config |
| 2 | `tsconfig.json` | 1 | TypeScript config |
| 3 | `pnpm-lock.yaml` | 1 | Dependency lock file |
| 4 | `.env` | 1 | Environment variables |
| 5 | `src/utils/logger.ts` | 2 | WebhookLogger re-implementation |
| 6 | `src/utils/product_fetcher.ts` | 2 | Product fetching utility |
| 7 | `src/types/schemas.ts` | 2 | Zod models/types |
| 8 | `src/routers/rules.ts` | 3 | Rule evaluation router |
| 9 | `src/routers/recommendations.ts` | 3 | Weighted scoring router |
| 10 | `src/logic/rules_engine.ts` | 3 | Core recursive logic |
| 11 | `src/main.ts` | 4 | Express entry point |
| 12 | `src/routers/routing.ts` | 4 | Deterministic routing |
| 13 | `src/routers/weather.ts` | 4 | Weather API integration |
| 14 | `src/routers/github.ts" | 4 | GitHub API integration |
| 15 | `src/middleware/logger.ts` | 4 | Logging middleware |
| 16 | `tests/rules.test.ts` | 5 | Rules unit tests |
| 17 | `tests/scoring.test.ts` | 5 | Scoring unit tests |
| 18 | `Procfile` | 5 | Deployment process config |
| 19 | `nixpacks.toml` | 5 | Build environment config |

## Risk Classification
| Phase | Risk | Rationale |
|-------|------|-----------|
| 1 | LOW | Standard project setup |
| 2 | MEDIUM | Library mapping accuracy |
| 3 | HIGH | Recursive logic parity |
| 4 | MEDIUM | Integration complexity |
| 5 | LOW | Standard testing/deployment |

## Execution Profile
```
Execution Profile:
- Total phases: 5
- Parallelizable phases: 0
- Sequential-only phases: 5
- Estimated parallel wall time: N/A
- Estimated sequential wall time: Moderate (Significant coding/testing)

Note: Native subagents currently run without user approval gates.
All tool calls are auto-approved without user confirmation.
```
