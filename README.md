# Delema API

Delema API is a specialized decision-support engine designed to help developers handle complex logic, recommendations, and automated choices in their applications. It provides a set of high-performance tools for scoring, rule evaluation, and deterministic routing.

## Key Features

### Recommendations & Scoring
- **Weighted Scoring**: Rank items based on multiple weighted features.
- **Dynamic Prioritization**: Calculate importance scores on-the-fly for feeds or search results.

### Business Logic & Rules Engine
- **Boolean Evaluation**: Evaluate complex, nested AND/OR conditions against input facts.
- **Decision Trees**: Traverse JSON-based decision trees to automate multi-step logic.
- **Rich Operators**: Supports `=`, `!=`, `>`, `<`, `>=`, `<=`, `IN`, and `NOT IN`.

### Automated Choices & Routing
- **Deterministic A/B Testing**: Consistent variant assignment using hashing (consistent hashing).
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
- **Python 3.10+**

### Installation
1. Clone the repository:
   ```bash
   git clone git@github.com:razaeldotexe/delema-api.git
   cd delema-api
   ```
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Run the server:
   ```bash
   python main.py
   # or
   uvicorn main:app --host 0.0.0.0 --port 8000
   ```

## Deployment
This API is ready for deployment on **Railway**, **Render**, or any platform supporting **Nixpacks** or **Procfile**.

---
&copy; 2026 OpenZero Project.
