variable "name_prefix" {
  type    = string
  default = "harbor"
}

variable "name" {
  description = "App name this ALB fronts, e.g. \"shop-admin-api\"."
  type        = string
}

variable "vpc_id" {
  type = string
}

variable "public_subnet_ids" {
  type = list(string)
}

variable "container_port" {
  type = number
}

variable "ecs_tasks_security_group_id" {
  description = "The shared ECS-tasks SG — this ALB is granted ingress into it on container_port."
  type        = string
}
