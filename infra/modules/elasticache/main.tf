# ElastiCache Module
#
# Creates a Redis cluster for caching and background job processing.

terraform {
  required_version = ">= 1.6.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

locals {
  name_prefix = "sleek-coach-${var.environment}"
}

# ElastiCache Subnet Group
resource "aws_elasticache_subnet_group" "main" {
  name        = "${local.name_prefix}-redis-subnet"
  description = "Subnet group for ${local.name_prefix} Redis"
  subnet_ids  = var.subnet_ids

  tags = merge(var.tags, {
    Name = "${local.name_prefix}-redis-subnet"
  })
}

# ElastiCache Parameter Group
resource "aws_elasticache_parameter_group" "main" {
  name        = "${local.name_prefix}-redis7"
  family      = "redis7"
  description = "Parameter group for ${local.name_prefix} Redis"

  parameter {
    name  = "maxmemory-policy"
    value = "volatile-lru"
  }

  tags = merge(var.tags, {
    Name = "${local.name_prefix}-redis7"
  })
}

# ElastiCache Replication Group (Redis Cluster)
resource "aws_elasticache_replication_group" "main" {
  replication_group_id = "${local.name_prefix}-redis"
  description          = "Redis cluster for ${local.name_prefix}"

  # Engine
  engine               = "redis"
  engine_version       = "7.1"
  node_type            = var.node_type
  parameter_group_name = aws_elasticache_parameter_group.main.name

  # Cluster configuration
  num_cache_clusters = var.num_cache_nodes
  port               = 6379

  # Network
  subnet_group_name  = aws_elasticache_subnet_group.main.name
  security_group_ids = [var.security_group_id]

  # High Availability
  automatic_failover_enabled = var.num_cache_nodes > 1
  multi_az_enabled           = var.num_cache_nodes > 1

  # Security
  at_rest_encryption_enabled = true
  transit_encryption_enabled = false # Set to true if you need TLS

  # Maintenance
  maintenance_window       = "sun:05:00-sun:06:00"
  snapshot_window          = "04:00-05:00"
  snapshot_retention_limit = var.snapshot_retention_limit

  # Notifications
  notification_topic_arn = var.notification_topic_arn

  # Updates
  auto_minor_version_upgrade = true
  apply_immediately          = var.environment != "production"

  tags = merge(var.tags, {
    Name = "${local.name_prefix}-redis"
  })
}
