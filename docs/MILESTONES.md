# Sleek Coach - Implementation Milestones

A comprehensive task breakdown for building the Sleek Coach fitness app.

**Total Phases:** 13
**Total Tasks:** 400+

---

## Key Milestones Overview

| Milestone | Phase | Description |
|-----------|-------|-------------|
| Backend MVP | 4 | Core API functional (auth, check-ins, nutrition) |
| Mobile App (No AI) | 7 | Full mobile app without AI coach |
| Full MVP | 9 | Complete MVP with AI Coach integration |
| Production Ready | 11 | CI/CD pipeline and AWS infrastructure complete |
| Launch Ready | 13 | Documentation, compliance, and final QA complete |

---

## Phase 1: Project Foundation & Infrastructure

### 1.1 Monorepo Setup
- [x] Initialize git repository
- [x] Create directory structure: `/apps/mobile`, `/apps/api`, `/infra`, `/docs`
- [x] Configure root `package.json` with workspaces (if using yarn/npm workspaces)
- [x] Set up shared TypeScript config (`tsconfig.base.json`)
- [x] Create `.gitignore` for all environments (Python, Node, React Native, IDE)
- [x] Set up `.editorconfig` for consistent formatting
- [x] Create initial `README.md` with project overview

### 1.2 Backend Environment Setup
- [x] Create `/apps/api` Python project structure
- [x] Set up `pyproject.toml` with dependencies (FastAPI, SQLModel, uvicorn, etc.)
- [x] Configure `ruff` for linting
- [ ] Configure `black` for formatting
- [x] Configure `mypy` for type checking
- [x] Create `Makefile` with common commands (lint, format, test, run)
- [ ] Set up `.env.example` with required environment variables

### 1.3 Docker Compose Environment
- [x] Create `docker-compose.yml` with services:
  - [x] `api` service (FastAPI with hot reload)
  - [x] `db` service (PostgreSQL 15+)
  - [x] `redis` service (for background jobs)
  - [x] `minio` service (S3-compatible storage for local dev)
- [x] Create `Dockerfile` for API service (multi-stage build)
- [x] Create `.dockerignore`
- [x] Configure volume mounts for hot reload
- [x] Set up health checks for all services
- [x] Create `docker-compose.override.yml` for dev-specific config
- [x] Write startup script that waits for dependencies

### 1.4 Database Foundation
- [x] Configure SQLModel/SQLAlchemy connection
- [x] Set up Alembic for migrations
- [x] Create initial migration (empty baseline)
- [x] Write database connection pool configuration
- [x] Create `alembic.ini` configuration
- [x] Set up migration naming conventions
- [x] Create seed data script for development

### 1.5 Basic CI Pipeline (GitHub Actions)
- [x] Create `.github/workflows/ci.yml`
- [x] Configure Python linting job (ruff, black --check)
- [x] Configure type checking job (mypy)
- [x] Configure unit test job (pytest)
- [x] Set up Python version matrix (3.11, 3.12)
- [x] Configure caching for pip dependencies
- [x] Add status badges to README

---

## Phase 2: Backend Core - Authentication & Users

### 2.1 User Model & Database Schema
- [x] Create `user` table migration:
  - `id` (UUID primary key)
  - `email` (unique, indexed)
  - `hashed_password`
  - `is_active`
  - `is_verified`
  - `created_at`, `updated_at`
- [x] Create `user_profile` table migration:
  - `user_id` (FK)
  - `height_cm`
  - `sex` (enum: male, female, other, prefer_not_to_say)
  - `birth_year` (not full DOB for privacy)
  - `activity_level` (enum: sedentary, light, moderate, active, very_active)
  - `timezone`
- [x] Create `user_goal` table migration:
  - `user_id` (FK)
  - `goal_type` (enum: fat_loss, muscle_gain, recomp, maintenance, performance)
  - `target_weight_kg` (nullable)
  - `pace_preference` (enum: slow, moderate, aggressive)
  - `target_date` (nullable)
- [x] Create `diet_preferences` table migration:
  - `user_id` (FK)
  - `diet_type` (enum: none, vegetarian, vegan, pescatarian, keto, paleo, halal, kosher)
  - `allergies` (array/JSON)
  - `disliked_foods` (array/JSON)
  - `meals_per_day`
- [x] Create SQLModel models for all tables
- [x] Set up table relationships and indexes

### 2.2 Authentication Module
- [x] Create `/apps/api/app/auth/` module structure
- [x] Implement password hashing service (Argon2id)
- [x] Create JWT token service:
  - [x] Access token generation (15min expiry)
  - [x] Refresh token generation (7 day expiry)
  - [x] Token validation/decoding
- [x] Create refresh token storage table migration
- [x] Implement `POST /auth/register` endpoint:
  - [x] Email validation
  - [x] Password strength validation
  - [x] Duplicate email check
  - [x] Create user + profile records
  - [x] Return tokens
