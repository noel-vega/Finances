data "aws_caller_identity" "current" {}

# --- app secret shells -------------------------------------------------
# Terraform creates the shell only, never a secret_version — real values
# (JWT secrets, Stripe/Shippo keys, SES SMTP creds) never touch git or TF
# state. Populate once per secret via:
#   aws secretsmanager put-secret-value --secret-id <name> --secret-string '{...}'

locals {
  app_secret_names = ["shop-admin-api", "storefront-api", "worker"]
}

resource "aws_secretsmanager_secret" "app" {
  for_each = toset(local.app_secret_names)
  name     = "${var.name_prefix}/production/${each.value}"
}

# --- database-url: the one secret Terraform legitimately owns the value
# of, composed from the RDS-managed master credential + endpoint. ---------

data "aws_secretsmanager_secret_version" "rds_master" {
  secret_id = var.rds_master_user_secret_arn
}

locals {
  rds_credentials = jsondecode(data.aws_secretsmanager_secret_version.rds_master.secret_string)
  # sslmode=require: RDS's default parameter group sets rds.force_ssl=1, which
  # rejects plaintext connections outright (pg_hba.conf has no non-SSL entry).
  # uselibpqcompat=true: without it, this pg-connection-string version treats
  # "require" as an alias for "verify-full", which fails with no RDS CA
  # bundle installed in the app image — this flag restores plain
  # encrypt-without-verifying semantics.
  database_url = "postgres://${local.rds_credentials.username}:${urlencode(local.rds_credentials.password)}@${var.rds_address}:${var.rds_port}/${var.rds_db_name}?sslmode=require&uselibpqcompat=true"
}

resource "aws_secretsmanager_secret" "database_url" {
  name = "${var.name_prefix}/production/database-url"
}

resource "aws_secretsmanager_secret_version" "database_url" {
  secret_id     = aws_secretsmanager_secret.database_url.id
  secret_string = local.database_url
}

# --- product-images bucket ----------------------------------------------
# Public-read by design (product photos served directly to shoppers) —
# distinct from the 3 private, CloudFront-fronted frontend buckets.
# With the packages/storage credential fix (optional accessKeyId/
# secretAccessKey), no static IAM user key is needed here — the
# shop-admin-api ECS task role gets direct bucket permissions instead
# (wired in the ecs-service module instantiation).

resource "aws_s3_bucket" "product_images" {
  bucket = "${var.name_prefix}-product-images-${data.aws_caller_identity.current.account_id}"
}

resource "aws_s3_bucket_public_access_block" "product_images" {
  bucket = aws_s3_bucket.product_images.id

  block_public_acls       = true
  ignore_public_acls      = true
  block_public_policy     = false
  restrict_public_buckets = false
}

resource "aws_s3_bucket_policy" "product_images" {
  bucket = aws_s3_bucket.product_images.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = "*"
      Action    = "s3:GetObject"
      Resource  = "${aws_s3_bucket.product_images.arn}/*"
    }]
  })

  depends_on = [aws_s3_bucket_public_access_block.product_images]
}
