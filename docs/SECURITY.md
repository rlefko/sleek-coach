# Security Documentation

This document outlines the security architecture, practices, and compliance measures implemented in the Sleek Coach application.

## Table of Contents

- [Security Architecture](#security-architecture)
- [Authentication & Authorization](#authentication--authorization)
- [Data Protection](#data-protection)
- [OWASP Top 10 Compliance](#owasp-top-10-compliance)
- [API Security](#api-security)
- [Mobile Security](#mobile-security)
- [AI Coach Safety](#ai-coach-safety)
- [Security Testing](#security-testing)
- [Incident Response](#incident-response)

---

## Security Architecture

### Defense in Depth

The application implements multiple layers of security:

1. **Network Layer**: HTTPS enforcement, CORS restrictions, rate limiting
2. **Application Layer**: Input validation, output encoding, authentication
3. **Data Layer**: Encryption at rest, parameterized queries, access controls
4. **Infrastructure Layer**: AWS security groups, IAM roles, secrets management

### Key Security Components

| Component | Location | Purpose |
|-----------|----------|---------|
| Security Headers Middleware | `apps/api/app/middleware/security_headers.py` | XSS, clickjacking protection |
| Rate Limiter | `apps/api/app/middleware/rate_limit.py` | DoS protection |
| Auth Dependencies | `apps/api/app/auth/dependencies.py` | Route protection |
| Policy Engine | `apps/api/app/coach_ai/policies/` | AI safety guardrails |

---

## Authentication & Authorization

### JWT Token System

- **Access Tokens**: 15-minute expiry, used for API authentication
- **Refresh Tokens**: 7-day expiry, stored as SHA-256 hashes in database
- **Token Rotation**: Refresh tokens are rotated on use, old tokens invalidated

### Password Security

- **Algorithm**: Argon2id (OWASP recommended)
- **Memory Cost**: 64 MB
- **Time Cost**: 3 iterations
- **Parallelism**: 4 threads

### Password Requirements

- Minimum 8 characters, maximum 128 characters
- At least one uppercase letter (A-Z)
- At least one lowercase letter (a-z)
- At least one digit (0-9)
- At least one special character

### Session Management

- Refresh tokens tracked in database with IP and user-agent
- Token revocation on logout (single and all sessions)
- User activation status checked on every request

---

## Data Protection

### Encryption

| Data Type | At Rest | In Transit |
|-----------|---------|------------|
| Passwords | Argon2id hashed | TLS 1.2+ |
| Tokens | SHA-256 hashed | TLS 1.2+ |
| Photos | S3 server-side encryption | HTTPS presigned URLs |
| Database | AWS RDS encryption | TLS connections |

### Sensitive Data Handling

- API keys and secrets managed via environment variables
- Production environments require explicit secret configuration (startup validation)
- No secrets in version control (enforced via `.gitignore`)
- Presigned URLs for S3 access (no anonymous bucket access)

### Data Access Controls

- All data queries scoped to authenticated user's ID
- Foreign key constraints prevent cross-user data access
- S3 keys namespaced by user ID

---

## OWASP Top 10 Compliance

### A01:2021 - Broken Access Control

**Status**: Mitigated

- All protected routes require valid JWT token
- User ID extracted from token, not user input
- Authorization checks via FastAPI dependencies
- Security tests: `tests/security/test_auth_bypass.py`

### A02:2021 - Cryptographic Failures

**Status**: Mitigated

- Strong password hashing (Argon2id)
- TLS enforced in production (HSTS header)
- Secrets validated on startup in production
- No sensitive data in logs

### A03:2021 - Injection

**Status**: Mitigated

- SQLAlchemy ORM with parameterized queries (no raw SQL)
- Pydantic input validation on all endpoints
- Security tests: `tests/security/test_injection.py`
- Content-type validation for file uploads

### A04:2021 - Insecure Design

**Status**: Mitigated

- Security middleware applied globally
- Defense in depth architecture
- AI safety policy engine with multiple guardrails
- Rate limiting on sensitive endpoints

### A05:2021 - Security Misconfiguration

**Status**: Mitigated

- Production secret validation on startup
- API documentation disabled in production
- Explicit CORS configuration (no wildcards for methods/headers)
- Security headers on all responses

### A06:2021 - Vulnerable and Outdated Components

**Status**: Ongoing

- Dependabot configured for dependency updates
- Modern framework versions (FastAPI 0.115+, Pydantic 2.10+)
- CI pipeline includes security scanning

### A07:2021 - Identification and Authentication Failures

**Status**: Mitigated

- Rate limiting on auth endpoints (5 requests / 15 minutes)
- Secure password requirements
- Token type validation (access vs refresh)
- Account lockout not implemented (rate limiting serves this purpose)

### A08:2021 - Software and Data Integrity Failures

**Status**: Mitigated

- ZIP bomb protection in file uploads (100MB decompressed limit)
- Content-type validation for photos
- Signed URLs for S3 access

### A09:2021 - Security Logging and Monitoring Failures

**Status**: Mitigated

- Structured logging with structlog
- Request ID middleware for tracing
- S3 operations logged with error details
- Audit events for auth operations

### A10:2021 - Server-Side Request Forgery (SSRF)

**Status**: Mitigated

- No user-controlled URLs in server requests
- External API calls (OpenAI) use whitelisted endpoints
- Timeouts on all external requests

---

## API Security

### Security Headers

Applied to all responses:

```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Cache-Control: no-store
Strict-Transport-Security: max-age=31536000; includeSubDomains (production only)
```

### CORS Configuration

- Origins: Whitelisted domains only
- Methods: Explicit list (GET, POST, PATCH, PUT, DELETE, OPTIONS)
- Headers: Explicit list (Authorization, Content-Type, X-Request-ID, Accept)
- Credentials: Allowed for authenticated requests

### Rate Limiting

| Endpoint | Limit |
|----------|-------|
| Auth endpoints | 5 requests / 15 minutes |
| General API | 100 requests / 60 seconds |

### Request Timeouts

- OpenAI API: 60 seconds (120 for streaming)
- Mobile client: 30 seconds per request

---

## Mobile Security

### Token Storage

- **Implementation**: expo-secure-store (hardware-backed encryption)
- **Location**: `apps/mobile/src/lib/storage.ts`
- **Migration**: Moved from MMKV to SecureStore in Phase 12.3

### API Client Security

- Bearer token injection via Authorization header
- Automatic token refresh on 401 responses
- Request timeouts with AbortController (30 seconds)
- No sensitive data in error messages

### Input Validation

- Zod schemas for all form inputs
- Client-side validation mirrors server requirements
- No sensitive data in console logs

---

## AI Coach Safety

### Safety Policy Engine

Located in `apps/api/app/coach_ai/policies/`:

1. **Eating Disorder Detection**: Keyword and pattern matching for concerning requests
2. **Calorie Safety**: Minimum thresholds (1200F/1500M), maximum deficit (1000 cal/day)
3. **Medical Claims**: Blocks dangerous medical advice
4. **Weight Loss Rate**: Maximum 1% body weight per week

### Tool Access Controls

- Internal tools: Deterministic, no user consent required
- External tools (web search): Require user consent, rate limited
- Tool call logging for audit

### Response Filtering

- Medical claim detection and blocking
- Disclaimer injection for borderline cases
- Content moderation on outputs

---

## Security Testing

### Automated Tests

| Test File | Coverage |
|-----------|----------|
| `tests/security/test_auth_bypass.py` | Token validation, tampering, type confusion |
| `tests/security/test_injection.py` | SQL, XSS, command, path traversal, NoSQL, header injection |

### Test Categories

1. **Authentication Bypass**
   - Expired token rejection
   - Malformed token handling
   - Wrong secret rejection
   - Payload tampering detection
   - "None" algorithm attack prevention

2. **Injection Prevention**
   - SQL injection in email, search, pagination
   - XSS in user-provided content
   - Command injection in display names
   - Path traversal in S3 keys
   - NoSQL injection in JSON fields
   - Header injection (CRLF)

### Running Security Tests

```bash
cd apps/api
uv run pytest tests/security/ -v
```

---

## Incident Response

### Security Issue Reporting

For security vulnerabilities, please email: security@sleekcoach.app

### Response Process

1. **Triage**: Assess severity and impact
2. **Contain**: Isolate affected systems if necessary
3. **Investigate**: Determine root cause
4. **Remediate**: Deploy fix
5. **Document**: Update security documentation

### Severity Levels

| Level | Description | Response Time |
|-------|-------------|---------------|
| Critical | Active exploitation, data breach | Immediate |
| High | Exploitable vulnerability | 24 hours |
| Medium | Vulnerability requiring auth | 72 hours |
| Low | Defense in depth improvement | Next release |

---

## Changelog

### Phase 12.3 - Security Audit (2024)

- Migrated mobile token storage to expo-secure-store
- Added production secret validation on startup
- Removed MinIO anonymous bucket access
- Added OpenAI API request timeouts
- Implemented ZIP bomb protection in MFP parser
- Restricted CORS to explicit methods/headers
- Improved S3 exception logging
- Added mobile API request timeouts
- Created this security documentation
