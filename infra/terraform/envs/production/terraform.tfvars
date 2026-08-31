# Fill these in before running `terraform apply`.

region      = "us-east-1"
name_prefix = "ordersail"

github_repo = "noel-vega/ordersail"

domain_name = "ordersail.com"

# real address you control — SES sends a confirmation email here that must
# be clicked manually before sending will work (see Phase 9)
ses_verified_email = "noelvegajr94@gmail.com"
