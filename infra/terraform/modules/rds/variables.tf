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

variable "instance_class" {
  type    = string
  default = "db.t4g.micro"
}

# --- OS-78 alarm routing + thresholds ---

variable "alarm_critical_topic_arns" {
  description = "SNS topics for the free-storage alarm (paging)."
  type        = list(string)
  default     = []
}

variable "alarm_warning_topic_arns" {
  description = "SNS topics for CPU / memory / connections alarms."
  type        = list(string)
  default     = []
}

variable "free_storage_floor_gb" {
  description = "Alert when FreeStorageSpace drops below this (instance is 20 GB, no autoscaling)."
  type        = number
  default     = 4
}

variable "cpu_threshold" {
  type    = number
  default = 85
}

variable "freeable_memory_floor_mb" {
  type    = number
  default = 200
}

variable "max_connections_threshold" {
  description = "db.t4g.micro tops out near 112 connections."
  type        = number
  default     = 90
}
