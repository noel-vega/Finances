# Plain (non-secret) values the GitHub Actions CI/CD workflows read via
# `aws ssm get-parameter` instead of running Terraform themselves.
#
# Split into one resource per concern (rather than one big map) so a
# targeted apply for a single concern — e.g. `-target=module.frontend_website
# -target=aws_ssm_parameter.frontend_website` — doesn't force evaluation of
# every other module's outputs too. HCL evaluates a map expression as a
# whole, so a single locals{} map covering everything would defeat that.

locals {
  ssm_frontend_website = {
    "frontend/website-bucket"       = module.frontend_website.bucket_name
    "frontend/website-distribution" = module.frontend_website.distribution_id
  }

  ssm_frontend_merchant_web = {
    "frontend/merchant-web-bucket"       = module.frontend_merchant_web.bucket_name
    "frontend/merchant-web-distribution" = module.frontend_merchant_web.distribution_id
  }

  ssm_ecr = {
    "ecr/merchant-api-uri"   = module.ecr.repository_urls["merchant-api"]
    "ecr/storefront-api-uri" = module.ecr.repository_urls["storefront-api"]
    "ecr/worker-uri"         = module.ecr.repository_urls["worker"]
    "ecr/migrator-uri"       = module.ecr.repository_urls["migrator"]
  }

  ssm_ecs = {
    "ecs/cluster-name"           = module.ecs_cluster.cluster_name
    "ecs/merchant-api-service"   = module.ecs_service_merchant_api.service_name
    "ecs/storefront-api-service" = module.ecs_service_storefront_api.service_name
    "ecs/worker-service"         = module.ecs_service_worker.service_name
    "ecs/migrator-task-family"   = aws_ecs_task_definition.migrator.family
  }

  ssm_network = {
    "network/private-subnet-ids"       = join(",", module.network.private_subnet_ids)
    "network/ecs-tasks-security-group" = module.ecs_cluster.ecs_tasks_security_group_id
  }

  ssm_alb = {
    "alb/merchant-api-dns"   = module.alb_merchant_api.dns_name
    "alb/storefront-api-dns" = module.alb_storefront_api.dns_name
  }
}

resource "aws_ssm_parameter" "frontend_website" {
  for_each = local.ssm_frontend_website
  name     = "/${var.name_prefix}/production/${each.key}"
  type     = "String"
  value    = each.value
}

resource "aws_ssm_parameter" "frontend_merchant_web" {
  for_each = local.ssm_frontend_merchant_web
  name     = "/${var.name_prefix}/production/${each.key}"
  type     = "String"
  value    = each.value
}

resource "aws_ssm_parameter" "ecr" {
  for_each = local.ssm_ecr
  name     = "/${var.name_prefix}/production/${each.key}"
  type     = "String"
  value    = each.value
}

resource "aws_ssm_parameter" "ecs" {
  for_each = local.ssm_ecs
  name     = "/${var.name_prefix}/production/${each.key}"
  type     = "String"
  value    = each.value
}

resource "aws_ssm_parameter" "network" {
  for_each = local.ssm_network
  name     = "/${var.name_prefix}/production/${each.key}"
  type     = "String"
  value    = each.value
}

resource "aws_ssm_parameter" "alb" {
  for_each = local.ssm_alb
  name     = "/${var.name_prefix}/production/${each.key}"
  type     = "String"
  value    = each.value
}
