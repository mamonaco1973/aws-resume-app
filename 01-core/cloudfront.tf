# ================================================================================
# ACM Certificate — myjobs.mikes-cloud-solutions.com
# Must be in us-east-1 for CloudFront; provider default region satisfies this.
# ================================================================================

resource "aws_acm_certificate" "myjobs" {
  domain_name       = "myjobs.mikes-cloud-solutions.com"
  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }
}

# ================================================================================
# Route 53 DNS validation records for the ACM certificate
# ================================================================================

resource "aws_route53_record" "myjobs_cert_validation" {
  for_each = {
    for dvo in aws_acm_certificate.myjobs.domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  }

  zone_id = "Z104804116GKVC6IA1EKC"
  name    = each.value.name
  type    = each.value.type
  records = [each.value.record]
  ttl     = 60
}

resource "aws_acm_certificate_validation" "myjobs" {
  certificate_arn         = aws_acm_certificate.myjobs.arn
  validation_record_fqdns = [for r in aws_route53_record.myjobs_cert_validation : r.fqdn]
}

# ================================================================================
# CloudFront distribution
# Uses the S3 website endpoint as origin to support SPA client-side routing.
# ================================================================================

resource "aws_cloudfront_distribution" "myjobs" {
  enabled             = true
  default_root_object = "index.html"
  aliases             = ["myjobs.mikes-cloud-solutions.com"]

  origin {
    # S3 website endpoint (HTTP) — REST endpoint doesn't support index/error docs
    domain_name = aws_s3_bucket_website_configuration.frontend.website_endpoint
    origin_id   = "s3-frontend"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "http-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  default_cache_behavior {
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "s3-frontend"
    viewer_protocol_policy = "redirect-to-https"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    min_ttl     = 0
    default_ttl = 3600
    max_ttl     = 86400
  }

  # Route unknown paths to index.html — required for SPA client-side routing
  custom_error_response {
    error_code         = 403
    response_code      = 200
    response_page_path = "/index.html"
  }

  custom_error_response {
    error_code         = 404
    response_code      = 200
    response_page_path = "/index.html"
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    acm_certificate_arn      = aws_acm_certificate_validation.myjobs.certificate_arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }
}

# ================================================================================
# Route 53 alias — myjobs.mikes-cloud-solutions.com → CloudFront distribution
# ================================================================================

resource "aws_route53_record" "myjobs" {
  zone_id = "Z104804116GKVC6IA1EKC"
  name    = "myjobs.mikes-cloud-solutions.com"
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.myjobs.domain_name
    zone_id                = aws_cloudfront_distribution.myjobs.hosted_zone_id
    evaluate_target_health = false
  }
}

# ================================================================================
# Output — custom domain URL
# ================================================================================

output "custom_domain_url" {
  value = "https://myjobs.mikes-cloud-solutions.com"
}

output "cloudfront_distribution_id" {
  value = aws_cloudfront_distribution.myjobs.id
}
