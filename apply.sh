#!/bin/bash
# ================================================================================
# File: apply.sh
# ================================================================================
#
# Purpose:
#   Orchestrates end-to-end deployment of the resume scorer application stack.
#
#   Workflow:
#     - Validate the local environment and AWS credentials
#     - Deploy backend (Lambdas, API Gateway, Cognito) via Terraform
#     - Discover the web S3 bucket and derive its region-aware URL
#     - Generate the web client artifacts (index.html, config.json)
#     - Deploy the web client via Terraform, targeting the existing bucket
#
# ================================================================================
# GLOBAL CONFIGURATION
# ================================================================================

# ------------------------------------------------------------------------------
# AWS REGION CONFIGURATION
# ------------------------------------------------------------------------------
# Defines the default AWS region used by AWS CLI and Terraform.
# ------------------------------------------------------------------------------
export AWS_DEFAULT_REGION="us-east-1"

# ------------------------------------------------------------------------------
# STRICT SHELL EXECUTION MODE
# ------------------------------------------------------------------------------
# Enforces defensive shell behavior:
#   -e  Exit immediately if any command fails
#   -u  Treat unset variables as errors
#   -o pipefail  Fail pipelines if any command fails
# ------------------------------------------------------------------------------
set -euo pipefail

# ================================================================================
# ENVIRONMENT PRE-CHECK
# ================================================================================

# ------------------------------------------------------------------------------
# ENVIRONMENT VALIDATION
# ------------------------------------------------------------------------------
# Ensures required tools, credentials, and environment variables exist
# before any deployment is attempted.
# ------------------------------------------------------------------------------
echo "NOTE: Running environment validation..."

./check_env.sh
if [ $? -ne 0 ]; then
  echo "ERROR: Environment validation failed. Exiting."
  exit 1
fi

# ================================================================================
# BACKEND DEPLOYMENT (LAMBDAS + API GATEWAY + COGNITO)
# ================================================================================

# ------------------------------------------------------------------------------
# DEPLOY BACKEND INFRASTRUCTURE
# ------------------------------------------------------------------------------
# Applies Terraform in 01-lambdas to create the backend stack, including:
#   - Lambda functions
#   - API Gateway (HTTP API)
#   - Cognito (domain + app client outputs are read later)
# ------------------------------------------------------------------------------
echo "NOTE: Building Application Core Services..."

cd 01-core || {
  echo "ERROR: 01-core directory missing."
  exit 1
}

terraform init
terraform apply -auto-approve

export API_BASE_URL=$(terraform output -raw api_endpoint)
export BUCKET_NAME=$(terraform output -raw frontend_bucket_name)
export BUCKET_URL=$(terraform output -raw frontend_website_url)

cd .. || exit 1

echo "NOTE: Bucket name is ${BUCKET_NAME}"
echo "NOTE: API Gateway URL - ${API_BASE_URL}"
echo "NOTE: Bucket URL - ${BUCKET_URL}"

# ------------------------------------------------------------------------------
# DEPLOYING WEB CLIENT ARTIFACTS
# ------------------------------------------------------------------------------
echo "NOTE: Deploying web application..."

cd 02-webapp || {
  echo "ERROR: 02-webapp directory missing."
  exit 1
}

envsubst < js/config.js.tmpl > js/config.js || {
  echo "ERROR: Failed to generate config.js."
  exit 1
}

aws s3 cp . s3://${BUCKET_NAME} --recursive
echo "NOTE: Web application URL - $BUCKET_URL/index.html"

cd ..

# # ------------------------------------------------------------------------------
# # READ COGNITO OUTPUTS FROM BACKEND STACK
# # ------------------------------------------------------------------------------
# # Reads Terraform outputs from 01-lambdas to configure the SPA login:
# #   - Cognito domain prefix
# #   - App client ID
# # ------------------------------------------------------------------------------
# echo "NOTE: Reading Cognito outputs..."

# COGNITO_DOMAIN_PREFIX=$(cd ../01-lambdas && terraform output -raw cognito_domain)
# CLIENT_ID=$(cd ../01-lambdas && terraform output -raw app_client_id)

# if [[ -z "${COGNITO_DOMAIN_PREFIX}" || -z "${CLIENT_ID}" ]]; then
#   echo "ERROR: Failed to read Cognito outputs."
#   exit 1
# fi

# # ------------------------------------------------------------------------------
# # BUILD COGNITO DOMAIN
# # ------------------------------------------------------------------------------
# # Constructs the Cognito Hosted UI domain from the domain prefix and
# # the region derived from the web bucket.
# # ------------------------------------------------------------------------------
# COGNITO_DOMAIN="${COGNITO_DOMAIN_PREFIX}.auth.${REGION}.amazoncognito.com"

# # ------------------------------------------------------------------------------
# # WRITE WEB CLIENT CONFIGURATION
# # ------------------------------------------------------------------------------
# # Writes config.json consumed by the SPA. redirectUri must match the
# # Hosted UI callback URL registered in the Cognito app client.
# # ------------------------------------------------------------------------------
# echo "NOTE: Writing config.json..."

# cat > config.json <<EOF
# {
#   "cognitoDomain": "${COGNITO_DOMAIN}",
#   "clientId": "${CLIENT_ID}",
#   "redirectUri": "${BUCKET_URL}/callback.html",
#   "apiBaseUrl": "${API_BASE}"
# }
# EOF

# # ------------------------------------------------------------------------------
# # DEPLOY WEB CLIENT (TERRAFORM)
# # ------------------------------------------------------------------------------
# # Applies Terraform in 02-webapp, targeting an existing bucket passed
# # via web_bucket_name. This module should not create the bucket.
# # ------------------------------------------------------------------------------
# terraform init
# terraform apply -auto-approve \
#   -var="web_bucket_name=${BUCKET_NAME}"

# cd .. || exit 1

# # ================================================================================
# # POST-DEPLOYMENT VALIDATION (OPTIONAL)
# # ================================================================================

# # ------------------------------------------------------------------------------
# # RUNTIME VALIDATION
# # ------------------------------------------------------------------------------
# # Enable once validate.sh is implemented.
# # ------------------------------------------------------------------------------
# echo "NOTE: Running post-deployment validation..."
# ./validate.sh

# # ================================================================================
# # END OF SCRIPT
# # ================================================================================