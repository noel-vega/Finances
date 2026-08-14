variable "name_prefix" {
  type    = string
  default = "harbor"
}

variable "region" {
  type = string
}

variable "role_name" {
  description = "IAM role name for this instance, e.g. \"harbor-github-actions-deploy-website\". Each deploy-role instantiation needs a unique name."
  type        = string
}

variable "oidc_provider_arn" {
  description = "ARN of the shared GitHub OIDC provider (modules/oidc-provider) — created once, referenced by every deploy-role instance."
  type        = string
}

variable "github_repo" {
  description = "\"<owner>/<repo>\" this OIDC trust policy is scoped to. Must match the repo's real GitHub location — substitute once the git remote is corrected."
  type        = string
}

variable "github_ref" {
  description = "Branch ref (e.g. \"refs/heads/main\") to trust for jobs that do NOT specify a GitHub Environment. Set to null if every workflow job using this role runs behind an environment gate (see github_environments)."
  type        = string
  default     = "refs/heads/main"
}

variable "github_environments" {
  description = "GitHub Environment names (e.g. [\"harbor-production\"]) to trust — required because a job with `environment:` set gets an OIDC sub claim shaped \"repo:OWNER/REPO:environment:NAME\" instead of the branch-ref form, which github_ref alone won't match."
  type        = list(string)
  default     = []
}

variable "include_ecr_push" {
  description = "Grant ECR auth + push permissions, scoped to repos under name_prefix. Off by default — only the platform-wide role needs this."
  type        = bool
  default     = false
}

variable "include_ecs_deploy" {
  description = "Grant ECS task-definition/service/task management permissions. Off by default — only the platform-wide role needs this."
  type        = bool
  default     = false
}

variable "pass_role_arns" {
  description = "ECS execution/task role ARNs the deploy role is allowed to iam:PassRole. Wired from the ecs-service module outputs in envs/production."
  type        = list(string)
  default     = []
}

variable "s3_bucket_arns" {
  description = "Frontend S3 bucket ARNs the deploy role may sync to. Wired from the s3-static-site module outputs."
  type        = list(string)
  default     = []
}

variable "cloudfront_distribution_arns" {
  description = "CloudFront distribution ARNs the deploy role may invalidate. Wired from the s3-static-site module outputs."
  type        = list(string)
  default     = []
}
