.PHONY: help install dev lint format type-check test test-cov run migrate seed clean

PYTHON := uv run python
PYTEST := uv run pytest
RUFF := uv run ruff
MYPY := uv run mypy
ALEMBIC := uv run alembic
UVICORN := uv run uvicorn

help:
	@echo "Available commands:"
	@echo "  install     - Install dependencies"
	@echo "  dev         - Install all dependencies (including dev)"
	@echo "  lint        - Run ruff linter"
	@echo "  format      - Format code with ruff"
	@echo "  type-check  - Run mypy type checker"
	@echo "  test        - Run tests"
	@echo "  test-cov    - Run tests with coverage"
	@echo "  run         - Start development server"
	@echo "  migrate     - Run database migrations"
	@echo "  seed        - Seed development data"
	@echo "  clean       - Remove cache files"

install:
	uv sync

dev:
	uv sync --all-groups

lint:
	$(RUFF) check .

format:
	$(RUFF) format .
	$(RUFF) check --fix .

type-check:
	$(MYPY) app

test:
	$(PYTEST)

test-cov:
	$(PYTEST) --cov=app --cov-report=html --cov-report=term-missing

run:
	$(UVICORN) app.main:app --reload --host 0.0.0.0 --port 8000

migrate:
	$(ALEMBIC) upgrade head

migrate-create:
	@read -p "Migration message: " msg; \
	$(ALEMBIC) revision --autogenerate -m "$$msg"

migrate-down:
	$(ALEMBIC) downgrade -1

seed:
	$(PYTHON) scripts/seed.py

clean:
	find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name ".pytest_cache" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name ".mypy_cache" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name ".ruff_cache" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name "htmlcov" -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name ".coverage" -delete 2>/dev/null || true
