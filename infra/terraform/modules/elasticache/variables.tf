variable "name_prefix" {
  type    = string
  default = "ordersail"
}

variable "vpc_id" {
  type = string
}

variable "private_subnet_ids" {
  type = list(string)
}

variable "ecs_tasks_security_group_id" {
  type = string
}

variable "node_type" {
  type    = string
  default = "cache.t4g.micro"
}

# --- OS-79 alarm routing + thresholds ---

variable "alarm_critical_topic_arns" {
  description = "SNS topics for memory / eviction alarms (paging)."
  type        = list(string)
  default     = []
}

variable "alarm_warning_topic_arns" {
  description = "SNS topics for CPU / swap / connections alarms."
  type        = list(string)
  default     = []
}

variable "memory_pct_threshold" {
  type    = number
  default = 80
}

variable "engine_cpu_threshold" {
  type    = number
  default = 90
}

variable "swap_threshold_mb" {
  type    = number
  default = 50
}

variable "max_connections" {
  type    = number
  default = 500
}
