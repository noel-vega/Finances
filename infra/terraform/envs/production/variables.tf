variable "region" {
  type    = string
  default = "us-east-1"
}

variable "name_prefix" {
  type    = string
  default = "harbor"
}

variable "github_repo" {
  description = "\"<owner>/<repo>\" for GitHub Actions OIDC trust. Must match this repo's real GitHub location."
  type        = string
}

variable "db_instance_class" {
  type    = string
  default = "db.t4g.micro"
}

variable "redis_node_type" {
  type    = string
  default = "cache.t4g.micro"
}

variable "ses_verified_email" {
  description = "Single email address to verify as both From and (while SES is in sandbox mode) the allowed recipient for order-confirmation email."
  type        = string
}
