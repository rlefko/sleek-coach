# RDS Module
#
# Creates a PostgreSQL RDS instance with appropriate configuration
# for staging or production environments.

terraform {
  required_version = ">= 1.6.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.0"
    }
  }
}

locals {
  name_prefix = "sleek-coach-${var.environment}"
}

# DB Subnet Group
resource "aws_db_subnet_group" "main" {
  name        = "${local.name_prefix}-db-subnet"
  description = "Subnet group for ${local.name_prefix} RDS"
  subnet_ids  = var.subnet_ids

  tags = merge(var.tags, {
    Name = "${local.name_prefix}-db-subnet"
  })
}

# DB Parameter Group
resource "aws_db_parameter_group" "main" {
  name        = "${local.name_prefix}-postgres16"
  family      = "postgres16"
  description = "Parameter group for ${local.name_prefix} PostgreSQL"

  parameter {
    name  = "log_connections"
    value = "1"
  }

  parameter {
    name  = "log_disconnections"
    value = "1"
  }

  parameter {
    name  = "log_duration"
    value = "1"
  }

  parameter {
    name         = "log_min_duration_statement"
    value        = "1000"
    apply_method = "pending-reboot"
  }

  tags = merge(var.tags, {
    Name = "${local.name_prefix}-postgres16"
  })
}

# Generate random password for database
resource "random_password" "db_password" {
  length           = 32
  special          = true
  override_special = "!#$%&*()-_=+[]{}<>:?"
}

# RDS Instance
resource "aws_db_instance" "main" {
  identifier = "${local.name_prefix}-postgres"

  # Engine
  engine               = "postgres"
  engine_version       = "16"
  instance_class       = var.instance_class
  parameter_group_name = aws_db_parameter_group.main.name

  # Storage
  allocated_storage     = var.allocated_storage
  max_allocated_storage = var.max_allocated_storage
  storage_type          = "gp3"
  storage_encrypted     = true

  # Database
  db_name  = var.database_name
  username = var.database_username
  password = random_password.db_password.result
  port     = 5432

  # Network
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [var.security_group_id]
  publicly_accessible    = false
  multi_az               = var.multi_az

  # Backup
  backup_retention_period = var.backup_retention_period
  backup_window           = "03:00-04:00"
  maintenance_window      = "Mon:04:00-Mon:05:00"

  # Monitoring
  performance_insights_enabled          = var.performance_insights_enabled
  performance_insights_retention_period = var.performance_insights_enabled ? 7 : null

  # Lifecycle
  deletion_protection       = var.deletion_protection
  skip_final_snapshot       = var.environment != "production"
  final_snapshot_identifier = var.environment == "production" ? "${local.name_prefix}-final-snapshot" : null
  copy_tags_to_snapshot     = true
  auto_minor_version_upgrade = true

  tags = merge(var.tags, {
    Name = "${local.name_prefix}-postgres"
  })
}
