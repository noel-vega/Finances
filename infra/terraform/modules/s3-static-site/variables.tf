variable "name_prefix" {
  type    = string
  default = "harbor"
}

variable "name" {
  description = "Frontend app name, e.g. \"shop-admin-web\"."
  type        = string
}
