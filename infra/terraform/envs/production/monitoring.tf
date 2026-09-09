# Alert routing (OS-80). Two severity tiers — every CloudWatch alarm (OS-76–79)
# and the order-job dead-letter alert (OS-73) point at one of these:
#
#   alerts-critical — page: service down, checkout down, dead-letter, RDS storage
#                     floor, ElastiCache memory pressure, unhealthy hosts.
#   alerts-warning  — email only: elevated latency / CPU / capacity, non-urgent.
#
# Recipients come from `alert_emails` / `alert_sms_numbers` in a git-ignored
# `secrets.auto.tfvars` (see variables.tf). Email subs need a one-time click to
# confirm; SMS is wired but the number list stays empty until the SNS SMS
# sandbox is exited. Runbook: docs/runbooks/alerts.md.

resource "aws_sns_topic" "alerts_critical" {
  name = "${var.name_prefix}-alerts-critical"
}

resource "aws_sns_topic" "alerts_warning" {
  name = "${var.name_prefix}-alerts-warning"
}

locals {
  alert_topic_arns = [aws_sns_topic.alerts_critical.arn, aws_sns_topic.alerts_warning.arn]

  # one (topic, email) subscription per pair
  email_subscriptions = {
    for pair in setproduct(local.alert_topic_arns, var.alert_emails) :
    "${pair[0]}|${pair[1]}" => { topic_arn = pair[0], email = pair[1] }
  }
}

resource "aws_sns_topic_subscription" "email" {
  for_each  = local.email_subscriptions
  topic_arn = each.value.topic_arn
  protocol  = "email"
  endpoint  = each.value.email
}

# critical topic only — SMS is noisier, keep it to pages
resource "aws_sns_topic_subscription" "sms" {
  for_each  = toset(var.alert_sms_numbers)
  topic_arn = aws_sns_topic.alerts_critical.arn
  protocol  = "sms"
  endpoint  = each.value
}