- [x] Implement `POST /auth/login` endpoint:
  - [x] Email/password validation
  - [x] Rate limiting (5 attempts per 15min)
  - [x] Return tokens on success
- [x] Implement `POST /auth/refresh` endpoint:
  - [x] Validate refresh token
  - [x] Issue new access token
  - [x] Rotate refresh token
- [x] Implement `POST /auth/logout` endpoint:
  - [x] Invalidate refresh token
- [x] Create auth dependency for protected routes
- [x] Write unit tests for all auth functions
- [x] Write API tests for auth endpoints

### 2.3 User Profile Endpoints
- [x] Create `/apps/api/app/users/` module structure
- [x] Implement `GET /me` endpoint:
  - [x] Return user, profile, goal, preferences
- [x] Implement `PATCH /me/profile` endpoint:
  - [x] Partial update support
  - [x] Validation for numeric ranges
- [x] Implement `PATCH /me/goals` endpoint:
  - [x] Goal type validation
  - [x] Target weight bounds checking
- [x] Implement `PATCH /me/preferences` endpoint:
  - [x] Diet type validation
  - [x] Allergies/dislikes array handling
- [x] Create Pydantic request/response schemas
- [x] Write API tests for all profile endpoints

### 2.4 Security Hardening
- [x] Implement rate limiting middleware (slowapi)
- [x] Configure CORS properly
- [x] Add request ID middleware for tracing
- [x] Set up structured logging (structlog)
- [ ] Create audit log table migration
- [ ] Implement audit logging for auth events
- [x] Add security headers middleware
- [ ] Configure HTTPS redirect (for production)

---

## Phase 3: Backend - Check-ins & Photos

### 3.1 Check-in Model & Endpoints
- [x] Create `check_in` table migration:
  - `id` (UUID)
  - `user_id` (FK, indexed)
  - `date` (date, unique per user)
  - `weight_kg` (decimal)
  - `notes` (text, nullable)
  - `energy_level` (1-5, nullable)
  - `sleep_quality` (1-5, nullable)
  - `mood` (1-5, nullable)
  - `adherence_score` (computed snapshot)
  - `created_at`, `updated_at`
- [x] Create SQLModel model with validations
- [x] Create `/apps/api/app/checkins/` module
- [x] Implement `POST /checkins` endpoint:
  - [x] Date validation (not future)
  - [x] Weight range validation (20-500kg)
  - [x] Upsert logic (update if same date exists)
- [x] Implement `GET /checkins` endpoint:
  - [x] Query params: `from`, `to` dates
  - [x] Pagination support
  - [x] Default to last 30 days
- [x] Implement `GET /checkins/latest` endpoint
- [x] Create weight trend calculation service:
  - [x] 7-day moving average
  - [x] Weekly rate of change
- [x] Write unit tests for trend calculations
- [x] Write API tests for check-in endpoints

### 3.2 Photo Storage System
- [x] Create `progress_photo` table migration:
  - `id` (UUID)
  - `user_id` (FK, indexed)
  - `date` (date)
  - `s3_key` (unique)
  - `content_hash` (for dedup)
  - `visibility` (enum: private, coach_only)
  - `metadata` (JSON: dimensions, size, etc.)
  - `created_at`
- [x] Create S3 client wrapper service
- [x] Configure S3 bucket settings:
  - [x] Lifecycle policies
  - [x] Server-side encryption
  - [x] CORS configuration
- [x] Implement presigned URL generation:
  - [x] Upload URL (5min expiry)
  - [x] Download URL (15min expiry)
- [x] Create `/apps/api/app/photos/` module
- [x] Implement `POST /photos/presign` endpoint:
  - [x] Generate S3 key with user prefix
  - [x] Return presigned upload URL
  - [x] Return expected photo ID
- [x] Implement `POST /photos/commit` endpoint:
  - [x] Verify upload completed
  - [x] Store metadata
  - [x] Generate content hash
- [x] Implement `GET /photos` endpoint:
  - [x] Query params: `from`, `to` dates
  - [x] Return metadata + presigned download URLs
- [x] Implement `DELETE /photos/{id}` endpoint
- [x] Write MinIO configuration for local dev
- [x] Write API tests for photo endpoints

### 3.3 Offline Sync Foundation (Backend)
- [x] Design conflict resolution strategy:
  - [x] Last-write-wins for check-ins
  - [x] Server timestamp comparison
- [x] Add `client_updated_at` field to check_in
- [x] Create batch sync endpoint `POST /checkins/sync`:
  - [x] Accept array of check-ins with client timestamps
  - [x] Return server versions + conflicts
- [x] Document sync protocol for mobile team

---

## Phase 4: Backend - Nutrition Module

