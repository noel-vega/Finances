# Pre-launch gate (OS-363). Reads a Secrets Manager secret holding a JSON map of
# {"<user>": "<password>"} pairs that unlock both public frontends via HTTP Basic
# auth at the CloudFront edge. The secret is created out of band (Console/CLI) —
# see infra/terraform/README.md. Empty / absent map => no gate.
#
# The values end up base64-embedded in the published CloudFront Function and are
# recoverable via cloudfront:GetFunction — a keep-the-public-out gate for a
# pre-launch site, not a secret boundary. To lift the gate at launch: empty the
# secret (or delete this file + the two basic_auth_credentials wirings in
# main.tf), then apply.
data "aws_secretsmanager_secret_version" "frontend_basic_auth" {
  secret_id = "${var.name_prefix}/production/frontend/basic-auth"
}

locals {
  # {"crew":"family126"} -> ["crew:family126"]
  frontend_basic_auth_credentials = [
    for user, pass in try(jsondecode(data.aws_secretsmanager_secret_version.frontend_basic_auth.secret_string), {}) :
    "${user}:${pass}"
  ]
}
