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

data "aws_caller_identity" "current" {}
data "aws_partition" "current" {}

resource "aws_sns_topic" "alerts_critical" {
  name = "${var.name_prefix}-alerts-critical"
}

resource "aws_sns_topic" "alerts_warning" {
  name = "${var.name_prefix}-alerts-warning"
}

locals {
  # Build the topic ARNs from parts that are all known at plan time (partition,
  # region, account, name). An SNS ARN is fully determined by these, so this
  # string is byte-identical to aws_sns_topic.*.arn — but using the resource
  # attribute makes it "known after apply", which breaks any for_each key or
  # count that depends on it (the worker task-role policy, the email-sub map).
  # The aws_sns_topic resources above still own creation; this is just the name.
  sns_arn_prefix = "arn:${data.aws_partition.current.partition}:sns:${var.region}:${data.aws_caller_identity.current.account_id}"

  alerts_critical_topic_arn = "${local.sns_arn_prefix}:${var.name_prefix}-alerts-critical"
  alerts_warning_topic_arn  = "${local.sns_arn_prefix}:${var.name_prefix}-alerts-warning"

  alert_topic_arns = {
    critical = local.alerts_critical_topic_arn
    warning  = local.alerts_warning_topic_arn
  }

  # one (topic, email) subscription per pair. Keyed on the static tier label +
  # email so the for_each keys are plan-known even though the ARN values aren't.
  email_subscriptions = {
    for pair in setproduct(keys(local.alert_topic_arns), var.alert_emails) :
    "${pair[0]}|${pair[1]}" => { topic_arn = local.alert_topic_arns[pair[0]], email = pair[1] }
  }
}

resource "aws_sns_topic_subscription" "email" {
  for_each  = local.email_subscriptions
  topic_arn = each.value.topic_arn
  protocol  = "email"
  endpoint  = each.value.email

  # topic_arn is now a constructed string, not a resource reference, so the
  # dependency on the topics has to be spelled out
  depends_on = [aws_sns_topic.alerts_critical, aws_sns_topic.alerts_warning]
}

# critical topic only — SMS is noisier, keep it to pages
resource "aws_sns_topic_subscription" "sms" {
  for_each  = toset(var.alert_sms_numbers)
  topic_arn = local.alerts_critical_topic_arn
  protocol  = "sms"
  endpoint  = each.value

  depends_on = [aws_sns_topic.alerts_critical]
}
