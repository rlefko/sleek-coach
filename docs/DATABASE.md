# Database Documentation

Complete reference for the Sleek Coach database schema.

## Overview

- **Database**: PostgreSQL 15+
- **ORM**: SQLModel (SQLAlchemy + Pydantic)
- **Migrations**: Alembic
- **Primary Keys**: UUID v4
- **Timestamps**: UTC

---

## Entity Relationship Diagram

```mermaid
erDiagram
    USER ||--o| USER_PROFILE : has
    USER ||--o| USER_GOAL : has
    USER ||--o| DIET_PREFERENCES : has
    USER ||--o{ CHECK_IN : logs
    USER ||--o{ NUTRITION_DAY : logs
    USER ||--o{ PROGRESS_PHOTO : uploads
    USER ||--o{ REFRESH_TOKEN : authenticates
    USER ||--o{ AI_SESSION : participates
    AI_SESSION ||--o{ AI_TOOL_CALL_LOG : executes
    AI_SESSION ||--o{ AI_POLICY_VIOLATION_LOG : triggers
    USER ||--o{ AI_TOOL_CALL_LOG : owns
    USER ||--o{ AI_POLICY_VIOLATION_LOG : owns

    USER {
        uuid id PK
        string email UK
        string hashed_password
        boolean is_active
        boolean is_verified
        timestamp created_at
        timestamp updated_at
    }

    USER_PROFILE {
        uuid id PK
        uuid user_id FK UK
        string display_name
        float height_cm
        enum sex
        int birth_year
        enum activity_level
        string timezone
        timestamp created_at
        timestamp updated_at
    }

    USER_GOAL {
        uuid id PK
        uuid user_id FK UK
        enum goal_type
        float target_weight_kg
        enum pace_preference
        date target_date
        timestamp created_at
        timestamp updated_at
    }

    DIET_PREFERENCES {
        uuid id PK
        uuid user_id FK UK
        enum diet_type
        json allergies
        json disliked_foods
        int meals_per_day
        json macro_targets
        timestamp created_at
        timestamp updated_at
    }

    CHECK_IN {
        uuid id PK
        uuid user_id FK
        date date
        decimal weight_kg
        text notes
        int energy_level
        int sleep_quality
        int mood
        decimal adherence_score
        timestamp client_updated_at
        timestamp created_at
        timestamp updated_at
    }

    NUTRITION_DAY {
        uuid id PK
        uuid user_id FK
        date date
        int calories
        decimal protein_g
        decimal carbs_g
        decimal fat_g
        decimal fiber_g
        enum source
        text notes
        timestamp created_at
        timestamp updated_at
    }

    PROGRESS_PHOTO {
        uuid id PK
        uuid user_id FK
        date date
        string s3_key UK
        string content_hash
        enum visibility
        json photo_metadata
        timestamp created_at
    }

    REFRESH_TOKEN {
        uuid id PK
        uuid user_id FK
        string token_hash
        timestamp expires_at
        timestamp revoked_at
        timestamp created_at
        string user_agent
        string ip_address
    }

    AI_SESSION {
        uuid id PK
        uuid user_id FK
        enum status
        timestamp started_at
        timestamp last_message_at
        int message_count
        int tokens_used
        string model_tier
        text context_summary
        jsonb conversation_history
        jsonb metadata
        timestamp created_at
    }

    AI_TOOL_CALL_LOG {
        uuid id PK
        uuid session_id FK
        uuid user_id FK
        string tool_name
        string tool_category
        string input_hash
        string input_summary
        text output_summary
        enum status
        string error_message
        int latency_ms
        boolean cached
        timestamp created_at
    }

    AI_POLICY_VIOLATION_LOG {
        uuid id PK
        uuid session_id FK
        uuid user_id FK
        enum violation_type
        string severity
        text trigger_content
        string action_taken
        jsonb details
        timestamp created_at
    }
```

---

## Table Descriptions

### Core User Tables

#### `user`

Core user table for authentication.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | Unique identifier |
| `email` | VARCHAR(255) | UNIQUE, NOT NULL, INDEX | User's email address |
| `hashed_password` | VARCHAR(255) | NOT NULL | Argon2id hashed password |
| `is_active` | BOOLEAN | DEFAULT TRUE | Account active status |
| `is_verified` | BOOLEAN | DEFAULT FALSE | Email verification status |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Account creation time |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Last update time |

---

#### `user_profile`

