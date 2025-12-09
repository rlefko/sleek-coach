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
- [ ] Initialize git repository
- [ ] Create directory structure: `/apps/mobile`, `/apps/api`, `/infra`, `/docs`
- [ ] Configure root `package.json` with workspaces (if using yarn/npm workspaces)
- [ ] Set up shared TypeScript config (`tsconfig.base.json`)
- [ ] Create `.gitignore` for all environments (Python, Node, React Native, IDE)
- [ ] Set up `.editorconfig` for consistent formatting
- [ ] Create initial `README.md` with project overview

### 1.2 Backend Environment Setup
- [ ] Create `/apps/api` Python project structure
- [ ] Set up `pyproject.toml` with dependencies (FastAPI, SQLModel, uvicorn, etc.)
- [ ] Configure `ruff` for linting
- [ ] Configure `black` for formatting
- [ ] Configure `mypy` for type checking
- [ ] Create `Makefile` with common commands (lint, format, test, run)
- [ ] Set up `.env.example` with required environment variables

### 1.3 Docker Compose Environment
- [ ] Create `docker-compose.yml` with services:
  - [ ] `api` service (FastAPI with hot reload)
  - [ ] `db` service (PostgreSQL 15+)
  - [ ] `redis` service (for background jobs)
  - [ ] `minio` service (S3-compatible storage for local dev)
- [ ] Create `Dockerfile` for API service (multi-stage build)
- [ ] Create `.dockerignore`
- [ ] Configure volume mounts for hot reload
- [ ] Set up health checks for all services
- [ ] Create `docker-compose.override.yml` for dev-specific config
- [ ] Write startup script that waits for dependencies

### 1.4 Database Foundation
- [ ] Configure SQLModel/SQLAlchemy connection
- [ ] Set up Alembic for migrations
- [ ] Create initial migration (empty baseline)
- [ ] Write database connection pool configuration
- [ ] Create `alembic.ini` configuration
- [ ] Set up migration naming conventions
- [ ] Create seed data script for development

### 1.5 Basic CI Pipeline (GitHub Actions)
- [ ] Create `.github/workflows/ci.yml`
- [ ] Configure Python linting job (ruff, black --check)
- [ ] Configure type checking job (mypy)
- [ ] Configure unit test job (pytest)
- [ ] Set up Python version matrix (3.11, 3.12)
- [ ] Configure caching for pip dependencies
- [ ] Add status badges to README

---

## Phase 2: Backend Core - Authentication & Users

### 2.1 User Model & Database Schema
- [ ] Create `user` table migration:
  - `id` (UUID primary key)
  - `email` (unique, indexed)
  - `hashed_password`
  - `is_active`
  - `is_verified`
  - `created_at`, `updated_at`
- [ ] Create `user_profile` table migration:
  - `user_id` (FK)
  - `height_cm`
  - `sex` (enum: male, female, other, prefer_not_to_say)
  - `birth_year` (not full DOB for privacy)
  - `activity_level` (enum: sedentary, light, moderate, active, very_active)
  - `timezone`
- [ ] Create `user_goal` table migration:
  - `user_id` (FK)
  - `goal_type` (enum: fat_loss, muscle_gain, recomp, maintenance, performance)
  - `target_weight_kg` (nullable)
  - `pace_preference` (enum: slow, moderate, aggressive)
  - `target_date` (nullable)
- [ ] Create `diet_preferences` table migration:
  - `user_id` (FK)
  - `diet_type` (enum: none, vegetarian, vegan, pescatarian, keto, paleo, halal, kosher)
  - `allergies` (array/JSON)
  - `disliked_foods` (array/JSON)
  - `meals_per_day`
- [ ] Create SQLModel models for all tables
- [ ] Set up table relationships and indexes

### 2.2 Authentication Module
- [ ] Create `/apps/api/app/auth/` module structure
- [ ] Implement password hashing service (Argon2id)
- [ ] Create JWT token service:
  - [ ] Access token generation (15min expiry)
  - [ ] Refresh token generation (7 day expiry)
  - [ ] Token validation/decoding
- [ ] Create refresh token storage table migration
- [ ] Implement `POST /auth/register` endpoint:
  - [ ] Email validation
  - [ ] Password strength validation
  - [ ] Duplicate email check
  - [ ] Create user + profile records
  - [ ] Return tokens
- [ ] Implement `POST /auth/login` endpoint:
  - [ ] Email/password validation
  - [ ] Rate limiting (5 attempts per 15min)
  - [ ] Return tokens on success
