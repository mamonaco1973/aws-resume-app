# =================================================================================
# Variables
# =================================================================================

locals {
  spa_origin           = "https://myjobs.mikes-cloud-solutions.com"
  google_enabled       = var.google_client_id != ""
  identity_providers   = local.google_enabled ? ["COGNITO", "Google"] : ["COGNITO"]
}

# =================================================================================
# Cognito User Pool
# =================================================================================

resource "aws_cognito_user_pool" "resume_app" {
  name = "resume-app-user-pool-${random_id.bucket_suffix.hex}"

  username_attributes      = ["email"]
  auto_verified_attributes = ["email"]

  password_policy {
    minimum_length    = 12
    require_lowercase = true
    require_uppercase = true
    require_numbers   = true
    require_symbols   = false
  }

  schema {
    name                = "email"
    attribute_data_type = "String"
    required            = true
    mutable             = true
  }

  account_recovery_setting {
    recovery_mechanism {
      name     = "verified_email"
      priority = 1
    }
  }
}

# =================================================================================
# Cognito Hosted UI domain
# =================================================================================

resource "aws_cognito_user_pool_domain" "resume_app" {
  domain       = "resume-app-auth-${random_id.bucket_suffix.hex}"
  user_pool_id = aws_cognito_user_pool.resume_app.id
}

# =================================================================================
# Google Identity Provider
# Only created when google_client_id is provided
# =================================================================================

resource "aws_cognito_identity_provider" "google" {
  count = local.google_enabled ? 1 : 0

  user_pool_id  = aws_cognito_user_pool.resume_app.id
  provider_name = "Google"
  provider_type = "Google"

  provider_details = {
    client_id        = var.google_client_id
    client_secret    = var.google_client_secret
    authorize_scopes = "openid email profile"
  }

  attribute_mapping = {
    email    = "email"
    username = "sub"
    name     = "name"
  }
}

# =================================================================================
# Cognito User Pool Client
# SPA client for Hosted UI login
# =================================================================================

resource "aws_cognito_user_pool_client" "resume_app" {
  name         = "resume-app-spa-client-${random_id.bucket_suffix.hex}"
  user_pool_id = aws_cognito_user_pool.resume_app.id

  generate_secret = false

  explicit_auth_flows = [
    "ALLOW_USER_SRP_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH"
  ]

  allowed_oauth_flows_user_pool_client = true
  allowed_oauth_flows                  = ["code"]
  allowed_oauth_scopes                 = ["openid", "email", "profile"]

  supported_identity_providers = local.identity_providers

  callback_urls = ["${local.spa_origin}/callback.html"]
  logout_urls   = ["${local.spa_origin}/index.html"]

  depends_on = [aws_cognito_identity_provider.google]
}

# =================================================================================
# Outputs
# =================================================================================

# ---------------------------------------------------------------------------------
# Cognito User Pool ID
# Consumed by apply.sh to configure frontend OAuth2 settings
# ---------------------------------------------------------------------------------

output "cognito_user_pool_id" {
  value = aws_cognito_user_pool.resume_app.id
}

# ---------------------------------------------------------------------------------
# Cognito App Client ID
# Used by the SPA as the OAuth2 client_id in authorization requests
# ---------------------------------------------------------------------------------

output "cognito_user_pool_client_id" {
  value = aws_cognito_user_pool_client.resume_app.id
}

# ---------------------------------------------------------------------------------
# Cognito Hosted UI domain prefix
# Used by apply.sh to construct the full Hosted UI base URL for the frontend
# ---------------------------------------------------------------------------------

output "cognito_domain" {
  value = aws_cognito_user_pool_domain.resume_app.domain
}

# ---------------------------------------------------------------------------------
# Cognito Hosted UI base URL
# Full URL consumed by apply.sh to populate COGNITO_DOMAIN in config.js
# ---------------------------------------------------------------------------------

output "cognito_hosted_ui_base" {
  value = "https://${aws_cognito_user_pool_domain.resume_app.domain}.auth.${data.aws_region.current.region}.amazoncognito.com"
}

# ---------------------------------------------------------------------------------
# Google OAuth redirect URI
# Paste this into Google Cloud Console → Authorized redirect URIs
# Only relevant when Google federation is enabled
# ---------------------------------------------------------------------------------

output "cognito_google_redirect_uri" {
  value = "https://${aws_cognito_user_pool_domain.resume_app.domain}.auth.${data.aws_region.current.region}.amazoncognito.com/oauth2/idpresponse"
}