### 4.1 Nutrition Model & Endpoints
- [x] Create `nutrition_day` table migration:
  - `id` (UUID)
  - `user_id` (FK, indexed)
  - `date` (date, unique per user)
  - `calories` (integer)
  - `protein_g` (decimal)
  - `carbs_g` (decimal)
  - `fat_g` (decimal)
  - `fiber_g` (decimal, nullable)
  - `source` (enum: manual, mfp_import, api_sync)
  - `created_at`, `updated_at`
- [x] Create SQLModel model
- [x] Create `/apps/api/app/nutrition/` module
- [x] Implement `POST /nutrition/day` endpoint:
  - [x] Macro validation (reasonable ranges)
  - [x] Upsert logic
- [x] Implement `GET /nutrition/day` endpoint:
  - [x] Single date query
- [x] Implement `GET /nutrition/range` endpoint:
  - [x] Date range query
  - [x] Aggregate statistics option
- [x] Create nutrition summary service:
  - [x] Daily averages over period
  - [x] Adherence to targets calculation
- [x] Write API tests for nutrition endpoints

### 4.2 MFP CSV Import (Tier C)
- [x] Research MFP export format:
  - [x] Nutrition diary CSV structure
  - [x] Measurements CSV structure
  - [x] Exercise CSV structure
- [x] Create `/apps/api/app/integrations/` module
- [x] Define `IntegrationProvider` interface/protocol
- [x] Create MFP CSV parser:
  - [x] Parse nutrition daily totals
  - [x] Parse weight measurements
  - [x] Handle date format variations
  - [x] Handle encoding issues (UTF-8, etc.)
- [x] Implement `POST /integrations/mfp/import` endpoint:
  - [x] Accept ZIP file upload
  - [x] Extract and parse CSVs
  - [x] Map to internal schema
  - [x] Return import summary (rows processed, errors)
- [ ] Create import history table migration
- [x] Handle duplicate detection during import
- [x] Write unit tests for CSV parser
- [x] Write API tests for import endpoint

### 4.3 TDEE & Targets Calculation
- [x] Implement TDEE estimation service:
  - [x] Mifflin-St Jeor formula
  - [x] Activity multipliers
  - [x] Adjustment based on actual weight trends
- [x] Implement macro target calculation:
  - [x] Protein targets by goal (0.7-1.2g/lb)
  - [x] Fat minimums (0.3-0.4g/lb)
  - [x] Carb as remainder
- [x] Create calorie deficit/surplus calculations:
  - [x] Based on goal and pace preference
  - [x] Safety bounds (min 1200/1500 cal)
- [ ] Create `user_targets` table migration:
  - [ ] Store calculated targets
  - [ ] Track target history
- [x] Write unit tests for all calculations
- [x] Expose targets in `GET /me` response

---

## Phase 5: Mobile App Foundation

### 5.1 React Native Project Setup
- [x] Initialize Expo project in `/apps/mobile`
- [x] Configure `app.json` / `app.config.js`
- [x] Set up TypeScript configuration
- [x] Configure ESLint + Prettier
- [x] Set up path aliases (`@/components`, etc.)
- [x] Create folder structure:
  - `/src/components`
  - `/src/screens`
  - `/src/navigation`
  - `/src/services`
  - `/src/stores`
  - `/src/hooks`
  - `/src/utils`
  - `/src/types`
- [x] Configure Metro bundler
- [x] Set up environment variables (react-native-dotenv or expo-constants)

### 5.2 Design System & Theming
- [x] Install React Native Paper
- [x] Configure Material 3 theme:
  - [x] Primary, secondary, tertiary colors
  - [x] Surface colors
  - [x] Error/warning/success colors
- [x] Create light theme configuration
- [x] Create dark theme configuration
- [x] Implement theme context/provider
- [x] Create typography scale components
- [x] Create spacing constants
- [x] Build reusable components:
  - [x] `Button` (variants: primary, secondary, text)
  - [x] `Card` (elevated, outlined)
  - [x] `Input` (text, number, with validation states)
  - [x] `Chip` (selectable, dismissible)
  - [ ] `BottomSheet`
  - [x] `LoadingSpinner`
  - [x] `EmptyState`
  - [x] `ErrorBoundary`

### 5.3 Navigation Structure
- [x] Install React Navigation (native-stack, bottom-tabs)
- [x] Create navigation types file
- [x] Set up root navigator with:
  - [x] Auth stack (unauthenticated)
  - [x] Main tabs (authenticated)
- [x] Create Auth stack screens:
  - [x] Login
  - [x] Register
  - [x] ForgotPassword
- [x] Create Main tab navigator:
  - [x] Home tab
  - [x] Progress tab
  - [x] Coach tab
  - [x] Settings tab
- [x] Create nested stacks where needed
- [x] Implement deep linking configuration
- [x] Add screen transition animations

### 5.4 State Management Setup
- [x] Install TanStack Query
- [x] Configure QueryClient with defaults:
  - [x] Stale time
  - [x] Retry logic
  - [x] Error handling
