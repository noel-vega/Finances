variable "region" {
  type    = string
  default = "us-east-1"
}

variable "name_prefix" {
  type    = string
  default = "ordersail"
}

variable "github_repo" {
  description = "\"<owner>/<repo>\" for GitHub Actions OIDC trust. Must match this repo's real GitHub location."
  type        = string
}

variable "github_owner_id" {
  description = "Numeric GitHub account id of the repo owner — the immutable half of the OIDC subject prefix (see modules/deploy-role). `gh api repos/<owner>/<repo> --jq .owner.id`."
  type        = number
}

variable "github_repo_id" {
  description = "Numeric GitHub repository id — the other immutable half of the OIDC subject prefix. `gh api repos/<owner>/<repo> --jq .id`."
  type        = number
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

variable "domain_name" {
  description = "Root domain registered in Route 53 (e.g. \"ordersail.com\"). Route 53 must already have a public hosted zone for it — created automatically at registration."
  type        = string
}
