output "repository_urls" {
  description = "Map of app name (merchant-api, storefront-api, worker, migrator) to its ECR repository URL."
  value       = { for k, v in aws_ecr_repository.this : k => v.repository_url }
}

output "repository_arns" {
  value = { for k, v in aws_ecr_repository.this : k => v.arn }
}
