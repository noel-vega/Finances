# CloudWatch alarms for the single Redis node (OS-79). Redis backs BullMQ
# (`orders` + `email` queues) plus rate-limiting / sessions. With
# maxmemory-policy = noeviction (OS-362) memory pressure makes BullMQ *writes
# fail* rather than evict — so `DatabaseMemoryUsagePercentage` is the real
# early warning that paid orders are about to start disappearing.
#
# Empty *_topic_arns → alarms still created, just no notification.

locals {
  cache_id = aws_elasticache_cluster.this.cluster_id
}

resource "aws_cloudwatch_metric_alarm" "memory" {
  alarm_name        = "${var.name_prefix}-redis-memory"
  alarm_description = "Redis ${local.cache_id}: DatabaseMemoryUsagePercentage above ${var.memory_pct_threshold}% — with noeviction, writes (incl. BullMQ jobs) will start failing."

  namespace           = "AWS/ElastiCache"
  metric_name         = "DatabaseMemoryUsagePercentage"
  dimensions          = { CacheClusterId = local.cache_id }
  statistic           = "Average"
  period              = 300
  evaluation_periods  = 2
  comparison_operator = "GreaterThanThreshold"
  threshold           = var.memory_pct_threshold
  treat_missing_data  = "ignore"

  alarm_actions = var.alarm_critical_topic_arns
  ok_actions    = var.alarm_critical_topic_arns
}

# Defensive — noeviction means this should be a flat zero. Any sustained
# eviction means the policy regressed and BullMQ keys are being dropped.
resource "aws_cloudwatch_metric_alarm" "evictions" {
  alarm_name        = "${var.name_prefix}-redis-evictions"
  alarm_description = "Redis ${local.cache_id}: Evictions > 0 — keys are being dropped under memory pressure (BullMQ job loss)."

  namespace           = "AWS/ElastiCache"
  metric_name         = "Evictions"
  dimensions          = { CacheClusterId = local.cache_id }
  statistic           = "Sum"
  period              = 300
  evaluation_periods  = 1
  comparison_operator = "GreaterThanThreshold"
  threshold           = 0
  treat_missing_data  = "notBreaching"

  alarm_actions = var.alarm_critical_topic_arns
  ok_actions    = var.alarm_critical_topic_arns
}

resource "aws_cloudwatch_metric_alarm" "engine_cpu" {
  alarm_name        = "${var.name_prefix}-redis-engine-cpu"
  alarm_description = "Redis ${local.cache_id}: EngineCPUUtilization above ${var.engine_cpu_threshold}% sustained."

  namespace           = "AWS/ElastiCache"
  metric_name         = "EngineCPUUtilization"
  dimensions          = { CacheClusterId = local.cache_id }
  statistic           = "Average"
  period              = 300
  evaluation_periods  = 3
  comparison_operator = "GreaterThanThreshold"
  threshold           = var.engine_cpu_threshold
  treat_missing_data  = "ignore"

  alarm_actions = var.alarm_warning_topic_arns
  ok_actions    = var.alarm_warning_topic_arns
}

resource "aws_cloudwatch_metric_alarm" "swap" {
  alarm_name        = "${var.name_prefix}-redis-swap"
  alarm_description = "Redis ${local.cache_id}: SwapUsage above ${var.swap_threshold_mb} MB for 15 min — under memory pressure."

  namespace           = "AWS/ElastiCache"
  metric_name         = "SwapUsage"
  dimensions          = { CacheClusterId = local.cache_id }
  statistic           = "Maximum"
  period              = 300
  evaluation_periods  = 3
  comparison_operator = "GreaterThanThreshold"
  threshold           = var.swap_threshold_mb * 1000 * 1000
  treat_missing_data  = "ignore"

  alarm_actions = var.alarm_warning_topic_arns
  ok_actions    = var.alarm_warning_topic_arns
}

resource "aws_cloudwatch_metric_alarm" "connections" {
  alarm_name        = "${var.name_prefix}-redis-connections"
  alarm_description = "Redis ${local.cache_id}: CurrConnections above ${var.max_connections} — connection leak or unexpected load."

  namespace           = "AWS/ElastiCache"
  metric_name         = "CurrConnections"
  dimensions          = { CacheClusterId = local.cache_id }
  statistic           = "Maximum"
  period              = 300
  evaluation_periods  = 2
  comparison_operator = "GreaterThanThreshold"
  threshold           = var.max_connections
  treat_missing_data  = "ignore"

  alarm_actions = var.alarm_warning_topic_arns
  ok_actions    = var.alarm_warning_topic_arns
}
