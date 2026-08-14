# A single GitHub Actions -> AWS deploy role, OIDC-federated (no static IAM
# access keys). Generic and instantiated multiple times — one per rollout
# concern (e.g. "website", later "platform") — each scoped to only the
# permissions that concern needs. All instances trust the same OIDC
# provider (modules/oidc-provider), created once and passed in via
# var.oidc_provider_arn.
#
# var.github_repo must be "<owner>/<repo>" for wherever this code actually
# lives on GitHub — set in envs/production/terraform.tfvars.

data "aws_caller_identity" "current" {}

data "aws_iam_policy_document" "trust" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRoleWithWebIdentity"]

    principals {
      type        = "Federated"
      identifiers = [var.oidc_provider_arn]
    }

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"
      values   = ["sts.amazonaws.com"]
    }

    condition {
      test     = "StringLike"
      variable = "token.actions.githubusercontent.com:sub"
      values   = ["repo:${var.github_repo}:ref:refs/heads/main"]
    }
  }
}

resource "aws_iam_role" "github_actions_deploy" {
  name               = var.role_name
  assume_role_policy = data.aws_iam_policy_document.trust.json
}

data "aws_iam_policy_document" "deploy" {
  dynamic "statement" {
    for_each = var.include_ecr_push ? [1] : []
    content {
      sid       = "EcrAuth"
      effect    = "Allow"
      actions   = ["ecr:GetAuthorizationToken"]
      resources = ["*"]
    }
  }

  dynamic "statement" {
    for_each = var.include_ecr_push ? [1] : []
    content {
      sid    = "EcrPush"
      effect = "Allow"
      actions = [
        "ecr:BatchCheckLayerAvailability",
        "ecr:GetDownloadUrlForLayer",
        "ecr:BatchGetImage",
        "ecr:PutImage",
        "ecr:InitiateLayerUpload",
        "ecr:UploadLayerPart",
        "ecr:CompleteLayerUpload",
      ]
      resources = ["arn:aws:ecr:${var.region}:${data.aws_caller_identity.current.account_id}:repository/${var.name_prefix}-*"]
    }
  }

  dynamic "statement" {
    # RegisterTaskDefinition and DescribeTaskDefinition do not support
    # resource-level permissions — AWS requires "*" for these two actions.
    for_each = var.include_ecs_deploy ? [1] : []
    content {
      sid    = "EcsTaskDefs"
      effect = "Allow"
      actions = [
        "ecs:RegisterTaskDefinition",
        "ecs:DescribeTaskDefinition",
      ]
      resources = ["*"]
    }
  }

  dynamic "statement" {
    for_each = var.include_ecs_deploy ? [1] : []
    content {
      sid    = "EcsDeploy"
      effect = "Allow"
      actions = [
        "ecs:UpdateService",
        "ecs:DescribeServices",
        "ecs:RunTask",
        "ecs:DescribeTasks",
        "ecs:StopTask",
      ]
      resources = [
        "arn:aws:ecs:${var.region}:${data.aws_caller_identity.current.account_id}:cluster/${var.name_prefix}",
        "arn:aws:ecs:${var.region}:${data.aws_caller_identity.current.account_id}:service/${var.name_prefix}/*",
        "arn:aws:ecs:${var.region}:${data.aws_caller_identity.current.account_id}:task/${var.name_prefix}/*",
        "arn:aws:ecs:${var.region}:${data.aws_caller_identity.current.account_id}:task-definition/${var.name_prefix}-*:*",
      ]
    }
  }

  dynamic "statement" {
    for_each = length(var.pass_role_arns) > 0 ? [1] : []
    content {
      sid       = "PassEcsRoles"
      effect    = "Allow"
      actions   = ["iam:PassRole"]
      resources = var.pass_role_arns
    }
  }

  dynamic "statement" {
    for_each = length(var.s3_bucket_arns) > 0 ? [1] : []
    content {
      sid    = "FrontendBuckets"
      effect = "Allow"
      actions = [
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:ListBucket",
      ]
      resources = flatten([for arn in var.s3_bucket_arns : [arn, "${arn}/*"]])
    }
  }

  dynamic "statement" {
    for_each = length(var.cloudfront_distribution_arns) > 0 ? [1] : []
    content {
      sid       = "FrontendInvalidations"
      effect    = "Allow"
      actions   = ["cloudfront:CreateInvalidation"]
      resources = var.cloudfront_distribution_arns
    }
  }

  statement {
    sid       = "ReadSsmOutputs"
    effect    = "Allow"
    actions   = ["ssm:GetParameter", "ssm:GetParameters", "ssm:GetParametersByPath"]
    resources = ["arn:aws:ssm:${var.region}:${data.aws_caller_identity.current.account_id}:parameter/${var.name_prefix}/production/*"]
  }
}

resource "aws_iam_role_policy" "deploy" {
  name   = var.role_name
  role   = aws_iam_role.github_actions_deploy.id
  policy = data.aws_iam_policy_document.deploy.json
}
