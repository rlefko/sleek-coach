variable "environment" {
  description = "Environment name (staging/production)"
  type        = string
}

variable "photos_transition_ia_days" {
  description = "Days before transitioning photos to Standard-IA"
  type        = number
  default     = 90
}

variable "photos_transition_glacier_days" {
  description = "Days before transitioning photos to Glacier"
  type        = number
  default     = 365
}

variable "exports_expiration_days" {
  description = "Days before exports expire and are deleted"
  type        = number
  default     = 30
}

variable "cors_allowed_origins" {
  description = "List of allowed origins for CORS"
  type        = list(string)
  default     = ["*"]
}

variable "tags" {
  description = "Additional tags to apply to resources"
  type        = map(string)
  default     = {}
}
