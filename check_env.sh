#!/bin/bash

# ==============================================================================
# Environment Validation Script
# ------------------------------------------------------------------------------
# Purpose:
#   - Validate required CLI tools exist in the current PATH
#   - Verify AWS CLI authentication is working
#   - Fail early before running Terraform deployment scripts
#
# Required Tools:
#   - aws        AWS CLI used for authentication and API access
#   - terraform  Infrastructure provisioning tool
#   - jq         JSON processor used by validation scripts
# ==============================================================================

echo "NOTE: Validating that required commands are found in your PATH."

# ------------------------------------------------------------------------------
# Required Commands
# ------------------------------------------------------------------------------
# List of CLI utilities required by the Quick Start deployment scripts.
# ------------------------------------------------------------------------------

commands=("aws" "terraform" "jq" "pip")

# Flag used to track whether all required commands were located
all_found=true

# ------------------------------------------------------------------------------
# Command Availability Check
# ------------------------------------------------------------------------------
# Iterate through the required command list and verify each exists in PATH.
# command -v returns success if the executable can be resolved.
# ------------------------------------------------------------------------------

for cmd in "${commands[@]}"; do
  if ! command -v "$cmd" &> /dev/null; then
    echo "ERROR: $cmd is not found in the current PATH."
    all_found=false
  else
    echo "NOTE: $cmd is found in the current PATH."
  fi
done

# ------------------------------------------------------------------------------
# Validation Result
# ------------------------------------------------------------------------------
# If any required command is missing the script exits with a failure code.
# ------------------------------------------------------------------------------

if [ "$all_found" = true ]; then
  echo "NOTE: All required commands are available."
else
  echo "ERROR: One or more commands are missing."
  exit 1
fi

# ------------------------------------------------------------------------------
# AWS Authentication Check
# ------------------------------------------------------------------------------
# Validate AWS CLI credentials by calling STS GetCallerIdentity.
# This confirms credentials and region configuration are working.
# ------------------------------------------------------------------------------

echo "NOTE: Checking AWS cli connection."

aws sts get-caller-identity --query "Account" --output text >> /dev/null

# ------------------------------------------------------------------------------
# AWS Login Result
# ------------------------------------------------------------------------------
# Check exit code of the AWS CLI command to confirm authentication.
# ------------------------------------------------------------------------------

if [ $? -ne 0 ]; then
  echo "ERROR: Failed to connect to AWS. Please check your credentials and environment variables."
  exit 1
else
  echo "NOTE: Successfully logged into AWS."
fi