- [x] Create query key factory
- [x] Install Zustand
- [x] Create stores:
  - [x] `authStore` (tokens, user, isAuthenticated)
  - [x] `onboardingStore` (step progress, collected data)
  - [x] `uiStore` (theme, loading states)
- [x] Set up store persistence (MMKV)

### 5.5 API Client & Services
- [x] Create axios/fetch wrapper with:
  - [x] Base URL configuration
  - [x] Auth token injection
  - [x] Token refresh interceptor
  - [x] Error transformation
- [x] Create API service modules:
  - [x] `authService` (login, register, refresh, logout)
  - [x] `userService` (getMe, updateProfile, etc.)
  - [x] `checkinService` (create, list, latest)
  - [x] `nutritionService` (create, get, import)
  - [x] `coachService` (chat, plan, insights)
- [x] Create TanStack Query hooks:
  - [x] `useUser`, `useUpdateProfile`
  - [x] `useCheckins`, `useCreateCheckin`
  - [x] `useNutrition`, `useLogNutrition`
- [x] Handle offline queue for mutations

### 5.6 Form Handling
- [x] Install Zod and React Hook Form
- [x] Create validation schemas:
  - [x] `loginSchema`
  - [x] `registerSchema`
  - [x] `profileSchema`
  - [x] `checkinSchema`
  - [x] `nutritionSchema`
- [x] Create reusable form components:
  - [x] `FormInput` (with error display)
  - [x] `FormSelect`
  - [x] `FormSlider`
  - [x] `FormDatePicker`
- [x] Implement form error handling patterns

---

## Phase 6: Mobile - Auth & Onboarding Screens

### 6.1 Auth Screens
- [x] Build Login screen:
  - [x] Email input with validation
  - [x] Password input with show/hide toggle
  - [x] Login button with loading state
  - [x] "Forgot password?" link
  - [x] "Create account" link
  - [x] Error message display
- [x] Build Register screen:
  - [x] Email input
  - [x] Password input with requirements indicator
  - [x] Confirm password
  - [x] Terms acceptance checkbox
  - [x] Register button
  - [x] "Already have account?" link
- [x] Build Forgot Password screen:
  - [x] Email input
  - [x] Submit button
  - [x] Success state with instructions
- [x] Implement secure token storage (expo-secure-store)
- [x] Handle auth state persistence across app restarts
- [x] Write component tests for auth screens

### 6.2 Onboarding Flow
- [x] Build onboarding progress indicator component
- [x] Build Goal Selection screen:
  - [x] Goal type cards (fat loss, muscle gain, recomp, etc.)
  - [x] Visual icons for each goal
  - [x] Single selection
- [x] Build Baseline Metrics screen:
  - [x] Current weight input
  - [x] Target weight input (if applicable)
  - [x] Height input
  - [x] Age/birth year input
  - [x] Sex selection
  - [x] Activity level selection
- [x] Build Timeline Preferences screen:
  - [x] Pace preference (slow, moderate, aggressive)
  - [x] Target date picker (optional)
  - [x] Explanation of what each pace means
- [x] Build Diet Preferences screen:
  - [x] Diet type selection (multi-chip)
  - [x] Allergies input (tags)
  - [x] Disliked foods input (tags)
  - [x] Meals per day slider
- [x] Build Privacy Settings screen:
  - [x] Data sharing toggles
  - [x] Photo storage preference
  - [x] Web search permission
  - [x] Clear explanations for each setting
- [x] Build Onboarding Complete screen:
  - [x] Summary of selections
  - [x] Calculated initial targets display
  - [x] "Get Started" CTA
- [x] Implement onboarding data submission to API
- [x] Handle partial onboarding recovery
- [x] Write E2E tests for onboarding flow

---

## Phase 7: Mobile - Core Feature Screens

### 7.1 Home/Today Screen
- [x] Build greeting header with user name
- [x] Build daily summary card:
  - [x] Today's weight (if logged)
  - [x] Nutrition progress (calories, protein)
  - [x] Check-in status indicator
- [x] Build quick action buttons:
  - [x] "Log Weight" FAB
  - [x] "Log Meal" button
  - [x] "Talk to Coach" button
- [x] Build streak display component
- [x] Build "Next Best Action" card:
  - [x] Dynamic content from coach insights
  - [x] Actionable with tap handler
- [ ] Build recent activity list
- [x] Implement pull-to-refresh
- [x] Handle empty states gracefully

### 7.2 Check-in Screen
- [x] Build weight input component:
  - [x] Large numeric display
  - [x] Increment/decrement buttons
  - [x] Unit toggle (kg/lbs)
  - [x] Last weight reference
- [x] Build notes input (expandable text area)
- [x] Build optional metrics section:
  - [x] Energy level slider (1-5, with emoji)
  - [x] Sleep quality slider (1-5)
  - [x] Mood slider (1-5)
