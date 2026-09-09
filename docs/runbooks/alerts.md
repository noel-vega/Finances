# Alerts & alarm channels

How production tells us something is wrong, and what to do when it does.
Part of the **Observability & alerting** Linear project (M1 — "Know when it breaks").

## Channels

Two SNS topics, created in `infra/terraform/envs/production/monitoring.tf`:

| Topic | ARN name | Subscribers | Use for |
|---|---|---|---|
| **critical** | `ordersail-alerts-critical` | email (+ SMS once the sandbox is exited) | pages — a human needs to act now |
| **warning** | `ordersail-alerts-warning` | email | elevated but not down; look when convenient |

### Adding / changing recipients

Recipients are **not** in the committed tfvars. Put them in a git-ignored
`infra/terraform/envs/production/secrets.auto.tfvars`:

```hcl
alert_emails      = ["you@example.com", "oncall@example.com"]
alert_sms_numbers = []   # keep empty until the SNS SMS sandbox is exited
```

`terraform apply`, then **click the confirmation link** in each "AWS Notification —
Subscription Confirmation" email. Unconfirmed subscriptions receive nothing.

### SMS (deferred)

AWS SNS SMS starts in a **sandbox**: it can only send to phone numbers you've verified in
the SNS console, and there's a monthly spend limit. To use it: verify the destination
number(s) (SNS → Text messaging → Sandbox destination phone numbers), optionally request
production access, set a spending limit, then populate `alert_sms_numbers`.

## Testing

```bash
CRIT=$(terraform -chdir=infra/terraform/envs/production output -raw alerts_critical_topic_arn)
aws sns publish --topic-arn "$CRIT" --subject "test" --message "alert channel test $(date)"
```
The confirmed email addresses should receive it within a minute.

## Silencing during maintenance

Per alarm, disable its actions (it still evaluates, just doesn't notify):

```bash
aws cloudwatch disable-alarm-actions --alarm-names ordersail-<alarm-name>
# ... maintenance ...
aws cloudwatch enable-alarm-actions  --alarm-names ordersail-<alarm-name>
```

Or force an alarm out of `ALARM` state temporarily:

```bash
aws cloudwatch set-alarm-state --alarm-name ordersail-<name> --state-value OK \
  --state-reason "maintenance window"
```

## Alarm inventory

Each row is added by its issue's PR. `→` is the topic the alarm notifies.

| Alarm | Source | Fires when | → |
|---|---|---|---|
| _ECS RunningTaskCount_ | OS-76 `modules/ecs-service` | running < desired for N min (per service) | critical |
| _ECS container-exit rate_ | OS-76 | ≥3 "Essential container … exited" in 15 min | critical |
| _ALB 5xx rate_ | OS-77 `modules/alb` | target+ELB 5xx / requests > 5% for 5 min | critical |
| _ALB 5xx absolute_ | OS-77 | ELB 5xx > 10 in 5 min | warning |
| _ALB p95 latency_ | OS-77 | `TargetResponseTime` p95 > threshold for 5 min | warning |
| _ALB unhealthy hosts_ | OS-77 | `UnHealthyHostCount` > 0 for 3 min | critical |
| _RDS free storage_ | OS-78 `modules/rds` | `FreeStorageSpace` < GB floor | critical |
| _RDS CPU / memory / connections_ | OS-78 | sustained high | warning |
| _ElastiCache memory %_ | OS-79 `modules/elasticache` | `DatabaseMemoryUsagePercentage` > 80% for 10 min | critical |
| _ElastiCache evictions_ | OS-79 | `Evictions` > 0 for 5 min | critical |
| _ElastiCache CPU / swap / connections_ | OS-79 | sustained high | warning |
| _Order-job dead-letter_ | OS-73 `apps/worker` | an `orders` job exhausts all 8 attempts | critical |

## When "order-job dead-letter" fires

A customer paid via Stripe and no order was created. The job's data is persisted in the
`failed_orders` table (independent of Redis). Reconcile from there:

1. merchant-web → the failed-orders view (OS-116) shows the row and a **Retry** action.
2. Once the root cause is fixed, retry re-drives the order from the persisted
   `OrderJobData` — it does not touch Redis/BullMQ.
3. Cross-check the Stripe payment intent to confirm the charge before/after.
