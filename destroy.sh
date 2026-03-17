#!/bin/bash
# ================================================================================
# File: destroy.sh
# ================================================================================
#
# Purpose:
#   Tears down the Resume Scoring application stack deployed by apply.sh.
#
#   Destroys all backend infrastructure provisioned by Terraform, including:
#     - Lambda functions, API Gateway, Cognito, DynamoDB, SQS, and S3 buckets.
#
# ================================================================================
# GLOBAL CONFIGURATION
# ================================================================================

# ------------------------------------------------------------------------------
# AWS REGION CONFIGURATION
# ------------------------------------------------------------------------------
# Sets the default AWS region used by:
#   - AWS CLI commands
#   - Terraform providers
# ------------------------------------------------------------------------------
export AWS_DEFAULT_REGION="us-east-1"

# ------------------------------------------------------------------------------
# STRICT SHELL EXECUTION MODE
# ------------------------------------------------------------------------------
# Enforces defensive Bash behavior:
#   -e  Exit immediately on command failure
#   -u  Treat unset variables as errors
#   -o pipefail  Fail pipelines if any command fails
# ------------------------------------------------------------------------------
set -euo pipefail

# ================================================================================
# CORE INFRASTRUCTURE TEARDOWN
# ================================================================================

# ------------------------------------------------------------------------------
# DESTROY BACKEND SERVICES
# ------------------------------------------------------------------------------
# Removes backend infrastructure provisioned by Terraform, including:
#   - Lambda functions
#   - API Gateway routes and integrations
# ------------------------------------------------------------------------------
echo "NOTE: Destroying Application Core Services..."

cd 01-core || {
  echo "ERROR: Directory 01-core not found."
  exit 1
}

terraform init
terraform destroy -auto-approve

cd .. || exit 1

# ================================================================================
# COMPLETION
# ================================================================================

# ------------------------------------------------------------------------------
# TEARDOWN COMPLETE
# ------------------------------------------------------------------------------
# Indicates that all Terraform stacks were destroyed successfully.
# ------------------------------------------------------------------------------
echo "NOTE: Infrastructure teardown complete."

# ================================================================================
# END OF SCRIPT
# ================================================================================