- [ ] Implement `POST /auth/refresh` endpoint:
  - [ ] Validate refresh token
  - [ ] Issue new access token
  - [ ] Rotate refresh token
- [ ] Implement `POST /auth/logout` endpoint:
  - [ ] Invalidate refresh token
- [ ] Create auth dependency for protected routes
- [ ] Write unit tests for all auth functions
- [ ] Write API tests for auth endpoints

### 2.3 User Profile Endpoints
- [ ] Create `/apps/api/app/users/` module structure
- [ ] Implement `GET /me` endpoint:
  - [ ] Return user, profile, goal, preferences
- [ ] Implement `PATCH /me/profile` endpoint:
  - [ ] Partial update support
  - [ ] Validation for numeric ranges
- [ ] Implement `PATCH /me/goals` endpoint:
  - [ ] Goal type validation
  - [ ] Target weight bounds checking
- [ ] Implement `PATCH /me/preferences` endpoint:
  - [ ] Diet type validation
  - [ ] Allergies/dislikes array handling
- [ ] Create Pydantic request/response schemas
- [ ] Write API tests for all profile endpoints

### 2.4 Security Hardening
- [ ] Implement rate limiting middleware (slowapi)
- [ ] Configure CORS properly
- [ ] Add request ID middleware for tracing
- [ ] Set up structured logging (structlog)
- [ ] Create audit log table migration
- [ ] Implement audit logging for auth events
- [ ] Add security headers middleware
- [ ] Configure HTTPS redirect (for production)

---

## Phase 3: Backend - Check-ins & Photos

### 3.1 Check-in Model & Endpoints
- [ ] Create `check_in` table migration:
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
- [ ] Create SQLModel model with validations
- [ ] Create `/apps/api/app/checkins/` module
- [ ] Implement `POST /checkins` endpoint:
  - [ ] Date validation (not future)
  - [ ] Weight range validation (20-500kg)
  - [ ] Upsert logic (update if same date exists)
- [ ] Implement `GET /checkins` endpoint:
  - [ ] Query params: `from`, `to` dates
  - [ ] Pagination support
  - [ ] Default to last 30 days
- [ ] Implement `GET /checkins/latest` endpoint
- [ ] Create weight trend calculation service:
  - [ ] 7-day moving average
  - [ ] Weekly rate of change
- [ ] Write unit tests for trend calculations
- [ ] Write API tests for check-in endpoints

### 3.2 Photo Storage System
- [ ] Create `progress_photo` table migration:
  - `id` (UUID)
  - `user_id` (FK, indexed)
  - `date` (date)
  - `s3_key` (unique)
  - `content_hash` (for dedup)
  - `visibility` (enum: private, coach_only)
  - `metadata` (JSON: dimensions, size, etc.)
  - `created_at`
- [ ] Create S3 client wrapper service
- [ ] Configure S3 bucket settings:
  - [ ] Lifecycle policies
  - [ ] Server-side encryption
  - [ ] CORS configuration
- [ ] Implement presigned URL generation:
  - [ ] Upload URL (5min expiry)
  - [ ] Download URL (15min expiry)
- [ ] Create `/apps/api/app/photos/` module
- [ ] Implement `POST /photos/presign` endpoint:
  - [ ] Generate S3 key with user prefix
  - [ ] Return presigned upload URL
  - [ ] Return expected photo ID
- [ ] Implement `POST /photos/commit` endpoint:
  - [ ] Verify upload completed
  - [ ] Store metadata
  - [ ] Generate content hash
- [ ] Implement `GET /photos` endpoint:
  - [ ] Query params: `from`, `to` dates
  - [ ] Return metadata + presigned download URLs
- [ ] Implement `DELETE /photos/{id}` endpoint
- [ ] Write MinIO configuration for local dev
- [ ] Write API tests for photo endpoints

### 3.3 Offline Sync Foundation (Backend)
- [ ] Design conflict resolution strategy:
  - [ ] Last-write-wins for check-ins
  - [ ] Server timestamp comparison
- [ ] Add `client_updated_at` field to check_in
- [ ] Create batch sync endpoint `POST /checkins/sync`:
  - [ ] Accept array of check-ins with client timestamps
  - [ ] Return server versions + conflicts
- [ ] Document sync protocol for mobile team

---

## Phase 4: Backend - Nutrition Module

