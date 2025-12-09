# Sleek Coach API

FastAPI backend for the Sleek Coach fitness coaching application.

## Quick Start

```bash
# Install dependencies
uv sync --all-groups

# Start development server
uv run uvicorn app.main:app --reload

# Or use Docker
docker compose up --build
```

## Development Commands

```bash
# Linting
make lint

# Formatting
make format

# Type checking
make type-check

# Run tests
make test

# Run tests with coverage
make test-cov

# Run database migrations
make migrate
```

## API Documentation

When running locally in development mode:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc
- OpenAPI JSON: http://localhost:8000/openapi.json

## Project Structure

```
app/
├── api/v1/          # API routes
├── auth/            # Authentication module
├── users/           # User management
├── checkins/        # Weight/check-in logging
├── photos/          # Progress photo storage
├── nutrition/       # Nutrition tracking
├── integrations/    # External integrations (MFP)
├── coach_ai/        # AI coach system
├── config.py        # Configuration
├── database.py      # Database setup
├── exceptions.py    # Custom exceptions
└── main.py          # Application entry
```
