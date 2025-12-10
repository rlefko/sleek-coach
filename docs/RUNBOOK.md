# Operations Runbook

Operations guide for Sleek Coach production systems.

## Infrastructure Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         AWS Region                               │
│                                                                  │
│  ┌──────────┐    ┌───────────────┐    ┌──────────────────────┐  │
│  │  Route53 │───▶│      ALB      │───▶│     ECS Fargate      │  │
│  │   (DNS)  │    │ (HTTPS/443)   │    │  (API Containers)    │  │
│  └──────────┘    └───────────────┘    └──────────┬───────────┘  │
│                                                   │              │
│                    ┌──────────────────────────────┼──────────┐  │
│                    │                              │          │  │
│                    ▼                              ▼          ▼  │
│  ┌──────────────────────┐  ┌───────────────┐  ┌────────────┐  │
│  │   RDS PostgreSQL     │  │ ElastiCache   │  │     S3     │  │
│  │   (Multi-AZ Prod)    │  │   (Redis)     │  │  (Photos)  │  │
│  └──────────────────────┘  └───────────────┘  └────────────┘  │
│                                                                  │
│  ┌──────────────────────┐  ┌───────────────┐                   │
│  │   Secrets Manager    │  │  CloudWatch   │                   │
│  │  (API Keys, DB PWD)  │  │   (Logging)   │                   │
│  └──────────────────────┘  └───────────────┘                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Service Dependencies

| Service | Purpose | Health Check |
|---------|---------|--------------|
| **ECS Fargate** | API containers | `/health` endpoint |
| **RDS PostgreSQL** | Primary database | Connection test |
| **ElastiCache Redis** | Caching, rate limiting | PING command |
| **S3** | Photo storage | HEAD request |
| **Secrets Manager** | Credentials | SDK call |
| **OpenAI/Anthropic** | AI provider | API health check |

---

## Common Incidents

### 1. API Unresponsive (5xx Errors)

**Symptoms:**
- Health checks failing
- Users receiving 500/502/503 errors
- Response times > 30s

**Investigation:**

```bash
# Check ECS service status
aws ecs describe-services --cluster sleek-coach-prod \
  --services sleek-coach-api

# View recent logs
aws logs filter-log-events \
  --log-group-name /ecs/sleek-coach-api \
  --start-time $(date -d '30 minutes ago' +%s)000 \
  --filter-pattern "ERROR"

# Check container health
aws ecs describe-tasks --cluster sleek-coach-prod \
  --tasks $(aws ecs list-tasks --cluster sleek-coach-prod --query 'taskArns[0]' --output text)
```

**Common Causes & Fixes:**

| Cause | Fix |
|-------|-----|
| Database connection exhausted | Restart ECS tasks, check pool settings |
| Memory exhaustion | Increase task memory, check for leaks |
| Deadlocked containers | Force new deployment |
| Bad deployment | Rollback to previous version |

**Rollback Procedure:**
```bash
# List recent deployments
aws ecs list-task-definitions \
  --family-prefix sleek-coach-api \
  --sort DESC --max-items 5

# Deploy previous version
aws ecs update-service --cluster sleek-coach-prod \
  --service sleek-coach-api \
  --task-definition sleek-coach-api:<previous-revision>
```

---

### 2. Database Connection Issues

**Symptoms:**
- "Connection refused" errors
- "Too many connections" errors
- Slow queries

**Investigation:**

```bash
# Check RDS status
aws rds describe-db-instances \
  --db-instance-identifier sleek-coach-prod

# View RDS metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/RDS \
  --metric-name DatabaseConnections \
  --dimensions Name=DBInstanceIdentifier,Value=sleek-coach-prod \
  --start-time $(date -d '1 hour ago' -u +%Y-%m-%dT%H:%M:%SZ) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%SZ) \
  --period 300 --statistics Maximum
```

**Fixes:**

