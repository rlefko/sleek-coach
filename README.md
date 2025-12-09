# Sleek Coach

A fitness coaching mobile app with an AI-powered coach that combines daily check-ins,
nutrition tracking, and adaptive coaching based on user progress.

## Project Structure

```
/apps/mobile    # React Native (Expo) mobile app
/apps/api       # FastAPI backend
/infra          # Terraform infrastructure
/docs           # Documentation
```

## Quick Start

### Backend Development

```bash
# Start all services with Docker
cd apps/api
docker compose up --build

# Or run locally with uv
uv sync
uv run uvicorn app.main:app --reload
```

### Running Tests

```bash
# Backend
cd apps/api
uv run pytest

# Linting
uv run ruff check .
uv run mypy .
```

## Documentation

- [Product Requirements (PRD)](docs/PRD.md)
- [Technical Design (TDD)](docs/TDD.md)
- [Implementation Milestones](docs/MILESTONES.md)

## Tech Stack

- **Backend**: FastAPI, SQLModel, PostgreSQL, Redis
- **Mobile**: React Native (Expo), TypeScript
- **Infrastructure**: AWS (ECS, RDS, S3), Terraform
- **AI**: LLM-powered coaching with tool-calling architecture

## CI/CD Status

![CI](https://github.com/rlefkowitz/sleek-coach/workflows/CI/badge.svg)
![Python](https://img.shields.io/badge/python-3.12-blue)

## License

Private - All rights reserved
