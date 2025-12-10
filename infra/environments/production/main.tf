# Production Environment
#
# Complete infrastructure for the production environment.

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

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "sleek-coach"
      Environment = "production"
      ManagedBy   = "terraform"
    }
  }
}

locals {
  environment = "production"
  common_tags = {
    Environment = local.environment
  }
}

# Data source for shared resources
data "terraform_remote_state" "shared" {
  backend = "s3"

  config = {
    bucket = "sleek-coach-terraform-state"
    key    = "shared/terraform.tfstate"
    region = var.aws_region
  }
}

# VPC
module "vpc" {
  source = "../../modules/vpc"

  environment        = local.environment
  vpc_cidr           = var.vpc_cidr
  availability_zones = var.availability_zones
  single_nat_gateway = var.single_nat_gateway
  container_port     = var.container_port
  tags               = local.common_tags
}

# RDS
module "rds" {
  source = "../../modules/rds"

  environment              = local.environment
  subnet_ids               = module.vpc.private_subnet_ids
  security_group_id        = module.vpc.rds_security_group_id
  instance_class           = var.db_instance_class
  allocated_storage        = var.db_allocated_storage
  max_allocated_storage    = var.db_max_allocated_storage
  database_name            = var.db_name
  database_username        = var.db_username
  multi_az                 = var.db_multi_az
  backup_retention_period  = var.db_backup_retention
  deletion_protection      = var.db_deletion_protection
  performance_insights_enabled = var.db_performance_insights
  tags                     = local.common_tags
}

# ElastiCache (Redis)
module "elasticache" {
  source = "../../modules/elasticache"

  environment              = local.environment
  subnet_ids               = module.vpc.private_subnet_ids
  security_group_id        = module.vpc.redis_security_group_id
  node_type                = var.redis_node_type
  num_cache_nodes          = var.redis_num_cache_nodes
  snapshot_retention_limit = var.redis_snapshot_retention
  tags                     = local.common_tags
}

# S3
module "s3" {
  source = "../../modules/s3"

  environment                    = local.environment
  photos_transition_ia_days      = var.photos_transition_ia_days
  photos_transition_glacier_days = var.photos_transition_glacier_days
  exports_expiration_days        = var.exports_expiration_days
  cors_allowed_origins           = var.cors_allowed_origins
  tags                           = local.common_tags
}

# Config Store (Secrets Manager)
module "config_store" {
  source = "../../modules/config-store"

  environment       = local.environment
  database_url      = module.rds.database_url
  database_host     = module.rds.db_instance_address
  database_port     = module.rds.db_instance_port
  database_name     = module.rds.db_name
  database_username = module.rds.db_username
  database_password = module.rds.db_password
  tags              = local.common_tags
}

# IAM
module "iam" {
  source = "../../modules/iam"

  environment        = local.environment
  config_arns        = module.config_store.all_arns
  photos_bucket_arn  = module.s3.photos_bucket_arn
  exports_bucket_arn = module.s3.exports_bucket_arn
  enable_ecs_exec    = var.enable_ecs_exec
  tags               = local.common_tags
}

# ALB
module "alb" {
  source = "../../modules/alb"

  environment       = local.environment
  vpc_id            = module.vpc.vpc_id
  public_subnet_ids = module.vpc.public_subnet_ids
  security_group_id = module.vpc.alb_security_group_id
  container_port    = var.container_port
  health_check_path = var.health_check_path
  tags              = local.common_tags
}

# ECS
module "ecs" {
  source = "../../modules/ecs"

  environment         = local.environment
  private_subnet_ids  = module.vpc.private_subnet_ids
  security_group_id   = module.vpc.ecs_security_group_id
  target_group_arn    = module.alb.target_group_arn
  execution_role_arn  = module.iam.ecs_execution_role_arn
  task_role_arn       = module.iam.ecs_task_role_arn
  ecr_repository_url  = data.terraform_remote_state.shared.outputs.ecr_repository_url
  image_tag           = var.image_tag
  container_port      = var.container_port
  cpu                 = var.ecs_cpu
  memory              = var.ecs_memory
  desired_count       = var.ecs_desired_count
  min_capacity        = var.ecs_min_capacity
  max_capacity        = var.ecs_max_capacity
  cpu_scale_target    = var.ecs_cpu_scale_target
  memory_scale_target = var.ecs_memory_scale_target
  log_retention_days  = var.log_retention_days
  container_insights  = var.container_insights
  s3_bucket_name      = module.s3.photos_bucket_name
  redis_url           = module.elasticache.redis_url
  database_config_arn = module.config_store.database_arn
  jwt_config_arn      = module.config_store.jwt_arn
  app_config_arn      = module.config_store.app_arn
  openai_config_arn   = module.config_store.openai_arn
  tags                = local.common_tags
}
