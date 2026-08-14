variable "name_prefix" {
  type    = string
  default = "harbor"
}

variable "rds_master_user_secret_arn" {
  type = string
}

variable "rds_address" {
  type = string
}

variable "rds_port" {
  type = number
}

variable "rds_db_name" {
  type = string
}
