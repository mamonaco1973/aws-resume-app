import json
from jobs import create_job, list_jobs
from resumes import create_resume, list_resumes


def lambda_handler(event, context):

    method = event["requestContext"]["http"]["method"]
    path = event["rawPath"]

    if method == "GET" and path == "/jobs":
        return list_jobs()

    if method == "POST" and path == "/jobs":
        return create_job(event)

    if method == "GET" and path == "/resumes":
        return list_resumes()

    if method == "POST" and path == "/resumes":
        return create_resume(event)

    return {
        "statusCode": 404,
        "body": json.dumps({"error": "not found"})
    }