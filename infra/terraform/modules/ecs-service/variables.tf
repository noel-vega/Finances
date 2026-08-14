variable "name_prefix" {
  type    = string
  default = "harbor"
}

variable "name" {
  description = "App short name, e.g. \"shop-admin-api\" — used in resource names/tags."
  type        = string
}

variable "cluster_id" {
  type = string
}

variable "private_subnet_ids" {
  type = list(string)
}

variable "ecs_tasks_security_group_id" {
  type = string
}

variable "container_port" {
  type = number
}

variable "image" {
  description = "Full ECR image URI including tag."
  type        = string
}

variable "cpu" {
  type    = string
  default = "256"
}

variable "memory" {
  type    = string
  default = "512"
}

variable "desired_count" {
  type    = number
  default = 1
}

variable "environment" {
  description = "Non-secret container env vars: [{ name = \"NODE_ENV\", value = \"production\" }, ...]"
  type        = list(object({ name = string, value = string }))
  default     = []
}

variable "secrets" {
  description = "Secrets Manager-backed env vars: [{ name = \"DATABASE_URL\", valueFrom = \"<secret arn>\" }, ...]"
  type        = list(object({ name = string, valueFrom = string }))
  default     = []
}

variable "secrets_manager_secret_arns" {
  description = "Distinct Secrets Manager secret ARNs (without JSON-key suffixes) referenced by var.secrets — scopes the execution role's GetSecretValue grant."
  type        = list(string)
  default     = []
}

variable "target_group_arn" {
  description = "ALB target group ARN, or null for services with no ALB (e.g. worker)."
  type        = string
  default     = null
}

variable "task_role_policy_json" {
  description = "Optional extra IAM policy JSON attached to the task role (e.g. shop-admin-api's S3 access to the product-images bucket)."
  type        = string
  default     = null
}
