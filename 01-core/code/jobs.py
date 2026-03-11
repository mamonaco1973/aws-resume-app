import json
import boto3
import os
import uuid
from datetime import datetime
from boto3.dynamodb.conditions import Key


table = boto3.resource("dynamodb").Table(os.environ["TABLE_NAME"])


def create_job(event):

    body = json.loads(event["body"])
    job_url = body["job_url"]

    # --------------------------------------------------------------------------
    # Verify at least one resume exists
    # --------------------------------------------------------------------------

    response = table.query(
        KeyConditionExpression=Key("pk").eq("USER#demo")
    )

    resumes = [
        i for i in response["Items"]
        if i["sk"].startswith("RESUME#")
    ]

    if not resumes:
        return {
            "statusCode": 400,
            "body": json.dumps({"error": "no resume uploaded"})
        }

    # --------------------------------------------------------------------------
    # Create job
    # --------------------------------------------------------------------------

    job_id = str(uuid.uuid4())

    item = {
        "pk": "USER#demo",
        "sk": f"JOB#{job_id}",
        "status": "Pending",
        "job_url": job_url,
        "created_at": datetime.utcnow().isoformat()
    }

    table.put_item(Item=item)

    return {
        "statusCode": 200,
        "body": json.dumps({"job_id": job_id})
    }


def list_jobs():

    response = table.query(
        KeyConditionExpression=Key("pk").eq("USER#demo")
    )

    jobs = [
        i for i in response["Items"]
        if i["sk"].startswith("JOB#")
    ]

    return {
        "statusCode": 200,
        "body": json.dumps(jobs)
    }