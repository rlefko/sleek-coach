# API Endpoint
output "api_endpoint" {
  description = "API endpoint URL"
  value       = module.alb.api_endpoint
}

output "alb_dns_name" {
  description = "ALB DNS name"
  value       = module.alb.alb_dns_name
}

# VPC
output "vpc_id" {
  description = "VPC ID"
  value       = module.vpc.vpc_id
}

output "public_subnet_ids" {
  description = "Public subnet IDs"
  value       = module.vpc.public_subnet_ids
}

output "private_subnet_ids" {
  description = "Private subnet IDs"
  value       = module.vpc.private_subnet_ids
}

# Database
output "db_endpoint" {
  description = "RDS endpoint"
  value       = module.rds.db_instance_endpoint
}

output "db_name" {
  description = "Database name"
  value       = module.rds.db_name
}

# Redis
output "redis_endpoint" {
  description = "Redis endpoint"
  value       = module.elasticache.primary_endpoint_address
}

output "redis_url" {
  description = "Redis URL"
  value       = module.elasticache.redis_url
}

# S3
output "photos_bucket" {
  description = "Photos S3 bucket name"
  value       = module.s3.photos_bucket_name
}

output "exports_bucket" {
  description = "Exports S3 bucket name"
  value       = module.s3.exports_bucket_name
}

# ECS
output "ecs_cluster_name" {
  description = "ECS cluster name"
  value       = module.ecs.cluster_name
}

output "ecs_service_name" {
  description = "ECS service name"
  value       = module.ecs.service_name
}

output "log_group_name" {
  description = "CloudWatch log group name"
  value       = module.ecs.log_group_name
}

# Config Store ARNs
output "database_config_arn" {
  description = "Database config ARN"
  value       = module.config_store.database_arn
}

output "openai_config_arn" {
  description = "OpenAI config ARN (set manually after deployment)"
  value       = module.config_store.openai_arn
}
