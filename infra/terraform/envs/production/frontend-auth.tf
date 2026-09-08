# Pre-launch gate (OS-363). Both public frontends sit behind one shared HTTP
# Basic credential enforced at the CloudFront edge. The value lives in an SSM
# SecureString created out of band — never in git or tfvars:
#
#   aws ssm put-parameter --region us-east-1 \
#     --name /ordersail/production/frontend/basic-auth \
#     --type SecureString \
#     --value 'crew:<long-passphrase>'        # comma-separate for multiple: 'crew:pw1,noel:pw2'
#
# The parameter must exist before `terraform apply`. To lift the gate at launch,
# open a PR removing this file + the two basic_auth_credentials wirings in
# main.tf, then apply.
data "aws_ssm_parameter" "frontend_basic_auth" {
  name = "/${var.name_prefix}/production/frontend/basic-auth"
}

locals {
  # comma-separated "user:pass" pairs; compact() tolerates a trailing comma or
  # an empty value (→ no gate).
  frontend_basic_auth_credentials = compact(split(",", data.aws_ssm_parameter.frontend_basic_auth.value))
}