Extended user profile information.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | Unique identifier |
| `user_id` | UUID | FK(user.id), UNIQUE, NOT NULL | Parent user |
| `display_name` | VARCHAR(100) | NULL | Display name |
| `height_cm` | NUMERIC | CHECK(50-300), NULL | Height in centimeters |
| `sex` | ENUM | NULL | male/female/other/prefer_not_to_say |
| `birth_year` | INTEGER | CHECK(1900-2100), NULL | Year of birth |
| `activity_level` | ENUM | NULL | sedentary/light/moderate/active/very_active |
| `timezone` | VARCHAR(50) | DEFAULT 'UTC' | User's timezone |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Creation time |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Last update time |

---

#### `user_goal`

User fitness goals.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | Unique identifier |
| `user_id` | UUID | FK(user.id), UNIQUE, NOT NULL | Parent user |
| `goal_type` | ENUM | DEFAULT 'maintenance' | fat_loss/muscle_gain/recomp/maintenance/performance |
| `target_weight_kg` | NUMERIC | CHECK(20-500), NULL | Target weight |
| `pace_preference` | ENUM | DEFAULT 'moderate' | slow/moderate/aggressive |
| `target_date` | DATE | NULL | Goal target date |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Creation time |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Last update time |

---

#### `diet_preferences`

User dietary preferences.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | Unique identifier |
| `user_id` | UUID | FK(user.id), UNIQUE, NOT NULL | Parent user |
| `diet_type` | ENUM | DEFAULT 'none' | none/vegetarian/vegan/pescatarian/keto/paleo/halal/kosher |
| `allergies` | JSON | DEFAULT [] | List of allergies |
| `disliked_foods` | JSON | DEFAULT [] | Foods to avoid |
| `meals_per_day` | INTEGER | CHECK(1-10), DEFAULT 3 | Meal frequency |
| `macro_targets` | JSON | NULL | Custom macro targets |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Creation time |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Last update time |

---

### Tracking Tables

#### `check_in`

Daily check-in records for weight and wellness tracking.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | Unique identifier |
| `user_id` | UUID | FK(user.id), NOT NULL, INDEX | Parent user |
| `date` | DATE | NOT NULL | Check-in date |
| `weight_kg` | NUMERIC(5,2) | CHECK(20-500), NULL | Weight in kg |
| `notes` | TEXT | NULL | User notes |
| `energy_level` | SMALLINT | CHECK(1-10), NULL | Energy rating |
| `sleep_quality` | SMALLINT | CHECK(1-10), NULL | Sleep rating |
| `mood` | SMALLINT | CHECK(1-10), NULL | Mood rating |
| `adherence_score` | NUMERIC(3,2) | CHECK(0-1), NULL | Computed adherence |
| `client_updated_at` | TIMESTAMP | NULL | Client-side timestamp (for sync) |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Creation time |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Last update time |

**Indexes:**
- `ix_check_in_user_id` (user_id)
- `ix_check_in_user_date` (user_id, date) UNIQUE

---

#### `nutrition_day`

Daily nutrition records for macro tracking.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | Unique identifier |
| `user_id` | UUID | FK(user.id), NOT NULL, INDEX | Parent user |
| `date` | DATE | NOT NULL | Nutrition date |
| `calories` | INTEGER | NULL | Total calories |
| `protein_g` | NUMERIC(6,2) | NULL | Protein in grams |
| `carbs_g` | NUMERIC(6,2) | NULL | Carbs in grams |
| `fat_g` | NUMERIC(6,2) | NULL | Fat in grams |
| `fiber_g` | NUMERIC(5,2) | NULL | Fiber in grams |
| `source` | VARCHAR(20) | DEFAULT 'manual' | manual/mfp_import |
| `notes` | TEXT | NULL | User notes |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Creation time |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Last update time |

**Indexes:**
- `ix_nutrition_day_user_id` (user_id)
- `ix_nutrition_day_user_date` (user_id, date) UNIQUE

---

#### `progress_photo`

Progress photo metadata storage.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | Unique identifier |
| `user_id` | UUID | FK(user.id), NOT NULL, INDEX | Parent user |
| `date` | DATE | NOT NULL | Photo date |
| `s3_key` | VARCHAR(500) | UNIQUE, NOT NULL | S3 object key |
| `content_hash` | VARCHAR(64) | NULL | SHA-256 for dedup |
| `visibility` | ENUM | DEFAULT 'private' | private/coach_only |
| `photo_metadata` | JSON | NULL | Dimensions, size, etc. |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Creation time |

