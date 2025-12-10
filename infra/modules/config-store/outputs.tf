output "database_arn" {
  description = "ARN of the database configuration"
  value       = aws_secretsmanager_secret.database.arn
}

output "database_name" {
  description = "Name of the database configuration"
  value       = aws_secretsmanager_secret.database.name
}

output "jwt_arn" {
  description = "ARN of the JWT configuration"
  value       = aws_secretsmanager_secret.jwt.arn
}

output "jwt_name" {
  description = "Name of the JWT configuration"
  value       = aws_secretsmanager_secret.jwt.name
}

output "app_arn" {
  description = "ARN of the app configuration"
  value       = aws_secretsmanager_secret.app.arn
}

output "app_name" {
  description = "Name of the app configuration"
  value       = aws_secretsmanager_secret.app.name
}

output "openai_arn" {
  description = "ARN of the OpenAI configuration"
  value       = aws_secretsmanager_secret.openai.arn
}

output "openai_name" {
  description = "Name of the OpenAI configuration"
  value       = aws_secretsmanager_secret.openai.name
}

output "all_arns" {
  description = "List of all configuration ARNs"
  value = [
    aws_secretsmanager_secret.database.arn,
    aws_secretsmanager_secret.jwt.arn,
    aws_secretsmanager_secret.app.arn,
    aws_secretsmanager_secret.openai.arn,
  ]
}
