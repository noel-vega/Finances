output "deploy_role_website_arn" {
  description = "Set as vars.AWS_DEPLOY_ROLE_ARN_WEBSITE for deploy-website.yml's configure-aws-credentials step."
  value       = module.deploy_role_website.deploy_role_arn
}

output "deploy_role_platform_arn" {
  description = "Set as vars.AWS_DEPLOY_ROLE_ARN for cd.yml's configure-aws-credentials step, once that milestone is applied."
  value       = module.deploy_role_platform.deploy_role_arn
}

output "admin_api_url" {
  value = "https://${module.alb_admin_api.dns_name}"
}

output "storefront_api_url" {
  value = "https://${module.alb_storefront_api.dns_name}"
}

output "admin_web_url" {
  value = "https://${module.frontend_admin_web.distribution_domain_name}"
}

output "storefront_web_url" {
  value = "https://${module.frontend_storefront_web.distribution_domain_name}"
}

output "website_url" {
  value = "https://${module.frontend_website.distribution_domain_name}"
}

output "ecr_repository_urls" {
  value = module.ecr.repository_urls
}

output "app_secret_arns" {
  description = "Populate these via `aws secretsmanager put-secret-value` before the first deploy."
  value       = module.secrets.app_secret_arns
}
