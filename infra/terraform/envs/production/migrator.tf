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

resource "aws_ecs_task_definition" "migrator" {
  family                   = "${var.name_prefix}-migrator"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = "256"
  memory                   = "512"
  execution_role_arn       = aws_iam_role.migrator_execution.arn

  container_definitions = jsonencode([
    {
      name      = "migrator"
      image     = "${module.ecr.repository_urls["migrator"]}:latest"
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
  ])

  # the CD workflow overrides the image tag per-deploy via `run-task
  # --overrides` rather than registering a new revision every time; don't
  # fight that by reverting it on every `terraform apply`
  lifecycle {
    ignore_changes = [container_definitions]
  }
}
