# Values here must match Phase 0's bootstrap module outputs
# (state_bucket_name, lock_table_name). Terraform's backend block can't
# reference variables/outputs, so these are hardcoded — update them if the
# bootstrap module is ever re-run against a different account.

terraform {
  backend "s3" {
    bucket         = "ordersail-terraform-state-084375572674"
    key            = "production/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "ordersail-terraform-locks"
    encrypt        = true
  }
}
