---
title: "FastAPI to Node.js Conversion"
created: "2026-04-22T10:30:14.375Z"
status: "approved"
authors: ["TechLead", "User"]
type: "design"
design_depth: "quick"
task_complexity: "complex"
---

# FastAPI to Node.js Conversion Design Document

## Problem Statement

The Delema API, currently implemented in Python/FastAPI, needs to be converted to a Node.js project using Express and TypeScript. The goal is to migrate all existing logic—specifically the weighted scoring, recursive rule evaluation, and deterministic routing—into a more uniform TypeScript ecosystem while maintaining compatibility with the current stateless API contract.

**Key Goals**:
1. Port all FastAPI routers to Express with equivalent TypeScript models (Zod).
2. Implement recursive evaluation of rules and decision trees from `routers/rules.py`.
3. Re-implement the weighted scoring logic from `routers/recommendations.py`.
4. Maintain the `WebhookLogger` singleton for asynchronous log batching.
5. Preserve the current deployment configuration (Procfile, nixpacks.toml).

## Approach

### Selected Approach: Express + TypeScript + Zod

**Summary**: A robust and flexible conversion using Express as the framework, TypeScript for type safety, and Zod for Pydantic-like validation.

**Architecture**:
- **Framework**: Express with `express-async-errors` for robust handling.
- **Validation**: Zod for defining schemas and validating request bodies.
- **Routers**: Replicate the current FastAPI router structure using `express.Router()`.
- **Utilities**: 
  - `WebhookLogger` re-implemented as a singleton using an internal queue and `setInterval` for batching.
  - `product_fetcher` re-implemented using `axios` and direct API calls or specialized npm packages (e.g., `duckduckgo-search`).
  - `routing` re-implemented using `hashids` and `crypto` (md5).

**Pros**:
- High ecosystem familiarity and extensive documentation.
- Excellent type safety with TypeScript and Zod.
- Seamless conversion of Python's async logic to Node.js Promises/async-await.

**Cons**:
- Slightly more boilerplate than FastAPI (e.g., explicit router registration).
- Performance is good but potentially lower than Fastify for high-throughput scenarios.

### Alternatives Considered

#### Fastify
- **Description**: Highly performant Node.js framework.
- **Pros**: Built-in validation, excellent performance.
- **Cons**: Slightly higher complexity in ecosystem plugins.
- **Rejected Because**: Express offers better flexibility and a larger ecosystem for this relatively straightforward conversion.

#### NestJS
- **Description**: Enterprise-grade, modular Node.js framework.
- **Pros**: Opinionated architecture, good for complex apps.
- **Cons**: Overly complex for this stateless logic engine.
- **Rejected Because**: It's too heavyweight for the project's current scope.

## Architecture

### Component Diagram

```
[Request] -> [Express Server] -> [Router Middleware] -> [Router Logic] -> [Response]
                                      |                     |
                                      v                     v
                                  [Zod Schema]          [Recursive Engine]
                                      |                     |
                                      v                     v
                                [Validated Data]      [Result Output]
```

### Data Flow

1. Request hits Express server.
2. Zod middleware validates the request body.
3. If valid, the corresponding router (e.g., `rules`) processes the logic recursively.
4. `WebhookLogger` asynchronously batches logs to Discord/webhooks.
5. Response is returned as JSON.

## Risk Assessment

| Risk | Severity | Likelihood | Mitigation |
|------|----------|------------|------------|
| Logic Parity (Recursive Rules) | HIGH | MEDIUM | Thorough testing with Python inputs and expected outputs. Use Vitest for unit tests. |
| Third-party Library Mapping | MEDIUM | MEDIUM | Research and map Python dependencies (ddgs, hashids) to equivalent Node.js packages. |
| Performance Overhead | LOW | LOW | Use Zod's `safeParse` and benchmark the key logic (scoring, rules) if needed. |
| Deployment Compatibility | MEDIUM | LOW | Ensure Procfile and nixpacks.toml are correctly updated for the Node.js runtime. |

## Success Criteria

1. All FastAPI routers are fully functional in Express/TypeScript.
2. API contracts (request/response bodies) remain identical to the FastAPI implementation.
3. Unit tests achieve 90%+ coverage for core recursive logic.
4. `pnpm run build` and `pnpm run start` work as expected.
5. Deployment to Railway/Render is successful with updated `Procfile` and `nixpacks.toml`.
