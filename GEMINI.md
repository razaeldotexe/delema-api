# GEMINI.md - Delema API Project Context

## Project Overview
**Delema API** is a specialized decision-support engine designed to handle complex logic, recommendations, and automated choices. It provides high-performance endpoints for weighted scoring, rule-based logic evaluation, and deterministic user routing.

- **Primary Technologies**: Python 3.10+, FastAPI, Pydantic v2.
- **Architecture**: Modular structure using FastAPI `APIRouter`. Logic is separated into specific domains under the `routers/` directory.
- **Key Modules**:
    - `recommendations`: Weighted scoring algorithms for item prioritization.
    - `rules`: A recursive logic engine for evaluating boolean rulesets and traversing decision trees.
    - `routing`: Consistent hashing implementation for deterministic A/B testing and variant assignment.

## Building and Running

### Installation
Install the required dependencies using pip:
```bash
pip install -r requirements.txt
```

### Running the Application
Start the development server:
```bash
python main.py
# or
uvicorn main:app --host 0.0.0.0 --port 8000
```

### Deployment
The project is configured for deployment on platforms like Railway or Render using the included `Procfile` and `nixpacks.toml`.
- **Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`

## Development Conventions

### Code Style & Patterns
- **Data Validation**: Rigorous use of **Pydantic v2** models for all request and response bodies. Models should be defined clearly in the router files or a dedicated `models.py` (if the project grows).
- **Modularity**: New decision logic or features should be implemented as new routers in the `routers/` directory and registered in `main.py`.
- **Logic Evaluation**: Rule evaluation uses a recursive pattern. When extending operators (e.g., `IN`, `NOT IN`), ensure they are handled within the `evaluate_rule` function in `routers/rules.py`.
- **Hashing**: Hashing for routing is done using `md5` to ensure consistency across sessions for a given `user_id`.

### API Documentation
- **Auto-Docs**: FastAPI's `/docs` (Swagger) and `/redoc` are available for interactive testing.
- **Custom Landing**: The root endpoint `/` serves a custom HTML dashboard that summarizes the engine's capabilities and provides usage examples.

### Dependencies
- Avoid adding heavy external dependencies unless necessary for specialized mathematical or decision-making logic.
- Ensure any new dependency is added to `requirements.txt`.

## Project Structure
- `main.py`: Entry point, middleware configuration, and router registration.
- `routers/`:
    - `recommendations.py`: Scoring logic.
    - `rules.py`: Boolean logic engine and decision tree traversal.
    - `routing.py`: A/B testing and variant assignment.
- `requirements.txt`: Python package dependencies.
- `Procfile`: Deployment instruction for web processes.
- `README.md`: User-facing documentation.