**Indexes:**
- `ix_progress_photo_user_id` (user_id)
- `ix_progress_photo_user_date` (user_id, date)
- `ix_progress_photo_s3_key` (s3_key) UNIQUE

---

### Authentication Tables

#### `refresh_token`

Refresh token storage for token rotation.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | Unique identifier |
| `user_id` | UUID | FK(user.id), NOT NULL, INDEX | Parent user |
| `token_hash` | VARCHAR(255) | NOT NULL, INDEX | SHA-256 hash of token |
| `expires_at` | TIMESTAMP | NOT NULL | Token expiration |
| `revoked_at` | TIMESTAMP | NULL | Revocation time |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Creation time |
| `user_agent` | VARCHAR(500) | NULL | Client user agent |
| `ip_address` | VARCHAR(45) | NULL | Client IP address |

**Indexes:**
- `ix_refresh_token_user_id` (user_id)
- `ix_refresh_token_token_hash` (token_hash)

---

### AI Coach Tables

#### `ai_session`

AI conversation session tracking.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | Unique identifier |
| `user_id` | UUID | FK(user.id), NOT NULL, INDEX | Parent user |
| `status` | ENUM | DEFAULT 'active' | active/completed/expired |
| `started_at` | TIMESTAMP | DEFAULT NOW() | Session start |
| `last_message_at` | TIMESTAMP | DEFAULT NOW() | Last message time |
| `message_count` | INTEGER | DEFAULT 0 | Total messages |
| `tokens_used` | INTEGER | DEFAULT 0 | Total tokens used |
| `model_tier` | VARCHAR(20) | DEFAULT 'standard' | Model tier used |
| `context_summary` | TEXT | NULL | Summarized context |
| `conversation_history` | JSONB | NULL | Message history |
| `metadata` | JSONB | NULL | Session metadata |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Creation time |

**Indexes:**
- `ix_ai_session_user_id` (user_id)

---

#### `ai_tool_call_log`

Log of AI tool calls for auditability and debugging.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | Unique identifier |
| `session_id` | UUID | FK(ai_session.id), NOT NULL, INDEX | Parent session |
| `user_id` | UUID | FK(user.id), NOT NULL, INDEX | Parent user |
| `tool_name` | VARCHAR(100) | NOT NULL | Tool identifier |
| `tool_category` | VARCHAR(50) | NOT NULL | internal/external |
| `input_hash` | VARCHAR(64) | NOT NULL | Hash of input params |
| `input_summary` | VARCHAR(500) | NULL | Human-readable input |
| `output_summary` | TEXT | NULL | Tool output summary |
| `status` | ENUM | DEFAULT 'success' | success/failed/blocked |
| `error_message` | VARCHAR(500) | NULL | Error details if failed |
| `latency_ms` | INTEGER | DEFAULT 0 | Execution time |
| `cached` | BOOLEAN | DEFAULT FALSE | Was result cached? |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Creation time |

**Indexes:**
- `ix_ai_tool_call_log_session_id` (session_id)
- `ix_ai_tool_call_log_user_id` (user_id)

---

#### `ai_policy_violation_log`

Log of safety policy violations for monitoring.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | Unique identifier |
| `session_id` | UUID | FK(ai_session.id), NULL, INDEX | Parent session |
| `user_id` | UUID | FK(user.id), NOT NULL, INDEX | Parent user |
| `violation_type` | ENUM | NOT NULL | Type of violation |
| `severity` | VARCHAR(20) | NOT NULL | warning/critical |
| `trigger_content` | TEXT | NULL | Content that triggered |
| `action_taken` | VARCHAR(100) | NOT NULL | Action taken |
| `details` | JSONB | NULL | Additional details |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Creation time |

**Violation Types:**
- `calorie_minimum` - Below safe calorie threshold
- `calorie_maximum` - Above safe calorie threshold
- `protein_minimum` - Below protein requirements
- `weight_loss_rate` - Exceeds safe weight loss rate
- `eating_disorder_signal` - Detected ED patterns
- `medical_claim` - Medical advice requested
- `unsafe_content` - Other unsafe content

**Indexes:**
- `ix_ai_policy_violation_log_user_id` (user_id)

---

## Enum Types

### Sex
```
male | female | other | prefer_not_to_say
```