| Issue | Fix |
|-------|-----|
| Connection limit reached | Restart ECS tasks, increase `max_connections` |
| RDS CPU maxed | Scale up instance, optimize queries |
| Disk space low | Increase storage, clean up old data |
| Failover in progress | Wait for failover completion (Multi-AZ) |

**Emergency: Scale RDS Instance:**
```bash
aws rds modify-db-instance \
  --db-instance-identifier sleek-coach-prod \
  --db-instance-class db.r6g.xlarge \
  --apply-immediately
```

---

### 3. Redis Cache Failures

**Symptoms:**
- Rate limiting not working
- Slower response times
- "Connection refused" to Redis

**Investigation:**

```bash
# Check ElastiCache cluster status
aws elasticache describe-cache-clusters \
  --cache-cluster-id sleek-coach-redis

# View metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/ElastiCache \
  --metric-name CurrConnections \
  --dimensions Name=CacheClusterId,Value=sleek-coach-redis \
  --start-time $(date -d '1 hour ago' -u +%Y-%m-%dT%H:%M:%SZ) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%SZ) \
  --period 300 --statistics Maximum
```

**Fixes:**

| Issue | Fix |
|-------|-----|
| Connection limit | Restart cache cluster |
| Memory full | Increase node size, review TTLs |
| Network issue | Check security groups |

**Note:** API is designed to function without Redis (graceful degradation), but rate limiting will be disabled.

---

### 4. S3 Upload/Download Failures

**Symptoms:**
- Photo uploads failing
- Presigned URLs not working
- "Access Denied" errors

**Investigation:**

```bash
# Check bucket accessibility
aws s3 ls s3://sleek-coach-photos-prod/

# Test presigned URL generation
aws s3 presign s3://sleek-coach-photos-prod/test.txt --expires-in 300

# Check bucket policy
aws s3api get-bucket-policy --bucket sleek-coach-photos-prod
```

**Common Causes:**

| Cause | Fix |
|-------|-----|
| IAM role permissions | Update ECS task role |
| Bucket policy changed | Review and restore policy |
| CORS misconfiguration | Update CORS rules |
| Region mismatch | Verify endpoint configuration |

---

### 5. AI Coach Errors

**Symptoms:**
- Chat responses timing out
- "Failed to process chat request" errors
- High latency on `/coach/chat`

**Investigation:**

```bash
# Check AI provider status
curl -s https://status.openai.com/api/v2/status.json | jq '.status'

# View AI-specific logs
aws logs filter-log-events \
  --log-group-name /ecs/sleek-coach-api \
  --filter-pattern "coach"

# Check tool call latencies
# Query from ai_tool_call_log table
```

**Common Causes:**

| Cause | Fix |
|-------|-----|
| OpenAI rate limited | Implement backoff, check quota |
| API key expired | Rotate key in Secrets Manager |
| Provider outage | Switch to backup provider |
| Context too large | Review context summarization |

**Fallback Response:**

If AI provider is completely unavailable, the API returns:
```json
{
  "message": "I'm temporarily unable to provide personalized advice. Please try again in a few minutes.",
  "confidence": 0.0
}
```

---

### 6. High Latency

**Symptoms:**
- P95 latency > 1s
- User complaints about slow app

**Investigation:**

```bash
# Check ECS CPU/Memory
aws cloudwatch get-metric-statistics \
  --namespace AWS/ECS \
  --metric-name CPUUtilization \
  --dimensions Name=ClusterName,Value=sleek-coach-prod \
               Name=ServiceName,Value=sleek-coach-api \
  --start-time $(date -d '1 hour ago' -u +%Y-%m-%dT%H:%M:%SZ) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%SZ) \
  --period 60 --statistics Average

# Check RDS latency
aws cloudwatch get-metric-statistics \
  --namespace AWS/RDS \
  --metric-name ReadLatency \
  --dimensions Name=DBInstanceIdentifier,Value=sleek-coach-prod \
  --start-time $(date -d '1 hour ago' -u +%Y-%m-%dT%H:%M:%SZ) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%SZ) \
  --period 60 --statistics Average
```

