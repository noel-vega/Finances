# Fill these in before running `terraform apply`.

region      = "us-east-1"
name_prefix = "harbor"

github_repo = "noel-vega/shop"

# real address you control — SES sends a confirmation email here that must
# be clicked manually before sending will work (see Phase 9)
ses_verified_email = "<you>@example.com"
