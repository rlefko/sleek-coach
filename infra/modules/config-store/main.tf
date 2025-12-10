# Config Store Module (AWS Secrets Manager)
#
# Creates AWS Secrets Manager entries for storing sensitive configuration
# values like database credentials, JWT keys, and API keys.

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
  name_prefix = "sleek-coach/${var.environment}"
}

# Generate random strings for keys
resource "random_password" "jwt_key" {
  length  = 64
  special = false
}

resource "random_password" "app_key" {
  length  = 64
  special = false
}

# Database Configuration
resource "aws_secretsmanager_secret" "database" {
  name        = "${local.name_prefix}/database"
  description = "Database credentials for ${var.environment}"

  tags = merge(var.tags, {
    Name = "${local.name_prefix}/database"
  })
}

resource "aws_secretsmanager_secret_version" "database" {
  secret_id = aws_secretsmanager_secret.database.id
  secret_string = jsonencode({
    url      = var.database_url
    host     = var.database_host
    port     = var.database_port
    name     = var.database_name
    username = var.database_username
    password = var.database_password
  })
}

# JWT Configuration
resource "aws_secretsmanager_secret" "jwt" {
  name        = "${local.name_prefix}/jwt"
  description = "JWT key for ${var.environment}"

  tags = merge(var.tags, {
    Name = "${local.name_prefix}/jwt"
  })
}

resource "aws_secretsmanager_secret_version" "jwt" {
  secret_id = aws_secretsmanager_secret.jwt.id
  secret_string = jsonencode({
    key = random_password.jwt_key.result
  })
}

# App Configuration
resource "aws_secretsmanager_secret" "app" {
  name        = "${local.name_prefix}/app"
  description = "Application key for ${var.environment}"

  tags = merge(var.tags, {
    Name = "${local.name_prefix}/app"
  })
}

resource "aws_secretsmanager_secret_version" "app" {
  secret_id = aws_secretsmanager_secret.app.id
  secret_string = jsonencode({
    key = random_password.app_key.result
  })
}

# OpenAI Configuration (placeholder - manually set after deployment)
resource "aws_secretsmanager_secret" "openai" {
  name        = "${local.name_prefix}/openai"
  description = "OpenAI API key for ${var.environment} - SET MANUALLY AFTER DEPLOYMENT"

  tags = merge(var.tags, {
    Name = "${local.name_prefix}/openai"
  })
}

resource "aws_secretsmanager_secret_version" "openai" {
  secret_id = aws_secretsmanager_secret.openai.id
  secret_string = jsonencode({
    key = "PLACEHOLDER_SET_MANUALLY"
  })

  lifecycle {
    ignore_changes = [secret_string]
  }
}
