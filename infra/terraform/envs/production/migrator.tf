# One-off DB migration task (drizzle-kit migrate), invoked via
# `aws ecs run-task` from the CD workflow — not a long-running service, so
# no aws_ecs_service here. Runs inside the private subnets using the shared
# ecs-tasks SG, which RDS's security group already trusts.

data "aws_region" "current" {}

resource "aws_cloudwatch_log_group" "migrator" {
  name              = "/ecs/${var.name_prefix}-migrator"
  retention_in_days = 30
}

data "aws_iam_policy_document" "migrator_execution_assume" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["ecs-tasks.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "migrator_execution" {
  name               = "${var.name_prefix}-migrator-execution"
  assume_role_policy = data.aws_iam_policy_document.migrator_execution_assume.json
}

resource "aws_iam_role_policy_attachment" "migrator_execution_managed" {
  role       = aws_iam_role.migrator_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_iam_role_policy" "migrator_execution_secrets" {
  name = "read-database-url"
  role = aws_iam_role.migrator_execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = "secretsmanager:GetSecretValue"
      Resource = module.secrets.database_url_secret_arn
    }]
  })
}

locals {
  migrator_container_definitions = [
    {
      name      = "migrator"
      image     = "${module.ecr.repository_urls["migrator"]}:${var.bootstrap_image_tag}"
      essential = true
      secrets = [
        { name = "DATABASE_URL", valueFrom = module.secrets.database_url_secret_arn }
      ]
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.migrator.name
          "awslogs-region"        = data.aws_region.current.name
          "awslogs-stream-prefix" = "migrator"
        }
      }
    }
  ]

  # published to SSM (ssm.tf) — migrate.yml reads it, swaps in the image tag,
  # registers a revision, run-tasks it. No taskRoleArn (migrator has none).
  migrator_register_task_definition_input = {
    family                  = "${var.name_prefix}-migrator"
    executionRoleArn        = aws_iam_role.migrator_execution.arn
    networkMode             = "awsvpc"
    requiresCompatibilities = ["FARGATE"]
    cpu                     = "256"
    memory                  = "512"
    containerDefinitions    = local.migrator_container_definitions
  }
}

resource "aws_ecs_task_definition" "migrator" {
  family                   = "${var.name_prefix}-migrator"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = "256"
  memory                   = "512"
  execution_role_arn       = aws_iam_role.migrator_execution.arn

  container_definitions = jsonencode(local.migrator_container_definitions)

  # the Migrate workflow registers a new revision per run, pinned to the
  # deployed image tag (run-task --overrides can't change the image) — this
  # is the TF-owned rev 1 baseline; ignore_changes stops `terraform apply`
  # from reverting to it.
  lifecycle {
    ignore_changes = [container_definitions]
  }
}
