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
  # cache.t4g.micro baselines at a flat ~54 MB of swap even at 1.7% memory use —
  # the oft-quoted 50 MB threshold is wrong for a node this small. 128 MB is
  # clearly above baseline. Real memory pressure shows first in the (critical)
  # DatabaseMemoryUsagePercentage / Evictions alarms anyway.
  type    = number
  default = 128
}

variable "max_connections" {
  type    = number
  default = 500
}