### 4.1 Nutrition Model & Endpoints
- [ ] Create `nutrition_day` table migration:
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
- [ ] Create SQLModel model
- [ ] Create `/apps/api/app/nutrition/` module
- [ ] Implement `POST /nutrition/day` endpoint:
  - [ ] Macro validation (reasonable ranges)
  - [ ] Upsert logic
- [ ] Implement `GET /nutrition/day` endpoint:
  - [ ] Single date query
- [ ] Implement `GET /nutrition/range` endpoint:
  - [ ] Date range query
  - [ ] Aggregate statistics option
- [ ] Create nutrition summary service:
  - [ ] Daily averages over period
  - [ ] Adherence to targets calculation
- [ ] Write API tests for nutrition endpoints

### 4.2 MFP CSV Import (Tier C)
- [ ] Research MFP export format:
  - [ ] Nutrition diary CSV structure
  - [ ] Measurements CSV structure
  - [ ] Exercise CSV structure
- [ ] Create `/apps/api/app/integrations/` module
- [ ] Define `IntegrationProvider` interface/protocol
- [ ] Create MFP CSV parser:
  - [ ] Parse nutrition daily totals
  - [ ] Parse weight measurements
  - [ ] Handle date format variations
  - [ ] Handle encoding issues (UTF-8, etc.)
- [ ] Implement `POST /integrations/mfp/import` endpoint:
  - [ ] Accept ZIP file upload
  - [ ] Extract and parse CSVs
  - [ ] Map to internal schema
  - [ ] Return import summary (rows processed, errors)
- [ ] Create import history table migration
- [ ] Handle duplicate detection during import
- [ ] Write unit tests for CSV parser
- [ ] Write API tests for import endpoint

### 4.3 TDEE & Targets Calculation
- [ ] Implement TDEE estimation service:
  - [ ] Mifflin-St Jeor formula
  - [ ] Activity multipliers
  - [ ] Adjustment based on actual weight trends
- [ ] Implement macro target calculation:
  - [ ] Protein targets by goal (0.7-1.2g/lb)
  - [ ] Fat minimums (0.3-0.4g/lb)
  - [ ] Carb as remainder
- [ ] Create calorie deficit/surplus calculations:
  - [ ] Based on goal and pace preference
  - [ ] Safety bounds (min 1200/1500 cal)
- [ ] Create `user_targets` table migration:
  - [ ] Store calculated targets
  - [ ] Track target history
- [ ] Write unit tests for all calculations
- [ ] Expose targets in `GET /me` response

---

## Phase 5: Mobile App Foundation

### 5.1 React Native Project Setup
- [ ] Initialize Expo project in `/apps/mobile`
- [ ] Configure `app.json` / `app.config.js`
- [ ] Set up TypeScript configuration
- [ ] Configure ESLint + Prettier
- [ ] Set up path aliases (`@/components`, etc.)
- [ ] Create folder structure:
  - `/src/components`
  - `/src/screens`
  - `/src/navigation`
  - `/src/services`
  - `/src/stores`
  - `/src/hooks`
  - `/src/utils`
  - `/src/types`
- [ ] Configure Metro bundler
- [ ] Set up environment variables (react-native-dotenv or expo-constants)

### 5.2 Design System & Theming
- [ ] Install React Native Paper
- [ ] Configure Material 3 theme:
  - [ ] Primary, secondary, tertiary colors
  - [ ] Surface colors
  - [ ] Error/warning/success colors
- [ ] Create light theme configuration
- [ ] Create dark theme configuration
- [ ] Implement theme context/provider
- [ ] Create typography scale components
- [ ] Create spacing constants
- [ ] Build reusable components:
  - [ ] `Button` (variants: primary, secondary, text)
  - [ ] `Card` (elevated, outlined)
  - [ ] `Input` (text, number, with validation states)
  - [ ] `Chip` (selectable, dismissible)
  - [ ] `BottomSheet`
  - [ ] `LoadingSpinner`
  - [ ] `EmptyState`
  - [ ] `ErrorBoundary`

### 5.3 Navigation Structure
- [ ] Install React Navigation (native-stack, bottom-tabs)
- [ ] Create navigation types file
- [ ] Set up root navigator with:
  - [ ] Auth stack (unauthenticated)
  - [ ] Main tabs (authenticated)
- [ ] Create Auth stack screens:
  - [ ] Login
  - [ ] Register
  - [ ] ForgotPassword
- [ ] Create Main tab navigator:
  - [ ] Home tab
  - [ ] Progress tab
  - [ ] Coach tab
  - [ ] Settings tab