- [x] Build photo capture/upload:
  - [x] Camera integration
  - [x] Gallery picker
  - [x] Photo preview
  - [x] Delete option
- [x] Build save button with validation
- [x] Implement optimistic updates
- [x] Handle offline check-in storage
- [x] Build success confirmation animation
- [x] Write component tests

### 7.3 Progress Screen
- [x] Build date range selector (7d, 30d, 90d, all)
- [x] Build weight trend chart:
  - [x] Line chart with victory-native
  - [x] Moving average overlay
  - [x] Goal weight reference line
  - [x] Touch to see data point details
- [x] Build weekly rate of change display
- [x] Build adherence metrics:
  - [x] Check-in completion %
  - [x] Nutrition logging %
  - [x] Target adherence %
- [x] Build progress photo comparison:
  - [x] Side-by-side view
  - [x] Date selector for each photo
  - [x] Swipe between comparisons
- [x] Build stats summary cards:
  - [x] Total weight change
  - [x] Average daily calories
  - [x] Average protein intake
- [x] Implement chart animations
- [x] Handle no-data states

### 7.4 Nutrition Logging Screen
- [x] Build calorie input (large display)
- [x] Build macro inputs:
  - [x] Protein (g)
  - [x] Carbs (g)
  - [x] Fat (g)
  - [x] Auto-calculate calories option
- [x] Build daily target comparison:
  - [x] Progress bars for each macro
  - [x] Color coding (under, on-target, over)
- [x] Build meal quick-add buttons (breakfast, lunch, dinner, snacks)
- [x] Build recent foods/meals list (for quick re-entry)
- [x] Build save functionality
- [x] Implement remaining macros display
- [x] Handle date selection for past logging

### 7.5 Offline Storage & Sync
- [x] Set up MMKV or SQLite for local storage
- [x] Create local check-in storage schema
- [x] Create local nutrition storage schema
- [x] Implement sync queue for pending changes
- [x] Build network status detection
- [x] Implement background sync (when online)
- [ ] Handle conflict resolution UI
- [x] Show sync status indicator
- [x] Test offline scenarios

---

## Phase 8: AI Coach System - Backend

### 8.1 Coach Orchestrator Architecture
- [x] Create `/apps/api/app/coach_ai/` module structure:
  - `/orchestrator.py` - main coordinator
  - `/tools/` - tool implementations
  - `/policies/` - safety rules
  - `/prompts/` - system prompts
- [x] Define LLM provider interface
- [x] Implement OpenAI/Anthropic client wrapper
- [x] Create user context builder:
  - [x] Fetch user profile, goals, preferences
  - [x] Fetch recent check-ins (14 days)
  - [x] Fetch recent nutrition (14 days)
  - [x] Compute current metrics
- [x] Create context summarization (for token efficiency)
- [x] Implement conversation history management
- [x] Create `ai_session` table migration:
  - `id`, `user_id`, `started_at`, `last_message_at`
  - `message_count`, `tokens_used`

### 8.2 Tool Registry Implementation
- [x] Create tool base class/interface
- [x] Implement internal tools:
  - [x] `get_user_profile(user_id)` - returns profile, goals, preferences
  - [x] `get_recent_checkins(user_id, days)` - returns check-in data
  - [x] `get_weight_trend(user_id, days)` - returns trend analysis
  - [x] `get_nutrition_summary(user_id, days)` - returns nutrition stats
  - [x] `calculate_tdee(user_id)` - returns TDEE estimate
  - [x] `get_adherence_metrics(user_id, days)` - returns adherence data
  - [ ] `create_recommendation(user_id, type, params)` - stores recommendation
  - [ ] `store_coach_note(user_id, note)` - stores internal note
- [ ] Implement external tools:
  - [ ] `search_web(query)` - approved search API integration
  - [ ] `fetch_recipe(query)` - recipe search (approved domains only)
- [ ] Create tool permission system:
  - [ ] Per-user tool consent tracking
  - [ ] Tool allowlist enforcement
- [x] Create tool result caching (Redis)
- [x] Create `ai_tool_call_log` table migration:
  - `id`, `session_id`, `tool_name`
  - `input_hash`, `output_summary`
  - `latency_ms`, `created_at`

### 8.3 Safety Policy Engine
- [x] Create policy rule definitions:
  - [x] Minimum calorie thresholds (1200F/1500M)
  - [x] Maximum deficit limits (1000 cal/day)
  - [x] Minimum protein requirements
  - [x] Maximum weight loss rate (1% body weight/week)
- [x] Implement eating disorder signal detection:
  - [x] Keyword patterns
  - [x] Behavior patterns (extreme restriction requests)
  - [x] Response templates for concerning signals
- [x] Create response filtering:
  - [x] Medical claim detection
  - [x] Unsafe recommendation blocking
  - [x] Disclaimer injection where needed
