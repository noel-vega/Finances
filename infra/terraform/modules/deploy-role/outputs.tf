output "deploy_role_arn" {
  description = "Role for GitHub Actions to assume via configure-aws-credentials' role-to-assume input."
  value       = aws_iam_role.github_actions_deploy.arn
}
