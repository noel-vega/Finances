output "state_bucket_name" {
  description = "S3 bucket holding remote Terraform state — reference this in envs/production/backend.tf"
  value       = aws_s3_bucket.terraform_state.bucket
}

output "lock_table_name" {
  description = "DynamoDB table used for Terraform state locking — reference this in envs/production/backend.tf"
  value       = aws_dynamodb_table.terraform_locks.name
}

output "account_id" {
  value = data.aws_caller_identity.current.account_id
}
