variable "repository_name" {
  description = "Name of the ECR repository"
  type        = string
  default     = "sleek-coach-api"
}

variable "image_count_to_keep" {
  description = "Number of tagged images to keep"
  type        = number
  default     = 10
}

variable "allowed_account_ids" {
  description = "AWS account IDs allowed to pull images (for cross-account access)"
  type        = list(string)
  default     = []
}

variable "tags" {
  description = "Additional tags to apply to resources"
  type        = map(string)
  default     = {}
}
