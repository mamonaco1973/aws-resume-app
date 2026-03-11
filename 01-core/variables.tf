# =================================================================================
# Frontend S3 bucket base name
# Actual bucket name will be <base>-<random_id>
# =================================================================================

variable "frontend_bucket_base_name" {
  description = "Base name for the frontend S3 bucket"
  type        = string
  default     = "resume-app"
}

# =================================================================================
# Backend S3 bucket base name
# Actual bucket name will be <base>-<random_id>
# =================================================================================

variable "backend_bucket_base_name" {
  description = "Base name for the backend S3 bucket"
  type        = string
  default     = "resume-data"
}
