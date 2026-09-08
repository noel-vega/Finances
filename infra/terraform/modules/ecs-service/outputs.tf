output "service_name" {
  value = aws_ecs_service.this.name
}

output "task_definition_family" {
  value = aws_ecs_task_definition.this.family
}

output "execution_role_arn" {
  value = aws_iam_role.execution.arn
}

output "task_role_arn" {
  value = aws_iam_role.task.arn
}

output "log_group_name" {
  value = aws_cloudwatch_log_group.this.name
}

# The full `register-task-definition` payload (JSON string) — envs/production
# publishes this to SSM for cd.yml to consume. See OS-361.
output "register_task_definition_input" {
  value = jsonencode(local.register_task_definition_input)
}