- [ ] Create nested stacks where needed
- [ ] Implement deep linking configuration
- [ ] Add screen transition animations

### 5.4 State Management Setup
- [ ] Install TanStack Query
- [ ] Configure QueryClient with defaults:
  - [ ] Stale time
  - [ ] Retry logic
  - [ ] Error handling
- [ ] Create query key factory
- [ ] Install Zustand
- [ ] Create stores:
  - [ ] `authStore` (tokens, user, isAuthenticated)
  - [ ] `onboardingStore` (step progress, collected data)
  - [ ] `uiStore` (theme, loading states)
- [ ] Set up store persistence (MMKV)

### 5.5 API Client & Services
- [ ] Create axios/fetch wrapper with:
  - [ ] Base URL configuration
  - [ ] Auth token injection
  - [ ] Token refresh interceptor
  - [ ] Error transformation
- [ ] Create API service modules:
  - [ ] `authService` (login, register, refresh, logout)
  - [ ] `userService` (getMe, updateProfile, etc.)
  - [ ] `checkinService` (create, list, latest)
  - [ ] `nutritionService` (create, get, import)
  - [ ] `coachService` (chat, plan, insights)
- [ ] Create TanStack Query hooks:
  - [ ] `useUser`, `useUpdateProfile`
  - [ ] `useCheckins`, `useCreateCheckin`
  - [ ] `useNutrition`, `useLogNutrition`
- [ ] Handle offline queue for mutations

### 5.6 Form Handling
- [ ] Install Zod and React Hook Form
- [ ] Create validation schemas:
  - [ ] `loginSchema`
  - [ ] `registerSchema`
  - [ ] `profileSchema`
  - [ ] `checkinSchema`
  - [ ] `nutritionSchema`
- [ ] Create reusable form components:
  - [ ] `FormInput` (with error display)
  - [ ] `FormSelect`
  - [ ] `FormSlider`
  - [ ] `FormDatePicker`
- [ ] Implement form error handling patterns

---

## Phase 6: Mobile - Auth & Onboarding Screens

### 6.1 Auth Screens
- [ ] Build Login screen:
  - [ ] Email input with validation
  - [ ] Password input with show/hide toggle
  - [ ] Login button with loading state
  - [ ] "Forgot password?" link
  - [ ] "Create account" link
  - [ ] Error message display
- [ ] Build Register screen:
  - [ ] Email input
  - [ ] Password input with requirements indicator
  - [ ] Confirm password
  - [ ] Terms acceptance checkbox
  - [ ] Register button
  - [ ] "Already have account?" link
- [ ] Build Forgot Password screen:
  - [ ] Email input
  - [ ] Submit button
  - [ ] Success state with instructions
- [ ] Implement secure token storage (expo-secure-store)
- [ ] Handle auth state persistence across app restarts
- [ ] Write component tests for auth screens

### 6.2 Onboarding Flow
- [ ] Build onboarding progress indicator component
- [ ] Build Goal Selection screen:
  - [ ] Goal type cards (fat loss, muscle gain, recomp, etc.)
  - [ ] Visual icons for each goal
  - [ ] Single selection
- [ ] Build Baseline Metrics screen:
  - [ ] Current weight input
  - [ ] Target weight input (if applicable)
  - [ ] Height input
  - [ ] Age/birth year input
  - [ ] Sex selection
  - [ ] Activity level selection
- [ ] Build Timeline Preferences screen:
  - [ ] Pace preference (slow, moderate, aggressive)
  - [ ] Target date picker (optional)
  - [ ] Explanation of what each pace means
- [ ] Build Diet Preferences screen:
  - [ ] Diet type selection (multi-chip)
  - [ ] Allergies input (tags)
  - [ ] Disliked foods input (tags)
  - [ ] Meals per day slider
- [ ] Build Privacy Settings screen:
  - [ ] Data sharing toggles
  - [ ] Photo storage preference
  - [ ] Web search permission
  - [ ] Clear explanations for each setting
- [ ] Build Onboarding Complete screen:
  - [ ] Summary of selections
  - [ ] Calculated initial targets display
  - [ ] "Get Started" CTA
- [ ] Implement onboarding data submission to API
- [ ] Handle partial onboarding recovery
- [ ] Write E2E tests for onboarding flow

---

## Phase 7: Mobile - Core Feature Screens

