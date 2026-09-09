resource "random_password" "master" {
  length  = 32
  special = false # alphanumeric only — no characters that need URL-encoding in the connection string
}

resource "aws_db_subnet_group" "this" {
  name       = "${var.name_prefix}-db"
  subnet_ids = var.private_subnet_ids
}

resource "aws_security_group" "rds" {
  name        = "${var.name_prefix}-rds"
  description = "Postgres access from ECS tasks only"
  vpc_id      = var.vpc_id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_security_group_rule" "rds_ingress_from_ecs" {
  type                     = "ingress"
  from_port                = 5432
  to_port                  = 5432
  protocol                 = "tcp"
  security_group_id        = aws_security_group.rds.id
  source_security_group_id = var.ecs_tasks_security_group_id
}

resource "aws_db_instance" "this" {
  identifier     = "${var.name_prefix}-production"
  engine         = "postgres"
  engine_version = "17"
  instance_class = var.instance_class

  allocated_storage = 20
  storage_type      = "gp3"

  db_name  = "ordersail"
  username = "postgres"

  # Static, Terraform-managed master password. We deliberately do NOT use
  # `manage_master_user_password` (RDS-managed rotation): it rotates the
  # password out-of-band every 7 days, which the composed `database-url` app
  # secret (modules/secrets) can't follow without a `terraform apply` — every
  # rotation was a prod outage (OS-366). Managed rotation comes back via RDS
  # Proxy (OS-45). The password lives in the (encrypted, access-restricted)
  # remote state.
  password          = random_password.master.result
  apply_immediately = true

  db_subnet_group_name      = aws_db_subnet_group.this.name
  vpc_security_group_ids    = [aws_security_group.rds.id]
  multi_az                  = false
  publicly_accessible       = false
  backup_retention_period   = 7
  deletion_protection       = true
  skip_final_snapshot       = false
  final_snapshot_identifier = "${var.name_prefix}-production-final"
}
