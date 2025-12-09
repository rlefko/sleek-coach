TDD — Architecture, Backend, Mobile, AI Agent, DevOps

1) High-Level Architecture

Clients
	•	React Native app (Material Design)
	•	(Optional) web admin console (later)

Backend
	•	FastAPI (Uvicorn) API
	•	Postgres (SQLModel + Alembic)
	•	Object storage for photos (S3 in prod; MinIO locally optional)
	•	Background jobs (recommended): Redis + RQ/Celery (or AWS SQS in prod)

AI Layer
	•	“Coach Orchestrator” service/module inside backend:
	•	LLM provider client
	•	tool registry + policy engine
	•	audit trail

Integrations
	•	MyFitnessPal connector module (Tier A/B/C)
	•	Web search tool via a proper Search API (not scraping)

Data Flow (typical)
	1.	User logs weight/photo → app stores locally → syncs to API
	2.	AI coach request → backend fetches user profile + recent data → computes metrics → may call web search / recipes → returns recommendation + tool trace

⸻

2) Mobile App (React Native) Technical Design

2.1 Stack
	•	React Native (Expo recommended for speed unless you need custom native SDKs)
	•	React Native Paper (Material 3) + Material You theming
	•	React Navigation
	•	TanStack Query (server state) + Zustand/Redux Toolkit (UI/local state)
	•	Form validation: Zod + React Hook Form
	•	Charts: victory-native or react-native-skia charting (choose one)

2.2 Key Screens (MVP)
	1.	Auth
	2.	Onboarding
	•	Goal, preferences, baseline metrics, privacy toggles
	3.	Home (Today)
	•	quick actions: weight, photo, nutrition
	4.	Check-in
	•	weight input, optional photo, notes
	5.	Progress
	•	weight trend + adherence + comparisons
	6.	Coach (Chat)
	•	streaming responses, “Used tools” disclosure
	7.	Settings
	•	integrations, export, delete

2.3 Material Design Rules
	•	Use Material 3 color system + dynamic theme support
	•	Motion: subtle transitions, shared element (optional)
	•	Typography scale consistent; avoid custom fonts until later
	•	Components: AppBar, FAB for “Quick Check-in”, bottom navigation with 3–4 tabs max

2.4 Offline-first approach
	•	Store check-ins locally (SQLite/MMKV)
	•	Background sync queue when network available
	•	Resolve conflicts: “server is source of truth; last-write-wins for notes; photos immutable”

2.5 Testing (Mobile)
	•	Unit: Jest
	•	UI: React Native Testing Library
	•	E2E: Detox
	•	Snapshot tests for key screens (stable theming)

⸻

3) Backend (FastAPI + SQLModel + Postgres)

3.1 Stack
	•	FastAPI + Uvicorn
	•	SQLModel (SQLAlchemy) + Alembic migrations
	•	Postgres
	•	Pydantic v2 models/schemas
	•	Auth: JWT + refresh tokens (or Auth provider like Cognito)
	•	Object storage: S3 (prod), MinIO (local)
	•	Background jobs: Redis + RQ/Celery (recommended)
	•	Observability: OpenTelemetry + structured logs

3.2 Service boundaries (modules)
	•	auth/ (tokens, sessions, password reset)
	•	users/ (profile, preferences, goals)
	•	checkins/ (weight, metrics, notes)
	•	photos/ (upload, signed URLs, metadata)
	•	nutrition/ (manual logs + imports)
	•	integrations/ (mfp, apple health later)
	•	coach_ai/ (agent orchestration, tools, policies)
	•	admin/ (feature flags, safety review tools; later)

3.3 Database schema (MVP)
Core tables (suggested):
	•	user
	•	user_profile (height, sex, DOB range, activity level)
	•	user_goal (goal type, target weight, pace preference)
	•	diet_preferences (diet type, allergies, dislikes)
	•	check_in (date, weight, notes, adherence score snapshot)
	•	progress_photo (date, s3_key, hash, visibility, metadata)
	•	nutrition_day (date, calories, protein, carbs, fat, source)
	•	integration_account (provider, external_user_id, tokens encrypted)
	•	ai_session (conversation metadata)
	•	ai_tool_call_log (tool, input hash, output summary, timestamps)

Notes
	•	Photos: store only metadata + S3 key in DB.
	•	Encrypt integration tokens at rest (KMS in prod).

3.4 API design (REST)
Base: /api/v1

Auth
	•	POST /auth/register
	•	POST /auth/login
	•	POST /auth/refresh
	•	POST /auth/logout

Profile
	•	GET /me
	•	PATCH /me/profile
	•	PATCH /me/goals
	•	PATCH /me/preferences

Check-ins
	•	POST /checkins
	•	GET /checkins?from=&to=
	•	GET /checkins/latest

Photos
	•	POST /photos/presign (returns signed upload URL)
	•	POST /photos/commit (confirm upload + metadata)
	•	GET /photos?from=&to=

Nutrition
	•	POST /nutrition/day
	•	GET /nutrition/day?date=
	•	POST /nutrition/import/mfp_csv (Tier C)

AI Coach
	•	POST /coach/chat (streaming supported)
	•	POST /coach/plan (weekly plan)
	•	GET /coach/insights (weekly insights)

