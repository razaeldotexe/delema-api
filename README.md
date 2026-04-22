# Delema API

Delema API is a specialized decision-support engine designed to help developers handle complex logic, recommendations, and automated choices. Originally written in Python/FastAPI, it is now a high-performance **Node.js** API built with **TypeScript**, **Express**, and **Zod**.

## Key Features

### Recommendations & Scoring
- **Weighted Scoring**: Rank items based on multiple weighted features.
- **Dynamic Prioritization**: Calculate importance scores on-the-fly for feeds or search results.

### Business Logic & Rules Engine
- **Boolean Evaluation**: Evaluate complex, nested AND/OR conditions against input facts.
- **Decision Trees**: Traverse JSON-based decision trees to automate multi-step logic.
- **Rich Operators**: Supports `=`, `!=`, `>`, `<`, `>=`, `<=`, `IN`, and `NOT IN`.

### Automated Choices & Routing
- **Deterministic A/B Testing**: Consistent variant assignment using hashing (MD5).
- **Weighted Distribution**: Route users to different features or configurations based on custom percentages.

## API Endpoints (v1)

### Recommendations
- `POST /api/v1/recommend/score`: Ranks items based on weighted features.

### Rules Engine
- `POST /api/v1/rules/evaluate`: Evaluates logical rulesets against facts.
- `POST /api/v1/rules/decision-tree`: Traverses a decision tree to return an outcome.

### Automated Routing
- `POST /api/v1/routing/ab-test`: Assigns a user to a variant deterministically.

## Getting Started

### Prerequisites
- **Node.js 18+**
- **pnpm** (recommended)

### Installation
1. Clone the repository:
   ```bash
   git clone git@github.com:razaeldotexe/delema-api.git
   cd delema-api
   ```
2. Install dependencies:
   ```bash
   pnpm install
   ```
3. Build the project:
   ```bash
   pnpm run build
   ```
4. Run the server:
   ```bash
   pnpm run start
   ```

### Testing
Run the unit tests for core logic and scoring:
```bash
pnpm run test
```

## Deployment
This API is ready for deployment on **Railway**, **Render**, or any platform supporting **Nixpacks** or **Procfile**. The current configuration uses the bundled `Procfile` and `nixpacks.toml`.

---
&copy; 2026 OpenZero Project.
