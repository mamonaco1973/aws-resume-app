# ==============================================================================
# AWS Provider Configuration
# ------------------------------------------------------------------------------
# Purpose:
#   - Defines the AWS provider and default region for Terraform resources
#   - Ensures all modules and resources deploy to the same AWS region
#   - Must be declared before any AWS resources are created
# ==============================================================================

provider "aws" {
  region = "us-east-1" # Primary AWS region (N. Virginia)
}

# ------------------------------------------------------------------------------
# AWS Data Sources
# ------------------------------------------------------------------------------
# Retrieves current AWS account ID and active region for dynamic references.
# ------------------------------------------------------------------------------

data "aws_caller_identity" "current" {} # Returns AWS account ID and ARN
data "aws_region" "current" {}          # Returns currently configured region