- [x] Implement content moderation for outputs
- [x] Create policy violation logging
- [x] Write unit tests for all policy rules

### 8.4 Coach API Endpoints
- [x] Implement `POST /coach/chat` endpoint:
  - [x] Accept message + conversation context
  - [x] Build user context
  - [x] Apply safety policies
  - [x] Call LLM with tools
  - [x] Execute tool calls
  - [x] Return response + tool trace
- [x] Implement streaming for `/coach/chat`:
  - [x] SSE or WebSocket support
  - [x] Stream tokens as generated
  - [x] Handle tool call interruptions
- [x] Implement `POST /coach/plan` endpoint:
  - [x] Generate weekly plan
  - [x] Include nutrition targets
  - [x] Include activity suggestions
  - [x] Store plan for reference
- [x] Implement `GET /coach/insights` endpoint:
  - [x] Pre-computed weekly insights
  - [x] Trend analysis summary
  - [x] Actionable recommendations
- [x] Create response schema with:
  - [x] Message content
  - [x] Tool trace array
  - [x] Confidence level
  - [x] Data gaps/limitations
- [x] Write API tests for coach endpoints
- [ ] Load test chat endpoint

### 8.5 Explainability Features
- [x] Create tool trace formatting:
  - [x] Human-readable tool descriptions
  - [x] Input/output summaries
  - [x] Source citations for web search
- [x] Implement "why" explanation generation:
  - [x] Data points used
  - [x] Calculation methodology
  - [x] Comparison to previous recommendations
- [x] Create confidence scoring:
  - [x] Based on data completeness
  - [x] Based on trend consistency
  - [x] Based on time since last data
- [x] Implement "what would improve confidence" suggestions

---

## Phase 9: Mobile - Coach Chat Interface

### 9.1 Chat UI Components
- [x] Build message bubble components:
  - [x] User message (right-aligned)
  - [x] Assistant message (left-aligned)
  - [x] Typing indicator
- [x] Build message input bar:
  - [x] Text input (expandable)
  - [x] Send button
  - [x] Disable during streaming
- [x] Build tool usage disclosure:
  - [x] Collapsible "Used tools" section
  - [x] Tool name + purpose display
  - [x] Source links for web searches
- [x] Build confidence indicator:
  - [x] Visual confidence level
  - [x] "What's missing" expandable
- [x] Build message timestamp display
- [x] Implement message list with virtualization

### 9.2 Streaming Implementation
- [x] Implement SSE/WebSocket client
- [x] Handle streaming text rendering
- [x] Show partial message during streaming
- [x] Handle stream interruption gracefully
- [x] Implement retry logic for failed streams
- [x] Add visual streaming indicator

### 9.3 Coach Screen Features
- [x] Build conversation history loading
- [x] Implement new conversation start
- [x] Build suggested prompts:
  - [x] "What should I eat today?"
  - [x] "How am I progressing?"
  - [x] "Adjust my targets"
- [x] Implement message persistence
- [x] Handle error states
- [x] Build empty state (first conversation)
- [x] Implement conversation reset option
- [x] Write component tests

### 9.4 Weekly Plan Display
- [x] Build plan overview card:
  - [x] Daily calorie target
  - [x] Macro breakdown visual
  - [x] Key focus areas
- [x] Build daily breakdown view
- [x] Build plan acceptance/modification flow
- [x] Implement plan storage in local state
- [x] Show plan in Home screen widget

---

## Phase 10: Settings & Data Management

### 10.1 Settings Screen
- [x] Build settings navigation list
- [x] Build profile section:
  - [x] Edit profile link
  - [x] Edit goals link
  - [x] Edit preferences link
- [x] Build integrations section:
  - [x] MFP import button
  - [x] Connection status display
- [x] Build privacy section:
  - [x] Data sharing toggles
  - [x] Web search toggle
  - [x] Photo visibility settings
- [x] Build appearance section:
  - [x] Theme toggle (light/dark/system)
  - [x] Unit preferences (kg/lbs, metric/imperial)
- [x] Build account section:
  - [x] Change password
  - [x] Export data
  - [x] Delete account

### 10.2 Data Export Feature
- [x] Implement `GET /me/export` backend endpoint:
  - [x] Generate JSON export of all user data
  - [x] Include check-ins, nutrition, photos metadata
  - [x] Generate presigned URL for download
- [x] Build export request UI
- [x] Handle export generation (async job)
- [x] Notify when export ready
- [x] Implement download to device

### 10.3 Account Deletion
- [x] Implement `DELETE /me` backend endpoint:
  - [x] Soft delete or hard delete (configurable)
  - [x] Delete S3 photos
  - [x] Invalidate all tokens
  - [x] Send confirmation email
- [x] Build deletion confirmation flow:
  - [x] Warning message
  - [x] Re-enter password
  - [x] Type "DELETE" confirmation
