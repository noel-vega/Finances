# The GitHub Actions OIDC identity provider — an AWS singleton, one per
# provider URL per account. Looked up rather than managed as a resource:
# it's an account-wide concept that may already exist (created by another
# project) or get created by another project later, and this repo has no
# business owning its lifecycle — a `terraform destroy` here should never
# be able to take down another project's CI.
#
# Assumes the provider already exists in the account. If it doesn't yet,
# create it once via the AWS console/CLI (or `aws iam create-open-id-
# connect-provider`) before applying this module.

data "aws_iam_openid_connect_provider" "github" {
  url = "https://token.actions.githubusercontent.com"
}
