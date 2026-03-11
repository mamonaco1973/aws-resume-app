import json
from jobs import create_job, list_jobs

def lambda_handler(event, context):

    method = event["requestContext"]["http"]["method"]
    path = event["rawPath"]

    if method == "GET" and path == "/jobs":
        return list_jobs()

    if method == "POST" and path == "/jobs":
        return create_job(event)

    return {
        "statusCode": 404,
        "body": json.dumps({"error": "not found"})
    }