### ActivityLevel
```
sedentary | light | moderate | active | very_active
```

### GoalType
```
fat_loss | muscle_gain | recomp | maintenance | performance
```

### PacePreference
```
slow | moderate | aggressive
```

### DietType
```
none | vegetarian | vegan | pescatarian | keto | paleo | halal | kosher
```

### NutritionSource
```
manual | mfp_import
```

### PhotoVisibility
```
private | coach_only
```

### SessionStatus
```
active | completed | expired
```

### ToolCallStatus
```
success | failed | blocked
```

### PolicyViolationType
```
calorie_minimum | calorie_maximum | protein_minimum |
weight_loss_rate | eating_disorder_signal | medical_claim | unsafe_content
```

---

## Migration Guide

### Prerequisites

```bash
cd apps/api
uv sync  # Install dependencies
```

### Running Migrations

```bash
# Apply all pending migrations
uv run alembic upgrade head

# Check current revision
uv run alembic current

# View migration history
uv run alembic history

# Rollback one migration
uv run alembic downgrade -1

# Rollback to specific revision
uv run alembic downgrade <revision_id>
```

### Creating New Migrations

```bash
# Auto-generate migration from model changes
uv run alembic revision --autogenerate -m "Add new_column to user"

# Create empty migration for manual changes
uv run alembic revision -m "Custom migration description"
```

### Migration Best Practices

1. **Always review auto-generated migrations** - Alembic may not detect all changes correctly
2. **Test migrations on staging** before production
3. **Keep migrations small** - One logical change per migration
4. **Include rollback logic** - Ensure `downgrade()` works
5. **Don't modify committed migrations** - Create new migrations instead

### Sample Migration

```python
"""Add notification_preferences to user_profile

Revision ID: abc123
Revises: xyz789
Create Date: 2024-01-15 10:00:00.000000
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = 'abc123'
down_revision = 'xyz789'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        'user_profile',
        sa.Column('notification_preferences', postgresql.JSONB(), nullable=True)
    )


def downgrade() -> None:
    op.drop_column('user_profile', 'notification_preferences')
```

---

## Performance Considerations

### Indexes

All foreign keys have indexes for efficient JOINs. Additional indexes are created for:

- User lookups by email
- Check-ins by user+date (unique constraint ensures one per day)
- Nutrition by user+date (unique constraint ensures one per day)
- Photos by S3 key (for upload verification)
- Refresh tokens by hash (for validation)

### Query Optimization

**Efficient user context loading:**
```sql
-- Uses selectin loading for related tables
SELECT u.*, up.*, ug.*, dp.*
FROM user u
LEFT JOIN user_profile up ON u.id = up.user_id
LEFT JOIN user_goal ug ON u.id = ug.user_id
LEFT JOIN diet_preferences dp ON u.id = dp.user_id
WHERE u.id = :user_id
```

**Date range queries (check-ins, nutrition):**
```sql
-- Uses composite index (user_id, date)
SELECT * FROM check_in
WHERE user_id = :user_id
AND date BETWEEN :from_date AND :to_date
ORDER BY date DESC
LIMIT 100
```

### Connection Pooling

Default configuration:
- Pool size: 5
- Max overflow: 10
- Pool recycle: 1800s (30 min)

Adjust in `app/config.py` for production loads.

---

## Backup & Recovery

### Automated Backups (AWS RDS)

- Automated daily snapshots
- Point-in-time recovery (up to 7 days)
- Multi-AZ deployment for production

### Manual Backup

```bash
# Create backup
pg_dump -h hostname -U username -d sleekcoach > backup.sql

# Restore backup
psql -h hostname -U username -d sleekcoach < backup.sql
```

---

## Data Retention

| Data Type | Retention | Notes |
|-----------|-----------|-------|
| User accounts | Until deleted | Soft delete available |
| Check-ins | Indefinite | Part of user data |
| Nutrition | Indefinite | Part of user data |
| Photos | Until deleted | S3 lifecycle: 90 days after deletion |
| Refresh tokens | Auto-cleanup | Expired tokens purged after 30 days |
| AI sessions | 90 days | Old sessions archived then deleted |
| AI tool logs | 90 days | For debugging and auditing |
| Policy violations | 1 year | For safety monitoring |

---

## Schema Versioning

The database schema version is tracked via Alembic migrations. Current version can be checked with:

```bash
uv run alembic current
```

All migrations are stored in `apps/api/alembic/versions/`.