### 7.1 Home/Today Screen
- [ ] Build greeting header with user name
- [ ] Build daily summary card:
  - [ ] Today's weight (if logged)
  - [ ] Nutrition progress (calories, protein)
  - [ ] Check-in status indicator
- [ ] Build quick action buttons:
  - [ ] "Log Weight" FAB
  - [ ] "Log Meal" button
  - [ ] "Talk to Coach" button
- [ ] Build streak display component
- [ ] Build "Next Best Action" card:
  - [ ] Dynamic content from coach insights
  - [ ] Actionable with tap handler
- [ ] Build recent activity list
- [ ] Implement pull-to-refresh
- [ ] Handle empty states gracefully

### 7.2 Check-in Screen
- [ ] Build weight input component:
  - [ ] Large numeric display
  - [ ] Increment/decrement buttons
  - [ ] Unit toggle (kg/lbs)
  - [ ] Last weight reference
- [ ] Build notes input (expandable text area)
- [ ] Build optional metrics section:
  - [ ] Energy level slider (1-5, with emoji)
  - [ ] Sleep quality slider (1-5)
  - [ ] Mood slider (1-5)
- [ ] Build photo capture/upload:
  - [ ] Camera integration
  - [ ] Gallery picker
  - [ ] Photo preview
  - [ ] Delete option
- [ ] Build save button with validation
- [ ] Implement optimistic updates
- [ ] Handle offline check-in storage
- [ ] Build success confirmation animation
- [ ] Write component tests

### 7.3 Progress Screen
- [ ] Build date range selector (7d, 30d, 90d, all)
- [ ] Build weight trend chart:
  - [ ] Line chart with victory-native
  - [ ] Moving average overlay
  - [ ] Goal weight reference line
  - [ ] Touch to see data point details
- [ ] Build weekly rate of change display
- [ ] Build adherence metrics:
  - [ ] Check-in completion %
  - [ ] Nutrition logging %
  - [ ] Target adherence %
- [ ] Build progress photo comparison:
  - [ ] Side-by-side view
  - [ ] Date selector for each photo
  - [ ] Swipe between comparisons
- [ ] Build stats summary cards:
  - [ ] Total weight change
  - [ ] Average daily calories
  - [ ] Average protein intake
- [ ] Implement chart animations
- [ ] Handle no-data states

### 7.4 Nutrition Logging Screen
- [ ] Build calorie input (large display)
- [ ] Build macro inputs:
  - [ ] Protein (g)
  - [ ] Carbs (g)
  - [ ] Fat (g)
  - [ ] Auto-calculate calories option
- [ ] Build daily target comparison:
  - [ ] Progress bars for each macro
  - [ ] Color coding (under, on-target, over)
- [ ] Build meal quick-add buttons (breakfast, lunch, dinner, snacks)
- [ ] Build recent foods/meals list (for quick re-entry)
- [ ] Build save functionality
- [ ] Implement remaining macros display
- [ ] Handle date selection for past logging

### 7.5 Offline Storage & Sync
- [ ] Set up MMKV or SQLite for local storage
- [ ] Create local check-in storage schema
- [ ] Create local nutrition storage schema
- [ ] Implement sync queue for pending changes
- [ ] Build network status detection
- [ ] Implement background sync (when online)
- [ ] Handle conflict resolution UI
- [ ] Show sync status indicator
- [ ] Test offline scenarios

---

## Phase 8: AI Coach System - Backend

### 8.1 Coach Orchestrator Architecture
- [ ] Create `/apps/api/app/coach_ai/` module structure:
  - `/orchestrator.py` - main coordinator
  - `/tools/` - tool implementations
  - `/policies/` - safety rules
  - `/prompts/` - system prompts
- [ ] Define LLM provider interface
- [ ] Implement OpenAI/Anthropic client wrapper
- [ ] Create user context builder:
  - [ ] Fetch user profile, goals, preferences
  - [ ] Fetch recent check-ins (14 days)
  - [ ] Fetch recent nutrition (14 days)
  - [ ] Compute current metrics
- [ ] Create context summarization (for token efficiency)
- [ ] Implement conversation history management
- [ ] Create `ai_session` table migration:
  - `id`, `user_id`, `started_at`, `last_message_at`
  - `message_count`, `tokens_used`

