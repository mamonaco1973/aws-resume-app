#!/bin/bash
# ================================================================================
# validate.sh
#
# Purpose
# Post-deploy validation for the AWS Bedrock Resume Scoring application.
# Reads Terraform outputs and prints a quick-start summary of all key
# endpoints, bucket names, and Cognito configuration.
#
# Requirements
# - terraform CLI installed and authenticated
# - AWS credentials configured
# - Terraform state must exist (run apply.sh first)
# ================================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TF_DIR="${SCRIPT_DIR}/01-core"

# ================================================================================
# Read Terraform outputs
# ================================================================================

cd "${TF_DIR}"

API_ENDPOINT="$(terraform output -raw api_endpoint 2>/dev/null || echo '<not found>')"
FRONTEND_URL="$(terraform output -raw frontend_website_url 2>/dev/null || echo '<not found>')"
FRONTEND_BUCKET="$(terraform output -raw frontend_bucket_name 2>/dev/null || echo '<not found>')"
COGNITO_POOL_ID="$(terraform output -raw cognito_user_pool_id 2>/dev/null || echo '<not found>')"
COGNITO_CLIENT_ID="$(terraform output -raw cognito_user_pool_client_id 2>/dev/null || echo '<not found>')"
COGNITO_HOSTED_UI="$(terraform output -raw cognito_hosted_ui_base 2>/dev/null || echo '<not found>')"

# ================================================================================
# Quick Start Output
# ================================================================================

echo ""
echo "============================================================================"
echo "AWS Bedrock Scoring Quick Start"
echo "============================================================================"
echo ""

printf "%-28s %s\n" "NOTE: Frontend URL:"        "${FRONTEND_URL}"
printf "%-28s %s\n" "NOTE: API Endpoint:"        "${API_ENDPOINT}"
echo ""
printf "%-28s %s\n" "NOTE: Frontend Bucket:"     "${FRONTEND_BUCKET}"
echo ""
printf "%-28s %s\n" "NOTE: Cognito Pool ID:"     "${COGNITO_POOL_ID}"
printf "%-28s %s\n" "NOTE: Cognito Client ID:"   "${COGNITO_CLIENT_ID}"
printf "%-28s %s\n" "NOTE: Cognito Hosted UI:"   "${COGNITO_HOSTED_UI}"

echo ""