- [x] Implement grace period (optional)
- [x] Handle deletion completion

### 10.4 MFP Import UI
- [x] Build import instructions screen
- [x] Implement file picker for ZIP upload
- [x] Build upload progress indicator
- [x] Display import results:
  - [x] Rows imported
  - [x] Date range covered
  - [x] Errors encountered
- [x] Handle import errors gracefully
- [x] Allow re-import with overwrite option

---

## Phase 11: CI/CD & AWS Infrastructure

### 11.1 Complete CI Pipeline
- [x] Extend `.github/workflows/ci.yml`:
  - [x] Add mobile lint job (ESLint)
  - [x] Add mobile type check (tsc)
  - [x] Add mobile unit tests (Jest)
- [x] Create Docker build job
- [x] Add integration test job:
  - [x] Use testcontainers for Postgres
  - [x] Run API tests against real DB
- [x] Add security scanning:
  - [x] Dependency vulnerability scan
  - [x] SAST scanning
- [x] Configure branch protection rules
- [x] Set up PR labeling/changelog

### 11.2 Infrastructure as Code
- [x] Create `/infra` directory structure
- [x] Choose Terraform vs CDK (recommend Terraform)
- [x] Create VPC module:
  - [x] Public/private subnets
  - [x] NAT Gateway
  - [x] Security groups
- [x] Create RDS module:
  - [x] Postgres instance
  - [x] Parameter groups
  - [x] Backup configuration
  - [x] Multi-AZ (prod only)
- [x] Create S3 module:
  - [x] Photos bucket
  - [x] Export bucket
  - [x] Lifecycle policies
  - [x] Bucket policies
- [x] Create ECR module:
  - [x] API repository
  - [x] Lifecycle policy
- [x] Create ECS module:
  - [x] Cluster
  - [x] Task definition
  - [x] Service
  - [x] Auto-scaling
- [x] Create ALB module:
  - [x] Load balancer
  - [x] Target groups
  - [x] SSL certificate
- [x] Create Secrets Manager resources
- [x] Create IAM roles and policies

### 11.3 CD Pipeline
- [x] Create `.github/workflows/deploy.yml`:
  - [x] Trigger on main branch push
  - [x] Build and push Docker image to ECR
  - [x] Run Alembic migrations
  - [x] Deploy to ECS
- [x] Implement blue/green or rolling deployment
- [x] Create staging deployment workflow
- [x] Create production deployment workflow (manual approval)
- [x] Set up GitHub environments with secrets
- [x] Configure OIDC for AWS authentication

### 11.4 Environment Configuration
- [x] Create staging environment:
  - [x] Separate RDS instance
  - [x] Separate S3 buckets
  - [x] Separate secrets
- [x] Create production environment:
  - [x] Production RDS (larger instance)
  - [x] Production S3 buckets
  - [x] Production secrets
- [ ] Implement feature flags system:
  - [ ] Database-backed flags
  - [ ] Admin API for flag management
  - [ ] Client-side flag fetching
- [x] Configure monitoring:
  - [x] CloudWatch logs
  - [x] CloudWatch metrics
  - [x] Alarms for critical metrics

---

## Phase 12: Testing & Quality Assurance

### 12.1 Backend Testing Completion
- [x] Achieve 80%+ unit test coverage
- [x] Write integration tests for:
  - [x] Complete auth flows
  - [x] Check-in CRUD operations
  - [x] Nutrition CRUD operations
  - [x] Photo upload flow
  - [x] Coach chat flow
- [x] Write contract tests:
  - [x] OpenAPI schema validation
  - [x] Response schema snapshots
- [x] Write security tests:
  - [x] Auth bypass attempts
  - [x] Rate limiting verification
  - [x] SQL injection prevention
  - [x] XSS prevention
- [ ] Write load tests (k6):
  - [ ] Check-in endpoint
  - [ ] Nutrition endpoint
  - [ ] Coach chat endpoint
  - [ ] Establish baseline performance

### 12.2 Mobile Testing Completion
- [x] Write unit tests for:
  - [x] All utility functions
  - [x] Store logic
  - [x] Form validation
- [x] Write component tests (RNTL):
  - [x] Auth screens
  - [x] Onboarding screens
  - [x] Check-in screen
  - [x] Coach chat
- [x] Write E2E tests (Detox):
  - [x] Complete onboarding flow
  - [x] Check-in flow
  - [x] Nutrition logging flow
  - [x] Coach conversation
- [ ] Set up snapshot tests for key screens
- [x] Configure test coverage reporting

### 12.3 Security Audit
- [x] Review OWASP Top 10:
  - [x] Injection vulnerabilities
  - [x] Broken authentication
  - [x] Sensitive data exposure
  - [x] XML external entities
  - [x] Broken access control
  - [x] Security misconfiguration
  - [x] XSS
  - [x] Insecure deserialization
  - [x] Using components with known vulnerabilities
  - [x] Insufficient logging
