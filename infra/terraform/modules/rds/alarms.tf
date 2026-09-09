# CloudWatch alarms for the single Postgres instance (OS-78). No alarms today —
# the first sign of a full disk or connection exhaustion would be requests
# failing. Empty *_topic_arns → alarms still created, just no notification.

locals {
  db_id = aws_db_instance.this.identifier
}

# The important one: alert with enough lead time to resize before the disk fills.
# Instance is allocated_storage = 20 GB with no storage autoscaling.
resource "aws_cloudwatch_metric_alarm" "free_storage" {
  alarm_name        = "${var.name_prefix}-rds-free-storage"
  alarm_description = "RDS ${local.db_id}: FreeStorageSpace below ${var.free_storage_floor_gb} GB — resize before it fills."

  namespace           = "AWS/RDS"
  metric_name         = "FreeStorageSpace"
  dimensions          = { DBInstanceIdentifier = local.db_id }
  statistic           = "Minimum"
  period              = 300
  evaluation_periods  = 1
  comparison_operator = "LessThanThreshold"
  threshold           = var.free_storage_floor_gb * 1000 * 1000 * 1000
  treat_missing_data  = "ignore"

  alarm_actions = var.alarm_critical_topic_arns
  ok_actions    = var.alarm_critical_topic_arns
}

resource "aws_cloudwatch_metric_alarm" "cpu" {
  alarm_name        = "${var.name_prefix}-rds-cpu"
  alarm_description = "RDS ${local.db_id}: CPUUtilization above ${var.cpu_threshold}% sustained."

  namespace           = "AWS/RDS"
  metric_name         = "CPUUtilization"
  dimensions          = { DBInstanceIdentifier = local.db_id }
  statistic           = "Average"
  period              = 300
  evaluation_periods  = 3
  comparison_operator = "GreaterThanThreshold"
  threshold           = var.cpu_threshold
  treat_missing_data  = "ignore"

  alarm_actions = var.alarm_warning_topic_arns
  ok_actions    = var.alarm_warning_topic_arns
}

resource "aws_cloudwatch_metric_alarm" "freeable_memory" {
  alarm_name        = "${var.name_prefix}-rds-freeable-memory"
  alarm_description = "RDS ${local.db_id}: FreeableMemory below ${var.freeable_memory_floor_mb} MB."

  namespace           = "AWS/RDS"
  metric_name         = "FreeableMemory"
  dimensions          = { DBInstanceIdentifier = local.db_id }
  statistic           = "Minimum"
  period              = 300
  evaluation_periods  = 2
  comparison_operator = "LessThanThreshold"
  threshold           = var.freeable_memory_floor_mb * 1000 * 1000
  treat_missing_data  = "ignore"

  alarm_actions = var.alarm_warning_topic_arns
  ok_actions    = var.alarm_warning_topic_arns
}

resource "aws_cloudwatch_metric_alarm" "connections" {
  alarm_name        = "${var.name_prefix}-rds-connections"
  alarm_description = "RDS ${local.db_id}: DatabaseConnections above ${var.max_connections_threshold} — nearing the instance-class ceiling."

  namespace           = "AWS/RDS"
  metric_name         = "DatabaseConnections"
  dimensions          = { DBInstanceIdentifier = local.db_id }
  statistic           = "Maximum"
  period              = 300
  evaluation_periods  = 1
  comparison_operator = "GreaterThanThreshold"
  threshold           = var.max_connections_threshold
  treat_missing_data  = "ignore"

  alarm_actions = var.alarm_warning_topic_arns
  ok_actions    = var.alarm_warning_topic_arns
}