**Quick Fixes:**

| Symptom | Fix |
|---------|-----|
| ECS CPU > 80% | Scale out (add tasks) |
| RDS CPU > 80% | Scale up instance |
| Redis hit rate low | Review cache TTLs |
| Specific endpoint slow | Check query plans, add indexes |

**Scale ECS Service:**
```bash
aws ecs update-service --cluster sleek-coach-prod \
  --service sleek-coach-api \
  --desired-count 4
```

---

## Deployment Procedures

### Standard Deployment (CI/CD)

1. **Push to main branch** triggers GitHub Actions
2. **CI runs:** Tests, linting, type checking
3. **Docker image built** and pushed to ECR
4. **Alembic migrations** run against staging
5. **Staging deployment** happens automatically
6. **Production deployment** requires manual approval

### Manual Deployment

```bash
# 1. Build and push image
cd apps/api
docker build -t sleek-coach-api .
docker tag sleek-coach-api:latest \
  <account>.dkr.ecr.<region>.amazonaws.com/sleek-coach-api:latest
docker push <account>.dkr.ecr.<region>.amazonaws.com/sleek-coach-api:latest

# 2. Run migrations
aws ecs run-task --cluster sleek-coach-prod \
  --task-definition sleek-coach-migrate \
  --launch-type FARGATE

# 3. Update service
aws ecs update-service --cluster sleek-coach-prod \
  --service sleek-coach-api \
  --force-new-deployment
```

### Rollback Procedure

```bash
# 1. List recent task definitions
aws ecs list-task-definitions \
  --family-prefix sleek-coach-api \
  --sort DESC --max-items 5

# 2. Deploy previous version
aws ecs update-service --cluster sleek-coach-prod \
  --service sleek-coach-api \
  --task-definition sleek-coach-api:<previous-revision>

# 3. If database migration caused issues, rollback
aws ecs run-task --cluster sleek-coach-prod \
  --task-definition sleek-coach-migrate-rollback \
  --launch-type FARGATE \
  --overrides '{"containerOverrides":[{"name":"migrate","command":["alembic","downgrade","-1"]}]}'
```

---

## Monitoring & Alerts

### CloudWatch Alarms

| Alarm | Threshold | Action |
|-------|-----------|--------|
| API 5xx Rate | > 5% for 5 min | Page on-call |
| API Latency P95 | > 2s for 5 min | Notify team |
| ECS CPU | > 85% for 10 min | Auto-scale |
| RDS CPU | > 80% for 15 min | Page on-call |
| RDS Connections | > 80% max for 5 min | Page on-call |
| Redis Memory | > 80% for 10 min | Notify team |
| Failed Login Rate | > 100/min | Security alert |

### Key Metrics to Monitor

**Application:**
- Request rate (by endpoint)
- Error rate (4xx, 5xx)
- Latency (P50, P95, P99)
- Active users (concurrent sessions)

**Infrastructure:**
- ECS CPU/Memory utilization
- RDS CPU, connections, disk
- Redis memory, connections, hit rate
- S3 request rate, errors

**Business:**
- Daily active users
- Check-ins per day
- AI coach conversations
- Policy violations

### Log Locations

| Log Type | Location |
|----------|----------|
| API Application | `/ecs/sleek-coach-api` |
| Database (RDS) | RDS console → Logs |
| Load Balancer | S3: `sleek-coach-logs/alb/` |
| CloudTrail | S3: `sleek-coach-logs/cloudtrail/` |

---

## Scheduled Tasks

| Task | Schedule | Purpose |
|------|----------|---------|
| Database backup | Daily 3AM UTC | RDS automated snapshot |
| Log rotation | Every 24h | Clean up old logs |
| Token cleanup | Daily 4AM UTC | Purge expired refresh tokens |
| AI session cleanup | Weekly | Archive old sessions |
| Metrics aggregation | Hourly | Update dashboards |

---

## Security Procedures

### Rotate Database Password

