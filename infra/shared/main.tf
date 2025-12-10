# Shared Resources
#
# Resources shared across all environments, like ECR repository.

terraform {
  required_version = ">= 1.6.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project   = "sleek-coach"
      ManagedBy = "terraform"
      Component = "shared"
    }
  }
}

# ECR Repository (shared across environments)
module "ecr" {
  source = "../modules/ecr"

  repository_name     = "sleek-coach-api"
  image_count_to_keep = 20
  allowed_account_ids = []

  tags = {
    Shared = "true"
  }
}

# GitHub Actions OIDC for CD pipeline
module "github_oidc" {
  source = "../modules/github-oidc"

  github_org         = "rlefko"
  github_repo        = "sleek-coach"
  ecr_repository_arn = module.ecr.repository_arn

  tags = {
    Shared = "true"
  }
}
