# ordersail.com was registered through the Route 53 console (domain
# registration/purchase isn't something Terraform can do — it's a one-time,
# billable, ICANN-verified transaction, not a declarative resource). Route
# 53 auto-creates a public hosted zone at registration time; `data` (not a
# managed `aws_route53_zone` resource) is deliberate here, so Terraform
# never has destroy authority over a zone tied to a real paid domain.
data "aws_route53_zone" "this" {
  name = var.domain_name
}

# Wildcard SAN covers admin.${domain}/shop.${domain} in advance, even
# though only the apex (-> website) is wired up below. When
# shop-admin-web/storefront-web's own milestones land, pointing their
# subdomains at this same cert is a two-line change with no re-validation.
resource "aws_acm_certificate" "frontends" {
  domain_name               = var.domain_name
  subject_alternative_names = ["*.${var.domain_name}"]
  validation_method         = "DNS"

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_route53_record" "cert_validation" {
  for_each = {
    for dvo in aws_acm_certificate.frontends.domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      type   = dvo.resource_record_type
      record = dvo.resource_record_value
    }
  }

  zone_id         = data.aws_route53_zone.this.zone_id
  name            = each.value.name
  type            = each.value.type
  records         = [each.value.record]
  ttl             = 60
  allow_overwrite = true
}

resource "aws_acm_certificate_validation" "frontends" {
  certificate_arn         = aws_acm_certificate.frontends.arn
  validation_record_fqdns = [for r in aws_route53_record.cert_validation : r.fqdn]
}

# Apex domains can't use a CNAME, so this is a Route53 "alias" record
# instead — points directly at the website's CloudFront distribution.
resource "aws_route53_record" "website_apex" {
  zone_id = data.aws_route53_zone.this.zone_id
  name    = var.domain_name
  type    = "A"

  alias {
    name                   = module.frontend_website.distribution_domain_name
    zone_id                = module.frontend_website.distribution_hosted_zone_id
    evaluate_target_health = false
  }
}