Integrations
	•	POST /integrations/mfp/connect (Tier A/B)
	•	POST /integrations/mfp/disconnect
	•	POST /integrations/mfp/sync

3.5 Auth & Security
	•	Passwords: Argon2/bcrypt
	•	JWT access tokens short-lived; refresh tokens stored hashed
	•	RBAC minimal (user/admin)
	•	Rate limiting on AI endpoints + auth endpoints
	•	Audit trail for:
	•	logins
	•	integration connect/disconnect
	•	AI tool calls that hit external APIs

⸻

4) AI Agent / Tool-Calling System Design

4.1 “Coach Orchestrator” responsibilities
	•	Build a user context object:
	•	goal, prefs
	•	recent check-ins and nutrition
	•	adherence/trend metrics
	•	Call LLM with:
	•	system policy (safety + style)
	•	tool definitions
	•	context summary (not raw dumps)
	•	Execute tool calls with:
	•	allowlist + per-user consent
	•	rate limits + caching
	•	logging and redaction

4.2 Tool Registry (examples)
Internal tools (safe, deterministic):
	•	get_user_profile(user_id)
	•	get_recent_checkins(user_id, days)
	•	get_weight_trend(user_id, days)
	•	get_nutrition_summary(user_id, days)
	•	create_recommendation_plan(user_id, params)
	•	store_coach_note(user_id, note)

External tools (guarded):
	•	search_web(query) (via approved Search API; return snippets + sources)
	•	fetch_recipe(url) (only from allowed domains, summarize; avoid copying)
	•	mfp_sync(user_id) (if connected)

4.3 Safety policy (hard rules)
	•	Never recommend dangerously low calories or extreme weight loss pace.
	•	If user shows eating disorder risk signals → respond with supportive guidance and recommend professional help.
	•	Always provide “this is informational” disclaimer in relevant contexts.
	•	Refuse medical claims; advise consulting clinician for medical conditions.

4.4 Explainability UX requirements
Return payload from /coach/chat includes:
	•	assistant message
	•	tool_trace[] (tool name, purpose, high-level output summary, sources)
	•	confidence + “what would improve confidence”

⸻

5) MyFitnessPal Integration (Technical)

Because access can be restricted  ￼, implement connectors as adapters:

Interface
	•	IntegrationProvider:
	•	connect(), disconnect()
	•	sync_range(from, to)
	•	health_check()

Tier C Import (MVP recommended)
	•	Upload zip/CSV
	•	Parse:
	•	nutrition day totals
	•	weight/measurements history
	•	exercise history
MyFitnessPal exports these as CSVs inside a zip.  ￼

⸻

6) Dockerized Local Dev (docker-compose)

Compose services
	•	api (FastAPI/Uvicorn)
	•	db (postgres)
	•	migrate (alembic upgrade head on startup / manual)
	•	redis (optional, for jobs)
	•	minio (optional, for photo storage locally)

Key requirements
	•	One-command startup: docker compose up --build
	•	Hot reload in api container
	•	Seed dev user + sample data script

⸻

7) CI/CD + AWS Deployment (GitHub Actions)

Repo strategy
	•	Monorepo:
	•	/apps/mobile
	•	/apps/api
	•	/infra (Terraform/CDK)
	•	/docs

CI pipeline (per PR)
	•	Lint (ruff/black, eslint)
	•	Type check (mypy, tsc)
	•	Unit tests (pytest, jest)
	•	Build docker image
	•	Run integration tests using ephemeral Postgres (testcontainers)

CD pipeline (main branch)
	•	Build + push API image to ECR
	•	Run migrations (Alembic) in a controlled job
	•	Deploy to AWS (recommended path):
	•	ECS Fargate service for API
	•	RDS Postgres
	•	S3 for photos
	•	CloudFront (optional)
	•	Secrets Manager + IAM OIDC from GitHub

Environments
	•	staging and prod with separate DBs/buckets/secrets
	•	Feature flags for AI + integrations

⸻

8) Documentation Requirements (README + docs/)

README must include
	•	elevator pitch + screenshots
	•	local dev quickstart
	•	architecture diagram
	•	testing instructions
	•	deployment overview
	•	contribution guidelines + code style

/docs should include
	•	PRD (living)
	•	API reference (OpenAPI + examples)
	•	DB schema & migrations guide
	•	AI safety & tool policy
	•	Integration notes (MFP tiers, import formats)
	•	Runbook (on-call style): common incidents, rollback, migrations

⸻

9) Testing Strategy (Backend)
	•	Unit tests (pure functions: TDEE, trend calculations, parsers)
	•	API tests (FastAPI TestClient/httpx)
	•	DB tests (transaction rollbacks, migration tests)
	•	Contract tests (OpenAPI schema snapshots)
	•	Security tests (auth flows, rate limiting)
	•	Load tests (k6) for /coach/chat and check-ins

⸻

10) Key Risks & Mitigations (Engineering)
	•	MFP access unavailable: ship MVP with manual logging + CSV import; keep connector abstraction.  ￼
	•	AI cost / latency: caching + smaller model for routine insights; stream responses.
	•	Privacy concerns with photos: signed URLs, private buckets, strict ACL, optional “local-only mode”.
	•	Recommendation safety: policy engine + hard constraints + auditing + feature flags.
