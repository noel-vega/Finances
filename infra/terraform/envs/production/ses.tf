# Interim SES setup, no domain required yet — see the plan's Phase 9 notes.
# `terraform apply` alone leaves this identity "Pending": AWS emails a
# confirmation link to var.ses_verified_email that must be clicked manually.
#
# SMTP credentials are NOT created here — generate them via the SES
# console's "Create SMTP credentials" flow (handles the IAM user + HMAC
# conversion in one step, no clean Terraform resource for it), then store
# into the worker secret manually:
#   aws secretsmanager put-secret-value --secret-id ordersail/production/worker \
#     --secret-string '{"SMTP_USER":"...","SMTP_PASS":"..."}'
#
# Also submit AWS's SES "request production access" support case once this
# is verified — sandbox mode restricts sending to verified recipients only.

resource "aws_ses_email_identity" "sender" {
  email = var.ses_verified_email
}
