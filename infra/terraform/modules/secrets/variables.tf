variable "name_prefix" {
  type    = string
  default = "ordersail"
}

variable "rds_master_username" {
  type = string
}

variable "rds_master_password" {
  type      = string
  sensitive = true
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
