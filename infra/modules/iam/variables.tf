variable "environment" {
  description = "Environment name (staging/production)"
  type        = string
}

variable "config_arns" {
  description = "List of Secrets Manager ARNs the execution role can access"
  type        = list(string)
}

variable "photos_bucket_arn" {
  description = "ARN of the photos S3 bucket"
  type        = string
}

variable "exports_bucket_arn" {
  description = "ARN of the exports S3 bucket"
  type        = string
}

variable "enable_ecs_exec" {
  description = "Enable ECS Exec for debugging"
  type        = bool
  default     = false
}

variable "tags" {
  description = "Additional tags to apply to resources"
  type        = map(string)
  default     = {}
}
