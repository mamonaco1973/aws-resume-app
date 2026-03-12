# ================================================================================
# Lambda API Router
#
# Dispatches API Gateway requests to the appropriate handler functions.
#
# Design
# - Single Lambda handles all API routes
# - Routing is based on HTTP method and request path
# - Business logic lives in domain modules (jobs.py, resumes.py)
# ================================================================================

import json
import logging
from jobs import create_job, list_jobs
from resumes import (
    create_resume,
    delete_resume,
    get_resume,
    list_resumes,
    update_resume,
)

# --------------------------------------------------------------------------------
# Configure logger
# --------------------------------------------------------------------------------

logger = logging.getLogger()
logger.setLevel(logging.INFO)


# --------------------------------------------------------------------------------
# Main Lambda entry point
#
# API Gateway sends all requests to this function. The router determines which
# handler to call based on HTTP method and request path.
# --------------------------------------------------------------------------------

def lambda_handler(event, context):

    method = event["requestContext"]["http"]["method"]
    path = event["rawPath"]

    # ----------------------------------------------------------------------------
    # Debug log for incoming requests
    # ----------------------------------------------------------------------------

    logger.info("API request: %s %s", method, path)

    # ----------------------------------------------------------------------------
    # Jobs endpoints
    # ----------------------------------------------------------------------------

    if method == "GET" and path == "/jobs":
        return list_jobs()

    if method == "POST" and path == "/jobs":
        return create_job(event)

    # ----------------------------------------------------------------------------
    # Resume collection endpoints
    # ----------------------------------------------------------------------------

    if method == "GET" and path == "/resumes":
        return list_resumes(event)

    if method == "POST" and path == "/resumes":
        return create_resume(event)

    # ----------------------------------------------------------------------------
    # Individual resume endpoints
    # ----------------------------------------------------------------------------

    if method == "GET" and path.startswith("/resumes/"):
        return get_resume(event)

    if method == "PUT" and path.startswith("/resumes/"):
        return update_resume(event)

    if method == "DELETE" and path.startswith("/resumes/"):
        return delete_resume(event)

    # ----------------------------------------------------------------------------
    # Default response
    # ----------------------------------------------------------------------------

    return {
        "statusCode": 404,
        "body": json.dumps({"error": "not found"})
    }