- [x] Review data encryption:
  - [x] Data in transit (TLS)
  - [x] Data at rest (DB, S3)
  - [x] Secrets management
- [x] Review authentication flows
- [x] Review authorization logic
- [x] Document security findings and fixes

### 12.4 Performance Optimization
- [x] Profile API endpoints
- [x] Optimize database queries:
  - [x] Add missing indexes
  - [x] Review query plans
  - [x] Implement query caching
- [x] Optimize mobile app:
  - [x] Bundle size analysis
  - [x] Render performance
  - [x] Memory usage
- [ ] Implement CDN for static assets
- [x] Review and optimize AI token usage

---

## Phase 13: Documentation & Launch Prep

### 13.1 Technical Documentation
- [ ] Complete README.md:
  - [ ] Project overview
  - [ ] Local development setup
  - [ ] Architecture diagram
  - [ ] Deployment instructions
- [ ] Create API documentation:
  - [ ] OpenAPI spec completeness
  - [ ] Example requests/responses
  - [ ] Authentication guide
- [ ] Create database documentation:
  - [ ] Schema diagrams
  - [ ] Migration guide
- [ ] Create AI system documentation:
  - [ ] Tool descriptions
  - [ ] Safety policies
  - [ ] Prompt guidelines
- [ ] Create runbook:
  - [ ] Common incidents
  - [ ] Rollback procedures
  - [ ] Monitoring alerts
  - [ ] Escalation paths

### 13.2 Legal & Compliance
- [ ] Create privacy policy
- [ ] Create terms of service
- [ ] Create data retention policy
- [ ] Add in-app disclaimers:
  - [ ] "Not medical advice"
  - [ ] Professional consultation recommendation
- [ ] Review GDPR/CCPA requirements
- [ ] Implement consent tracking

### 13.3 App Store Preparation
- [ ] Create app icons (all sizes)
- [ ] Create splash screen
- [ ] Write app store description
- [ ] Create screenshots for store listing
- [ ] Create promotional graphics
- [ ] Prepare iOS App Store submission:
  - [ ] App Store Connect setup
  - [ ] Privacy labels
  - [ ] Review guidelines compliance
- [ ] Prepare Google Play submission:
  - [ ] Play Console setup
  - [ ] Content rating questionnaire
  - [ ] Data safety form

### 13.4 Final QA & Launch
- [ ] Complete QA testing:
  - [ ] Test all user flows
  - [ ] Test edge cases
  - [ ] Test offline scenarios
  - [ ] Test on multiple devices
- [ ] Fix critical bugs
- [ ] Performance benchmarking
- [ ] Create launch checklist
- [ ] Plan phased rollout (if applicable)
- [ ] Set up user feedback channels
- [ ] Monitor launch metrics

---

## Dependencies Graph

```
Phase 1 (Foundation)
    ↓
Phase 2 (Auth/Users) ──────────────────┐
    ↓                                  │
Phase 3 (Check-ins/Photos)             │
    ↓                                  │
Phase 4 (Nutrition)                    │
    ↓                                  ↓
Phase 5 (Mobile Foundation) ←──────────┘
    ↓
Phase 6 (Mobile Auth/Onboarding)
    ↓
Phase 7 (Mobile Core Screens)
    ↓
Phase 8 (AI Coach Backend)
    ↓
Phase 9 (Mobile Coach Chat)
    ↓
Phase 10 (Settings/Data)
    ↓
Phase 11 (CI/CD & Infrastructure)
    ↓
Phase 12 (Testing & QA)
    ↓
Phase 13 (Documentation & Launch)
```

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| MFP API access unavailable | Ship with CSV import (Tier C); keep connector abstraction |
| AI cost/latency issues | Implement caching, use smaller models for routine tasks, stream responses |
| Photo privacy concerns | Signed URLs, private buckets, strict ACLs, optional local-only mode |
| Unsafe AI recommendations | Policy engine + hard constraints + auditing + feature flags |
| Offline sync conflicts | Last-write-wins with server as source of truth; clear conflict UI |

---

## Success Criteria

### Phase Completion Checklist
- [ ] All tasks marked complete
- [x] Tests passing (unit, integration, E2E where applicable)
- [x] Code reviewed and merged
- [ ] Documentation updated
- [x] No critical bugs open

### MVP Definition of Done
- [x] User can register, login, complete onboarding
- [x] User can log weight and view trends
- [x] User can log nutrition manually
- [x] User can import MFP data via CSV
- [x] User can chat with AI coach
- [x] User can view weekly plan and insights
- [x] User can export data and delete account
- [x] App works offline and syncs when online
- [x] Performance meets NFRs (<300ms check-in, smooth charts)
- [x] Security audit passed
- [ ] Privacy policy and disclaimers in place
