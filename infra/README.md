# Sleek Coach Infrastructure

AWS infrastructure for the Sleek Coach fitness coaching application using Terraform.

## Architecture Overview

```
                    Internet
                        │
                        ▼
                ┌───────────────┐
                │      ALB      │  (Public Subnets)
                │   Port 80     │
                └───────┬───────┘
                        │
         ┌──────────────┼──────────────┐
         ▼              ▼              ▼
    ┌─────────┐   ┌─────────┐   ┌─────────┐
    │   ECS   │   │   ECS   │   │   ...   │  (Private Subnets)
    │  Task   │   │  Task   │   │         │
    └────┬────┘   └────┬────┘   └─────────┘
         │              │
         └──────┬───────┘
                │
    ┌───────────┼───────────┐
    ▼           ▼           ▼
┌───────┐  ┌───────┐  ┌───────┐
│  RDS  │  │ Redis │  │  S3   │
│Postgres│ │(Elasti│  │Photos │
└───────┘  │Cache) │  └───────┘
           └───────┘
```

## Directory Structure

```
infra/
├── bootstrap/          # One-time setup for remote state
├── modules/            # Reusable Terraform modules
│   ├── vpc/           # VPC, subnets, NAT, security groups
│   ├── rds/           # PostgreSQL database
│   ├── elasticache/   # Redis cluster
│   ├── s3/            # S3 buckets for photos/exports
│   ├── ecr/           # Docker image repository
│   ├── config-store/  # AWS Secrets Manager
│   ├── iam/           # IAM roles and policies
│   ├── alb/           # Application Load Balancer
│   └── ecs/           # ECS Fargate cluster and service
├── shared/            # Resources shared across environments (ECR)
└── environments/      # Environment-specific configurations
    ├── staging/
    └── production/
```

## Prerequisites

- [Terraform](https://www.terraform.io/downloads) >= 1.6.0
- [AWS CLI](https://aws.amazon.com/cli/) configured with appropriate credentials
- AWS account with permissions to create VPC, RDS, ECS, S3, etc.

## Quick Start

### 1. Bootstrap Remote State (One-time setup)

```bash
cd infra/bootstrap
terraform init
terraform apply
```

This creates:
- S3 bucket for Terraform state: `sleek-coach-terraform-state`
- DynamoDB table for state locking: `sleek-coach-terraform-locks`

### 2. Deploy Shared Resources (ECR)

```bash
cd infra/shared
terraform init
terraform apply
```

### 3. Deploy an Environment

```bash
# Staging
cd infra/environments/staging
terraform init
terraform plan -out=tfplan
terraform apply tfplan

# Production
cd infra/environments/production
terraform init
terraform plan -out=tfplan
terraform apply tfplan
```

## Environment Configuration

### Staging
- **VPC CIDR**: 10.0.0.0/16
- **RDS**: db.t3.micro, single-AZ
- **ElastiCache**: cache.t3.micro, 1 node
- **ECS**: 256 CPU, 512 MB, 1 task
- **NAT Gateway**: Single (cost optimization)

### Production
- **VPC CIDR**: 10.1.0.0/16
- **RDS**: db.t3.medium, Multi-AZ
- **ElastiCache**: cache.t3.small, 2 nodes
- **ECS**: 512 CPU, 1024 MB, 2+ tasks
- **NAT Gateway**: Per AZ (high availability)

## Resource Naming Convention

All resources follow the pattern: `sleek-coach-{environment}-{resource}`

Examples:
- `sleek-coach-staging-vpc`
- `sleek-coach-production-postgres`
- `sleek-coach-staging-redis`

## Secrets Management

Secrets are stored in AWS Secrets Manager:

| Secret Path | Contents |
|-------------|----------|
| `sleek-coach/{env}/database` | Database URL and credentials |
| `sleek-coach/{env}/jwt` | JWT secret key |
| `sleek-coach/{env}/app` | Application secret key |
| `sleek-coach/{env}/openai` | OpenAI API key |

**Important**: After initial deployment, manually set the OpenAI API key:
```bash
aws secretsmanager put-secret-value \
  --secret-id sleek-coach/staging/openai \
  --secret-string '{"key":"sk-your-api-key"}'
```

## Estimated Costs

| Resource | Staging | Production |
|----------|---------|------------|
| NAT Gateway | $32/mo | $64/mo |
| RDS | $15/mo | $100/mo |
| ElastiCache | $12/mo | $25/mo |
| ALB | $16/mo | $16/mo |
| ECS Fargate | $9/mo | $36/mo |
| S3 | <$1/mo | Variable |
| Secrets Manager | $2/mo | $2/mo |
| **Total** | **~$90/mo** | **~$250/mo** |

## Common Operations

### View Infrastructure State
```bash
cd infra/environments/staging
terraform show
```

### Plan Changes
```bash
terraform plan -out=tfplan
```

### Apply Changes
```bash
terraform apply tfplan
```

### Destroy Environment (DANGER)
```bash
terraform destroy
```

### Import Existing Resources
```bash
terraform import module.vpc.aws_vpc.main vpc-12345678
```

## Troubleshooting

### State Lock Error
If you see a state lock error, someone else may be running Terraform. Wait or force unlock:
```bash
terraform force-unlock LOCK_ID
```

### ECS Service Not Starting
1. Check CloudWatch logs: `/ecs/sleek-coach-{env}`
2. Verify secrets are populated in Secrets Manager
3. Check security group rules allow traffic

### RDS Connection Issues
1. Verify ECS tasks are in the correct security group
2. Check RDS security group allows port 5432 from ECS
3. Verify database credentials in Secrets Manager

## Security Notes

- All resources are in private subnets except ALB
- RDS and ElastiCache are not publicly accessible
- S3 buckets block all public access
- Secrets are encrypted at rest
- IAM roles follow least-privilege principle
