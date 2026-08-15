variable "name_prefix" {
  type    = string
  default = "harbor"
}

variable "name" {
  description = "Frontend app name, e.g. \"shop-admin-web\"."
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