### 8.2 Tool Registry Implementation
- [ ] Create tool base class/interface
- [ ] Implement internal tools:
  - [ ] `get_user_profile(user_id)` - returns profile, goals, preferences
  - [ ] `get_recent_checkins(user_id, days)` - returns check-in data
  - [ ] `get_weight_trend(user_id, days)` - returns trend analysis
  - [ ] `get_nutrition_summary(user_id, days)` - returns nutrition stats
  - [ ] `calculate_tdee(user_id)` - returns TDEE estimate
  - [ ] `get_adherence_metrics(user_id, days)` - returns adherence data
  - [ ] `create_recommendation(user_id, type, params)` - stores recommendation
  - [ ] `store_coach_note(user_id, note)` - stores internal note
- [ ] Implement external tools:
  - [ ] `search_web(query)` - approved search API integration
  - [ ] `fetch_recipe(query)` - recipe search (approved domains only)
- [ ] Create tool permission system:
  - [ ] Per-user tool consent tracking
  - [ ] Tool allowlist enforcement
- [ ] Create tool result caching (Redis)
- [ ] Create `ai_tool_call_log` table migration:
  - `id`, `session_id`, `tool_name`
  - `input_hash`, `output_summary`
  - `latency_ms`, `created_at`

### 8.3 Safety Policy Engine
- [ ] Create policy rule definitions:
  - [ ] Minimum calorie thresholds (1200F/1500M)
  - [ ] Maximum deficit limits (1000 cal/day)
  - [ ] Minimum protein requirements
  - [ ] Maximum weight loss rate (1% body weight/week)
- [ ] Implement eating disorder signal detection:
  - [ ] Keyword patterns
  - [ ] Behavior patterns (extreme restriction requests)
  - [ ] Response templates for concerning signals
- [ ] Create response filtering:
  - [ ] Medical claim detection
  - [ ] Unsafe recommendation blocking
  - [ ] Disclaimer injection where needed
- [ ] Implement content moderation for outputs
- [ ] Create policy violation logging
- [ ] Write unit tests for all policy rules

### 8.4 Coach API Endpoints
- [ ] Implement `POST /coach/chat` endpoint:
  - [ ] Accept message + conversation context
  - [ ] Build user context
  - [ ] Apply safety policies
  - [ ] Call LLM with tools
  - [ ] Execute tool calls
  - [ ] Return response + tool trace
- [ ] Implement streaming for `/coach/chat`:
  - [ ] SSE or WebSocket support
  - [ ] Stream tokens as generated
  - [ ] Handle tool call interruptions
- [ ] Implement `POST /coach/plan` endpoint:
  - [ ] Generate weekly plan
  - [ ] Include nutrition targets
  - [ ] Include activity suggestions
  - [ ] Store plan for reference
- [ ] Implement `GET /coach/insights` endpoint:
  - [ ] Pre-computed weekly insights
  - [ ] Trend analysis summary
  - [ ] Actionable recommendations
- [ ] Create response schema with:
  - [ ] Message content
  - [ ] Tool trace array
  - [ ] Confidence level
  - [ ] Data gaps/limitations
- [ ] Write API tests for coach endpoints
- [ ] Load test chat endpoint

### 8.5 Explainability Features
- [ ] Create tool trace formatting:
  - [ ] Human-readable tool descriptions
  - [ ] Input/output summaries
  - [ ] Source citations for web search
- [ ] Implement "why" explanation generation:
  - [ ] Data points used
  - [ ] Calculation methodology
  - [ ] Comparison to previous recommendations
- [ ] Create confidence scoring:
  - [ ] Based on data completeness
  - [ ] Based on trend consistency
  - [ ] Based on time since last data
- [ ] Implement "what would improve confidence" suggestions

---

## Phase 9: Mobile - Coach Chat Interface

### 9.1 Chat UI Components
- [ ] Build message bubble components:
  - [ ] User message (right-aligned)
  - [ ] Assistant message (left-aligned)
  - [ ] Typing indicator
- [ ] Build message input bar:
  - [ ] Text input (expandable)
  - [ ] Send button
  - [ ] Disable during streaming
- [ ] Build tool usage disclosure:
  - [ ] Collapsible "Used tools" section
  - [ ] Tool name + purpose display
  - [ ] Source links for web searches
- [ ] Build confidence indicator:
  - [ ] Visual confidence level
  - [ ] "What's missing" expandable
- [ ] Build message timestamp display
- [ ] Implement message list with virtualization

### 9.2 Streaming Implementation
- [ ] Implement SSE/WebSocket client
- [ ] Handle streaming text rendering
- [ ] Show partial message during streaming
- [ ] Handle stream interruption gracefully
- [ ] Implement retry logic for failed streams
- [ ] Add visual streaming indicator

