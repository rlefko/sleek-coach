variable "environment" {
  description = "Environment name (staging/production)"
  type        = string
}

variable "private_subnet_ids" {
  description = "List of private subnet IDs for ECS tasks"
  type        = list(string)
}

variable "security_group_id" {
  description = "Security group ID for ECS tasks"
  type        = string
}

variable "target_group_arn" {
  description = "ARN of the ALB target group"
  type        = string
}

variable "execution_role_arn" {
  description = "ARN of the ECS task execution role"
  type        = string
}

variable "task_role_arn" {
  description = "ARN of the ECS task role"
  type        = string
}

variable "ecr_repository_url" {
  description = "URL of the ECR repository"
  type        = string
}

variable "image_tag" {
  description = "Docker image tag to deploy"
  type        = string
  default     = "latest"
}

variable "container_port" {
  description = "Port the container listens on"
  type        = number
  default     = 8000
}

variable "cpu" {
  description = "CPU units for the task (256, 512, 1024, 2048, 4096)"
  type        = number
  default     = 256
}

variable "memory" {
  description = "Memory for the task in MB"
  type        = number
  default     = 512
}

variable "desired_count" {
  description = "Desired number of tasks"
  type        = number
  default     = 1
}

variable "min_capacity" {
  description = "Minimum number of tasks for auto-scaling"
  type        = number
  default     = 1
}

variable "max_capacity" {
  description = "Maximum number of tasks for auto-scaling"
  type        = number
  default     = 4
}

variable "cpu_scale_target" {
  description = "Target CPU utilization percentage for scaling"
  type        = number
  default     = 70
}

variable "memory_scale_target" {
  description = "Target memory utilization percentage for scaling"
  type        = number
  default     = 80
}

variable "log_retention_days" {
  description = "CloudWatch log retention in days"
  type        = number
  default     = 30
}

variable "container_insights" {
  description = "Enable Container Insights"
  type        = bool
  default     = false
}

# Environment variables
variable "s3_bucket_name" {
  description = "S3 bucket name for photos"
  type        = string
}

variable "redis_url" {
  description = "Redis connection URL"
  type        = string
}

# Config ARNs (for secrets)
variable "database_config_arn" {
  description = "ARN of database configuration in Secrets Manager"
  type        = string
}

variable "jwt_config_arn" {
  description = "ARN of JWT configuration in Secrets Manager"
  type        = string
}

variable "app_config_arn" {
  description = "ARN of app configuration in Secrets Manager"
  type        = string
}

variable "openai_config_arn" {
  description = "ARN of OpenAI configuration in Secrets Manager"
  type        = string
}

variable "tags" {
  description = "Additional tags to apply to resources"
  type        = map(string)
  default     = {}
}
