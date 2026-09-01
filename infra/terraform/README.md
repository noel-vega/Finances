# Infrastructure (Terraform)

All AWS infrastructure for Ordersail. Region `us-east-1`, account `084375572674`.

```
infra/terraform/
├── bootstrap/          # S3 state bucket + DynamoDB lock table — LOCAL state, run once
├── modules/            # reusable modules (network, rds, ecs-service, alb, s3-static-site, …)
└── envs/
    └── production/     # the live stack — S3 remote state
```

## Layer order

### 1. `bootstrap/` — run once, manually, from an admin identity

Creates `ordersail-terraform-state-084375572674` (S3, versioned, encrypted) and
`ordersail-terraform-locks` (DynamoDB). Its own state is **local** (chicken-and-egg)
— the `terraform.tfstate` file lives in the directory and is gitignored.

```bash
cd infra/terraform/bootstrap
terraform init && terraform apply
```

Already applied (2026-08-26). Only re-run to move the backend to a new account —
then update the hardcoded values in `envs/production/backend.tf`.

### 2. `envs/production/` — the live stack

```bash
cd infra/terraform/envs/production
terraform init      # configures the S3 backend
terraform plan
terraform apply
```

Contains: VPC + NAT, RDS Postgres 17 (`ordersail-production`), ElastiCache Redis,
ECS cluster + 3 Fargate services (merchant-api, storefront-api, worker) + a
migrator task, 2 ALBs, 3 CloudFront distributions (merchant-web, storefront-web,
website) + S3 origin buckets, ACM cert (`*.ordersail.com`), Secrets Manager
(one secret per API + the DB URL), ECR (4 repos), the GitHub OIDC provider, and
two GitHub-Actions deploy roles (`-platform`, `-website`).

**State as of 2026-08-31:** fully applied and `merchant-*`-named. Previously the
stack was applied under the pre-rename `shop-admin-*` names; the rename apply
(31 create / 31 destroy — every resource an empty shell) landed this date and
also replaced RDS to pick up `db_name = "ordersail"` (was `"shop"`).

## GitHub configuration (consumed by `.github/workflows/`)

### Environment

A **`production`** GitHub Environment with **one required reviewer**. Gates the
approval-sensitive jobs in `cd.yml` (`migrate`, `deploy-services`,
`deploy-frontends`) and `deploy-website.yml` — there is no staging (M4 / OS-38).

### Repo variables (`gh variable list`)

| variable | value | source |
|---|---|---|
| `AWS_REGION` | `us-east-1` | fixed |
| `AWS_DEPLOY_ROLE_ARN` | `…:role/ordersail-github-actions-deploy-platform` | `terraform output deploy_role_platform_arn` |
| `AWS_DEPLOY_ROLE_ARN_WEBSITE` | `…:role/ordersail-github-actions-deploy-website` | `terraform output deploy_role_website_arn` |
| `VITE_STRIPE_PUBLISHABLE_KEY` | *(not set yet)* | platform Stripe publishable key — set before `merchant-web` deploys (OS-31) |
| `VITE_STOREFRONT_APP_KEY` | *(not set yet)* | a prod storefront API key — set once a prod account is seeded (OS-32) |

### OIDC trust

Both deploy roles trust GitHub Actions OIDC tokens for this repo. GitHub issues
the token `sub` claim with an **immutable ID-suffixed prefix**
(`repo:noel-vega@179352624/ordersail@1292329338:…`, the default since 2025) — the
trust policies list both that and the legacy `repo:noel-vega/ordersail:…` form.
The two numeric ids live in `terraform.tfvars` as `github_owner_id` /
`github_repo_id` (`gh api repos/noel-vega/ordersail --jq '.owner.id, .id'`); they
change only on a GitHub owner/repo **transfer** — update the tfvars and re-apply
`module.deploy_role_*` if that ever happens.

## Runbooks

### Changing an RDS identity attribute (`db_name`, `identifier`, `engine`, …)

These force a **replacement**, which the instance's `deletion_protection = true`
blocks. Before `terraform apply`:

```bash
aws rds modify-db-instance --db-instance-identifier ordersail-production \
  --no-deletion-protection --apply-immediately
# wait for PendingModifiedValues to clear
terraform apply          # old instance destroyed (final snapshot taken), new one created
```

The new instance comes up with `deletion_protection = true` from
`modules/rds/main.tf` — no code change and no manual re-enable needed. The final
snapshot is `ordersail-production-final`; delete it manually once you're sure.

### CloudFront changes

Creating or destroying a distribution takes ~15–20 min each (Terraform waits for
`Deployed`). A rename touches two distributions serially — budget 30–45 min for
that apply.