### 9.3 Coach Screen Features
- [ ] Build conversation history loading
- [ ] Implement new conversation start
- [ ] Build suggested prompts:
  - [ ] "What should I eat today?"
  - [ ] "How am I progressing?"
  - [ ] "Adjust my targets"
- [ ] Implement message persistence
- [ ] Handle error states
- [ ] Build empty state (first conversation)
- [ ] Implement conversation reset option
- [ ] Write component tests

### 9.4 Weekly Plan Display
- [ ] Build plan overview card:
  - [ ] Daily calorie target
  - [ ] Macro breakdown visual
  - [ ] Key focus areas
- [ ] Build daily breakdown view
- [ ] Build plan acceptance/modification flow
- [ ] Implement plan storage in local state
- [ ] Show plan in Home screen widget

---

## Phase 10: Settings & Data Management

### 10.1 Settings Screen
- [ ] Build settings navigation list
- [ ] Build profile section:
  - [ ] Edit profile link
  - [ ] Edit goals link
  - [ ] Edit preferences link
- [ ] Build integrations section:
  - [ ] MFP import button
  - [ ] Connection status display
- [ ] Build privacy section:
  - [ ] Data sharing toggles
  - [ ] Web search toggle
  - [ ] Photo visibility settings
- [ ] Build appearance section:
  - [ ] Theme toggle (light/dark/system)
  - [ ] Unit preferences (kg/lbs, metric/imperial)
- [ ] Build account section:
  - [ ] Change password
  - [ ] Export data
  - [ ] Delete account

### 10.2 Data Export Feature
- [ ] Implement `GET /me/export` backend endpoint:
  - [ ] Generate JSON export of all user data
  - [ ] Include check-ins, nutrition, photos metadata
  - [ ] Generate presigned URL for download
- [ ] Build export request UI
- [ ] Handle export generation (async job)
- [ ] Notify when export ready
- [ ] Implement download to device

### 10.3 Account Deletion
- [ ] Implement `DELETE /me` backend endpoint:
  - [ ] Soft delete or hard delete (configurable)
  - [ ] Delete S3 photos
  - [ ] Invalidate all tokens
  - [ ] Send confirmation email
- [ ] Build deletion confirmation flow:
  - [ ] Warning message
  - [ ] Re-enter password
  - [ ] Type "DELETE" confirmation
- [ ] Implement grace period (optional)
- [ ] Handle deletion completion

### 10.4 MFP Import UI
- [ ] Build import instructions screen
- [ ] Implement file picker for ZIP upload
- [ ] Build upload progress indicator
- [ ] Display import results:
  - [ ] Rows imported
  - [ ] Date range covered
  - [ ] Errors encountered
- [ ] Handle import errors gracefully
- [ ] Allow re-import with overwrite option

---

## Phase 11: CI/CD & AWS Infrastructure

### 11.1 Complete CI Pipeline
- [ ] Extend `.github/workflows/ci.yml`:
  - [ ] Add mobile lint job (ESLint)
  - [ ] Add mobile type check (tsc)
  - [ ] Add mobile unit tests (Jest)
- [ ] Create Docker build job
- [ ] Add integration test job:
  - [ ] Use testcontainers for Postgres
  - [ ] Run API tests against real DB
- [ ] Add security scanning:
  - [ ] Dependency vulnerability scan
  - [ ] SAST scanning
- [ ] Configure branch protection rules
- [ ] Set up PR labeling/changelog

### 11.2 Infrastructure as Code
- [ ] Create `/infra` directory structure
- [ ] Choose Terraform vs CDK (recommend Terraform)
- [ ] Create VPC module:
  - [ ] Public/private subnets
  - [ ] NAT Gateway
  - [ ] Security groups
- [ ] Create RDS module:
  - [ ] Postgres instance
  - [ ] Parameter groups
  - [ ] Backup configuration
  - [ ] Multi-AZ (prod only)
- [ ] Create S3 module:
  - [ ] Photos bucket
  - [ ] Export bucket
  - [ ] Lifecycle policies
  - [ ] Bucket policies
- [ ] Create ECR module:
  - [ ] API repository
  - [ ] Lifecycle policy
- [ ] Create ECS module:
  - [ ] Cluster
  - [ ] Task definition
  - [ ] Service
  - [ ] Auto-scaling
- [ ] Create ALB module:
  - [ ] Load balancer
  - [ ] Target groups
  - [ ] SSL certificate
