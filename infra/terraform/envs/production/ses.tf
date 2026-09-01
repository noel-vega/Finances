# Interim SES setup, no domain required yet — see the plan's Phase 9 notes.
# `terraform apply` alone leaves this identity "Pending": AWS emails a
# confirmation link to var.ses_verified_email that must be clicked manually
# (re-send with `aws ses verify-email-identity --email-address <addr>`).
#
# Also submit AWS's SES "request production access" support case once this
# is verified — sandbox mode restricts sending to verified recipients only
# (OS-61).

resource "aws_ses_email_identity" "sender" {
  email = var.ses_verified_email
}

# --- SMTP credentials for apps/worker's nodemailer transport --------------
# SES SMTP auth is an IAM access key pair run through a region-specific HMAC
# (the `ses_smtp_password_v4` attribute does that conversion). The user is
# send-only. The raw access-key secret lands in Terraform state like any
# IAM key — the derived password is surfaced as a sensitive output and
# written into the worker Secrets Manager secret out-of-band:
#   aws secretsmanager put-secret-value --secret-id ordersail/production/worker \
#     --secret-string "{\"SMTP_USER\":\"$(terraform output -raw ses_smtp_user)\",\"SMTP_PASS\":\"$(terraform output -raw ses_smtp_password)\"}"

resource "aws_iam_user" "ses_smtp" {
  name = "${var.name_prefix}-ses-smtp"
}

resource "aws_iam_user_policy" "ses_smtp" {
  name = "ses-send"
  user = aws_iam_user.ses_smtp.name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["ses:SendRawEmail", "ses:SendEmail"]
      Resource = "*"
    }]
  })
}

resource "aws_iam_access_key" "ses_smtp" {
  user = aws_iam_user.ses_smtp.name
}
