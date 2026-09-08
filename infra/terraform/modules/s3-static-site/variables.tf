variable "name_prefix" {
  type    = string
  default = "ordersail"
}

variable "name" {
  description = "Frontend app name, e.g. \"merchant-web\"."
  type        = string
}

variable "aliases" {
  description = "CloudFront alternate domain names (CNAMEs), e.g. [\"ordersail.com\"]. Leave empty to serve only the default *.cloudfront.net domain."
  type        = list(string)
  default     = []
}

variable "acm_certificate_arn" {
  description = "ACM cert (must be in us-east-1) covering every name in `aliases`. Required when `aliases` is non-empty; ignored otherwise."
  type        = string
  default     = null
}

variable "enable_api_routing" {
  description = "Adds a second CloudFront origin + ordered_cache_behavior routing api_path_pattern to api_origin_domain_name. A separate bool rather than inferring this from api_origin_domain_name != null, because that value (an ALB's dns_name) is only known after apply when the ALB is created in the same plan — count/for_each can't key off an unknown value, but a literal bool the caller already knows can."
  type        = bool
  default     = false
}

variable "api_origin_domain_name" {
  description = "DNS name of an ALB to route api_path_pattern to. Required when enable_api_routing is true; ignored otherwise."
  type        = string
  default     = null
}

variable "api_path_pattern" {
  description = "CloudFront path pattern routed to api_origin_domain_name. Ignored when enable_api_routing is false."
  type        = string
  default     = "/api/*"
}

variable "basic_auth_credentials" {
  description = <<-EOT
    "user:password" pairs that unlock the site via HTTP Basic auth, enforced by a
    CloudFront Function on viewer-request over default_cache_behavior only (the
    api_path_pattern behavior is never gated). Empty (default) = no gate.

    NOTE: the values are base64-embedded in the published CloudFront Function and
    recoverable by anyone with cloudfront:GetFunction — this is a keep-the-public-
    out gate for a pre-launch site, not a real secret boundary.
  EOT
  type        = list(string)
  default     = []
  sensitive   = true
}

variable "basic_auth_realm" {
  description = "Realm shown in the browser's Basic-auth prompt. ASCII only (it lands in a WWW-Authenticate header). Ignored when basic_auth_credentials is empty."
  type        = string
  default     = "ordersail - under construction"
}