- [ ] Create Secrets Manager resources
- [ ] Create IAM roles and policies

### 11.3 CD Pipeline
- [ ] Create `.github/workflows/deploy.yml`:
  - [ ] Trigger on main branch push
  - [ ] Build and push Docker image to ECR
  - [ ] Run Alembic migrations
  - [ ] Deploy to ECS
- [ ] Implement blue/green or rolling deployment
- [ ] Create staging deployment workflow
- [ ] Create production deployment workflow (manual approval)
- [ ] Set up GitHub environments with secrets
- [ ] Configure OIDC for AWS authentication

### 11.4 Environment Configuration
- [ ] Create staging environment:
  - [ ] Separate RDS instance
  - [ ] Separate S3 buckets
  - [ ] Separate secrets
- [ ] Create production environment:
  - [ ] Production RDS (larger instance)
  - [ ] Production S3 buckets
  - [ ] Production secrets
- [ ] Implement feature flags system:
  - [ ] Database-backed flags
  - [ ] Admin API for flag management
  - [ ] Client-side flag fetching
- [ ] Configure monitoring:
  - [ ] CloudWatch logs
  - [ ] CloudWatch metrics
  - [ ] Alarms for critical metrics

---

## Phase 12: Testing & Quality Assurance

### 12.1 Backend Testing Completion
- [ ] Achieve 80%+ unit test coverage
- [ ] Write integration tests for:
  - [ ] Complete auth flows
  - [ ] Check-in CRUD operations
  - [ ] Nutrition CRUD operations
  - [ ] Photo upload flow
  - [ ] Coach chat flow
- [ ] Write contract tests:
  - [ ] OpenAPI schema validation
  - [ ] Response schema snapshots
- [ ] Write security tests:
  - [ ] Auth bypass attempts
  - [ ] Rate limiting verification
  - [ ] SQL injection prevention
  - [ ] XSS prevention
- [ ] Write load tests (k6):
  - [ ] Check-in endpoint
  - [ ] Nutrition endpoint
  - [ ] Coach chat endpoint
  - [ ] Establish baseline performance

### 12.2 Mobile Testing Completion
- [ ] Write unit tests for:
  - [ ] All utility functions
  - [ ] Store logic
  - [ ] Form validation
- [ ] Write component tests (RNTL):
  - [ ] Auth screens
  - [ ] Onboarding screens
  - [ ] Check-in screen
  - [ ] Coach chat
- [ ] Write E2E tests (Detox):
  - [ ] Complete onboarding flow
  - [ ] Check-in flow
  - [ ] Nutrition logging flow
  - [ ] Coach conversation
- [ ] Set up snapshot tests for key screens
- [ ] Configure test coverage reporting

### 12.3 Security Audit
- [ ] Review OWASP Top 10:
  - [ ] Injection vulnerabilities
  - [ ] Broken authentication
  - [ ] Sensitive data exposure
  - [ ] XML external entities
  - [ ] Broken access control
  - [ ] Security misconfiguration
  - [ ] XSS
  - [ ] Insecure deserialization
  - [ ] Using components with known vulnerabilities
  - [ ] Insufficient logging
- [ ] Review data encryption:
  - [ ] Data in transit (TLS)
  - [ ] Data at rest (DB, S3)
  - [ ] Secrets management
- [ ] Review authentication flows
- [ ] Review authorization logic
- [ ] Document security findings and fixes

### 12.4 Performance Optimization
- [ ] Profile API endpoints
- [ ] Optimize database queries:
  - [ ] Add missing indexes
  - [ ] Review query plans
  - [ ] Implement query caching
- [ ] Optimize mobile app:
  - [ ] Bundle size analysis
  - [ ] Render performance
  - [ ] Memory usage
- [ ] Implement CDN for static assets
- [ ] Review and optimize AI token usage

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
- [ ] Tests passing (unit, integration, E2E where applicable)
- [ ] Code reviewed and merged
- [ ] Documentation updated
- [ ] No critical bugs open

### MVP Definition of Done
- [ ] User can register, login, complete onboarding
- [ ] User can log weight and view trends
- [ ] User can log nutrition manually
- [ ] User can import MFP data via CSV
- [ ] User can chat with AI coach
- [ ] User can view weekly plan and insights
- [ ] User can export data and delete account
- [ ] App works offline and syncs when online
- [ ] Performance meets NFRs (<300ms check-in, smooth charts)
- [ ] Security audit passed
- [ ] Privacy policy and disclaimers in place