```bash
# 1. Generate new password
NEW_PASS=$(openssl rand -base64 32)

# 2. Update Secrets Manager
aws secretsmanager put-secret-value \
  --secret-id sleek-coach-prod/db-password \
  --secret-string "$NEW_PASS"

# 3. Update RDS
aws rds modify-db-instance \
  --db-instance-identifier sleek-coach-prod \
  --master-user-password "$NEW_PASS"

# 4. Force ECS task refresh (picks up new secret)
aws ecs update-service --cluster sleek-coach-prod \
  --service sleek-coach-api \
  --force-new-deployment
```

### Rotate API Keys (OpenAI)

```bash
# 1. Get new key from OpenAI dashboard
# 2. Update Secrets Manager
aws secretsmanager put-secret-value \
  --secret-id sleek-coach-prod/openai-api-key \
  --secret-string "sk-new-key-here"

# 3. Force ECS task refresh
aws ecs update-service --cluster sleek-coach-prod \
  --service sleek-coach-api \
  --force-new-deployment
```

### Incident Response

1. **Identify** - What's broken? What's the impact?
2. **Communicate** - Update status page, notify stakeholders
3. **Mitigate** - Apply quick fix or rollback
4. **Investigate** - Root cause analysis
5. **Document** - Post-mortem, update runbook

---

## Contacts & Escalation

### Escalation Path

| Level | Contact | When |
|-------|---------|------|
| L1 | On-call engineer | First response |
| L2 | Engineering lead | L1 can't resolve in 30 min |
| L3 | CTO / Founder | Major outage, data loss |

### External Contacts

| Service | Support Portal |
|---------|----------------|
| AWS | https://console.aws.amazon.com/support |
| OpenAI | https://help.openai.com |
| GitHub | https://support.github.com |

---

## Disaster Recovery

### RPO/RTO Targets

| Metric | Target | Actual |
|--------|--------|--------|
| RPO (data loss) | < 1 hour | ~5 min (RDS point-in-time) |
| RTO (downtime) | < 4 hours | ~30 min (Multi-AZ failover) |

### Backup Locations

| Data | Backup Location | Retention |
|------|-----------------|-----------|
| Database | RDS automated snapshots | 7 days |
| User photos | S3 cross-region replication | Indefinite |
| Configuration | Terraform state (S3) | Versioned |
| Logs | CloudWatch + S3 archive | 90 days |

### Full Recovery Procedure

```bash
# 1. Restore RDS from snapshot
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier sleek-coach-prod-restored \
  --db-snapshot-identifier <snapshot-id>

# 2. Update Secrets Manager with new endpoint
# 3. Verify S3 bucket accessibility
# 4. Deploy ECS service
# 5. Run smoke tests
# 6. Update DNS (if needed)
```

---

## Useful Commands

### Quick Status Check

```bash
# All services status
aws ecs describe-services --cluster sleek-coach-prod \
  --services sleek-coach-api \
  --query 'services[0].{Status:status,Running:runningCount,Desired:desiredCount}'

# Database status
aws rds describe-db-instances \
  --db-instance-identifier sleek-coach-prod \
  --query 'DBInstances[0].DBInstanceStatus'

# Recent errors
aws logs filter-log-events \
  --log-group-name /ecs/sleek-coach-api \
  --start-time $(date -d '15 minutes ago' +%s)000 \
  --filter-pattern "ERROR" \
  --limit 20
```

### Performance Check

```bash
# ECS task metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/ECS \
  --metric-name CPUUtilization \
  --dimensions Name=ClusterName,Value=sleek-coach-prod Name=ServiceName,Value=sleek-coach-api \
  --start-time $(date -d '1 hour ago' -u +%Y-%m-%dT%H:%M:%SZ) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%SZ) \
  --period 300 --statistics Average Maximum
```

### Database Connection

```bash
# Connect to production database (via bastion)
psql -h sleek-coach-prod.xxx.rds.amazonaws.com \
  -U sleekcoach -d sleekcoach
```
